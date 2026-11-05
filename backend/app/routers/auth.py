from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.deps import get_current_user, rate_limit
from app.models import PasswordResetToken, User
from app.schemas import ForgotIn, LoginIn, ResetIn, SignupIn, UserOut
from app.security import (create_access_token, hash_password, hash_token,
                          new_reset_token, verify_password)

router = APIRouter(prefix="/auth", tags=["auth"])
_limit = rate_limit(10, 60)

# Pre-computed so unknown-email logins cost the same time as real ones.
_DUMMY_HASH = hash_password("not-a-real-password-1")


def _set_cookie(resp: Response, token: str, max_age: int):
    resp.set_cookie(settings.cookie_name, token, max_age=max_age, httponly=True,
                    secure=settings.cookie_secure, samesite=settings.cookie_samesite, path="/")


@router.post("/signup", response_model=UserOut, status_code=201, dependencies=[Depends(_limit)])
def signup(body: SignupIn, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(full_name=body.full_name.strip(), email=email,
                hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    token, age = create_access_token(user.id, user.token_version)
    _set_cookie(response, token, age)
    return user


@router.post("/login", response_model=UserOut, dependencies=[Depends(_limit)])
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    ok = verify_password(body.password, user.hashed_password if user else _DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token, age = create_access_token(user.id, user.token_version, body.remember_me)
    _set_cookie(response, token, age)
    return user


@router.post("/logout")
def logout(response: Response, user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    # Bumping token_version revokes every token issued so far for this user.
    user.token_version += 1
    db.commit()
    response.delete_cookie(settings.cookie_name, path="/")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/forgot-password", dependencies=[Depends(_limit)])
def forgot_password(body: ForgotIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user:
        raw, hashed = new_reset_token()
        db.add(PasswordResetToken(
            user_id=user.id, token_hash=hashed,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_minutes)))
        db.commit()
        # DEV MAILER: no email service is configured, so nothing is emailed.
        # Replace this with SMTP/Resend later.
        print(f"\n[DEV] Password reset link for {user.email}: "
              f"{settings.frontend_url}/reset-password?token={raw}\n")
    return {"message": "If an account exists for that email, a reset link has been generated."}


@router.post("/reset-password", dependencies=[Depends(_limit)])
def reset_password(body: ResetIn, db: Session = Depends(get_db)):
    rec = db.scalar(select(PasswordResetToken).where(
        PasswordResetToken.token_hash == hash_token(body.token)))
    expires = rec.expires_at if rec else None
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not rec or rec.used or expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset link is invalid or has expired")
    user = db.get(User, rec.user_id)
    user.hashed_password = hash_password(body.new_password)
    user.token_version += 1
    rec.used = True
    db.commit()
    return {"message": "Password updated. You can now log in."}
