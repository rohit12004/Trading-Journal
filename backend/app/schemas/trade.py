from datetime import datetime
from typing import Optional, Union, Literal, Annotated
from pydantic import BaseModel, Field, model_validator

class StockTradeCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=50)
    direction: str = Field(..., description="BUY or SELL")
    quantity: float = Field(..., gt=0, description="Shares")
    entry_price: float = Field(..., gt=0)
    exit_price: float = Field(..., ge=0)
    notes: Optional[str] = None
    entry_time: Optional[str] = Field(None, description="Format HH:MM")
    exit_time: Optional[str] = Field(None, description="Format HH:MM")
    strategy: Optional[str] = Field(None, max_length=100)
    timestamp: Optional[datetime] = Field(None, description="Trade execution date")
    asset_class: Literal["STOCKS"] = "STOCKS"

class OptionTradeCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=50)
    direction: str = Field(..., description="CALL or PUT")
    quantity: float = Field(..., gt=0, description="Lots")
    strike_price: Optional[float] = Field(None, ge=0)
    entry_price: float = Field(..., gt=0, description="Premium paid/received per unit at entry")
    exit_price: float = Field(..., ge=0, description="Premium at exit")
    notes: Optional[str] = None
    entry_time: Optional[str] = Field(None, description="Format HH:MM")
    exit_time: Optional[str] = Field(None, description="Format HH:MM")
    strategy: Optional[str] = Field(None, max_length=100)
    timestamp: Optional[datetime] = Field(None, description="Trade execution date")
    asset_class: Literal["OPTIONS"] = "OPTIONS"

class FutureTradeCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=50)
    direction: str = Field(..., description="BUY or SELL")
    quantity: float = Field(..., gt=0, description="Lots")
    entry_price: float = Field(..., gt=0, description="Price at entry")
    exit_price: float = Field(..., ge=0, description="Price at exit")
    notes: Optional[str] = None
    entry_time: Optional[str] = Field(None, description="Format HH:MM")
    exit_time: Optional[str] = Field(None, description="Format HH:MM")
    strategy: Optional[str] = Field(None, max_length=100)
    timestamp: Optional[datetime] = Field(None, description="Trade execution date")
    asset_class: Literal["FUTURES"] = "FUTURES"

# Discriminated Union for FastAPI request body validation
TradeCreate = Annotated[
    Union[StockTradeCreate, OptionTradeCreate, FutureTradeCreate],
    Field(discriminator="asset_class")
]

class TradeUpdate(BaseModel):
    symbol: Optional[str] = Field(None, min_length=1, max_length=50)
    direction: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    entry_price: Optional[float] = Field(None, gt=0)
    exit_price: Optional[float] = Field(None, ge=0)
    strike_price: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    asset_class: Optional[str] = None
    pnl: Optional[float] = None
    notes: Optional[str] = None
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None
    strategy: Optional[str] = None
    timestamp: Optional[datetime] = None

class TradeResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    direction: str
    quantity: float
    asset_class: str
    status: str
    notes: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    strike_price: Optional[float] = None
    pnl: Optional[float] = None
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None
    strategy: Optional[str] = None
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class TradeMetricsResponse(BaseModel):
    net_pnl: float
    win_rate: float
    profit_factor: float
    total_trades: int
    open_trades_count: int
    total_capital: float
    current_balance: float
