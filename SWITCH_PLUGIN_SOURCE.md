# 🔄 How to Switch Plugin Source (Local ↔ Remote)

## 🎯 Current Setup

**✅ RIGHT NOW:** Plugins load from `/home/saiful/nextpanel-bill/billing-frontend/modules/`  
**🔮 FUTURE:** Plugins download from `https://dbuh.com/plugins/`

---

## ⚡ Quick Switch

### **Using Environment Variable** (Recommended)

```bash
# === For Local Development (Current) ===
export PLUGIN_SOURCE=local
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --reload

# === For Production (Future) ===
export PLUGIN_SOURCE=remote
export PLUGIN_SERVER_URL=https://dbuh.com/plugins
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --reload
```

### **Using Config File**

Edit `billing-backend/app/core/plugin_config.py`:

```python
# Line 11-12:
SOURCE = os.getenv("PLUGIN_SOURCE", PluginSource.LOCAL)  # Change to REMOTE

# Line 19-22:
REMOTE_PLUGINS_URL = os.getenv(
    "PLUGIN_SERVER_URL", 
    "https://dbuh.com/plugins"  # Your plugin server URL
)
```

---

## 📦 Where Plugins Come From

### **LOCAL Mode (Now):**
```
Source: /home/saiful/nextpanel-bill/billing-frontend/modules/
File: ai_chatbot_v1.0.0.zip

URL format: file:///home/saiful/nextpanel-bill/billing-frontend/modules/ai_chatbot_v1.0.0.zip
```

### **REMOTE Mode (Future):**
```
Source: https://dbuh.com/plugins/
Endpoint: https://dbuh.com/plugins/download/ai_chatbot/1.0.0

URL format: https://dbuh.com/plugins/download/{plugin_id}/{version}
```

---

## 🚀 Setup Remote Plugin Server

When you're ready to use `https://dbuh.com/plugins/`:

### **Option 1: Simple Static File Server**

```bash
# On your dbuh.com server
mkdir -p /var/www/plugins/download/ai_chatbot/
cp ai_chatbot_v1.0.0.zip /var/www/plugins/download/ai_chatbot/1.0.0.zip

# Nginx config:
location /plugins/download/ {
    alias /var/www/plugins/download/;
    autoindex off;
}

# URL becomes:
# https://dbuh.com/plugins/download/ai_chatbot/1.0.0
```

### **Option 2: GitHub Releases** (Free!)

```bash
# Upload to GitHub releases
# URL becomes:
# https://github.com/yourname/nextpanel-plugins/releases/download/v1.0.0/ai_chatbot_v1.0.0.zip

# Then set:
export PLUGIN_SERVER_URL=https://github.com/yourname/nextpanel-plugins/releases/download/v1.0.0
```

### **Option 3: S3/Cloud Storage**

```bash
# Upload to AWS S3, DigitalOcean Spaces, etc.
# URL becomes:
# https://your-bucket.s3.amazonaws.com/plugins/ai_chatbot_v1.0.0.zip
```

---

## 🧪 Testing

### **Test Local Mode:**

```bash
# 1. Put plugin in modules folder
cp ai_chatbot_v1.0.0.zip /home/saiful/nextpanel-bill/billing-frontend/modules/

# 2. Set environment
export PLUGIN_SOURCE=local

# 3. Start backend
cd billing-backend && python3 -m uvicorn app.main:app --reload

# 4. Go to marketplace, click install
# Should copy from local folder
```

### **Test Remote Mode:**

```bash
# 1. Upload plugin to https://dbuh.com/plugins/download/ai_chatbot/1.0.0

# 2. Set environment
export PLUGIN_SOURCE=remote
export PLUGIN_SERVER_URL=https://dbuh.com/plugins

# 3. Start backend
cd billing-backend && python3 -m uvicorn app.main:app --reload

# 4. Go to marketplace, click install
# Should download from remote URL
```

---

## 📊 Current vs Future

| Aspect | LOCAL (Now) | REMOTE (Future) |
|--------|-------------|-----------------|
| Source | `/modules/` folder | `https://dbuh.com/plugins/` |
| Install Speed | Instant (copy) | 5-10s (download) |
| Updates | Manual file replace | Auto from server |
| Customers | Share folder | Download from URL |
| Control | Local only | Centralized |
| Bandwidth | None | Internet required |

---

## ✅ Checklist for Switching to Remote

- [ ] Package all plugins as ZIPs
- [ ] Upload to `https://dbuh.com/plugins/`
- [ ] Test download URL manually (`curl https://dbuh.com/plugins/download/ai_chatbot/1.0.0`)
- [ ] Set `PLUGIN_SOURCE=remote`
- [ ] Set `PLUGIN_SERVER_URL=https://dbuh.com/plugins`
- [ ] Restart backend
- [ ] Test install from marketplace
- [ ] ✅ Working with remote plugins!

---

## 🎯 ONE-LINE SWITCH

```bash
# Switch to remote plugins:
PLUGIN_SOURCE=remote PLUGIN_SERVER_URL=https://dbuh.com/plugins python3 -m uvicorn app.main:app --reload

# Switch back to local:
PLUGIN_SOURCE=local python3 -m uvicorn app.main:app --reload
```

---

## 💡 Pro Tips

1. **Development:** Always use LOCAL mode for testing
2. **Staging:** Use REMOTE with test URL
3. **Production:** Use REMOTE with `https://dbuh.com/plugins/`
4. **Version Control:** Keep plugins in `/modules/` for backup
5. **Updates:** Just upload new version to remote server

---

**That's it!** Your system can switch between local and remote with one environment variable! 🎉

