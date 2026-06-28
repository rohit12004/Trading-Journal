from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.trade import TradeCreate, TradeResponse
from app.services.broker_parser import BrokerParser
from app.services.trade import TradeService

router = APIRouter()

@router.post("/preview", response_model=List[dict])
async def preview_imports(
    broker: str = Query(..., description="Broker statement format, e.g. GROWW"),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload a broker statement and preview the parsed trades before committing.
    """
    if broker.upper() != "GROWW":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Broker format '{broker}' is not supported yet."
        )

    filename = file.filename or ""
    if not (filename.endswith(".xlsx") or filename.endswith(".xls") or filename.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an Excel (.xlsx) or CSV file."
        )

    try:
        contents = await file.read()
        rows = BrokerParser.parse_xlsx_to_rows(contents)
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not find any readable rows in sheet1. Please check if the file is empty or formatted incorrectly."
            )
            
        trades = BrokerParser.parse_groww_fno(rows)
        return trades
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse broker file: {str(e)}"
        )

@router.post("/confirm", response_model=List[TradeResponse])
def confirm_imports(
    trades_in: List[TradeCreate],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Bulk insert the confirmed trades into the database.
    """
    saved_trades = []
    try:
        for trade_data in trades_in:
            db_trade = TradeService.create_trade(db, trade_data, current_user.id)
            saved_trades.append(db_trade)
        return saved_trades
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error occurred during bulk trade import: {str(e)}"
        )
