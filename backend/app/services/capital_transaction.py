from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.capital_transaction import CapitalTransaction
from app.schemas.capital_transaction import CapitalTransactionCreate

class CapitalTransactionService:
    @staticmethod
    def create_capital_transaction(db: Session, transaction_in: CapitalTransactionCreate, user_id: str) -> CapitalTransaction:
        db_transaction = CapitalTransaction(
            user_id=user_id,
            type=transaction_in.type.upper(),
            amount=transaction_in.amount,
            timestamp=transaction_in.timestamp,
            description=transaction_in.description
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction

    @staticmethod
    def get_capital_transactions(db: Session, user_id: str) -> List[CapitalTransaction]:
        return db.query(CapitalTransaction).filter(
            CapitalTransaction.user_id == user_id
        ).order_by(CapitalTransaction.timestamp.desc()).all()

    @staticmethod
    def delete_capital_transaction(db: Session, transaction_id: str, user_id: str) -> dict:
        transaction = db.query(CapitalTransaction).filter(
            CapitalTransaction.id == transaction_id, 
            CapitalTransaction.user_id == user_id
        ).first()
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Capital transaction not found or access denied."
            )
        db.delete(transaction)
        db.commit()
        return {"message": "Capital transaction successfully deleted."}
