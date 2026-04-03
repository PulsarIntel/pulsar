
from typing import Any, Literal

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

class TransactionIn(BaseModel):
    ticker: str
    type: Literal["buy", "sell"]
    shares: float
    price_per_share: float
    date: str
    currency: str = "USD"
    fee: float = 0.0
    notes: str = ""
    portfolio_id: str | None = None

class TransactionUpdate(BaseModel):
    type: Literal["buy", "sell"] | None = None
    shares: float | None = None
    price_per_share: float | None = None
    date: str | None = None
    fee: float | None = None
    notes: str | None = None

class TransactionOut(BaseModel):
    id: str
    portfolio_id: str
    ticker: str
    type: Literal["buy", "sell"]
    shares: float
    price_per_share: float
    total_cost: float
    date: str
    currency: str
    fee: float
    notes: str
    created_at: str

class PositionOut(BaseModel):
    id: str
    portfolio_id: str
    ticker: str
    currency: str
    total_shares: float
    avg_cost: float
    total_invested: float
    realized_pnl: float
    first_transaction_date: str
    transaction_count: int

class PortfolioCreate(BaseModel):
    name: str

class PortfolioUpdate(BaseModel):
    name: str | None = None

class PortfolioOut(BaseModel):
    id: str
    name: str
    is_default: bool
    created_at: str

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
