from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.trade import TradeCreate, TradeUpdate, TradeResponse, TradeMetricsResponse
from app.services.trade import TradeService

router = APIRouter()


@router.post("/", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
def create_trade(
    trade_in: TradeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Log a new trade (can be OPEN or CLOSED).
    """
    return TradeService.create_trade(db, trade_in, current_user.id)


@router.get("/lot-sizes")
def read_lot_sizes(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get configured F&O lot sizes.
    """
    from app.constants.lot_sizes import LOT_SIZES
    return LOT_SIZES


@router.get("/", response_model=List[TradeResponse])
def read_trades(
    status: Optional[str] = None,
    symbol: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List trades belonging to the current user, filterable by status and symbol.
    """
    return TradeService.get_trades(db, current_user.id, status_filter=status, symbol_filter=symbol)


@router.get("/metrics", response_model=TradeMetricsResponse)
def read_trade_metrics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Calculate and return performance aggregates (Net P&L, Win Rate, Profit Factor).
    """
    return TradeService.get_trade_metrics(db, current_user.id)


@router.put("/{id}", response_model=TradeResponse)
def update_trade(
    id: str,
    trade_in: TradeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update a trade (e.g. adjust prices, close position, write notes).
    """
    return TradeService.update_trade(db, id, trade_in, current_user.id)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_trade(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a trade from the journal.
    """
    return TradeService.delete_trade(db, id, current_user.id)
