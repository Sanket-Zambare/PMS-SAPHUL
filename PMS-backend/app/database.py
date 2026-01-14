from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# postgresql://<username>:<password>@<host>:<port>/<database_name>

DATABASE_URL = "postgresql://postgres:1739@localhost:5432/db_pms"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()