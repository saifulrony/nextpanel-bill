# 🚨 FIX API KEY NOW - Step-by-Step Visual Guide

## Current Error

```
❌ Authentication failed (403): The user doesn't have super admin privileges
```

## ✅ Quick Fix (5 Minutes)

Follow these **exact steps** to fix it:

---

## 📍 Step 1: Login to NextPanel

Open your browser and go to:
```
http://192.168.10.203:3000
```

Login with your **NextPanel super admin** account (NOT billing system account!)

---

## 📍 Step 2: Navigate to API Keys

Look for one of these menu locations:

### Option A:
```
Dashboard → Super Admin → API Keys
```

### Option B:
```
Settings → API Keys
```

### Option C:
```
Admin Panel → API Management
```

### Option D:
```
Configuration → API Access
```

**Look for:** Anything with "API", "Keys", or "Integration" in the menu.

---

## 📍 Step 3: Create NEW API Key

Instead of editing the old one, **create a brand new key**:

### Click: **"Create New API Key"** or **"Add API Key"**

### Fill in the form:

```
┌────────────────────────────────────────────────────┐
│ Create New API Key                                 │
│                                                    │
│ Name:                                              │
│ ┌──────────────────────────────────────────────┐  │
│ │ Billing System Full Access                   │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Description: (optional)                            │
│ ┌──────────────────────────────────────────────┐  │
│ │ Used by billing system to provision accounts │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Permission Level:                                  │
│ ┌──────────────────────────────────────────────┐  │
│ │ ⭕ READ_ONLY                                  │  │
│ │ ⭕ USER                                       │  │
│ │ ⭕ BILLING                                    │  │
│ │ ● SUPER_ADMIN  ← SELECT THIS!                │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Scopes/Permissions:                                │
│ ☑ Account Management  ← Check this                │
│ ☑ User Management     ← Check this                │
│ ☑ Billing Operations  ← Check this                │
│ ☑ Full Access         ← Check if available        │
│                                                    │
│ Allowed IP Addresses:                              │
│ ┌──────────────────────────────────────────────┐  │
│ │ 192.168.10.203                               │  │ ← Add both!
│ │ 127.0.0.1                                    │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Status:                                            │
│ ☑ Active  ← Must be checked                       │
│                                                    │
│ Expires: (optional)                                │
│ ┌──────────────────────────────────────────────┐  │
│ │ Never                                        │  │ ← Or far future
│ └──────────────────────────────────────────────┘  │
│                                                    │
│          [Cancel]  [Create API Key]                │
└────────────────────────────────────────────────────┘
```

---

## 📍 Step 4: Copy Credentials

**IMMEDIATELY after creating**, you'll see:

```
┌────────────────────────────────────────────────────┐
│ ✅ API Key Created Successfully!                   │
│                                                    │
│ API Key:                                           │
│ ┌──────────────────────────────────────────────┐  │
│ │ npk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx         │  │
│ └──────────────────────────────────────────────┘  │
│                               [Copy]  📋           │
│                                                    │
│ API Secret:                                        │
│ ┌──────────────────────────────────────────────┐  │
│ │ nps_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx         │  │
│ └──────────────────────────────────────────────┘  │
│                               [Copy]  📋           │
│                                                    │
│ ⚠️ WARNING: Save these now! They won't be shown   │
│    again after you close this dialog.             │
│                                                    │
│                      [Done]                        │
└────────────────────────────────────────────────────┘
```

**DO THIS:**
1. ✅ Click **Copy** next to API Key
2. ✅ Paste in a text file or password manager
3. ✅ Click **Copy** next to API Secret
4. ✅ Paste in the same file
5. ✅ Label it: "NextPanel SUPER_ADMIN API Key"
6. ✅ Click "Done"

---

## 📍 Step 5: Update Billing System

### Go to:
```
http://192.168.10.203:4000/server
```

### Option A: Edit Existing Server

1. Find your current server ("asdf")
2. Click **Edit** (pencil icon)
3. Update fields:
   ```
   API Key: [paste new npk_ key]
   API Secret: [paste new nps_ secret]
   ```
4. Click **"Test Connection"**
5. Should show: ✅ "Connection successful!"
6. Click **"Save"**

### Option B: Delete and Re-add (Recommended)

