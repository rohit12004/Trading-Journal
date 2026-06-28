from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, Account
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter()

@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new trading account for the current logged-in user.
    """
    # Check if user already has an account with this name to prevent duplicate labels
    existing = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.account_name == account_in.account_name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with the name '{account_in.account_name}' already exists."
        )

    db_account = Account(
        user_id=current_user.id,
        broker=account_in.broker,
        account_name=account_in.account_name
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/", response_model=List[AccountResponse])
def read_accounts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get all accounts belonging to the current logged-in user.
    """
    return db.query(Account).filter(Account.user_id == current_user.id).all()

@router.put("/{id}", response_model=AccountResponse)
def update_account(
    id: str,
    account_in: AccountUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update broker or label of a trading account.
    """
    account = db.query(Account).filter(Account.id == id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied."
        )

    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_account(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a trading account and cascade delete all associated trades.
    """
    account = db.query(Account).filter(Account.id == id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied."
        )

    db.delete(account)
    db.commit()
    return {"message": "Account and all associated trades successfully deleted."}
