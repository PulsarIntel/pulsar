from fastapi import Request
from fastapi.responses import JSONResponse

from finance.core.exceptions import AppError

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )
