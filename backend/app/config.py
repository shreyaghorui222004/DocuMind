"""Central settings. All secrets come from environment variables / .env."""
import os
from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes")


def _db_url() -> str:
    url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL") or ""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Settings:
    database_url: str = _db_url()
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "")
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))
    remember_me_days: int = int(os.getenv("REMEMBER_ME_DAYS", "30"))
    reset_token_minutes: int = int(os.getenv("RESET_TOKEN_MINUTES", "30"))
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    cookie_name: str = "documind_session"
    # Set COOKIE_SECURE=true in production (HTTPS). For a frontend and API on
    # different sites also set COOKIE_SAMESITE=none.
    cookie_secure: bool = _bool("COOKIE_SECURE", False)
    cookie_samesite: str = os.getenv("COOKIE_SAMESITE", "lax")


settings = Settings()
