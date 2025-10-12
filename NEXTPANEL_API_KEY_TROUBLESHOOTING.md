# NextPanel API Key Permission Troubleshooting

## 🔍 Current Problem

You're getting this error when trying to provision accounts:
```
Authentication failed (403): The user doesn't have super admin privileges
```

Even though you've set the API key to "Full Access" in NextPanel, it's still being rejected.

---

## ✅ NextPanel Server Status

Your NextPanel server is **ONLINE and working**:
```
✓ Server: http://192.168.10.203:3000
✓ Status: Healthy
✓ Database: Connected
✓ Version: 1.0.0
```

The problem is **NOT** with the server - it's with the **API key permissions**.

---

## 🔧 Step-by-Step Fix

### Step 1: Access NextPanel Super Admin

1. **Open NextPanel in browser:**
   ```
   http://192.168.10.203:3000
   ```

2. **Login as Super Admin**
   - Use your NextPanel super admin credentials
   - NOT the billing system credentials

3. **Navigate to API Keys:**
   - Look for one of these paths:
     - `Super Admin → API Keys`
     - `Admin → Settings → API Keys`
     - `Settings → API Management`
     - `Configuration → API Access`

### Step 2: Check Current API Key

1. **Find the API key** you're using in the billing system
   - It starts with `npk_`
   - Check in billing system at: `http://192.168.10.203:4000/server`

2. **Click "Edit" or "View"** on that API key

3. **Check these settings:**

   ```
   ┌────────────────────────────────────────────┐
   │ API Key Settings                           │
   │                                            │
   │ Name: _______________________              │
   │                                            │
   │ Permission Level: [SUPER_ADMIN]  ← Must be this!
   │                                            │
   │ Scopes/Permissions:                        │
   │  ☑ User Management                         │
   │  ☑ Account Management    ← Required!       │
   │  ☑ Billing Operations    ← Required!       │
   │  ☑ Full Access                             │
   │                                            │
   │ Allowed IP Addresses:                      │
   │  192.168.10.203  ← Add this                │
   │  127.0.0.1       ← Add this too!           │
   │                                            │
   │ Status: [Active] ← Must be active          │
   │                                            │
   │         [Save Changes]                     │
   └────────────────────────────────────────────┘
   ```

### Step 3: Verify Permission Level

