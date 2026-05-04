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
)
import traceback
import os

app = FastAPI(title="SAPHUL PMS Backend")

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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:5173"],  # Vite default port - LOCAL ONLY
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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

@app.get("/")
def root():
    return {"message": "SAPHUL PMS Backend is running"}

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Backend is healthy"}
