# 🧪 Test Plugin Installation - Step by Step

## ✅ Plugin Created!

**Location:** `/home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip`  
**Size:** 18KB  
**Contents:** Complete AI Chatbot with backend, frontend, and migrations

---

## 📦 What's Inside the Plugin

```
ai_chatbot_v1.0.0.zip
├── metadata.json              ✅ Plugin info
├── backend/                   ✅ Python API code
│   ├── __init__.py
│   ├── routes.py             (Chat API endpoints)
│   └── migrations/
├── frontend/                  ✅ React components
│   ├── components/
│   │   └── AIChatBot.tsx     (Homepage widget)
│   └── pages/
│       └── ChatsPage.tsx     (Admin chat interface)
├── migrations/                ✅ Database setup
│   ├── up.sql                (CREATE tables)
│   └── down.sql              (DROP tables)
└── README.md                  ✅ Documentation
```

---

## 🚀 Test Installation Flow

### **Step 1: Verify Plugin is Ready**

```bash
ls -lh /home/saiful/nextpanel-bill/billing-frontend/modules/
# Should see: ai_chatbot_v1.0.0.zip (18K)

unzip -l /home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip
# Should see all files listed above
```

### **Step 2: Make Sure Backend is Running**

```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### **Step 3: Verify Plugin Source is LOCAL**

```bash
# Check environment
echo $PLUGIN_SOURCE
# Should be empty or "local"

# If not set:
export PLUGIN_SOURCE=local
```

### **Step 4: Log Into Dashboard as Admin**

1. Go to `http://192.168.10.203:3000/login`
2. Log in with your admin account
3. **IMPORTANT:** Clear localStorage first if you had 403 errors:
   ```javascript
   // In browser console (F12):
   localStorage.clear();
   location.reload();
   // Then log in again
   ```

### **Step 5: Go to Marketplace**

1. Navigate to `/marketplace`
2. You should see "AI Chatbot" in the list
3. It should show:
   - Icon: 🤖
   - Price: FREE
   - Status: Not installed (no green border)

### **Step 6: Install the Plugin**

1. Click **"Install Free"** button on AI Chatbot card
2. Wait 5-10 seconds
3. You should see backend logs:
   ```
   🔌 Installing plugin: ai_chatbot v1.0.0
   📍 Source: local
   📁 Loading from local: file:///home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip
   ✅ Downloaded to: /tmp/ai_chatbot_v1.0.0.zip
   📦 Extracting to: /tmp/ai_chatbot_v1.0.0_extracted
   📦 Installing backend files...
     ✅ Backend files installed
   🎨 Installing frontend files...
     ✅ Frontend files installed
   💾 Running database migrations...
     ✅ Executed migration: up.sql
   📝 Registering plugin...
   ✅ Plugin ai_chatbot installed successfully!
   ```

### **Step 7: Verify Installation**

**Check Files Were Created:**
```bash
# Backend files
ls -la /home/saiful/nextpanel-bill/billing-backend/app/addons/
# Should see: ai_chatbot/ folder

ls -la /home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot/
# Should see: __init__.py, routes.py, migrations/

# Frontend files
ls -la /home/saiful/nextpanel-bill/billing-frontend/src/addons/
# Should see: ai_chatbot/ folder

# Registry
cat /home/saiful/nextpanel-bill/billing-backend/app/addons/addon_registry.json
# Should show ai_chatbot entry
```

**Check Database Tables Were Created:**
```bash
cd /home/saiful/nextpanel-bill/billing-backend
sqlite3 billing.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'chat_%';"
# Should show: chat_sessions, chat_messages
```

**Check Marketplace UI:**
```
1. Refresh /marketplace page
2. AI Chatbot card should now have:
   - Green border
   - "Installed" badge
   - "Uninstall" button (red)
```

### **Step 8: Test the Plugin Works**

**Homepage Widget:**
```
1. Go to homepage: http://192.168.10.203:3000/
2. Look at bottom right corner
3. ✅ You should see chatbot button!
4. Click it → Chat window opens
5. Type a message → AI responds
```

**Admin Interface:**
```
1. Go to /support
2. Check sidebar
3. ✅ "Live Chats" menu item should appear!
4. Click it → Goes to /support/chats
5. Should show chat sessions interface
```

---

## 🗑️ Test Uninstallation

### **Step 1: Uninstall Plugin**

1. Go back to `/marketplace`
2. Find AI Chatbot (green border, "Installed")
3. Click **"Uninstall"** button (red)
4. Confirm
5. Wait 2-5 seconds
6. You should see backend logs:
   ```
   🗑️  Uninstalling plugin: ai_chatbot
   💾 Reversing database migrations...
     ✅ Executed migration: down.sql
   🗑️  Removing backend files...
   🗑️  Removing frontend files...
   📝 Unregistering plugin...
   ✅ Plugin ai_chatbot uninstalled successfully!
   ```

### **Step 2: Verify Uninstallation**

**Check Files Were Removed:**
```bash
# Backend - should NOT exist
ls /home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot/
# Should show: No such file or directory

# Frontend - should NOT exist
ls /home/saiful/nextpanel-bill/billing-frontend/src/addons/ai_chatbot/
# Should show: No such file or directory

# Registry should be empty
cat /home/saiful/nextpanel-bill/billing-backend/app/addons/addon_registry.json
# Should show: {}
```

**Check Tables Were Dropped:**
```bash
cd /home/saiful/nextpanel-bill/billing-backend
sqlite3 billing.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'chat_%';"
# Should show: (empty - no results)
```

**Check UI:**
```
1. Refresh /marketplace
2. AI Chatbot card:
   - No green border
   - No "Installed" badge
   - "Install Free" button back

3. Go to homepage
4. ✅ Chatbot button GONE!

5. Check sidebar at /support
6. ✅ "Live Chats" menu item GONE!
```

---

## ✅ Success Criteria

After testing, you should have verified:

- [x] Plugin ZIP exists in `/modules/` folder
- [x] Install works (files copied, tables created)
- [x] Plugin appears in marketplace as "Installed"
- [x] Chatbot widget appears on homepage
- [x] "Live Chats" menu appears in sidebar
- [x] Admin can access `/support/chats`
- [x] Uninstall works (files deleted, tables dropped)
- [x] Plugin shows as "Not Installed" after uninstall
- [x] Chatbot widget disappears
- [x] "Live Chats" menu disappears

---

## 🐛 Troubleshooting

### **Installation Fails**

```bash
# Check backend logs for errors
tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log

# Make sure plugin source is local
export PLUGIN_SOURCE=local

# Verify ZIP file exists
ls -lh /home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip
```

### **403 Error**

```javascript
// Clear localStorage and log back in
localStorage.clear();
location.reload();
```

### **Tables Not Created**

```bash
# Check if migration ran
cd /home/saiful/nextpanel-bill/billing-backend
sqlite3 billing.db ".tables"
# Should include: chat_sessions, chat_messages

# If not, manually run migration:
sqlite3 billing.db < /tmp/ai_chatbot_v1.0.0_extracted/migrations/up.sql
```

---

## 🎊 Next Steps

Once local testing works:

1. ✅ Package more plugins (Email Marketing, SMS, etc.)
2. ✅ Upload to `https://dbuh.com/plugins/`
3. ✅ Switch to `PLUGIN_SOURCE=remote`
4. ✅ Customers download from your server!

---

**Your plugin system is READY TO TEST!** 🚀

Start with Step 1 and follow through. The chatbot should install/uninstall cleanly!

