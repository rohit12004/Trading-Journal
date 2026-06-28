import random
from datetime import datetime, timedelta
import redis
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.services.email import send_otp_email, send_reset_password_email
from app.models.user import User, RefreshToken
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    Token,
    TokenRefreshRequest,
    OTPVerifyRequest,
    OTPResendRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.config import settings

router = APIRouter()

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """
    Utility helper to set access and refresh tokens in HTTP-only, SameSite=Lax cookies.
    """
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in production (HTTPS)
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False,  # Set to True in production (HTTPS)
        path="/"
    )

def clear_auth_cookies(response: Response):
    """
    Utility helper to clear authorization cookies.
    """
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db),
    redis_client: redis.Redis = Depends(deps.get_redis)
):
    """
    Register a new user (creates in inactive state and triggers email OTP).
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    password_hash = security.get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        first_name=user_in.first_name,
        middle_name=user_in.middle_name,
        last_name=user_in.last_name,
        password_hash=password_hash,
        is_active=False,  # Unverified users cannot log in yet
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate OTP (6 digits)
    otp = f"{random.randint(100000, 999999)}"
    
    # Store OTP in Redis with 5-minute (300s) TTL
    redis_client.setex(f"otp:{db_user.email}", 300, otp)
    
    # Mock send email
    send_otp_email(db_user.email, otp)
    
    return db_user

@router.post("/verify-otp", response_model=Token)
def verify_otp(
    payload: OTPVerifyRequest,
    response: Response,
    db: Session = Depends(deps.get_db),
    redis_client: redis.Redis = Depends(deps.get_redis)
):
    """
    Verify 6-digit OTP. On success, activates the account, sets auth cookies,
    and returns tokens in the response body (auto-login).
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified and active."
        )
    
    # Fetch OTP from Redis
    cached_otp = redis_client.get(f"otp:{payload.email}")
    if not cached_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired or is invalid."
        )
    
    if cached_otp != payload.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code."
        )
    
    # Activate User
    user.is_active = True
    db.commit()
    
    # Clean up OTP key from Redis
    redis_client.delete(f"otp:{payload.email}")
    
    # Generate JWT Access & Refresh Tokens
    access_token = security.create_access_token(user.email)
    refresh_token_value = security.generate_refresh_token()
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set cookies in HTTP response (for web clients)
    set_auth_cookies(response, access_token, refresh_token_value)
    
    # Return JSON body (for mobile/fallback clients)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_value,
        "token_type": "bearer",
    }

@router.post("/resend-otp")
def resend_otp(
    payload: OTPResendRequest,
    db: Session = Depends(deps.get_db),
    redis_client: redis.Redis = Depends(deps.get_redis)
):
    """
    Resend verification OTP if the user exists and is not active yet.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified."
        )
    
    # Generate new OTP
    otp = f"{random.randint(100000, 999999)}"
    
    # Save to Redis
    redis_client.setex(f"otp:{payload.email}", 300, otp)
    
    # Send mock email
    send_otp_email(payload.email, otp)
    
    return {"message": "Verification code resent successfully."}

@router.post("/login", response_model=Token)
def login(
    response: Response,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, sets HTTP-only cookies and returns tokens.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user. Please verify your email first."
        )
    
    access_token = security.create_access_token(user.email)
    refresh_token_value = security.generate_refresh_token()
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set cookies in HTTP response
    set_auth_cookies(response, access_token, refresh_token_value)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_value,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=Token)
def refresh_token(
    request: Request,
    response: Response,
    payload: TokenRefreshRequest = None,  # Optional in body if cookies are present
    db: Session = Depends(deps.get_db)
):
    """
    Refresh access token using token rotation. Extracts token from cookies first,
    falling back to JSON body. Sets new cookies in response.
    """
    # 1. Extract refresh token from cookies first, fallback to JSON body
    token_val = request.cookies.get("refresh_token")
    if not token_val and payload:
        token_val = payload.refresh_token
        
    if not token_val:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )
        
    db_token = db.query(RefreshToken).filter(RefreshToken.token == token_val).first()
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if the token has already been revoked (Indication of reuse / theft)
    if db_token.is_revoked:
        # Revoke ALL refresh tokens for this user session as a security measure
        db.query(RefreshToken).filter(RefreshToken.user_id == db_token.user_id).update({"is_revoked": True})
        db.commit()
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token already used. Session compromised. Please re-authenticate."
        )
    
    # Check if expired
    if db_token.expires_at < datetime.utcnow():
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired refresh token. Please login again."
        )
    
    # Find user
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user or not user.is_active:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # --- Token Rotation Process ---
    # 1. Mark the old refresh token as revoked
    db_token.is_revoked = True
    
    # 2. Generate a new refresh token
    new_refresh_token_value = security.generate_refresh_token()
    new_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_new_token = RefreshToken(
        user_id=user.id,
        token=new_refresh_token_value,
        expires_at=new_expires_at
    )
    db.add(db_new_token)
    
    # 3. Generate a new access token
    new_access_token = security.create_access_token(user.email)
    
    db.commit()
    
    # Set updated cookies in response
    set_auth_cookies(response, new_access_token, new_refresh_token_value)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token_value,
        "token_type": "bearer",
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    response: Response,
    payload: TokenRefreshRequest = None,
    db: Session = Depends(deps.get_db)
):
    """
    Revoke a refresh token on logout. Clears cookies.
    """
    token_val = request.cookies.get("refresh_token")
    if not token_val and payload:
        token_val = payload.refresh_token
        
    if token_val:
        db_token = db.query(RefreshToken).filter(RefreshToken.token == token_val).first()
        if db_token:
            db_token.is_revoked = True
            db.commit()
            
    # Clear browser cookies
    clear_auth_cookies(response)
    
    return {"message": "Successfully logged out."}

@router.post("/test-expire")
def test_expire(response: Response):
    """
    Expires access token cookie manually to simulate expiry.
    """
    response.delete_cookie("access_token", path="/")
    return {"message": "Access token cookie cleared. Next API request will trigger auto-rotation."}

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update profile details (names and address fields).
    """
    update_data = profile_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(deps.get_current_user)):
    """
    Get current user details.
    """
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(deps.get_db),
    redis_client: redis.Redis = Depends(deps.get_redis)
):
    """
    Generate and send a 6-digit OTP code to reset user's password.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user with this email does not exist."
        )

    # Generate OTP
    otp = f"{random.randint(100000, 999999)}"

    # Save to Redis under password-reset-otp:<email> (valid for 5 mins / 300 seconds)
    redis_client.setex(f"password-reset-otp:{payload.email}", 300, otp)

    # Send reset email
    send_reset_password_email(payload.email, otp)

    return {"message": "Password reset code sent successfully."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(deps.get_db),
    redis_client: redis.Redis = Depends(deps.get_redis)
):
    """
    Verify reset OTP code and update user's password.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user with this email does not exist."
        )

    # Get OTP from Redis
    cached_otp = redis_client.get(f"password-reset-otp:{payload.email}")
    if not cached_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The reset code has expired or is invalid."
        )

    # Check OTP
    if cached_otp != payload.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect reset code."
        )

    # Reset Password
    user.password_hash = security.get_password_hash(payload.new_password)
    db.commit()

    # Clear OTP from Redis
    redis_client.delete(f"password-reset-otp:{payload.email}")

    return {"message": "Password reset successfully. Please log in with your new password."}

