"""Auth: password hashing, httpOnly cookie sessions, current-user dependency, AI rate limiting."""

import hashlib
import logging
import os
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import Cookie, HTTPException, Response
from passlib.context import CryptContext

from lib.db import db
from models.trip import User

logger = logging.getLogger(__name__)

SESSION_COOKIE = "voyage_session"
SESSION_DAYS = 30

_pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(raw: str) -> str:
    return _pwd.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return _pwd.verify(raw, hashed)
    except Exception:
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_session(user_id: str, response: Response) -> None:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    await db.sessions.insert_one(
        {"token_hash": _token_hash(token), "user_id": user_id, "expires_at": expires}
    )
    secure = os.environ.get("APP_URL", "").startswith("https")
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=secure,
        max_age=SESSION_DAYS * 24 * 3600,
        path="/",
    )


async def destroy_session(token: str | None, response: Response) -> None:
    if token:
        await db.sessions.delete_one({"token_hash": _token_hash(token)})
    response.delete_cookie(SESSION_COOKIE, path="/")


async def current_user(voyage_session: str | None = Cookie(default=None)) -> User:
    """FastAPI dependency — 401s unless a live session cookie resolves to a user."""
    if not voyage_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.sessions.find_one({"token_hash": _token_hash(voyage_session)})
    if not sess:
        raise HTTPException(status_code=401, detail="Session expired")
    expires = sess.get("expires_at")
    if isinstance(expires, datetime):
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            await db.sessions.delete_one({"token_hash": sess["token_hash"]})
            raise HTTPException(status_code=401, detail="Session expired")
    doc = await db.users.find_one({"id": sess["user_id"]})
    if not doc:
        raise HTTPException(status_code=401, detail="Session expired")
    return User(**{k: v for k, v in doc.items() if k != "_id" and k != "password_hash"})


# ------------------------------------------------------------ AI rate limiting
_AI_WINDOW_SECONDS = 60
_AI_MAX_CALLS = 12
_ai_calls: dict[str, list[float]] = {}


def check_ai_rate_limit(user_id: str) -> None:
    """Cheap in-process limiter so a user cannot hammer the expensive AI routes."""
    now = time.time()
    calls = [t for t in _ai_calls.get(user_id, []) if now - t < _AI_WINDOW_SECONDS]
    if len(calls) >= _AI_MAX_CALLS:
        raise HTTPException(
            status_code=429,
            detail="You're sending AI requests very quickly. Please wait a moment and try again.",
        )
    calls.append(now)
    _ai_calls[user_id] = calls
