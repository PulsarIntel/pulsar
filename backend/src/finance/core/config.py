from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Pulsar API"
    DEBUG: bool = False
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "finance"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"

    ALPACA_API_KEY: str = ""
    ALPACA_API_SECRET: str = ""
    ALPACA_BASE_URL: str = "https://data.alpaca.markets"
    ALPACA_FEED: str = "sip"
    ALPACA_STREAM_ENABLED: bool = True

    DOVIZ_ENABLED: bool = True
    DOVIZ_WS_URL: str = "wss://socket.doviz.com/"

    CRYPTO_ENABLED: bool = True
    CRYPTO_WS_URL: str = "wss://stream.binance.com:9443"
    BINANCE_API_URL: str = "https://api.binance.com"

    FINNHUB_API_KEY: str = ""
    FINNHUB_ENABLED: bool = True

    CDN_BASE_URL: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [s.strip() for s in self.ALLOWED_ORIGINS.split(",") if s.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
