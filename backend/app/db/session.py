import ssl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

connect_args = {}
# Support cloud databases requiring SSL (Aiven, TiDB, etc.)
if any(cloud_host in (settings.DATABASE_URL or "") for cloud_host in ["aivencloud.com", "tidbcloud.com", "clever-cloud.com", "aws.neon.tech"]):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ctx

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    pool_timeout=15,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
