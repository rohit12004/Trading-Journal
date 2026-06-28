from typing import Generator
import redis
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import TokenData
from app.core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False  # Don't throw errors automatically, let our custom extractor handle it
)

# Initialize Redis connection pool
redis_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True
)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_redis() -> Generator[redis.Redis, None, None]:
    client = redis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        client.close()

def get_token_from_request(request: Request) -> str:
    """
    Extracts the token from either HTTP-only cookies or the Authorization header.
    Allows local Swagger UI testing to function alongside cookie auth.
    """
    # 1. Check cookies first
    token = request.cookies.get("access_token")
    if token:
        return token
    
    # 2. Check Authorization header as fallback
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
        
    return None

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    _token_doc: str = Depends(oauth2_scheme)  # Included for Swagger UI documentation
) -> User:
    token = get_token_from_request(request)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return user
