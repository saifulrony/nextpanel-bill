# 🔄 COMPLETE RESTART GUIDE - Port 4000

## Your System Setup
- **Backend:** Port 8000
- **Frontend:** Port 4000 ✅ (Updated!)

## Quick Fix (One Command)

```bash
sudo /home/saiful/nextpanel-bill/complete-fix.sh
```

Then follow the instructions it gives you.

---

## Manual Complete Restart

### Step 1: Stop Everything
```bash
sudo pkill -9 -f "uvicorn app.main"
sudo pkill -9 -f "next dev"
sudo pkill -9 -f "node.*next"
```

### Step 2: Fix Database
```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 fix_database.py
```

### Step 3: Clean Frontend
```bash
cd /home/saiful/nextpanel-bill/billing-frontend
sudo rm -rf .next
sudo rm -rf node_modules/.cache
sudo chown -R saiful:saiful /home/saiful/nextpanel-bill/billing-frontend
```

### Step 4: Start Backend (Terminal 1)
```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Wait for:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Keep this terminal open!**

### Step 5: Start Frontend (Terminal 2)
```bash
cd /home/saiful/nextpanel-bill/billing-frontend
npm run dev
```

**Wait for:**
```
✓ Ready in X.Xs
- Local:   http://localhost:4000
```

**Keep this terminal open!**

### Step 6: Browser
```
1. Hard refresh: Ctrl + Shift + R
2. Visit: http://localhost:4000/
```

---

## ✅ What You Should See

### Homepage (http://localhost:4000/)
- ✅ Styled header with indigo buttons
- ✅ Domain search box (white, rounded)
- ✅ Featured products cards (if any starred)
- ✅ Browse by Category section
- ✅ Proper colors, spacing, shadows
- ✅ Footer at bottom

### Dashboard (http://localhost:4000/dashboard)
- ✅ Indigo sidebar on left
- ✅ Product cards with proper styling
- ✅ Star icons visible
- ✅ All colors and layouts correct

---

## 🎯 Test Everything Works

### Backend Test:
```bash
curl http://localhost:8000/api/v1/plans/
# Should return JSON array
```

### Frontend Test:
```
Visit: http://localhost:4000/
Should see: Fully styled homepage
```

### Dashboard Test:
```
Visit: http://localhost:4000/dashboard/products
Should see: Products with star icons
```

---

## 🔍 Troubleshooting

### "Blank Page" Issue

**Cause:** CSS not loading or JavaScript error

**Fix:**
1. Open browser DevTools (F12)
2. Check Console tab for red errors
3. Check Network tab - CSS files should load (status 200)
4. If CSS files missing → Frontend not compiled properly

**Solution:**
```bash
cd /home/saiful/nextpanel-bill/billing-frontend
rm -rf .next
npm run dev
# Wait for "✓ Compiled" message
```

### "Broken CSS" Issue

**Cause:** Tailwind not compiling or old cache

**Check:**
```bash
cd /home/saiful/nextpanel-bill/billing-frontend
cat src/app/globals.css | head -10
# Should see @tailwind directives
```

**Fix:**
```bash
sudo rm -rf .next
sudo chown -R saiful:saiful .
npm run dev
```

### "Network Error" Still Happening

**Check backend is running:**
```bash
ps aux | grep uvicorn
# Should show process on port 8000
```

**Check backend responds:**
```bash
curl http://localhost:8000/api/v1/plans/
# Should return JSON
```

---

## 📋 Ports Summary

| Service  | Port | URL |
|----------|------|-----|
| Backend  | 8000 | http://localhost:8000 |
| Frontend | 4000 | http://localhost:4000 ✅ |

---

## 🚀 Final Instructions

**Run these in order:**

1. **Complete fix:**
   ```bash
   sudo /home/saiful/nextpanel-bill/complete-fix.sh
   ```

2. **Terminal 1 - Backend:**
   ```bash
   cd /home/saiful/nextpanel-bill/billing-backend
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Terminal 2 - Frontend:**
   ```bash
   cd /home/saiful/nextpanel-bill/billing-frontend
   npm run dev
   ```

4. **Browser:**
   ```
   Visit: http://localhost:4000/
   Hard refresh: Ctrl + Shift + R
   ```

---

**Everything will work on port 4000 now!** 🎉

