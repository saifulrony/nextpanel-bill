# UI Provisioning Guide - Create NextPanel Accounts from Web Interface

## ✅ What's New

I've added a **user-friendly web interface** to provision NextPanel hosting accounts! No more command-line scripts - you can now do everything from your browser.

---

## 🚀 How to Use the UI

### Step 1: Access Customer Management

1. Login to admin dashboard: `http://192.168.10.203:4000/login`
2. Go to: **Customers** (in the sidebar)

### Step 2: View Customer Details

1. Find the customer you want to provision hosting for
2. Click the **👁️ (eye icon)** to view customer details
3. A modal will open with customer information

### Step 3: Go to Hosting Tab

1. In the customer details modal, click the **"Hosting"** tab
2. You'll see:
   - Customer information
   - Available NextPanel servers
   - Server capacity and status
   - Instructions

### Step 4: Provision Account

1. Click the **"Provision Account"** button (green button)
2. A provisioning form will appear with:
   - **Hosting Username** - The username customer will use to login
   - **Hosting Password** - The password for their hosting account
   - **Select Server** - Choose which NextPanel server to use

3. Fill in the details:
   ```
   Hosting Username: johndoe
   Hosting Password: SecurePassword123!
   Server: Production Server
   ```

4. Click **"Provision Account"**

5. Wait for confirmation (usually 2-5 seconds)

6. Success! You'll see:
   - ✅ Green success message
   - NextPanel User ID
   - Server details

### Step 5: Send Credentials to Customer

After provisioning, **manually send an email** to the customer with:
- NextPanel URL (e.g., `http://192.168.10.203:3000`)
- Username
- Password
- License key

---

## 📸 Visual Guide

### Customer List View
```
┌─────────────────────────────────────────────────┐
│ Customers                                       │
│ ┌──────────────────────────────────────────┐   │
│ │ Name         Email           Actions      │   │
│ │ John Doe     john@test.com   👁️ ✏️ 🗑️   │ ← Click eye icon
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Customer Details Modal
```
┌───────────────────────────────────────────────────────┐
│ John Doe                                         ✕    │
│ john@test.com                                         │
│                                                       │
│ [Details] [Licenses] [Subscriptions] [Payments] [Hosting] ← Click here!
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Hosting Accounts                                │ │
│ │                                                 │ │
│ │ [+ Provision Account]  ← Click to provision     │ │
│ │                                                 │ │
│ │ Customer Information:                           │ │
│ │ • Email: john@test.com                          │ │
│ │ • Full Name: John Doe                           │ │
│ │ • Active Licenses: 1                            │ │
│ │                                                 │ │
│ │ Available Servers:                              │ │
│ │ ┌─────────────────────────────────────────┐    │ │
│ │ │ Production Server                       │    │ │
│ │ │ http://192.168.10.203:3000              │    │ │
│ │ │ Capacity: 0/100 (0.0% used)            │    │ │
│ │ │                             [Online]     │    │ │
│ │ └─────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Provisioning Modal
```
┌────────────────────────────────────────────────┐
│ Provision Hosting Account                      │
│                                                │
│ Customer: John Doe (john@test.com)            │
│                                                │
│ Hosting Username *                             │
│ ┌──────────────────────────────────────────┐  │
│ │ johndoe                                  │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Hosting Password *                             │
│ ┌──────────────────────────────────────────┐  │
│ │ ••••••••••••••                           │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Select NextPanel Server *                      │
│ ┌──────────────────────────────────────────┐  │
│ │ Production Server - http://...          ▼│  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ⚠️ Important: Send credentials to customer     │
│    via email after provisioning               │
│                                                │
│        [Cancel]  [Provision Account]           │
└────────────────────────────────────────────────┘
```

---

## ⚙️ Features

### ✅ What the UI Provides

1. **Visual Server Status**
   - See which servers are online/offline
   - View capacity and utilization
   - Real-time server information

2. **Easy Form**
   - Simple input fields
   - Dropdown server selection
   - Validation and error messages

3. **Customer Context**
   - Shows customer information automatically
   - Pre-fills email and name
   - Shows active licenses

4. **Error Handling**
   - Clear error messages
   - Form validation
   - Success confirmations

5. **No CLI Required**
   - Everything in the browser
   - Point and click
   - User-friendly

---

## 🔍 What You'll See

### Before Provisioning (No Servers)
```
⚠️ No NextPanel servers configured. 
   Please add a server first in the Server management page.
```

### After Adding Servers
```
Available Servers:
┌─────────────────────────────────────────┐
│ Production Server                       │
│ http://192.168.10.203:3000              │
│ Capacity: 0/100 (0.0% used)    [Online] │
└─────────────────────────────────────────┘

💡 How to Provision:
1. Ensure customer has an active license
2. Click "Provision Account" button
3. Enter hosting username and password
4. Select a NextPanel server
5. Click "Provision" to create the hosting account
6. Send credentials to customer via email
```

### Success Message
```
✅ Account provisioned successfully! 
   NextPanel User ID: 456
```

