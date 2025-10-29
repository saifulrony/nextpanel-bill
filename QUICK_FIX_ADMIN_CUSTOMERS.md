# Quick Fix for /admin/customers Error

## Problem
The `/admin/customers` page shows a "Network Error" because the `payments` table is missing the `order_id` column.

## Quick Fix (Recommended)

Run this single command:

```bash
cd /home/saiful/nextpanel-bill
chmod +x fix-and-restart.sh && ./fix-and-restart.sh
```

## Manual Fix

If the script doesn't work, do it manually:

1. **Fix the database:**
   ```bash
   docker exec billing-backend sqlite3 /app/billing.db "ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id);"
   ```

2. **Restart the backend:**
   ```bash
   docker-compose restart backend
   ```

3. **Check if it's working:**
   ```bash
   docker-compose ps backend
   ```

## Verify It's Fixed

1. Go to `/admin/customers` in your browser
2. The page should load without errors
3. You should see the customers list

## What Was Fixed

The `Payment` model in SQLAlchemy expects an `order_id` column, but the database table was created before this column was added to the model. The fix adds the missing column to the existing table.

## Automatic Prevention

Future starts will automatically check and add the column if it's missing (added in `app/core/database.py`).
