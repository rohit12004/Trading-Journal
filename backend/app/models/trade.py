import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class Trade(Base):
    __tablename__ = "trades"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    symbol = Column(String(50), index=True, nullable=False)
    direction = Column(String(10), nullable=False, default="BUY")  # BUY, SELL, CALL, PUT
    quantity = Column(Numeric(18, 4), nullable=False)
    entry_price = Column(Numeric(18, 4), nullable=True)
    exit_price = Column(Numeric(18, 4), nullable=True)
    strike_price = Column(Numeric(18, 4), nullable=True)
    commission = Column(Numeric(18, 4), default=0.0)
    pnl = Column(Numeric(18, 4), default=0.0)
    status = Column(String(20), nullable=False, default="PROFIT")  # PROFIT, LOSS
    asset_class = Column(String(20), nullable=False, default="STOCKS")  # STOCKS, OPTIONS, FUTURES
    tags = Column(JSON, nullable=True)
    notes = Column(String(1000), nullable=True)
    entry_time = Column(String(10), nullable=True)  # HH:MM format
    exit_time = Column(String(10), nullable=True)   # HH:MM format
    strategy = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="trades")

