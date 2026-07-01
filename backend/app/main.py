import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.routes import router as trades_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.capital_transactions import router as capital_transactions_router
from app.api.v1.imports import router as imports_router
from app.api.v1.ai import router as ai_router
from app.api.v1.journal import router as journal_router
from app.db.base import Base
from app.db.session import engine, SessionLocal

# Import all models to ensure they are registered with Base for DDL creation
from app.models.user import User, Account, RefreshToken
from app.models.trade import Trade
from app.models.capital_transaction import CapitalTransaction
from app.models.journal import JournalEntry


from alembic import command
from alembic.config import Config

def run_alembic_migrations():
    try:
        # Load Alembic configuration and run upgrade programmatically
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Alembic migrations completed successfully.")
    except Exception as e:
        print(f"Database migration/connection error: {e}")
        short_msg = str(e)
        print("\n" + "=" * 60)
        print("  ❌  DATABASE CONNECTION OR MIGRATION FAILED")
        print("=" * 60)
        print(f"  Error : {short_msg}")
        print(f"  Host  : {settings.DATABASE_URL.split('@')[-1].split('/')[0] if '@' in settings.DATABASE_URL else 'localhost'}")
        print()
        print("  ➜  Make sure your Docker containers are running:")
        print("       docker compose up -d")
        print("=" * 60 + "\n")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Startup: connect to DB and run migrations — exit cleanly on failure
# ---------------------------------------------------------------------------
run_alembic_migrations()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(trades_router, prefix=f"{settings.API_V1_STR}/trades", tags=["Trades"])
app.include_router(accounts_router, prefix=f"{settings.API_V1_STR}/accounts", tags=["Accounts"])
app.include_router(capital_transactions_router, prefix=f"{settings.API_V1_STR}/capital-transactions", tags=["Capital Transactions"])
app.include_router(imports_router, prefix=f"{settings.API_V1_STR}/imports", tags=["Broker Imports"])
app.include_router(ai_router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Services"])
app.include_router(journal_router, prefix=f"{settings.API_V1_STR}/journal", tags=["Daily Journal"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API. Access API docs at /docs"}
