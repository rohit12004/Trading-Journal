import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CapitalTransaction(Base):
    __tablename__ = "capital_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # DEPOSIT, WITHDRAWAL
    amount = Column(Numeric(18, 4), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="capital_transactions")