1. Click **Delete** (trash icon) on old server
2. Click **"Add Server"**
3. Fill in:
   ```
   Server Name: Production Server
   Description: Main hosting server
   Base URL: http://192.168.10.203:3000
   API Key: [paste new npk_ key]
   API Secret: [paste new nps_ secret]
   Capacity: 100
   Location: Local
   ```
4. Click **"Test Connection"** → Should be ✅
5. Click **"Add Server"**

---

## 📍 Step 6: Test Provisioning

### Go to:
```
http://192.168.10.203:4000/customers
```

### Click: **"Add Customer"**

### Fill out form:
```
Customer Details:
  Email: test@example.com
  Full Name: Test User
  Password: (click 🎲 Generate, then 📋 Copy)

Check: ☑ Also provision NextPanel hosting account

Hosting Details:
  Username: testuser
  Password: (click 🎲 Generate, then 📋 Copy)
  Server: Production Server

Check: ☑ I have saved the password(s) securely
```

### Click: **"Create & Provision"**

### Expected Result:
```
✅ Customer created and hosting account provisioned successfully!
   NextPanel User ID: 123
```

---

## 🎯 If It STILL Doesn't Work

### Check Backend Logs:

```bash
tail -50 /home/saiful/nextpanel-bill/billing-backend/backend.log
```

Look for lines showing:
- "Attempting to create account on..."
- "Using API Key: npk_..."
- "Response status: 403"
- "Response body: ..." ← This will show the exact error

### Common Responses:

**If you see:**
```
"The user doesn't have super admin privileges"
```
**Fix:** API key level is not SUPER_ADMIN

**If you see:**
```
"IP address not allowed"
```
**Fix:** Add 127.0.0.1 to allowed IPs

**If you see:**
```
"Invalid API key"
```
**Fix:** API Key or Secret is wrong - copy them again

**If you see:**
```
"Account created successfully"
```
**Success!** ✅ It's working!

---

## 🔄 Alternative Method: Direct Test

Test your API key directly with curl:

```bash
# Replace with YOUR actual API key and secret!
curl -X POST http://192.168.10.203:3000/api/v1/billing/accounts \
  -H "X-API-Key: npk_YOUR_KEY_HERE" \
  -H "X-API-Secret: nps_YOUR_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser999",
    "email": "test999@example.com",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

**Expected responses:**

**Success (201):**
```json
{
  "id": 123,
  "username": "testuser999",
  "email": "test999@example.com"
}
```
✅ **API key works!** Go provision in the UI!

**Permission Denied (403):**
```json
{
  "detail": "The user doesn't have super admin privileges"
}
```
❌ **API key level is wrong** - must be SUPER_ADMIN

**Authentication Failed (401):**
```json
{
  "detail": "Invalid API key or secret"
}
```
❌ **Wrong credentials** - check key and secret

---

## 📋 Final Checklist

When creating the new API key in NextPanel, verify:

- [ ] Permission Level = **SUPER_ADMIN** (not BILLING, not ADMIN)
- [ ] Scopes include **Account Management**
- [ ] Scopes include **User Management**
- [ ] Allowed IPs include **192.168.10.203**
- [ ] Allowed IPs include **127.0.0.1**
- [ ] Status = **Active**
- [ ] Not expired
- [ ] Copied both API Key and Secret
- [ ] Updated in billing system
- [ ] Connection test passes

---

## 🎉 Once Fixed

You'll be able to:
1. ✅ Provision accounts from Create Customer modal
2. ✅ Provision accounts from Customer Details → Hosting tab
3. ✅ Use CLI script for bulk operations
4. ✅ Generate strong passwords with one click
5. ✅ Copy credentials easily
6. ✅ Manage multiple NextPanel servers
7. ✅ Monitor server capacity and status

---

## 🚀 Quick Action Plan

**DO THIS NOW:**

1. **Open two browser tabs:**
   - Tab 1: `http://192.168.10.203:3000` (NextPanel)
   - Tab 2: `http://192.168.10.203:4000/server` (Billing)

2. **In NextPanel tab:**
   - Create NEW API key
   - Level: SUPER_ADMIN
   - IPs: 192.168.10.203, 127.0.0.1
   - Copy credentials

3. **In Billing tab:**
   - Update server with new credentials
   - Test connection
   - Should be ✅

4. **Test provisioning:**
   - Go to Customers → Add Customer
   - Enable provisioning
   - Create & Provision
   - Should work! ✅

---

**Time to fix: 5 minutes**  
**Result: Fully working provisioning system** 🎉

