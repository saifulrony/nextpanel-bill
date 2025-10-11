# Start NextPanel Billing System

## ⚠️ Important: Permission Issue Detected

The `.next` folder was created by root and needs to be removed manually.

## Manual Start Instructions

### Step 1: Clean Frontend Build (Run these commands)

```bash
cd /home/saiful/nextPanel/billing/billing-frontend
sudo rm -rf .next
sudo rm -rf node_modules/.cache
```

### Step 2: Start Backend (Terminal 1)

```bash
cd /home/saiful/nextPanel/billing/billing-backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

### Step 3: Start Frontend (Terminal 2)

```bash
cd /home/saiful/nextPanel/billing/billing-frontend
npm run dev
```

You should see:
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3001
  ✓ Ready in X s
```

### Step 4: Access the Application

Open your browser to: **http://localhost:3001**

## Quick Test

Backend health check:
```bash
curl http://localhost:8001/health
```

Should return:
```json
{"status":"healthy","version":"1.0.0","database":"connected","timestamp":"..."}
```

## Troubleshooting

If frontend still has permission errors:
```bash
# Change ownership of entire frontend folder
sudo chown -R $USER:$USER /home/saiful/nextPanel/billing/billing-frontend

# Then try starting again
cd /home/saiful/nextPanel/billing/billing-frontend
npm run dev
```

## Current Status

✅ Backend: Running on port 8001
⚠️  Frontend: Needs manual restart after cleaning .next folder

