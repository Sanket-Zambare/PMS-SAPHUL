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
DATABASE_URL = os.getenv("DATABASE_URL")

# Supabase requires SSL; pooler connections need sslmode in connect_args
_connect_args = {"sslmode": "require"} if DATABASE_URL and "supabase" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()