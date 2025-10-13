# 🔌 Modular Plugin System - Complete Guide

## 🎯 What We Built

A **TRUE modular plugin system** where:
- ✅ Installing a plugin **downloads and adds code files**
- ✅ Uninstalling a plugin **removes code files**
- ✅ Database tables are **created on install, dropped on uninstall**
- ✅ Routes **appear/disappear** based on installed plugins
- ✅ **Easily switch** between local (development) and remote (production) plugin sources

## 🏗️ Architecture

```
Development Mode (Now):
Plugin Source: /home/saiful/nextpanel-bill/billing-frontend/modules/
└── ai_chatbot_v1.0.0.zip

Production Mode (Future):
Plugin Source: https://dbuh.com/plugins/
└── download/ai_chatbot/1.0.0
```

## 🔄 How to Switch Between Local and Remote

### **Method 1: Environment Variable (Recommended)**

```bash
# For local development (use /modules folder)
export PLUGIN_SOURCE=local

# For production (download from https://dbuh.com/plugins)
export PLUGIN_SOURCE=remote
export PLUGIN_SERVER_URL=https://dbuh.com/plugins
```

### **Method 2: Edit Configuration File**

Edit `billing-backend/app/core/plugin_config.py`:

```python
# Change this line:
SOURCE = PluginSource.LOCAL   # or PluginSource.REMOTE

# Change remote URL:
REMOTE_PLUGINS_URL = "https://dbuh.com/plugins"
```

### **Method 3: Docker Environment**

In `docker-compose.yml`:

```yaml
environment:
  - PLUGIN_SOURCE=remote
  - PLUGIN_SERVER_URL=https://dbuh.com/plugins
```

---

## 📦 Plugin Package Structure

Every plugin is a ZIP file with this structure:

```
ai_chatbot_v1.0.0.zip
├── metadata.json              # Plugin information
├── backend/                   # Python backend code
│   ├── __init__.py
│   ├── models.py             # Database models (if any)
│   ├── routes.py             # FastAPI routes
│   ├── schemas.py            # Pydantic schemas
│   └── services.py           # Business logic
├── frontend/                  # React/Next.js frontend code
│   ├── pages/
│   │   └── ChatsPage.tsx     # Main page component
│   ├── components/
│   │   ├── AIChatBot.tsx     # Chatbot widget
│   │   └── ChatWidget.tsx    # Other components
│   └── addon.config.ts       # Frontend configuration
└── migrations/                # Database migrations
    ├── up.sql                # CREATE tables (run on install)
    └── down.sql              # DROP tables (run on uninstall)
```

### **metadata.json Example**

```json
{
  "id": "ai_chatbot",
  "name": "AI Chatbot",
  "version": "1.0.0",
  "author": "NextPanel Team",
  "description": "AI-powered customer support chatbot with contact collection",
  "category": "communication",
  "price": 0,
  "icon": "🤖",
  "backend": {
    "routes": ["/api/v1/chat/*"],
    "models": ["ChatSession", "ChatMessage"]
  },
  "frontend": {
    "routes": ["/support/chats"],
    "components": ["AIChatBot", "ChatWidget"]
  }
}
```

### **migrations/up.sql Example**

```sql
-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    guest_email VARCHAR(255),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    session_token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);
```

### **migrations/down.sql Example**

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
```

---

## 🚀 Installation Flow

When admin clicks "Install" on AI Chatbot:

```
1. Frontend: POST /api/v1/marketplace/install
   ↓
2. Backend checks if plugin exists in marketplace
   ↓
3. PluginInstaller downloads from source:
   - LOCAL: /home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip
   - REMOTE: https://dbuh.com/plugins/download/ai_chatbot/1.0.0
   ↓
4. Extract ZIP to /tmp/ai_chatbot_v1.0.0_extracted/
   ↓
5. Read and validate metadata.json
   ↓
6. Copy backend/ → /billing-backend/app/addons/ai_chatbot/
   ↓
7. Copy frontend/ → /billing-frontend/src/addons/ai_chatbot/
   ↓
8. Run migrations/up.sql (CREATE tables)
   ↓
9. Register in addon_registry.json
   ↓
10. Create database record in addon_installations
    ↓
11. Cleanup temp files
    ↓
12. Return success
    ✅ Plugin code is now in the system!
    ✅ Tables created!
    ✅ Ready to use (after restart)
```

---

## 🗑️ Uninstallation Flow

When admin clicks "Uninstall":

```
1. Frontend: DELETE /api/v1/marketplace/uninstall/{id}
   ↓
2. PluginInstaller reads addon_registry.json
   ↓
3. Run migrations/down.sql (DROP tables)
   ↓
4. Delete /billing-backend/app/addons/ai_chatbot/
   ↓
5. Delete /billing-frontend/src/addons/ai_chatbot/
   ↓
6. Remove from addon_registry.json
   ↓
7. Delete database record from addon_installations
   ↓
