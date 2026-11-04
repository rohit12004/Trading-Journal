import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the backend (Trading_Journal/backend)
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Load .env file from backend directory
dotenv_path = BACKEND_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "QuantCoach AI")
    _raw_db_url: str = (os.getenv("DATABASE_URL") or "mysql+pymysql://journal_user:journal_secure_pass_123@localhost:3307/trading_journal").strip()
    # Automatically convert bare mysql:// to mysql+pymysql:// if provided by cloud providers (e.g. Aiven/TiDB)
    DATABASE_URL: str = _raw_db_url.replace("mysql://", "mysql+pymysql://", 1) if _raw_db_url.startswith("mysql://") else _raw_db_url
    
    # Remove unsupported ssl-mode query parameters from URI that cause PyMySQL to crash
    for _ssl_flag in ["?ssl-mode=REQUIRED", "&ssl-mode=REQUIRED", "?ssl-mode=required", "&ssl-mode=required", "ssl-mode=REQUIRED", "ssl-mode=required"]:
        DATABASE_URL = DATABASE_URL.replace(_ssl_flag, "")
    if DATABASE_URL.endswith("?"):
        DATABASE_URL = DATABASE_URL[:-1]

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-me")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived access token: 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30    # Long-lived refresh token: 30 days
    API_V1_STR: str = "/api/v1"
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    _raw_redis_url: str = (os.getenv("REDIS_URL") or "").strip()
    # Valkey is 100% wire-compatible with Redis; normalize valkey:// or valkeys:// scheme to redis:// or rediss:// for redis-py
    REDIS_URL: str = _raw_redis_url.replace("valkeys://", "rediss://", 1).replace("valkey://", "redis://", 1) if _raw_redis_url else ""

    # AI Integration Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Neo4j Settings (for Graph Memory)
    NEO4J_URI: str = os.getenv("GRAPH_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("GRAPH_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("GRAPH_PASSWORD", "trading@12004")

    # SMTP Configuration
    EMAILS_ENABLED: bool = os.getenv("EMAILS_ENABLED", "False").lower() == "true"
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "no-reply@quantcoach.ai")


settings = Settings()
