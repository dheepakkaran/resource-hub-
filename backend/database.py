from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

DATABASE_URL = "sqlite+aiosqlite:///./techvault.db"

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        from models import Resource  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)


async def migrate_db():
    """Add new columns to existing tables without dropping data."""
    async with engine.connect() as conn:
        result = await conn.execute(text("PRAGMA table_info(resources)"))
        existing_cols = [row[1] for row in result.fetchall()]
        if "priority" not in existing_cols:
            await conn.execute(text("ALTER TABLE resources ADD COLUMN priority VARCHAR(20)"))
            await conn.commit()
