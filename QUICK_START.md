# Quick Start Guide - Complete Working System

## ✅ System is Ready!

The database has been seeded with dummy data. Everything is configured to work with the database.

## 🚀 Start the System

### 1. Start Backend Server
```bash
cd PMS-backend
uvicorn app.main:app --reload
```
Backend will run on: `http://localhost:8000`

### 2. Start Frontend Server
```bash
cd pms-frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

## 🔐 Login Credentials

### Admin Account
- **Email:** admin@saphul.com
- **Password:** admin123
- **Access:** Full system access

### Project Manager Account
- **Email:** john@example.com
- **Password:** password123
- **Access:** Can manage projects and tasks

### Member Account
- **Email:** sarah@example.com
- **Password:** password123
- **Access:** Can view and update assigned tasks

## 📝 Sign Up

You can also create new accounts:
1. Go to `http://localhost:5173/signup`
2. Fill in the form
3. Choose your role (Member, Project Manager, or Admin)
4. You'll be automatically logged in after signup

## 📊 Pre-loaded Data

The database contains:
- **5 Users** (1 Admin, 1 Manager, 3 Members)
- **4 Projects** (Website Redesign, Mobile App, API Integration, Database Migration)
- **6 Tasks** (Various statuses: Pending, In Progress, Completed)
- **7 Project Members** (Assigned to projects)
- **5 Activity Logs** (System activity history)
- **Project Statistics** (Auto-calculated)

## ✨ Features Working

✅ **Authentication & Authorization**
- Login/Logout
- Sign up for new accounts
- Role-based access control (ADMIN, PROJECT_MANAGER, MEMBER)
- Protected routes

✅ **Dashboard**
- Role-specific statistics
- Project and task counts
- Real-time data from database

✅ **Projects**
- View all projects
- Create new projects (ADMIN only)
- Edit projects (ADMIN only)
- Delete projects (ADMIN only)
- Approve project completion (ADMIN only)
- View project details with tasks and activity

✅ **Tasks**
- View all tasks
- Create tasks (ADMIN/PROJECT_MANAGER)
- Edit tasks (Assigned members or ADMIN/PROJECT_MANAGER)
- Update task progress
- Approve task completion (PROJECT_MANAGER/ADMIN)
- Delete tasks (ADMIN/PROJECT_MANAGER)

✅ **Users** (ADMIN only)
- View all users
- Create new users
- Edit users
- Delete users (soft delete)

✅ **Database Integration**
- All data stored in PostgreSQL
- New items added to database
- Updates reflected immediately
- Statistics auto-calculated

## 🎯 Testing the System

1. **Login** with admin credentials
2. **View Dashboard** - See statistics
3. **Create a Project** - Click "Add Project" (ADMIN only)
4. **Create a Task** - Go to a project and add a task
5. **Update Task Progress** - Edit a task and change progress
6. **Sign Up** - Create a new account
7. **View Activity Logs** - Check project details for activity timeline

## 🔧 Troubleshooting

### Backend not starting?
- Check if PostgreSQL is running
- Verify database connection in `PMS-backend/app/database.py`
- Make sure database `pms_db` exists

### Frontend can't connect?
- Ensure backend is running on port 8000
- Check browser console (F12) for errors
- Verify CORS settings in backend

### Database errors?
- Run `python seed_database.py` again to reset data
- Check PostgreSQL is running and accessible

## 📝 Notes

- All deletions are **soft deletes** (data preserved)
- Project completion requires **ADMIN approval**
- Task completion requires **PROJECT_MANAGER approval**
- Only assigned members can update task progress
- Statistics are automatically maintained

## 🎉 Ready to Demo!

The system is fully functional and ready for demonstration. All features work with real database integration!


