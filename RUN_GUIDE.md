
# 🏥 Panaceon Medical Coding AI - Run Guide

Your development environment has been successfully repaired. The Backend database is now initialized, and an admin user has been created.

## 🚀 Quick Start

### 1. Ensure Docker is Running
Open **Docker Desktop** and check that the following containers are running:
- `multitenant-postgres`
- `panaceon-redis`
- `multitenant-pgadmin`

If not, run:
```powershell
docker compose up -d
```

### 2. Start the Backend
Open a terminal in the project root (`D:\Medical_coding`) and run:
```powershell
.\start-backend.bat
```
*Wait until you see "Uvicorn running on http://localhost:8000"*

### 3. Start the Frontend
Open a **new** terminal and run:
```powershell
.\start-frontend.bat
```
*Wait for the browser to open at http://localhost:3000*

## 🔑 Login Credentials

Use the following credentials to log in:

- **Username:** `admin`
- **Password:** `admin`

## 🛠️ Troubleshooting

If you encounter issues:

1. **"Failed to fetch"**: 
   - Ensure Backend is running on port 8000.
   - Check Backend terminal for errors.
   - Refresh the page.

2. **Database Errors**:
   - If you need to reset the database completely, run `docker compose down -v` and restart.
   - Then you may need to re-run the initialization scripts (ask for help).

3. **Environment Variables**:
   - Backend `.env` is located in `Backend/.env`.
   - Frontend `.env` is located in `Frontend/.env`.

## 📂 Project Status
- **Database**: Initialized ✅
- **Admin User**: Created (`admin`) ✅
- **Reference Data**: Tables created ✅ (Seeding partial)
