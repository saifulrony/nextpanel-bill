# Quick Fix: Network Error on Products Page

## The Issue
You're getting a "Network Error" because:
1. The backend needs to be restarted after model changes
2. New database columns need to be added
3. Backend is running on port **8000** (not 8001 as configured)

## Quick Solution (Recommended)

Run this single command to fix everything:

```bash
cd /home/saiful/nextpanel-bill
sudo ./update_and_restart.sh
```

This script will:
- ✅ Stop the backend safely
- ✅ Add the new database columns (is_featured, sort_order)
- ✅ Restart the backend on port 8000
- ✅ Show you the status

## Manual Solution (If Script Fails)

### Step 1: Stop Backend
```bash
# Find the process
ps aux | grep uvicorn

# Stop it (use sudo if needed)
sudo kill <PID_NUMBER>
```

### Step 2: Add Database Columns
```bash
cd /home/saiful/nextpanel-bill/billing-backend

sqlite3 billing.db "ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0;"
sqlite3 billing.db "ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;"
```

### Step 3: Restart Backend
```bash
cd /home/saiful/nextpanel-bill/billing-backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
```

## Verify It Works

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/api/v1/plans
   ```

2. **Check columns were added:**
   ```bash
   cd /home/saiful/nextpanel-bill/billing-backend
   sqlite3 billing.db "PRAGMA table_info(plans);" | grep -E "(is_featured|sort_order)"
   ```

3. **Refresh your browser:**
   - Hard reload: `Ctrl + Shift + R`
   - Visit: `http://localhost:3000/dashboard/products`

## After Fix

Once the backend is running again:

1. **Mark Products as Featured:**
   - Go to `/dashboard/products`
   - Click the ⭐ star icon on 2-3 products

2. **View on Homepage:**
   - Visit `/` (homepage)
   - Scroll to "Featured Products"
   - See your selected products!

## Troubleshooting

### Still Getting Network Error?

**Check backend logs:**
```bash
cd /home/saiful/nextpanel-bill/billing-backend
tail -f backend.log
```

**Check if backend is actually running:**
```bash
ps aux | grep uvicorn
```

**Check the port:**
```bash
netstat -tlnp | grep 8000
```

### Frontend Says "Connection Refused"?

The frontend is configured for port 8001 but backend runs on 8000. You have two options:

**Option A: Update Frontend Config (Recommended)**
```bash
# Create/update .env.local in frontend
cd /home/saiful/nextpanel-bill/billing-frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Restart frontend
# Press Ctrl+C in the terminal running npm run dev
# Then run: npm run dev
```

**Option B: Change Backend Port**
```bash
# Stop backend
sudo kill <PID>

# Start on port 8001
cd /home/saiful/nextpanel-bill/billing-backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
```

## Complete Fresh Start

If nothing works, try a complete restart:

```bash
# Stop everything
sudo pkill -f uvicorn
sudo pkill -f "npm.*dev"

# Backend
cd /home/saiful/nextpanel-bill/billing-backend
sqlite3 billing.db < migrate_featured.sql
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &

# Frontend
cd /home/saiful/nextpanel-bill/billing-frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

## Success!

When it's working, you should see:
- ✅ Products page loads without errors
- ✅ Star icons appear on product cards
- ✅ Can toggle featured status
- ✅ Featured products show on homepage

---

**Need Help?**
Check the logs:
- Backend: `tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log`
- Frontend: Check browser console (F12)

