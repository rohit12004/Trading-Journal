from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeUpdate
from app.constants.lot_sizes import calculate_fno_pnl


def calculate_pnl(direction: str, entry_price: float, exit_price: Optional[float], quantity: float) -> Optional[float]:
    """
    Utility helper to compute P&L for closed stock positions.
    """
    if exit_price is None:
        return None
        
    dir_upper = direction.upper()
    if dir_upper == "BUY":  # LONG
        return (exit_price - entry_price) * quantity
    elif dir_upper == "SELL":  # SHORT
        return (entry_price - exit_price) * quantity
    return 0.0


def compute_trade_pnl(
    asset_class: str,
    direction: str,
    symbol: str,
    quantity: float,
    entry_price: float,
    exit_price: Optional[float]
) -> Optional[float]:
    """
    Unified helper to compute P&L based on asset class (Stocks or F&O).
    """
    if exit_price is None:
        return None
        
    asset_upper = asset_class.upper()
    if asset_upper == "STOCKS":
        return calculate_pnl(direction, entry_price, exit_price, quantity)
    else:
        # F&O calculations using lot size
        fno_pnl, _, _ = calculate_fno_pnl(
            entry_price=entry_price,
            exit_price=exit_price,
            lots=quantity,
            symbol=symbol,
            direction=direction,
            asset_class=asset_upper,
        )
        return fno_pnl


class TradeService:
    @staticmethod
    def create_trade(db: Session, trade_in: TradeCreate, user_id: str) -> Trade:
        """
        Log a new trade (can be OPEN or CLOSED).
        """
        asset_upper = trade_in.asset_class.upper()
        entry_price = getattr(trade_in, "entry_price", None)
        exit_price = getattr(trade_in, "exit_price", None)
        strike_price = getattr(trade_in, "strike_price", None)
        entry_time = getattr(trade_in, "entry_time", None)
        exit_time = getattr(trade_in, "exit_time", None)
        strategy = getattr(trade_in, "strategy", None)
        timestamp = getattr(trade_in, "timestamp", None)
        
        pnl = 0.0
        status_val = "OPEN"
        
        if exit_price is not None:
            pnl = compute_trade_pnl(
                asset_class=asset_upper,
                direction=trade_in.direction,
                symbol=trade_in.symbol,
                quantity=trade_in.quantity,
                entry_price=entry_price,
                exit_price=exit_price
            )
            status_val = "CLOSED"

        db_trade = Trade(
            user_id=user_id,
            timestamp=timestamp or datetime.utcnow(),
            symbol=trade_in.symbol.upper(),
            direction=trade_in.direction.upper(),
            entry_price=entry_price,
            quantity=trade_in.quantity,
            exit_price=exit_price,
            strike_price=strike_price,
            status=status_val,
            asset_class=asset_upper,
            pnl=pnl,
            notes=trade_in.notes,
            entry_time=entry_time,
            exit_time=exit_time,
            strategy=strategy
        )
        db.add(db_trade)
        db.commit()
        db.refresh(db_trade)
        return db_trade

    @staticmethod
    def get_trades(
        db: Session,
        user_id: str,
        status_filter: Optional[str] = None,
        symbol_filter: Optional[str] = None
    ) -> List[Trade]:
        """
        List trades belonging to the user, filterable by status and symbol.
        """
        query = db.query(Trade).filter(Trade.user_id == user_id)

        if status_filter:
            query = query.filter(Trade.status == status_filter.upper())
        if symbol_filter:
            query = query.filter(Trade.symbol == symbol_filter.upper())

        return query.order_by(Trade.created_at.desc()).all()

    @staticmethod
    def get_trade_metrics(db: Session, user_id: str) -> dict:
        """
        Calculate and return performance aggregates (Net P&L, Win Rate, Profit Factor, Capital, Balance).
        """
        from app.models.capital_transaction import CapitalTransaction

        all_trades = db.query(Trade).filter(Trade.user_id == user_id).all()
        
        # Define closed vs open based on exit price presence
        closed_trades = [t for t in all_trades if t.exit_price is not None]
        open_trades_count = len([t for t in all_trades if t.exit_price is None])
        
        net_pnl = sum(t.pnl for t in closed_trades if t.pnl is not None)
        total_trades = len(closed_trades)
        
        winning_trades = [t for t in closed_trades if t.pnl is not None and t.pnl > 0]
        losing_trades = [t for t in closed_trades if t.pnl is not None and t.pnl < 0]
        
        win_rate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0.0
        
        gross_profit = sum(t.pnl for t in winning_trades)
        gross_loss = abs(sum(t.pnl for t in losing_trades))
        
        if gross_loss > 0:
            profit_factor = gross_profit / gross_loss
        else:
            profit_factor = gross_profit if gross_profit > 0 else 0.0

        # Calculate Capital adjustments (Sum of DEPOSITs - Sum of WITHDRAWALs)
        capital_txs = db.query(CapitalTransaction).filter(CapitalTransaction.user_id == user_id).all()
        total_capital = 0.0
        for tx in capital_txs:
            amt = float(tx.amount)
            if tx.type.upper() == "DEPOSIT":
                total_capital += amt
            elif tx.type.upper() == "WITHDRAWAL":
                total_capital -= amt

        current_balance = total_capital + float(net_pnl)
            
        return {
            "net_pnl": float(net_pnl),
            "win_rate": float(win_rate),
            "profit_factor": float(profit_factor),
            "total_trades": total_trades,
            "open_trades_count": open_trades_count,
            "total_capital": float(total_capital),
            "current_balance": float(current_balance)
        }

    @staticmethod
    def update_trade(db: Session, trade_id: str, trade_in: TradeUpdate, user_id: str) -> Trade:
        """
        Update a trade (e.g. adjust prices, close position, write notes).
        """
        trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user_id).first()
        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trade not found or access denied."
            )

        update_data = trade_in.model_dump(exclude_unset=True)
        
        # Apply updates
        for field, value in update_data.items():
            setattr(trade, field, value)

        # Re-calculate P&L if closed or has exit price
        if trade.status == "CLOSED" or trade.exit_price is not None:
            if trade.exit_price is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Exit price is required to close a trade."
                )
            trade.status = "CLOSED"
            trade.pnl = compute_trade_pnl(
                asset_class=trade.asset_class,
                direction=trade.direction,
                symbol=trade.symbol,
                quantity=trade.quantity,
                entry_price=trade.entry_price,
                exit_price=trade.exit_price
            )
        else:
            trade.status = "OPEN"
            trade.pnl = 0.0
            trade.exit_price = None

        db.commit()
        db.refresh(trade)
        return trade

    @staticmethod
    def delete_trade(db: Session, trade_id: str, user_id: str) -> dict:
        """
        Delete a trade from the journal.
        """
        trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user_id).first()
        if not trade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trade not found or access denied."
            )

        db.delete(trade)
        db.commit()
        return {"message": "Trade successfully deleted."}
