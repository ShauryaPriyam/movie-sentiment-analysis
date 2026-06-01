"""
database.py
-----------
SQLAlchemy async engine wired to Postgres (Supabase / Railway / Render).
Set DATABASE_URL in your .env — the same URL your host gives you.

Supabase  → Settings > Database > Connection string (URI mode, use "Session" pooler for serverless)
Railway   → Variables tab → DATABASE_URL
Render    → Dashboard > PostgreSQL > External Database URL
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

# Raw postgres:// URLs must become postgresql+asyncpg://
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,          # set True to log all SQL (dev only)
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # drop stale connections before use
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI dependency — yields an async session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
