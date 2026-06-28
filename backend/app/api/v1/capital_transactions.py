from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.capital_transaction import CapitalTransactionCreate, CapitalTransactionResponse
from app.services.capital_transaction import CapitalTransactionService

router = APIRouter()

@router.post("/", response_model=CapitalTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_capital_transaction(
    transaction_in: CapitalTransactionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Add a capital transaction (DEPOSIT or WITHDRAWAL).
    """
    return CapitalTransactionService.create_capital_transaction(db, transaction_in, current_user.id)

@router.get("/", response_model=List[CapitalTransactionResponse])
def read_capital_transactions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get all capital transactions (deposits/withdrawals) for the current user.
    """
    return CapitalTransactionService.get_capital_transactions(db, current_user.id)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_capital_transaction(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a capital transaction from history.
    """
    return CapitalTransactionService.delete_capital_transaction(db, id, current_user.id)
