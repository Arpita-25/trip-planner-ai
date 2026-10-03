"""Auth routes — httpOnly cookie sessions. No token ever reaches the frontend in JSON."""

import logging

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from lib.db import db
from lib.security import (
    create_session,
    current_user,
    destroy_session,
    hash_password,
    verify_password,
)
from models.trip import LoginRequest, SignupRequest, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=User, status_code=201)
async def signup(payload: SignupRequest, response: Response) -> User:
    email = payload.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(email=email, name=payload.name.strip())
    doc = user.model_dump()
    doc["password_hash"] = hash_password(payload.password)
    await db.users.insert_one(doc)
    await create_session(user.id, response)
    logger.info("auth_signup user=%s", user.id)
    return user


@router.post("/login", response_model=User)
async def login(payload: LoginRequest, response: Response) -> User:
    email = payload.email.strip().lower()
    doc = await db.users.find_one({"email": email})
    if not doc or not verify_password(payload.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    await create_session(doc["id"], response)
    logger.info("auth_login user=%s", doc["id"])
    return User(**{k: v for k, v in doc.items() if k not in ("_id", "password_hash")})


@router.post("/logout", status_code=204)
async def logout(response: Response, voyage_session: str | None = Cookie(default=None)) -> None:
    await destroy_session(voyage_session, response)


@router.get("/me", response_model=User)
async def me(user: User = Depends(current_user)) -> User:
    return user
