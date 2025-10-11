# 🚀 Namecheap Sandbox Testing Guide - 100% FREE

## Step 1: Create Namecheap Account (FREE)

### 1.1 Sign Up
1. Open browser in your VM:
   ```bash
   firefox https://www.namecheap.com/myaccount/signup/ &
   ```

2. Fill in the form:
   - Username: (choose yours)
   - Password: (strong password)
   - Email: (your email)
   - Security Question

3. Click **"Create Account"**

---

## Step 2: Enable API Access (FREE)

### 2.1 Navigate to API Settings
1. Log in to: https://www.namecheap.com/myaccount/login/
2. Go to: **Profile** → **Tools** → **Business & Dev Tools** → **API Access**
3. Or direct link: https://ap.www.namecheap.com/settings/tools/apiaccess/

### 2.2 Enable API Access
1. Read and accept the API Terms of Service
2. Click **"Enable API Access"**
3. You'll see your **API Key** (copy this!)

### 2.3 Whitelist Your IP
1. Get your current IP:
   ```bash
   curl ifconfig.me
   ```
   
2. In Namecheap API page:
   - Click **"Edit"** next to Whitelisted IPs
   - Add your IP address
   - Click **"Save"**

---

## Step 3: Get Your Credentials

You'll need these 3 things:

```bash
1. Username: your_namecheap_username
2. API Key: (long string from API Access page)
3. Client IP: (your IP from curl ifconfig.me)
```

---

## Step 4: Test API with Sandbox

Namecheap has a **FREE sandbox environment**:

### Sandbox Details:
```
Production API URL: https://api.namecheap.com/xml.response
Sandbox API URL:    https://api.sandbox.namecheap.com/xml.response

Username: Your Namecheap username
API Key:  Your API key from Step 2
API User: Same as username (for most cases)
Client IP: Your whitelisted IP
```

---

## Step 5: Save Credentials

Run this in your terminal:

```bash
cd /home/saiful/nextPanel/billing

# Create .env file for billing backend
cat > billing-backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://billing_user:billing_pass@localhost:5432/billing_db

# JWT
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe (add later)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Namecheap API (SANDBOX)
NAMECHEAP_API_USER=YOUR_USERNAME_HERE
NAMECHEAP_API_KEY=YOUR_API_KEY_HERE
NAMECHEAP_USERNAME=YOUR_USERNAME_HERE
NAMECHEAP_CLIENT_IP=YOUR_IP_HERE
NAMECHEAP_SANDBOX=true
EOF

echo "✅ .env file created!"
echo "⚠️  IMPORTANT: Edit billing-backend/.env and add your real credentials!"
```

---

## Step 6: Test Your API Access

I'll create a test script for you!

See: `billing/test_namecheap_api.py`

---

## 🎯 Quick Command Summary

```bash
# 1. Get your IP
curl ifconfig.me

# 2. Open Namecheap in browser
firefox https://www.namecheap.com &

# 3. After setup, edit credentials
nano /home/saiful/nextPanel/billing/billing-backend/.env

# 4. Test the API
cd /home/saiful/nextPanel/billing
python3 test_namecheap_api.py
```

---

## 💡 Important Notes

### Sandbox vs Production

**SANDBOX (Free Testing):**
- ✅ FREE forever
- ✅ Test all API calls
- ✅ No real domains registered
- ✅ No money charged
- ✅ Perfect for development

**PRODUCTION (Real Domains):**
- 💰 Requires account balance
- 💰 Real domain registrations
- 💰 Charges your account
- ⚠️  Only use when ready to go live!

### Common Issues

**Issue 1: "API key is invalid"**
- Solution: Copy the entire API key, including all characters
- Make sure no spaces before/after

**Issue 2: "IP address is not whitelisted"**
- Solution: Run `curl ifconfig.me` and add that IP in Namecheap
- If using VPN, add your VPN IP too

**Issue 3: "Account not enabled for API access"**
- Solution: Wait 5 minutes after enabling API
- Try logging out and back in

---

## 📞 Need Help?

Namecheap Support:
- Live Chat: https://www.namecheap.com/support/live-chat/
- Knowledge Base: https://www.namecheap.com/support/knowledgebase/

---

## Next Steps After Setup

1. ✅ Test API with the test script
2. ✅ Integrate into billing backend
3. ✅ Build domain search functionality
4. ✅ Create checkout flow
5. ✅ Test with sandbox domains

Let's do it! 🚀

