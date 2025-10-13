# 🔧 FIX NETWORK ERRORS - Do This Now!

## The Problem
Your backend is **stuck** - it's running but not responding. That's why everything shows "Network Error".

## The Solution (2 Minutes)

### Step 1: Run This Command
```bash
sudo /home/saiful/nextpanel-bill/fix-now.sh
```

**What it does:**
- ✅ Kills the stuck backend
- ✅ Adds database columns (is_featured, sort_order)
- ✅ Starts fresh backend on port 8000
- ✅ Tests that it works

### Step 2: Restart Frontend

**Find the terminal running your frontend** (showing "npm run dev" or "next dev")

Then:
1. Press `Ctrl + C` to stop it
2. Run:
```bash
cd /home/saiful/nextpanel-bill/billing-frontend
npm run dev
```

### Step 3: Hard Refresh Browser
```
Press: Ctrl + Shift + R
(or Cmd + Shift + R on Mac)
```

---

## ✅ How to Know It Worked

**1. Visit:** `http://localhost:3000/dashboard/products`
- Should load WITHOUT errors
- Should see your products
- Should see ⭐ star icons on product cards

**2. Visit:** `http://localhost:3000/`
- Should load homepage
- Should see featured products section
- Should see "Browse by Category" section

**3. Check browser console (F12):**
- Should see NO red errors

---

## 🎉 After It Works

### Mark Products as Featured:
1. Go to `/dashboard/products`
2. Click the ⭐ star icon on products you want featured
3. Star turns solid yellow = product is featured

### See Them on Homepage:
1. Go to homepage `/`
2. Scroll down
3. Featured products show in special section
4. All products show in "Browse by Category"

---

## 🆘 If It Still Doesn't Work

### Check Backend Logs:
```bash
cd /home/saiful/nextpanel-bill/billing-backend
tail -f backend.log
```

Look for errors. Common issues:
- "Address in use" → Port blocked, need to kill process
- "Module not found" → Need to install dependencies
- "Database locked" → Close other connections to database

### Verify Backend is Running:
```bash
ps aux | grep uvicorn
```
Should show process on port 8000.

### Test Backend Directly:
```bash
curl http://localhost:8000/api/v1/plans
```
Should return JSON with products.

### Nuclear Option (Complete Reset):
```bash
# Stop everything
sudo pkill -9 uvicorn
sudo pkill -9 node

# Backend
cd /home/saiful/nextpanel-bill/billing-backend
sqlite3 billing.db "ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0;"
sqlite3 billing.db "ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal - Frontend
cd /home/saiful/nextpanel-bill/billing-frontend
npm run dev

# Browser: Hard refresh (Ctrl+Shift+R)
```

---

## 📋 Quick Checklist

- [ ] Run: `sudo /home/saiful/nextpanel-bill/fix-now.sh`
- [ ] See "✅ Backend working!" message
- [ ] Stop frontend (Ctrl+C)
- [ ] Start frontend: `npm run dev`
- [ ] Hard refresh browser: `Ctrl+Shift+R`
- [ ] Visit `/dashboard/products` - loads without error
- [ ] Visit `/` homepage - loads without error
- [ ] Click star ⭐ to feature products
- [ ] See featured products on homepage

---

## 🎯 Summary

**Problem:** Backend stuck, not responding  
**Solution:** Kill and restart it  
**Command:** `sudo /home/saiful/nextpanel-bill/fix-now.sh`  
**Then:** Restart frontend + hard refresh browser  
**Result:** Everything works! ✨

---

**Run the command now and you'll be back up in 2 minutes!** 🚀

