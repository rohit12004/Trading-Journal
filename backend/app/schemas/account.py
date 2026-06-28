from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AccountBase(BaseModel):
    broker: Optional[str] = Field(None, max_length=100)
    account_name: str = Field(..., min_length=1, max_length=100)

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    broker: Optional[str] = Field(None, max_length=100)
    account_name: Optional[str] = Field(None, min_length=1, max_length=100)

class AccountResponse(AccountBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
