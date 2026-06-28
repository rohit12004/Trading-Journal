from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

class CapitalTransactionBase(BaseModel):
    type: Literal["DEPOSIT", "WITHDRAWAL"] = Field(..., description="Transaction type: DEPOSIT or WITHDRAWAL")
    amount: float = Field(..., gt=0, description="Amount of capital added/withdrawn")
    timestamp: datetime = Field(..., description="Date and time of the transaction")
    description: Optional[str] = Field(None, max_length=255, description="Brief description or notes")

class CapitalTransactionCreate(CapitalTransactionBase):
    pass

class CapitalTransactionResponse(CapitalTransactionBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
