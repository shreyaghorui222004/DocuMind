from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

if not settings.database_url:
    raise RuntimeError("Set NEON_DATABASE_URL (or DATABASE_URL) in .env")

_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create missing tables only. Never drops or alters existing tables
    (including the ragverse_documents vector table)."""
    from app import models  # noqa: F401  (register models)
    Base.metadata.create_all(bind=engine)
