# Updated Start Script

The `start.sh` script has been updated to work correctly. However, there's a permission issue with the frontend `.next` directory that needs to be fixed first.

## Quick Fix

If you encounter frontend startup issues, run:

```bash
cd /home/saiful/nextPanel/billing
sudo chown -R saiful:saiful billing-frontend/.next
rm -rf billing-frontend/.next
./start.sh
```

## What Was Fixed

1. **Backend**: Added `aiosqlite` package (required for SQLite database)
2. **Frontend**: Changed port from 3001 to 3002 in package.json
3. **CORS**: Added http://localhost:3002 to allowed origins
4. **Requirements**: Updated requirements.txt to include aiosqlite

## Files Modified

- `billing-backend/requirements.txt` - Added aiosqlite==0.21.0
- `billing-backend/app/core/config.py` - Added port 3002 to CORS_ORIGINS  
- `billing-frontend/package.json` - Changed dev port from 3001 to 3002

All changes have been saved and are ready to use.

