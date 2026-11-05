import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import User
from app.security import decode_access_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:]
    payload = decode_access_token(token) if token else None
    user = db.get(User, payload["sub"]) if payload else None
    if not user or user.token_version != payload.get("ver"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def rate_limit(max_calls: int, per_seconds: int):
    """Simple in-memory per-IP limiter (use Redis if you run several workers)."""
    hits: dict[str, deque] = defaultdict(deque)

    def dep(request: Request):
        ip = request.client.host if request.client else "unknown"
        now, q = time.time(), hits[ip]
        while q and now - q[0] > per_seconds:
            q.popleft()
        if len(q) >= max_calls:
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
        q.append(now)

    dep.reset = hits.clear  # used by tests
    return dep