Make **absolutely sure** the permission level is set to:
- **SUPER_ADMIN** (preferred), OR
- **BILLING** (if that's the highest available)

**NOT:**
- ❌ USER
- ❌ READ_ONLY
- ❌ VIEWER
- ❌ DEVELOPER

### Step 4: Check Scopes

If your NextPanel has granular scopes/permissions, enable:
- ✅ **User Management**
- ✅ **Account Creation**
- ✅ **Account Management**
- ✅ **Billing Operations**
- ✅ **Full Access** (if available)

### Step 5: Save and Test

1. **Save the changes** in NextPanel
2. **Wait 30 seconds** (for changes to propagate)
3. **Try provisioning again** in billing system

---

## 🔄 Alternative: Create New API Key

If you can't fix the existing key, create a brand new one:

### In NextPanel:

1. **Go to:** Super Admin → API Keys → **Create New**

2. **Fill in details:**
   ```
   Name: Billing System Full Access
   
   Permission Level: SUPER_ADMIN ← Important!
   
   Description: Used by billing system to provision accounts
   
   Allowed IP Addresses:
     192.168.10.203
     127.0.0.1
   
   Scopes: Select ALL or at minimum:
     ☑ User Management
     ☑ Account Management
     ☑ Billing Operations
   
   Expires: Never (or set far future date)
   
   Status: Active
   ```

3. **Create** and **copy credentials:**
   ```
   API Key: npk_xxxxxxxxxxxxxxxxxxxxx
   API Secret: nps_xxxxxxxxxxxxxxxxx
   ```
   
4. **IMPORTANT:** Save these immediately! You might not see them again.

### Update in Billing System:

1. **Go to:** `http://192.168.10.203:4000/server`

2. **Find your server** (currently named "asdf")

3. **Delete it** (trash icon) or edit it

4. **Add server again** with new credentials:
   ```
   Server Name: Production Server
   Base URL: http://192.168.10.203:3000
   API Key: [paste new npk_ key]
   API Secret: [paste new nps_ secret]
   Capacity: 100
   ```

5. **Test Connection** - Should show ✓ Success

6. **Add Server**

7. **Try provisioning** - Should work now!

---

## 🐛 Common Issues & Solutions

### Issue 1: "Permission Level is already SUPER_ADMIN but still getting 403"

**Possible causes:**
1. Changes not saved properly
2. NextPanel cache not cleared
3. Wrong API key being used

**Solutions:**
1. **Restart NextPanel server**
   ```bash
   # On NextPanel server
   sudo systemctl restart nextpanel
   # OR
   pkill -f nextpanel && ./start_nextpanel.sh
   ```

2. **Create a completely new API key** and update billing system

3. **Check you're editing the correct key:**
   - Compare first few characters of API key
   - Check in billing system server settings

### Issue 2: "Can't find API Keys settings in NextPanel"

**Where to look:**
- `/super-admin/api-keys`
- `/admin/api-keys`
- `/settings/api`
- `/api-management`
- Settings → Security → API Keys
- Admin Panel → API Configuration

**Still can't find it?**
- Check if you're logged in as super admin
- Check your NextPanel version and documentation
- Look for "API", "Keys", "Integration" in menus

### Issue 3: "API key works for read but not write"

**This is the exact problem you have!**

**Cause:** API key has READ permissions but not WRITE/CREATE permissions

**Fix:** 
1. Find the specific scope for "Account Creation" or "User Management"
2. Enable it
3. Save
4. Try again

---

## 📊 Testing Your Fix

### After updating API key in NextPanel:

1. **Wait 30 seconds** (for changes to propagate)

2. **Try test command:**
   ```bash
   # Get your credentials from billing system first
   curl -X POST http://192.168.10.203:3000/api/v1/billing/accounts \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "X-API-Secret: YOUR_API_SECRET" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser123",
       "email": "test@example.com",
       "password": "TestPass123!",
       "full_name": "Test User"
     }'
   ```

3. **Expected responses:**
   - ✅ **201 Created** - Success! API key works!
   - ✅ **400 Bad Request** - API key works, but user exists (still good!)
   - ❌ **403 Forbidden** - API key still doesn't have permission
   - ❌ **401 Unauthorized** - Wrong credentials

4. **If still 403:**
   - Create NEW API key with SUPER_ADMIN
   - Delete old key
   - Update billing system with new key

---

## 🔍 How to Check Logs

### NextPanel Backend Logs:

Look for these error messages to understand what's wrong:

```bash
# On your NextPanel server
tail -f /path/to/nextpanel/logs/app.log
# or
tail -f /var/log/nextpanel/error.log
# or wherever your NextPanel stores logs
```

**Look for lines containing:**
- "API key"
- "permission"
- "403"
- "super admin"

### Billing System Logs:

Check what the billing system is seeing:

```bash
tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log
```

**Now when you try to provision**, you'll see detailed logs showing:
- Exact URL being called
- API Key being used (first 15 chars)
- Request data being sent
- Response status and body

---

## 📝 Checklist for API Key

Your API key MUST have:

- [ ] **Permission Level:** SUPER_ADMIN (or BILLING)
- [ ] **Status:** Active
- [ ] **Allowed IPs:** Include both `192.168.10.203` AND `127.0.0.1`
- [ ] **Scopes:** Account Management enabled
- [ ] **Scopes:** User Management enabled
- [ ] **Scopes:** Billing Operations enabled
- [ ] **Not Expired:** Check expiration date
- [ ] **Saved:** Changes are saved in NextPanel

---

## 🎯 Quick Fix Summary

### Fastest Solution:

1. **Login to NextPanel** at `http://192.168.10.203:3000`
2. **Delete old API key** (the one that's not working)
3. **Create new API key:**
   - Name: "Billing System"
   - Level: **SUPER_ADMIN**
   - IPs: `192.168.10.203, 127.0.0.1`
   - Scopes: **ALL**
4. **Copy new credentials**
5. **Update in billing system** at `http://192.168.10.203:4000/server`
6. **Test connection** - Should be ✓
7. **Try provisioning** - Should work!

---

## 📞 Next Steps

### Try This Now:

1. **Run the diagnostic after trying to provision:**
   ```bash
   cd /home/saiful/nextpanel-bill
   tail -50 billing-backend/backend.log
   ```
   
   Look for lines showing the API call details

2. **Check the exact error** from NextPanel

3. **Based on the error**, adjust API key settings

4. **If stuck**, create a NEW API key as described above

---

## 💡 Why This is Complex

NextPanel API keys can have many permission levels:
- READ_ONLY
- USER
- DEVELOPER  
- BILLING
- ADMIN
- SUPER_ADMIN

And even within each level, there can be granular scopes.

**For provisioning accounts, you need the HIGHEST level** (SUPER_ADMIN) because you're creating user accounts, which is a privileged operation.

---

## 🎉 Once Fixed

After you update the API key permissions properly:
1. ✅ Test connection will work
2. ✅ Provisioning will work
3. ✅ All three provisioning methods will work:
   - Create Customer with provisioning
   - Customer Details → Hosting → Provision
   - CLI script

---

**The fix MUST be done in NextPanel's API key settings. Try creating a new SUPER_ADMIN key if the current one won't update properly.**

