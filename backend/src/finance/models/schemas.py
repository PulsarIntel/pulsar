
from typing import Any

from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str

class AuthResponse(BaseModel):
    token: str
    user: UserOut

class ProfileUpdate(BaseModel):
    name: str | None = None

class WatchlistAdd(BaseModel):
    ticker: str

class HoldingIn(BaseModel):
    ticker: str
    shares: float
    avg_cost: float
    bought_at: str
    currency: str = "USD"

class HoldingOut(BaseModel):
    id: str
    ticker: str
    shares: float
    avg_cost: float
    bought_at: str
    currency: str = "USD"

class WidgetSchema(BaseModel):
    id: str
    type: str
    ticker: str | None = None
    title: str
    x: float
    y: float
    w: float
    h: float
    page: int = 1

class SaveWidgetsRequest(BaseModel):
    widgets: list[WidgetSchema]

class HeatmapIn(BaseModel):
    name: str
    tickers: list[str]

class HeatmapOut(BaseModel):
    id: str
    name: str
    tickers: list[str]

class SuccessResponse(BaseModel):
    success: bool = True
    data: Any = None
    message: str | None = None
