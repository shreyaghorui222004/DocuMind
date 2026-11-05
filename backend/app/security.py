import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from app.config import settings

_ph = PasswordHasher()


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def _secret() -> str:
    if len(settings.jwt_secret_key) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be set in .env and be at least 32 characters")
    return settings.jwt_secret_key


def create_access_token(user_id: str, token_version: int, remember: bool = False):
    delta = (timedelta(days=settings.remember_me_days) if remember
             else timedelta(minutes=settings.access_token_minutes))
    exp = datetime.now(timezone.utc) + delta
    token = jwt.encode({"sub": user_id, "ver": token_version, "exp": exp},
                       _secret(), algorithm=settings.jwt_algorithm)
    return token, int(delta.total_seconds())


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _secret(), algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


def new_reset_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
