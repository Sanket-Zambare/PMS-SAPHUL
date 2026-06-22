from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.database import engine
from app.routes.invitations import router as invitations
from app.routes.import_routes import router as import_router
from app.routes.meetings import router as meetings_router
from app.models import Base
from app.routes import (
    auth,
    users,
    admin,
    projects,
    project_members,
    tasks,
    sprints,
    time_logs,
    approvals,
    project_files,
    activity_logs,
    dashboard,
    notifications,
)
import traceback
import os

app = FastAPI(title="SANE PMS Backend")

# CORS middleware - MUST be added before routes
# =========================
# ==== PRODUCTION (HOSTINGER) ====
# Uncomment this for production deployment
# Frontend: https://app.yourdomain.com
# =========================
# PRODUCTION CORS origins (uncomment for production):
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://app.yourdomain.com"],  # PRODUCTION - replace with your frontend domain
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"],
# )

# =========================
# ==== LOCAL (REMOVE FOR PROD) ====
# REMOVE OR COMMENT THIS FOR PRODUCTION
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://sane-sigma.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files for uploads
# =========================
# ==== PRODUCTION (HOSTINGER) ====
# Uncomment this for production deployment
# Use absolute path: /home/username/uploads or /var/www/uploads
# =========================
# PRODUCTION upload directory (uncomment and set your production path):
# app.mount("/uploads", StaticFiles(directory="/home/username/uploads"), name="uploads")

# =========================
# ==== LOCAL (REMOVE FOR PROD) ====
# REMOVE OR COMMENT THIS FOR PRODUCTION
# =========================
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")  # LOCAL ONLY - relative path

# Include routers
app.include_router(auth)
app.include_router(users)
app.include_router(admin)
app.include_router(projects)
app.include_router(project_members)
app.include_router(tasks)
app.include_router(sprints)
app.include_router(time_logs)
app.include_router(approvals)
app.include_router(project_files)
app.include_router(activity_logs)
app.include_router(dashboard)
app.include_router(invitations)
app.include_router(notifications)
app.include_router(import_router)
app.include_router(meetings_router)

# Start background scheduler for due date reminders
from app.services.scheduler import start_scheduler
_scheduler = start_scheduler()

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to catch all errors."""
    print(f"Error: {str(exc)}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Create the database tables
Base.metadata.create_all(bind=engine)

# Safe column migrations (idempotent via IF NOT EXISTS)
try:
    from sqlalchemy import text as _text
    with engine.connect() as _conn:
        _conn.execute(_text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE"))
        _conn.execute(_text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocker_reason TEXT"))
        _conn.execute(_text("""
            CREATE TABLE IF NOT EXISTS meetings (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                scheduled_at TIMESTAMP NOT NULL,
                duration_minutes INTEGER NOT NULL DEFAULT 60,
                meet_link VARCHAR(500),
                is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
                project_id INTEGER REFERENCES projects(id),
                created_by INTEGER NOT NULL REFERENCES users(id),
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        _conn.execute(_text("""
            CREATE TABLE IF NOT EXISTS meeting_attendees (
                id SERIAL PRIMARY KEY,
                meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
            )
        """))
        _conn.commit()
except Exception:
    pass

@app.get("/")
def root():
    return {"message": "SANE PMS Backend is running"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}
