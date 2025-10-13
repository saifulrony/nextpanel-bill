# 📖 Quick Reference - NextPanel Billing System

## 🚀 Fast Access Guide

### **Admin Tools**

```bash
# Make user admin
cd billing-backend
python3 make_user_admin.py email@example.com

# List all users
python3 make_user_admin.py --list

# List only admins
python3 make_user_admin.py --list-admins
```

---

## 🔑 **Important Logins**

**If you get 403 errors:**
1. Open browser console (F12)
2. Run: `localStorage.clear(); location.reload();`
3. Log in again

**Default admin accounts:**
- invoice_test@example.com
- admin@test.com  
- test@test.com (you made this admin)

---

## 🗺️ **Page Navigation**

| Path | Purpose |
|------|---------|
| `/dashboard` | Overview statistics |
| `/customers` | Customer management |
| `/products` | Product/plan management |
| `/payments` | Transaction list with filters |
| `/payments/gateways` | Payment gateway management |
| `/payments/gateways/add` | Add new gateway |
| `/support` | Support tickets |
| `/support/chats` | Live chat admin interface |
| `/marketplace` | ⭐ Install/uninstall addons |
| `/settings` | ⭐ System time + profile settings |
| `/server` | NextPanel server management |
| `/analytics` | Business analytics |
| `/` (homepage) | Public storefront + chatbot |

---

## 🎯 **Key Features Quick Access**

### **💳 Payment Gateways**
**Add Gateway:**
```
Payments → Payment Gateways → Add Gateway
→ Choose type → Configure → Test → Create
```

**View Transactions:**
```
Payments → Transactions
→ Use filters → Export data
```

---

### **🤖 AI Chatbot**

**Install:**
```
Marketplace → Find "AI Chatbot" → Install Free
→ Refresh homepage → Chatbot appears
```

**Uninstall:**
```
Marketplace → AI Chatbot → Uninstall
→ Confirm → Chatbot disappears from homepage
```

**Use (Customer):**
```
Homepage → Click chat button → Enter email + phone
→ Start chatting → Get AI responses
```

---

### **🎫 Support System**

**Create Ticket:**
```
Support → Tickets → New Ticket
→ Fill details → Submit
```

**Manage Chats:**
```
Support → Live Chats → Click session
→ View conversation → Respond → Close when done
```

---

### **⏰ System Time Settings**

**Configure:**
```
Settings → System Time Settings (admin only)
→ Select timezone → Choose date/time formats
→ Save System Settings
```

**Initialize:**
```
Settings → Initialize Defaults (one-time)
→ Loads default time settings
```

---

### **🏪 Marketplace**

**Browse Addons:**
```
Marketplace → Use filters
→ Category, Type, Status
→ Search by name
```

**Install Addon:**
```
Find addon → Click "Install"
→ Confirm → Addon installed
→ Refresh to see changes
```

---

## 🎨 **UI Styling Standard**

**All input fields use:**
```tsx
className="appearance-none block w-full px-3 py-2 border border-gray-300 
           rounded-md shadow-sm placeholder-gray-400 text-gray-900 
           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 
           sm:text-sm"
```

---

## 📞 **Customer Contact Info**

**Collected from:**
- AI Chatbot contact form
- Support tickets
- Live chat sessions

**Accessible in:**
```
Support → Live Chats → Click session
→ See email 📧 and phone 📱 at top
```

---

## 🐛 **Troubleshooting**

### **Backend not responding:**
```bash
cd billing-backend
pkill -f uvicorn
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
```

### **403 Forbidden errors:**
1. Clear localStorage: `localStorage.clear()`
2. Log out and log back in
3. Get fresh JWT with admin flag

### **Chatbot not showing:**
1. Check if installed: `Marketplace → AI Chatbot`
2. Install if needed
3. Refresh homepage
4. Check browser console for errors

### **Settings not loading:**
1. Go to Settings
2. Click "Initialize Defaults"
3. Refresh page

---

## 🎊 **Feature Checklist**

- [x] Payment gateway management (8 types)
- [x] Transaction tracking with filters
- [x] Support ticket system
- [x] Live chat admin interface
- [x] AI chatbot with contact form
- [x] Marketplace with 5 addons
- [x] System time configuration
- [x] Dynamic feature enabling
- [x] Beautiful UI everywhere
- [x] Complete documentation

---

## 📚 **Documentation Index**

| File | Topic |
|------|-------|
| `PAYMENT_SYSTEM_COMPLETE.md` | Payment gateways |
| `SUPPORT_CHAT_SYSTEM_COMPLETE.md` | Support & chat |
| `AI_CHATBOT_GUEST_CONTACT_COMPLETE.md` | Contact form |
| `MARKETPLACE_SYSTEM_COMPLETE.md` | Marketplace & settings |
| `INPUT_STYLING_IMPROVEMENTS.md` | UI improvements |
| `QUICK_START_SUPPORT_PAYMENTS.md` | Getting started |
| `FINAL_COMPLETE_SUMMARY.md` | Complete overview |
| `THIS FILE` | Quick reference |

---

## ⚡ **Quick Commands**

```bash
# Backend health check
curl http://localhost:8001/health

# Test AI chatbot
curl -X POST http://localhost:8001/api/v1/chat/bot \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","guest_email":"test@test.com","guest_phone":"+1234567890"}'

# List addons in database
cd billing-backend
python3 -c "import sqlite3; conn = sqlite3.connect('billing.db'); 
cursor = conn.cursor(); cursor.execute('SELECT display_name, category FROM addons'); 
[print(row) for row in cursor.fetchall()]; conn.close()"
```

---

**Everything is ready to use!** 🎉

Quick tip: Bookmark this file for fast reference to all features!

