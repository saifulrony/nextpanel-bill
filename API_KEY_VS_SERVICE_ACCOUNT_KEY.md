# API Key vs Service Account Key - What's the Difference?

## ⚠️ Important: You Need a SERVICE ACCOUNT KEY (JSON), Not an API Key!

### API Key (What you created)
- Used for accessing Google Cloud APIs
- Simple string like: `AIzaSyAbc123...`
- **NOT what you need for Google Drive backups**

### Service Account Key (What you need)
- JSON file with credentials
- Contains private key, email, project info
- **This is what you need for Google Drive backups**

---

## How to Create the Correct Service Account Key (JSON)

### Step 1: Go to Service Accounts (NOT API Keys)

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Make sure your project is selected
3. Go to: **"IAM & Admin"** → **"Service Accounts"**
   - Direct link: https://console.cloud.google.com/iam-admin/serviceaccounts
   - **NOT** "APIs & Services" → "Credentials" → "API Keys"

### Step 2: Find Your Service Account

1. You should see a list of service accounts
2. If you don't have one yet, create it:
   - Click **"CREATE SERVICE ACCOUNT"**
   - Name: `backup-service` (or any name)
   - Click **"CREATE AND CONTINUE"**
   - Skip roles (click **"CONTINUE"**)
   - Click **"DONE"**

### Step 3: Create the JSON Key

1. **Click on your service account email** (e.g., `backup-service@nextpanel-test.iam.gserviceaccount.com`)
2. Click the **"Keys"** tab at the top
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **"JSON"**
5. Click **"CREATE"**

### Step 4: File Downloads

- The JSON file downloads automatically
- Filename: `nextpanel-test-xxxxx-xxxxxxxxxxxx.json`
- **This is the file you need!**

---

## What the JSON File Looks Like

The downloaded file should look like this:

```json
{
  "type": "service_account",
  "project_id": "nextpanel-test",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "backup-service@nextpanel-test.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/backup-service%40nextpanel-test.iam.gserviceaccount.com"
}
```

**Key fields:**
- `type`: "service_account"
- `private_key`: Long string starting with "-----BEGIN PRIVATE KEY-----"
- `client_email`: Your service account email

---

## Where to Find the Downloaded File

### On Linux/Mac:
```bash
# Check Downloads folder
ls ~/Downloads/*.json

# Or search for it
find ~/Downloads -name "*nextpanel-test*.json" -type f
```

### On Windows:
- Usually in: `C:\Users\YourUsername\Downloads\`
- Look for file starting with your project name

### In Browser:
- Press `Ctrl + J` (or `Cmd + J` on Mac) to open Downloads
- Look for the JSON file

---

## Quick Checklist

- [ ] Went to **"IAM & Admin"** → **"Service Accounts"** (NOT API Keys)
- [ ] Clicked on service account email
- [ ] Clicked **"Keys"** tab
- [ ] Clicked **"ADD KEY"** → **"Create new key"**
- [ ] Selected **"JSON"**
- [ ] Clicked **"CREATE"**
- [ ] File downloaded automatically
- [ ] Found the JSON file in Downloads folder

---

## If File Didn't Download

1. **Check browser settings:**
   - Some browsers block automatic downloads
   - Check if download was blocked (look for download icon in browser)

2. **Check Downloads folder:**
   - Open your Downloads folder
   - Look for file with your project name

3. **Try different browser:**
   - Chrome works best
   - Try incognito mode

4. **Check browser console:**
   - Press F12
   - Look for any errors

---

## Next Steps After Getting the JSON File

1. **Upload to your server:**
   ```bash
   # Upload the file to your server
   scp ~/Downloads/nextpanel-test-*.json user@your-server:/etc/backup/google-credentials.json
   ```

2. **Set secure permissions:**
   ```bash
   chmod 600 /etc/backup/google-credentials.json
   ```

3. **Configure in your billing system:**
   - Go to `/admin/backup`
   - Enter path: `/etc/backup/google-credentials.json`
   - Enter your Google Drive folder ID
   - Test connection

---

## Still Can't Find It?

If you created the key but can't find the file:

1. **Check if it actually downloaded:**
   - Look in browser's download history
   - Check if browser blocked the download

2. **Create a new key:**
   - Go back to Service Accounts → Keys tab
   - Create another key (you can have multiple keys)
   - Make sure to download it this time

3. **Use command line (alternative):**
   ```bash
   # Install gcloud CLI first
   gcloud iam service-accounts keys create ~/service-account-key.json \
     --iam-account=backup-service@nextpanel-test.iam.gserviceaccount.com
   ```

---

## Summary

- ❌ **API Key** = Not what you need
- ✅ **Service Account Key (JSON)** = What you need
- Location: IAM & Admin → Service Accounts → Keys tab
- File downloads automatically when you create it
- Check your Downloads folder!

