# ✅ Universal Start Script

## How It Works

The `start.sh` script is now **completely universal** with:
- ✅ **No hardcoded paths** - Uses script's own location
- ✅ **Run from anywhere** - Works from any directory
- ✅ **Auto-detection** - Finds backend and frontend automatically
- ✅ **Safety checks** - Verifies directories exist

## Run From Anywhere

You can run the script from **any location**:

### Option 1: From project root
```bash
cd /home/saiful/nextpanel-bill
./start.sh
```

### Option 2: From parent directory
```bash
cd /home/saiful
./nextpanel-bill/start.sh
```

### Option 3: From anywhere with full path
```bash
/home/saiful/nextpanel-bill/start.sh
```

### Option 4: From a completely different directory
```bash
cd /tmp
/home/saiful/nextpanel-bill/start.sh
```

**All work the same!** The script automatically detects where it's located and uses that as the base directory.

## How It Detects Location

```bash
INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
```

This command:
1. `$0` - Script path (could be relative or absolute)
2. `dirname "$0"` - Gets directory containing script
3. `cd "$(dirname "$0")"` - Changes to that directory
4. `pwd` - Gets absolute path
5. Result: Always knows where the script is located

## Directory Structure Expected

```
/your/path/to/project/
├── start.sh           ← Script location
├── billing-backend/   ← Backend code
└── billing-frontend/  ← Frontend code
```

The script will:
- Detect it's in `/your/path/to/project/`
- Look for `billing-backend/` there
- Look for `billing-frontend/` there
- Start both services

## Safety Features

### Directory Verification
If `billing-backend/` or `billing-frontend/` don't exist, it will:
```
Error: Required directories not found!
Make sure you have:
  - /your/path/billing-backend
  - /your/path/billing-frontend
```

### Port Cleanup
Automatically stops any processes using:
- Port 8001 (backend)
- Port 4000 (frontend)

### Log Rotation
Keeps old logs as `.old` before starting new ones.

## What Gets Started

### Backend:
- **Port:** 8001
- **Command:** `python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload`
- **Log:** `billing-backend/backend.log`
- **Auto-reload:** Yes (watches for code changes)

### Frontend:
- **Port:** 4000
- **Command:** `npm run dev`
- **Log:** `billing-frontend/frontend.log`
- **Auto-reload:** Yes (Next.js hot reload)

## Access URLs

After starting, you can access:

| Service | Local | Network |
|---------|-------|---------|
| Frontend | http://localhost:4000 | http://YOUR_IP:4000 |
| Backend | http://localhost:8001 | http://YOUR_IP:8001 |
| API Docs | http://localhost:8001/docs | http://YOUR_IP:8001/docs |

## Examples

### Development Workflow

**Morning - Start services:**
```bash
cd ~/nextpanel-bill
./start.sh
```

**During day - Make changes:**
- Edit files in `/home/saiful/nextpanel-bill/`
- Services auto-reload
- Just refresh browser

**Evening - Stop services:**
```bash
pkill -f "uvicorn app.main:app"
pkill -f "next dev"
```

### Working from Different Locations

**Scenario 1: Working in project root**
```bash
cd /home/saiful/nextpanel-bill
./start.sh
```

**Scenario 2: Working in parent directory**
```bash
cd /home/saiful
./nextpanel-bill/start.sh
```

**Scenario 3: Running from script**
```bash
# Your custom script somewhere
#!/bin/bash
/home/saiful/nextpanel-bill/start.sh
```

All work identically!

## Troubleshooting

### "Command not found"
**Problem:** Script not executable

**Fix:**
```bash
chmod +x /home/saiful/nextpanel-bill/start.sh
```

### "Required directories not found"
**Problem:** Running from wrong location or directories renamed

**Check:**
```bash
ls /home/saiful/nextpanel-bill/
# Should see: billing-backend, billing-frontend
```

### "Address already in use"
**Problem:** Services already running

**Fix:**
```bash
pkill -f "uvicorn app.main"
pkill -f "next dev"
./start.sh
```

### "Backend not responding"
**Problem:** Backend crashed or failed to start

**Check logs:**
```bash
tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log
```

## Advanced Usage

### Run in Background (Detached)

The script already runs services in background with `nohup`. To detach the script itself:

```bash
nohup ./start.sh > start.log 2>&1 &
```

### Monitor Services

```bash
# Backend logs
tail -f billing-backend/backend.log

# Frontend logs
tail -f billing-frontend/frontend.log

# Both at once
tail -f billing-backend/backend.log & tail -f billing-frontend/frontend.log
```

### Restart Individual Service

**Backend only:**
```bash
pkill -f "uvicorn app.main"
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend only:**
```bash
pkill -f "next dev"
cd /home/saiful/nextpanel-bill/billing-frontend
npm run dev
```

## Summary

✅ **Universal** - Run from any directory  
✅ **No hardcoded paths** - Auto-detects location  
✅ **Safe** - Verifies directories exist  
✅ **Clean** - Stops old processes first  
✅ **Informative** - Shows PIDs, URLs, status  
✅ **Auto-reload** - Both services watch for changes  

---

**Just run:**
```bash
./start.sh
```

**From anywhere!** 🚀

