from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


_engine_kw = {"echo": False, "future": True}
if settings.database_url.strip().lower().startswith("sqlite"):
    _engine_kw["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **_engine_kw)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

