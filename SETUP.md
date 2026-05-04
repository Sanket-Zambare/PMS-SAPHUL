# Quick Setup Guide

## Prerequisites
1. PostgreSQL must be installed and running
2. Create a database named `pms_db`

## Steps to Get Started

### 1. Create PostgreSQL Database
Open PostgreSQL and run:
```sql
CREATE DATABASE pms_db;
```

### 2. Update Database Connection
Edit `PMS-backend/app/database.py` and update the connection string:
```python
DATABASE_URL = "postgresql://postgres:1739@localhost:5432/pms_db"
```
(Change username, password, and database name as needed)

### 3. Create Admin User
Run this command from the `PMS-backend` directory:
```bash
python create_admin.py
```

This will create an admin user with:
- Email: `admin@saphul.com`
- Password: `admin123`

### 4. Start Backend Server
From the `PMS-backend` directory:
```bash
uvicorn app.main:app --reload
```

The backend will run on `http://localhost:8000`

### 5. Start Frontend Server
From the `pms-frontend` directory:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 6. Login
- Go to `http://localhost:5173/login`
- Use the admin credentials created in step 3

## Troubleshooting

### Login stuck on "Signing in..."
- Make sure the backend is running on port 8000
- Check browser console for errors
- Verify database connection is correct
- Ensure admin user was created successfully

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `database.py`
- Ensure database `pms_db` exists

### CORS Errors
- Make sure backend CORS is configured for `http://localhost:5173`
- Check that both servers are running





