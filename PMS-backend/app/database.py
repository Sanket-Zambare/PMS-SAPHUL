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
from sqlalchemy.engine.url import make_url, URL as SA_URL

_raw_url = os.getenv("DATABASE_URL", "")
_db_password = os.getenv("DB_PASSWORD")  # plain text, no URL-encoding needed

if _db_password:
    # Use SQLAlchemy URL object so special chars in password are handled safely
    _base = make_url(_raw_url)
    DATABASE_URL = _base.set(password=_db_password)
else:
    DATABASE_URL = _raw_url

_is_supabase = "supabase" in _raw_url
engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"} if _is_supabase else {})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()