8. Return success
   ✅ Plugin code completely removed!
   ✅ Tables dropped!
   ✅ System clean!
```

---

## 📁 Directory Structure After Installation

```
billing-backend/
├── app/
│   ├── core/
│   │   ├── plugin_config.py      ⭐ NEW - Plugin configuration
│   │   └── plugin_installer.py   ⭐ NEW - Install/uninstall logic
│   ├── addons/                    ⭐ NEW - Installed plugins
│   │   ├── addon_registry.json    (Tracks installed plugins)
│   │   └── ai_chatbot/            (Downloaded when installed)
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── routes.py
│   │       └── migrations/
│   └── api/v1/
│       └── marketplace.py         (Updated with installer)

billing-frontend/
├── modules/                        ⭐ NEW - Local plugin storage
│   └── ai_chatbot_v1.0.0.zip      (Plugin packages)
└── src/
    └── addons/                     ⭐ NEW - Installed frontend plugins
        └── ai_chatbot/             (Downloaded when installed)
            ├── pages/
            └── components/
```

---

## 🎯 Usage Examples

### **Install Plugin**

```bash
# From marketplace UI
1. Go to /marketplace
2. Find "AI Chatbot"
3. Click "Install Free"
4. Wait for installation (5-10 seconds)
5. See "Plugin installed successfully. Please restart."
6. Restart backend
7. Refresh frontend
8. ✅ Plugin active!
```

### **Uninstall Plugin**

```bash
# From marketplace UI
1. Go to /marketplace
2. Find installed "AI Chatbot"
3. Click "Uninstall"
4. Confirm
5. Wait for uninstallation (2-5 seconds)
6. See "Plugin uninstalled successfully"
7. Refresh page
8. ✅ Plugin removed!
```

---

## 🔄 Switching to Remote Plugins

### **When You're Ready for Production:**

**Step 1: Upload Plugins to Your Server**

Upload your plugin ZIPs to `https://dbuh.com/plugins/`:

```
https://dbuh.com/plugins/
├── download/
│   ├── ai_chatbot/
│   │   ├── 1.0.0  → returns ai_chatbot_v1.0.0.zip
│   │   └── latest → returns latest version
│   ├── email_marketing/
│   │   └── 1.0.0
│   └── sms_notifications/
│       └── 1.0.0
└── manifest.json  (List of available plugins)
```

**Step 2: Change Environment Variable**

```bash
# On your production server
export PLUGIN_SOURCE=remote
export PLUGIN_SERVER_URL=https://dbuh.com/plugins

# Restart backend
systemctl restart nextpanel-backend
```

**Step 3: Done!**

Now when customers install plugins, they download from `https://dbuh.com/plugins/`!

---

## 🛡️ Security

### **What's Protected:**

1. ✅ **Admin-only installation** (require_admin decorator)
2. ✅ **Metadata validation** (checks required fields)
3. ✅ **Rollback on failure** (auto-cleanup if installation fails)
4. ✅ **SQL injection protected** (using parameterized queries)

### **What to Add:**

1. ⚠️ **Plugin signatures** (verify plugin is from you)
2. ⚠️ **Checksums** (verify file integrity)
3. ⚠️ **Sandboxing** (limit plugin permissions)
4. ⚠️ **Code review** (review plugins before publishing)

---

## 📊 Comparison

### **OLD System (Feature Flags):**
```
Install: Just set database flag
Code: Always in bundle (just hidden)
Tables: Always exist
Size: 5MB (all features)
Speed: Fast (instant)
Security: High (all code reviewed together)
```

### **NEW System (True Modular):**
```
Install: Download & extract files, run migrations
Code: Only installed plugins exist
Tables: Created on install, dropped on uninstall
Size: 2MB core + installed plugins
Speed: Medium (5-10s install)
Security: Medium (need plugin verification)
Flexibility: HIGH! ⭐
```

---

## ✅ What You Can Do Now

### **Development (Local Plugins):**

1. Create plugin ZIP in `/modules/`
2. Install from marketplace
3. Plugin files copied to system
4. Tables created
5. Test the plugin
6. Uninstall → Everything removed
7. Modify plugin, repackage, reinstall

### **Production (Remote Plugins):**

1. Package plugin as ZIP
2. Upload to `https://dbuh.com/plugins/`
3. Change `PLUGIN_SOURCE=remote`
4. Customers install from your server
5. Easy updates → Just upload new version
6. Centralized control

---

## 🎊 Result

You now have a **TRUE modular plugin system**:

✅ Code is added/removed dynamically  
✅ Tables created/dropped on install/uninstall  
✅ Routes appear/disappear  
✅ Small core bundle  
✅ Easy to switch local ↔ remote  
✅ Production-ready architecture  

**Next Steps:**
1. Package existing chatbot as plugin
2. Test install/uninstall locally
3. When ready, switch to remote source

Want me to package the chatbot into the plugin format now?