### Error Message
```
❌ Failed to provision account: Username already exists
```

---

## 🎯 Complete Workflow Example

### Scenario: New Customer Needs Hosting

**Step 1:** Customer purchases hosting plan
- They register on your website
- Make payment through Stripe
- System creates their account

**Step 2:** Admin provisions hosting
1. Go to **Customers** page
2. Find customer: "John Doe"
3. Click **👁️** to view details
4. Go to **"Hosting"** tab
5. Click **"Provision Account"**
6. Enter:
   - Username: `johndoe`
   - Password: `SecurePass123!`
   - Server: `Production Server`
7. Click **"Provision Account"**

**Step 3:** System creates account
- Calls NextPanel API
- Creates hosting account on selected server
- Returns success message

**Step 4:** Send credentials to customer
- Manually email customer with:
  ```
  Subject: Your Hosting Account is Ready!

  Dear John,

  Your hosting account has been provisioned!

  NextPanel URL: http://192.168.10.203:3000
  Username: johndoe
  Password: SecurePass123!
  License Key: NP-XXXX-XXXX-XXXX

  Login and start building your website!

  Regards,
  Support Team
  ```

**Step 5:** Customer logs in
- Customer visits NextPanel URL
- Logs in with credentials
- Starts using hosting services

---

## 🚨 Troubleshooting

### "No servers configured" message

**Fix:** Add a NextPanel server first
1. Go to: **Server** page (in sidebar)
2. Click **"Add Server"**
3. Fill in server details
4. Click **"Test Connection"**
5. Click **"Add Server"**

### "Provision Account" button is disabled

**Possible causes:**
- No servers added
- All servers are offline
- Servers are loading

**Fix:** 
1. Make sure at least one server is added and online
2. Check server status in the Hosting tab

### Provisioning fails with "Username already exists"

**Fix:**
- Choose a different username
- Username must be unique across the NextPanel server

### Server shows as "Offline"

**Fix:**
1. Check if NextPanel server is running
2. Verify server URL is correct
3. Test connection from Server management page

---

## 💡 Tips

### Username Suggestions
- Use customer email prefix: `john` from `john@example.com`
- Add customer ID: `customer123`
- Use company name: `acmecorp`

### Password Best Practices
- At least 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use common passwords
- Generate strong password: `pwgen -s 16 1`

### Server Selection
- Choose server with lowest utilization
- Use servers in customer's region
- Avoid offline servers

---

## 📊 Server Capacity Monitoring

The UI shows real-time server information:

```
Production Server
http://192.168.10.203:3000
Capacity: 45/100 (45.0% used)    [Online]
```

- **Green** (0-70%): Server has plenty of capacity
- **Yellow** (70-90%): Server is getting full
- **Red** (90-100%): Server is almost full, add more servers

---

## 🔄 After Provisioning

### What Happens Automatically

1. ✅ Hosting account created on NextPanel
2. ✅ Account linked to customer in database
3. ✅ Server capacity updated
4. ✅ Success message shown

### What You Need to Do Manually

1. ⚠️ Send credentials to customer via email
2. ⚠️ Include NextPanel URL
3. ⚠️ Include license key
4. ⚠️ Provide support documentation

---

## 🎉 Benefits of UI Provisioning

### Before (CLI Script)
```bash
cd /home/saiful/nextpanel-bill
./provision_account.sh
# Enter details manually
# Copy/paste customer ID
# Risk of typos
```

### After (Web UI)
```
1. Click customer → Hosting tab
2. Click "Provision Account"
3. Fill form (customer info pre-filled!)
4. Click "Provision"
5. Done! ✅
```

**Advantages:**
- ✅ Faster (30 seconds vs 2 minutes)
- ✅ Fewer errors (customer info auto-filled)
- ✅ Visual feedback
- ✅ No terminal needed
- ✅ Works on any device with browser
- ✅ Mobile friendly

---

## 📱 Access from Anywhere

The UI is accessible from:
- ✅ Desktop computer
- ✅ Laptop
- ✅ Tablet
- ✅ Smartphone
- ✅ Any device with web browser

Just login at: `http://192.168.10.203:4000`

---

## 🎯 Quick Reference

### URLs
- **Frontend:** http://192.168.10.203:4000
- **Backend API:** http://192.168.10.203:8001
- **API Docs:** http://192.168.10.203:8001/docs

### Navigation
```
Login → Dashboard
     ↓
Customers → Click 👁️ → Hosting Tab → Provision Account
```

### Required Fields
1. Hosting Username (unique)
2. Hosting Password (strong)
3. NextPanel Server (online & active)

---

## ✅ Checklist Before Provisioning

- [ ] Customer has active license
- [ ] At least one NextPanel server is added
- [ ] Server is online and active
- [ ] Server has available capacity
- [ ] Username is unique
- [ ] Password is strong
- [ ] Ready to send credentials to customer

---

**That's it! You now have a complete web interface to provision NextPanel hosting accounts! 🎉**

No more command-line scripts - just point, click, and provision!

