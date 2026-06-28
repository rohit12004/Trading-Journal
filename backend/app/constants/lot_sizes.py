"""
Lot sizes for Indian F&O instruments (NSE/BSE).
Source: NSE circulars — update periodically as exchange revises lot sizes.

P&L Formulas:
  OPTIONS  (CALL or PUT — buyer's perspective):
      pnl = (exit_premium - entry_premium) * lots * lot_size
      Rationale: CALL/PUT are option *types*, not trade direction.
                 Premium rises = profit, regardless of option type.

  FUTURES  (directional):
      BUY  (long)  : pnl = (exit_price - entry_price) * lots * lot_size
      SELL (short) : pnl = (entry_price - exit_price) * lots * lot_size
"""

LOT_SIZES: dict[str, int] = {
    # Index Derivatives (NSE — Jun 2026)
    "NIFTY":        65,
    "BANKNIFTY":    30,
    "FINNIFTY":     60,
    "SENSEX":       10,
}

DEFAULT_LOT_SIZE: int = 1


def get_lot_size(symbol: str) -> int:
    if not symbol:
        return DEFAULT_LOT_SIZE
    
    # Normalise: uppercase, remove spaces, underscores, hyphens
    s = symbol.strip().upper().replace(" ", "").replace("_", "").replace("-", "")
    
    if "NIFTYNXT50" in s or "NIFTYNEXT50" in s:
        return 25
    elif "MIDCPNIFTY" in s or "NIFTYMIDCAP" in s or "MIDCAP" in s:
        return 120
    elif "FINNIFTY" in s or "NIFTYFIN" in s:
        return 60
    elif "BANKNIFTY" in s or "NIFTYBANK" in s:
        return 30
    elif "NIFTY" in s:
        return 65
    elif "SENSEX" in s:
        return 10
    elif "BANKEX" in s:
        return 15
    elif "360ONE" in s:
        return 500
        
    return LOT_SIZES.get(s, DEFAULT_LOT_SIZE)


def calculate_fno_pnl(
    *,
    entry_price: float,
    exit_price: float,
    lots: float,
    symbol: str,
    direction: str,
    asset_class: str = "OPTIONS",
) -> tuple[float, int, float]:
    """
    Calculate P&L for F&O trades.

    For OPTIONS (CALL/PUT): P&L = (exit_premium - entry_premium) * total_qty
        CALL and PUT are option *types*, not directional indicators.
        Both are treated as buyer positions: premium up = profit.

    For FUTURES (BUY/SELL): P&L depends on direction.
        BUY  (long)  : P&L = (exit - entry) * total_qty
        SELL (short) : P&L = (entry - exit) * total_qty
    """
    lot_size = get_lot_size(symbol)
    total_qty = lots * lot_size

    if asset_class.upper() == "OPTIONS":
        # CALL/PUT = option type, not direction — always buyer's perspective
        pnl = (exit_price - entry_price) * total_qty
    else:
        # FUTURES: BUY = long, SELL = short
        if direction.upper() == "BUY":
            pnl = (exit_price - entry_price) * total_qty
        else:
            pnl = (entry_price - exit_price) * total_qty

    return pnl, lot_size, total_qty
