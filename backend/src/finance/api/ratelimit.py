
from typing import Union

import jwt
from fastapi import Request, WebSocket
from pyrate_limiter import Duration, Limiter, Rate

from fastapi_limiter.depends import RateLimiter
from finance.core.config import settings

async def _identifier(request: Union[Request, WebSocket]) -> str:
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        try:
            token = auth.removeprefix("Bearer ")
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get("sub", "")
            if user_id:
                return f"user:{user_id}:{request.scope['path']}"
        except (jwt.PyJWTError, Exception):
            pass

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.client:
        ip = request.client.host
    else:
        ip = "127.0.0.1"
    return f"ip:{ip}:{request.scope['path']}"

auth_limiter = RateLimiter(
    limiter=Limiter(Rate(10, Duration.MINUTE)),
    identifier=_identifier,
)

market_limiter = RateLimiter(
    limiter=Limiter(Rate(120, Duration.MINUTE)),
    identifier=_identifier,
)

realtime_limiter = RateLimiter(
    limiter=Limiter(Rate(120, Duration.MINUTE)),
    identifier=_identifier,
)

financials_limiter = RateLimiter(
    limiter=Limiter(Rate(30, Duration.MINUTE)),
    identifier=_identifier,
)

user_limiter = RateLimiter(
    limiter=Limiter(Rate(60, Duration.MINUTE)),
    identifier=_identifier,
)

health_limiter = RateLimiter(
    limiter=Limiter(Rate(300, Duration.MINUTE)),
    identifier=_identifier,
)
