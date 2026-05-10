# SAPHUL Project Management System (PMS)

A complete full-stack Project Management System built with React.js (Vite) frontend and Python FastAPI backend, using PostgreSQL database.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Role-Based Access Control**: ADMIN, PROJECT_MANAGER, and MEMBER roles
- **Project Management**: Create, update, and manage projects with approval workflow
- **Task Management**: Create, assign, and track tasks with progress monitoring
- **Activity Logging**: Automatic activity logging for all system actions
- **Dashboard**: Role-specific dashboards with statistics
- **Soft Deletes**: All deletions are soft deletes (records are never permanently removed)
- **Project Statistics**: Automatic calculation of project task statistics

## Tech Stack

### Backend
- Python 3.13+
- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- JWT Authentication
- Pydantic for data validation

### Frontend
- React.js 19
- Vite
- React Router
- Axios
- Bootstrap 5
- React Bootstrap

## Database Schema

The system includes the following tables:
- `users` - User accounts with roles
- `projects` - Project information
- `project_members` - Project membership
- `tasks` - Task details
- `project_files` - File metadata
- `activity_logs` - System activity tracking
- `project_task_stats` - Project statistics

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd PMS-backend
```

2. Create a virtual environment (if not already created):
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Update database connection in `app/database.py`:
```python
DATABASE_URL = "postgresql://username:password@localhost:5432/pms_db"
```

6. Create the PostgreSQL database:
```sql
CREATE DATABASE pms_db;
```

7. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd pms-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API base URL in `src/services/api.js` if needed:
```javascript
const API_BASE_URL = "http://localhost:8000";
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Workflow Rules

### Projects
- Only ADMIN can create projects
- Project status: PENDING → IN_PROGRESS → COMPLETED
- Project completion requires ADMIN approval
- Review status handled only by ADMIN

### Tasks
- Only ADMIN or PROJECT_MANAGER can create tasks
- Task status: PENDING → IN_PROGRESS → COMPLETED
- Task completion requires PROJECT_MANAGER approval
- Only assigned members can update task progress
- Review status handled only by PROJECT_MANAGER

### Files
- Versioned metadata
- Only one file marked `is_latest = true` per entity

## Default Roles

- **ADMIN**: Full system access, can create projects, approve project completions
- **PROJECT_MANAGER**: Can create tasks, approve task completions, manage assigned projects
- **MEMBER**: Can view assigned tasks and update their progress

## Security Notes

- Change the `SECRET_KEY` in `app/core/security.py` for production
- Use environment variables for sensitive configuration
- Implement proper password policies
- Use HTTPS in production

## License

This project is proprietary software for SAPHUL Developed By Sanket Zambare.





