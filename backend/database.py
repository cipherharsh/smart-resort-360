# /backend/database.py
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("database")

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./smart_resort.db")

def init_engine():
    global raw_db_url
    if raw_db_url.startswith("postgresql://"):
        url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        try:
            eng = create_engine(url, pool_pre_ping=True)
            with eng.connect():
                logger.info("Connected to PostgreSQL database.")
            return eng
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
            return create_engine("sqlite:///./smart_resort.db", connect_args={"check_same_thread": False})
    elif raw_db_url.startswith("sqlite"):
        return create_engine(raw_db_url, connect_args={"check_same_thread": False})
    else:
        return create_engine(raw_db_url)

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()