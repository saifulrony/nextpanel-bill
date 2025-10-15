# 🔧 Fix Database Permissions

## Problem
The database file is owned by root, so you can't create the pages table.

## Solution

### Run this command in your terminal:

```bash
sudo chown $USER:$USER /home/saiful/nextpanel-bill/billing-backend/billing.db
```

### Then run this to create the pages table:

```bash
python3 /home/saiful/nextpanel-bill/create_pages_table.py
```

### Then restart the backend:

```bash
pkill -9 -f uvicorn
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
```

### Then test it:

```bash
curl http://localhost:8001/api/v1/pages
```

You should see the list of pages!

---

## Quick Fix (All in One)

```bash
# Fix permissions
sudo chown $USER:$USER /home/saiful/nextpanel-bill/billing-backend/billing.db

# Create pages table
python3 /home/saiful/nextpanel-bill/create_pages_table.py

# Restart backend
pkill -9 -f uvicorn
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &

# Wait 3 seconds
sleep 3

# Test API
curl http://localhost:8001/api/v1/pages
```

---

## After This Works:

1. Go to: `http://localhost:3000/page-builder`
2. Select a page
3. Edit it
4. Save it
5. View at: `http://localhost:3000/dynamic-page/home`

**Everything will work!** 🎉

