# 🚀 Install AI Chatbot Plugin - Quick Start

## ✅ Everything is Ready!

Your modular plugin system is now set up and ready to test!

---

## 📦 **Current Status:**

```
✅ Plugin Package: /billing-frontend/modules/ai_chatbot_v1.0.0.zip (17KB)
✅ Backend Addons: /billing-backend/app/addons/ (empty, ready)
✅ Frontend Addons: /billing-frontend/src/addons/ (empty, ready)
✅ Registry: addon_registry.json (empty: {})
✅ Plugin Installer: Ready to download and install
```

---

## 🎯 **Install the Plugin in 5 Steps:**

### **Step 1: Make Sure Backend is Running**

```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Keep this terminal open!** Watch the logs for installation messages.

### **Step 2: Log Into Dashboard as Admin**

1. Go to: `http://192.168.10.203:3000/login`
2. Log in with your admin account
3. **If you get 403 errors:**
   ```javascript
   // Open browser console (F12) and run:
   localStorage.clear();
   location.reload();
   // Then log in again
   ```

### **Step 3: Go to Marketplace**

Navigate to: `http://192.168.10.203:3000/marketplace`

You should see:
- 5 available addons
- **"AI Chatbot"** with 🤖 icon
- Price: **FREE**
- Status: **Not Installed** (no green border)

### **Step 4: Click "Install Free"**

1. Click the **"Install Free"** button on AI Chatbot
2. Wait 5-10 seconds
3. **Watch the backend terminal** - you should see:

```
🔌 Installing plugin: ai_chatbot v1.0.0
📍 Source: local
📁 Loading from local: file:///home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip
✅ Downloaded to: /tmp/ai_chatbot_v1.0.0.zip
📦 Extracting to: /tmp/ai_chatbot_v1.0.0_extracted
📦 Installing backend files...
  ✅ Backend files installed to: /home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot
🎨 Installing frontend files...
  ✅ Frontend files installed to: /home/saiful/nextpanel-bill/billing-frontend/src/addons/ai_chatbot
💾 Running database migrations...
  ✅ Executed migration: up.sql
📝 Registering plugin...
✅ Plugin ai_chatbot installed successfully!
```

4. You should see a success message in the browser

### **Step 5: Restart Backend (IMPORTANT!)**

The backend needs to load the new chat routes:

```bash
# In your backend terminal:
# Press Ctrl+C to stop
# Then restart:
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## ✅ **Verify Installation:**

### **1. Check Files Were Created:**

```bash
# Backend files
ls -la /home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot/
# Should show: __init__.py, routes.py, migrations/

# Frontend files  
ls -la /home/saiful/nextpanel-bill/billing-frontend/src/addons/ai_chatbot/
# Should show: components/, pages/

# Registry
cat /home/saiful/nextpanel-bill/billing-backend/app/addons/addon_registry.json
# Should show ai_chatbot entry with metadata
```

### **2. Check Database Tables:**

```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 -c "
import sqlite3
conn = sqlite3.connect('billing.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\" AND name LIKE \"chat_%\"')
tables = [row[0] for row in cursor.fetchall()]
print('Chat tables:', tables)
conn.close()
"
```

Should show: `Chat tables: ['chat_sessions', 'chat_messages']`

### **3. Check Marketplace UI:**

Refresh `/marketplace` - AI Chatbot card should now have:
- ✅ Green border
- ✅ "Installed" badge
- ✅ "Uninstall" button (red)

### **4. Check Sidebar:**

Look at your dashboard sidebar:
- ✅ Under "Support", you should see **"Live Chats"** menu item!

### **5. Test the Page:**

Navigate to: `http://192.168.10.203:3000/support/chats`

- ✅ Should load successfully!
- ✅ Shows chat sessions interface
- ✅ Admin can manage chats

---

## 🎉 **Success!**

If everything above works, your **TRUE modular plugin system** is working!

---

## 🗑️ **Test Uninstallation:**

1. Go back to `/marketplace`
2. Find AI Chatbot (green border, "Installed")
3. Click **"Uninstall"** button
4. Confirm
5. Wait 2-5 seconds
6. Refresh the page

**What Should Happen:**

```bash
# Backend logs:
🗑️  Uninstalling plugin: ai_chatbot
💾 Reversing database migrations...
  ✅ Executed migration: down.sql
🗑️  Removing backend files...
🗑️  Removing frontend files...
📝 Unregistering plugin...
✅ Plugin ai_chatbot uninstalled successfully!

# Verify:
ls /home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot/
# Should show: No such file or directory ✅

# Database:
# Tables should be dropped ✅

# UI:
# /support/chats → 404 ✅
# "Live Chats" menu → Gone ✅
```

---

## 🐛 **Troubleshooting:**

### **Problem: 403 Error when installing**

```javascript
// Clear localStorage and log back in:
localStorage.clear();
location.reload();
```

### **Problem: Installation fails**

```bash
# Check backend logs for errors
tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log

# Verify plugin ZIP exists
ls -lh /home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip

# Check plugin source is set to local
echo $PLUGIN_SOURCE  # Should be empty or "local"
```

### **Problem: /support/chats still shows 404 after install**

```bash
# 1. Check if files were installed
ls /home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot/

# 2. If files exist, RESTART BACKEND
# Backend needs to load the new routes!
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### **Problem: Tables not created**

```bash
# Manually run migration
cd /home/saiful/nextpanel-bill/billing-backend
python3 -c "
import sqlite3
conn = sqlite3.connect('billing.db')
cursor = conn.cursor()

# Read and execute up.sql
with open('app/addons/ai_chatbot/migrations/up.sql', 'r') as f:
    sql = f.read()
    statements = [s.strip() for s in sql.split(';') if s.strip()]
    for statement in statements:
        cursor.execute(statement)

conn.commit()
conn.close()
print('✅ Tables created')
"
```

---

## 📊 **Expected Behavior:**

### **Without Plugin (Initial State):**
```
❌ /support/chats → 404
❌ "Live Chats" menu → Hidden
❌ chat_sessions table → Doesn't exist
❌ chat_messages table → Doesn't exist
✅ This is CORRECT!
```

### **With Plugin Installed:**
```
✅ /support/chats → Works!
✅ "Live Chats" menu → Visible
✅ chat_sessions table → Exists
✅ chat_messages table → Exists
✅ Can manage chat sessions
✅ API /api/v1/chat/* → Works
```

### **After Uninstalling:**
```
❌ /support/chats → 404 (gone!)
❌ "Live Chats" menu → Hidden (gone!)
❌ Tables → Dropped (gone!)
✅ Back to initial state
```

---

## 🎯 **This Proves TRUE Modularity!**

Your system now:
- ✅ Doesn't include chat code in the base app
- ✅ Downloads and installs code when plugin is installed
- ✅ Creates database tables on install
- ✅ Removes everything on uninstall
- ✅ Routes appear/disappear based on installation
- ✅ Works exactly like WordPress, VS Code, Shopify!

---

## 🚀 **Ready to Test!**

Follow the 5 steps above and watch your modular system in action! 🎉

**When you're ready for production:**
Just change `PLUGIN_SOURCE=remote` and upload plugins to `https://dbuh.com/plugins/`!

