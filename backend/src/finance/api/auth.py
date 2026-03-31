from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, Header as FastAPIHeader, HTTPException
from finance.api.ratelimit import auth_limiter
from finance.core.config import settings
from finance.core.exceptions import BadRequestError, UnauthorizedError
from finance.database.connections import get_db
from finance.models.schemas import (
    AuthResponse,
    LoginRequest,
    ProfileUpdate,
    RegisterRequest,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(auth_limiter)])

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def _create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    db = get_db()

    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise BadRequestError("An account with this email already exists")

    if len(body.password) < 6:
        raise BadRequestError("Password must be at least 6 characters")

    if not body.name.strip():
        raise BadRequestError("Name is required")

    user_doc = {
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password": _hash_password(body.password),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    return AuthResponse(
        token=_create_token(user_id),
        user=UserOut(id=user_id, name=user_doc["name"], email=user_doc["email"]),
    )

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    db = get_db()

    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise UnauthorizedError("Invalid email or password")

    if not _verify_password(body.password, user["password"]):
        raise UnauthorizedError("Invalid email or password")

    user_id = str(user["_id"])

    return AuthResponse(
        token=_create_token(user_id),
        user=UserOut(id=user_id, name=user["name"], email=user["email"]),
    )

from finance.api.deps import _get_user_id

@router.get("/profile", response_model=UserOut)
async def get_profile(
    authorization: str | None = FastAPIHeader(None),
) -> UserOut:
    user_id = _get_user_id(authorization)
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"])

@router.patch("/profile")
async def update_profile(
    body: ProfileUpdate,
    authorization: str | None = FastAPIHeader(None),
):
    user_id = _get_user_id(authorization)
    db = get_db()

    update: dict = {}
    if body.name is not None:
        if not body.name.strip():
            raise BadRequestError("Name is required")
        update["name"] = body.name.strip()

    if not update:
        raise BadRequestError("No fields to update")

    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return UserOut(id=str(user["_id"]), name=user["name"], email=user["email"])
