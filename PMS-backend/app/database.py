from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# postgresql://<username>:<password>@<host>:<port>/<database_name>

# =========================
# ==== PRODUCTION (HOSTINGER) ====
# Uncomment this for production deployment
# Use environment variable: DATABASE_URL=postgresql://user:pass@host:port/dbname
# =========================
# PRODUCTION database URL (uncomment and set your production database):
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@host:5432/production_db_pms")

# =========================
# ==== LOCAL (REMOVE FOR PROD) ====
# REMOVE OR COMMENT THIS FOR PRODUCTION
# =========================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1739@localhost:5432/db_pms")  # LOCAL ONLY - development database

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()