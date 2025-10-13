# 🚨 FIX 403 ERROR NOW - Simple Steps

## ❌ Problem
You're getting "Request failed with status code 403" when trying to install addons.

## ✅ Why This Happens
Your current JWT token doesn't have the `is_admin: true` flag. We updated the auth system to include this flag, but your existing token doesn't have it.

## 🔧 Solution (Choose ONE method)

---

### **METHOD 1: Use the Helper Page** ⭐ EASIEST

1. Open this file in your browser:
   ```
   file:///home/saiful/nextpanel-bill/REFRESH_ADMIN_TOKEN.html
   ```
   
2. Click the "🔄 Clear & Login Again" button

3. You'll be redirected to login

4. Log in with your admin account

5. ✅ Done! You now have admin permissions

---

### **METHOD 2: Browser Console** 

1. Press **F12** (Developer Tools)

2. Go to **Console** tab

3. Paste this and press Enter:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   window.location.href = '/login';
   ```

4. Log in again

5. ✅ Done!

---

### **METHOD 3: Manual Steps**

1. In your dashboard, click **Logout** (top right)

2. Go to browser Developer Tools (F12)

3. Go to **Application** tab

4. Click **Local Storage** → `http://localhost:3000`

5. Right-click → **Clear**

6. Close Developer Tools

7. Log in again

8. ✅ Done!

---

## 🎯 After Fixing

Once you've logged back in with a fresh token:

1. Go to **Marketplace** (`/marketplace`)
2. Find "🤖 AI Chatbot" 
3. Click **"Install Free"**
4. You should see: "Addon installed successfully!"
5. Go to **Homepage** (`/`)
6. **The chatbot widget will appear!** 🎉

---

## 📊 Verify Your Token

After logging in, you can verify you have admin permissions:

1. Press F12 → Console
2. Run:
   ```javascript
   const token = localStorage.getItem('token');
   if (token) {
     const payload = JSON.parse(atob(token.split('.')[1]));
     console.log('Admin?', payload.is_admin);
     console.log('Email:', payload.sub);
   }
   ```
3. Should show: `Admin? true`

---

## ⚠️ If Still Getting 403

Make sure you're using an admin account. To verify:

```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 make_user_admin.py --list-admins
```

If your email is not in the list, run:
```bash
python3 make_user_admin.py your-email@example.com
```

Then clear localStorage and log in again.

---

## 🤖 What Happens After Installing Chatbot

**Installation Flow:**
```
1. You click "Install Free" on AI Chatbot
   ↓
2. Backend creates entry in addon_installations table
   ↓
3. Homepage checks: "Is ai_chatbot installed?"
   ↓
4. Finds it: YES!
   ↓
5. Renders the chatbot widget on homepage
   ↓
6. Customers can now chat! 🎉
```

**The Chatbot Features:**
- ✅ Floating widget (bottom right)
- ✅ AI-powered responses
- ✅ Contact form (email + phone required)
- ✅ Session tracking
- ✅ 10+ knowledge categories
- ✅ Beautiful UI
- ✅ Smooth animations

---

## 🎊 Summary

**Quick Fix:**
1. Open: `file:///home/saiful/nextpanel-bill/REFRESH_ADMIN_TOKEN.html`
2. Click the button
3. Log in again
4. Install chatbot from marketplace
5. See it appear on homepage!

That's it! The chatbot is ready to be installed as an addon. 🚀

