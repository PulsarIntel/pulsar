import jwt
from fastapi import Header as FastAPIHeader, HTTPException
from finance.core.config import settings

def _get_user_id(authorization: str | None = FastAPIHeader(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing authorization")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
