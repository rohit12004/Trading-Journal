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

# In-memory dictionary fallback with TTL when Redis/Valkey is not reachable
_memory_cache = {}

class MemoryRedisFallback:
    def setex(self, name: str, time_sec: int, value: str):
        import time as _t
        _memory_cache[name] = (value, _t.time() + time_sec)
        return True

    def get(self, name: str):
        import time as _t
        entry = _memory_cache.get(name)
        if not entry:
            return None
        val, expires_at = entry
        if _t.time() > expires_at:
            _memory_cache.pop(name, None)
            return None
        return val

    def delete(self, *names):
        for n in names:
            _memory_cache.pop(n, None)
        return True

    def close(self):
        pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_redis():
    """
    Returns an active Redis/Valkey client or falls back gracefully to in-memory TTL store.
    """
    client = None
    try:
        redis_url = getattr(settings, "REDIS_URL", "")
        if redis_url:
            # If rediss:// (SSL) is used, accept server cert
            kwargs = {"decode_responses": True, "socket_timeout": 2.0}
            if redis_url.startswith("rediss://"):
                kwargs["ssl_cert_reqs"] = "none"
            client = redis.Redis.from_url(redis_url, **kwargs)
        else:
            client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=0,
                decode_responses=True,
                socket_timeout=2.0
            )
        client.ping()
        yield client
        client.close()
    except Exception:
        yield MemoryRedisFallback()

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
