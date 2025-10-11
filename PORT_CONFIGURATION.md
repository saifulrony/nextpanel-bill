# Port Configuration Reference

## Current Port Setup

- **Frontend**: Port **3001** (http://localhost:3001)
- **Backend API**: Port **8001** (http://localhost:8001)
- **API Documentation**: http://localhost:8001/docs

## Configuration Files

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```
Location: `/home/saiful/nextPanel/billing/billing-frontend/.env.local`

### Frontend (package.json)
```json
"scripts": {
  "dev": "next dev -p 3001 -H 0.0.0.0",
  "start": "next start -p 3001 -H 0.0.0.0"
}
```

### Backend CORS (config.py)
```python
CORS_ORIGINS: list = [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://billing.local",
]
```

## Starting Services

### Option 1: Using the Start Script (Recommended)
```bash
cd /home/saiful/nextPanel/billing
./start_services.sh
```

This will:
- Stop any existing services
- Start backend on port 8001
- Start frontend on port 3001
- Show access points and log locations

### Option 2: Manual Start

#### Backend (Terminal 1)
```bash
cd /home/saiful/nextPanel/billing/billing-backend
source venv/bin/activate  # if using venv
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend (Terminal 2)
```bash
cd /home/saiful/nextPanel/billing/billing-frontend
npm run dev
```

## Stopping Services

### Using the Stop Script
```bash
cd /home/saiful/nextPanel/billing
./stop_services.sh
```

### Manual Stop
```bash
# Stop backend
pkill -f "uvicorn app.main:app"

# Stop frontend
pkill -f "next dev"
```

## Checking Service Status

```bash
# Check if backend is running
curl http://localhost:8001/health

# Check if frontend is running
curl http://localhost:3001

# Check running processes
ps aux | grep -E "uvicorn|next dev" | grep -v grep
```

## Troubleshooting

### Network Error in Browser
1. Check if backend is running: `curl http://localhost:8001/health`
2. Check frontend .env.local file exists and has correct URL
3. Restart frontend after creating/modifying .env.local
4. Check browser console for exact error

### Port Already in Use
```bash
# Find process using port 8001
sudo lsof -i :8001

# Find process using port 3001
sudo lsof -i :3001

# Kill process by PID
kill -9 <PID>
```

### CORS Error
1. Verify backend CORS_ORIGINS includes `http://localhost:3001`
2. Restart backend after CORS changes
3. Clear browser cache

## Quick Commands

```bash
# View backend logs
tail -f /home/saiful/nextPanel/billing/billing-backend/backend.log

# View frontend logs
tail -f /home/saiful/nextPanel/billing/billing-frontend/frontend.log

# Test backend API
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Run auth tests
cd /home/saiful/nextPanel/billing
./test_auth_system.sh
```

