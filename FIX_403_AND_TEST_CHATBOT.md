# 🔧 Fix 403 Error & Test Chatbot Addon

## ❌ Problem
Getting 403 error when trying to install addons from marketplace.

## ✅ Solution

### **Step 1: Clear Your Session**
Open browser console (F12) and run:
```javascript
localStorage.clear();
location.reload();
```

OR simply **log out** from the UI.

### **Step 2: Log Back In**
Log in again with your admin account. This will give you a fresh JWT token with `is_admin: true`.

### **Step 3: Go to Marketplace**
Navigate to: `http://localhost:3000/marketplace`

### **Step 4: Install AI Chatbot**
1. Find the "🤖 AI Chatbot" card
2. Click "Install Free"
3. You should see success message
4. The addon is now installed!

### **Step 5: See the Magic! ✨**
1. Go to homepage: `http://localhost:3000/`
2. **The chatbot widget will appear at the bottom right!** 🎉
3. This is the SAME chatbot we built earlier
4. It only shows because you installed it

### **Step 6: Test Uninstall**
1. Go back to marketplace
2. Find "🤖 AI Chatbot" (now shows "Installed" badge)
3. Click "Uninstall"
4. Go back to homepage
5. **Chatbot disappears!** ✨

---

## 🤖 How the Chatbot Addon Works

### **The Integration (Already Done!):**

```typescript
// In /app/page.tsx (homepage)

// 1. Check if chatbot addon is installed
const checkChatbotAddon = async () => {
  const response = await axios.get('/api/v1/marketplace/installed');
  const chatbot = response.data.find(
    addon => addon.addon?.name === 'ai_chatbot'
  );
  setChatbotEnabled(chatbot && chatbot.is_enabled);
};

// 2. Only render if installed
{chatbotEnabled && <AIChatBot />}
```

### **What Happens:**

**Before Installation:**
```
Homepage: [No chatbot]
Database: addon_installations table is empty
```

**After Installation:**
```
Marketplace → Install "AI Chatbot"
     ↓
Database: Row added to addon_installations
addon_id: <ai_chatbot_id>
is_enabled: true
     ↓
Homepage checks installations
     ↓
Finds ai_chatbot installed
     ↓
Sets chatbotEnabled = true
     ↓
Homepage: [Chatbot appears! 🤖]
```

**After Uninstallation:**
```
Marketplace → Uninstall "AI Chatbot"
     ↓
Database: Row deleted from addon_installations
     ↓
Homepage checks installations
     ↓
Doesn't find ai_chatbot
     ↓
Sets chatbotEnabled = false
     ↓
Homepage: [Chatbot disappears]
```

---

## 📋 Complete Testing Checklist

### **Test 1: Authentication**
- [ ] Clear localStorage
- [ ] Log out
- [ ] Log in as admin
- [ ] No more 403 errors

### **Test 2: Marketplace**
- [ ] Go to /marketplace
- [ ] See 5 addons displayed
- [ ] See "AI Chatbot" (FREE)
- [ ] All cards show properly

### **Test 3: Install Chatbot**
- [ ] Click "Install Free" on AI Chatbot
- [ ] See success message
- [ ] Card shows green border
- [ ] "Installed" badge appears
- [ ] Button changes to "Uninstall"

### **Test 4: Chatbot Appears**
- [ ] Go to homepage (/)
- [ ] Chatbot widget visible at bottom right
- [ ] Click chatbot button
- [ ] Chat window opens
- [ ] Can type messages
- [ ] AI responds
- [ ] Contact form works (email + phone required)

### **Test 5: Uninstall Chatbot**
- [ ] Go back to /marketplace
- [ ] Click "Uninstall" on AI Chatbot
- [ ] Confirm uninstallation
- [ ] Card loses green border
- [ ] "Installed" badge disappears
- [ ] Button changes to "Install Free"

### **Test 6: Chatbot Disappears**
- [ ] Go to homepage (/)
- [ ] Chatbot widget is GONE
- [ ] Only appears if reinstalled

---

## 🎯 The Addon System is COMPLETE!

### **What's Integrated:**

1. **AIChatBot Component** (`/components/ui/AIChatBot.tsx`)
   - Full chat interface
   - AI responses
   - Contact form (email + phone)
   - Session tracking
   - Beautiful UI

2. **Marketplace Entry** (Database)
   - Name: `ai_chatbot`
   - Display: "AI Chatbot"
   - Category: communication
   - Price: FREE
   - Status: active

3. **Dynamic Rendering** (Homepage)
   - Checks installations on load
   - Only renders if installed
   - Automatic show/hide

4. **API Integration**
   - POST `/api/v1/marketplace/install`
   - DELETE `/api/v1/marketplace/uninstall/{id}`
   - GET `/api/v1/marketplace/installed`

---

## 🚀 Quick Fix Command

Run this in your browser console:
```javascript
// 1. Clear old token
localStorage.clear();

// 2. Reload page (will redirect to login)
location.reload();
```

Then log in again and try installing!

---

## ✨ Expected Result

After fixing the 403 error and installing:

**Homepage WITH Chatbot:**
```
┌─────────────────────────────────┐
│  Your Website Header            │
│  Products, Pricing, etc.        │
│                                 │
│  Content...                     │
│                                 │
│                           ┌────┐│
│                           │🤖  ││ ← Chatbot Button
│                           └────┘│
└─────────────────────────────────┘
```

**Homepage WITHOUT Chatbot:**
```
┌─────────────────────────────────┐
│  Your Website Header            │
│  Products, Pricing, etc.        │
│                                 │
│  Content...                     │
│                                 │
│                                 │ ← No chatbot!
│                                 │
└─────────────────────────────────┘
```

---

## 🎊 You're Almost There!

Just need to:
1. Clear localStorage (get fresh token)
2. Log back in
3. Install AI Chatbot from marketplace
4. See the magic happen! ✨

The chatbot you built earlier is now a fully installable addon! 🚀

