# How to Download Google Service Account Credentials

## ⚠️ Important: You Must CREATE a Key First!

The JSON credentials file **doesn't exist automatically**. You need to **create a key** for your service account first, then it will download automatically.

---

## Step-by-Step: Create and Download Credentials

### Step 1: Go to Service Accounts

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Make sure your project is selected (top dropdown)
3. In the left sidebar, click: **"IAM & Admin"** → **"Service Accounts"**
   - Direct link: https://console.cloud.google.com/iam-admin/serviceaccounts

### Step 2: Find Your Service Account

1. You'll see a list of service accounts
2. **Click on the service account email** (e.g., `backup-service@your-project.iam.gserviceaccount.com`)
   - **Important:** Click on the email/name, not just view the list

### Step 3: Open the Keys Tab

1. After clicking the service account, you'll see a page with tabs at the top:
   - **Details** | **Permissions** | **Keys**
2. Click on the **"Keys"** tab

### Step 4: Create a New Key

1. Click the **"ADD KEY"** button (usually at the top right of the Keys section)
2. Select **"Create new key"** from the dropdown menu
3. A dialog box will appear asking for key type
4. Select **"JSON"** (this is important!)
5. Click **"CREATE"**

### Step 5: File Downloads Automatically

- The JSON file will **automatically download** to your browser's default download folder
- **File name format:** `your-project-id-xxxxx-xxxxxxxxxxxx.json`
- **⚠️ WARNING:** This is the ONLY time you can download this file! Save it securely.

---

## Troubleshooting: Can't See "Keys" Tab?

### Problem: No "Keys" tab visible

**Solution 1: Make sure you clicked the service account**
- Don't just view the list
- Click on the service account **email/name** to open its details page
- The Keys tab only appears on the service account details page

**Solution 2: Try direct navigation**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click on your service account email
3. Look for tabs: Details | Permissions | **Keys**

**Solution 3: Use the menu**
1. In the service accounts list, find your service account
2. Click the **three dots (⋮)** on the right side of the row
3. Select **"Manage keys"** or **"Create key"**

---

## Troubleshooting: Can't See "ADD KEY" Button?

### Problem: No "ADD KEY" button in Keys tab

**Check:**
1. Are you on the **Keys** tab? (not Details or Permissions)
2. Do you have permission to create keys?
   - You need "Service Account Key Admin" or "Owner" role
3. Try refreshing the page (F5)

**Alternative method:**
1. In the service accounts list, click the **three dots (⋮)** next to your service account
2. Select **"Manage keys"**
3. Then click **"ADD KEY"** → **"Create new key"**

---

## Troubleshooting: File Didn't Download?

### Problem: No file downloaded after clicking CREATE

**Solutions:**
1. **Check browser download settings**
   - Some browsers block automatic downloads
   - Check your browser's download folder
   - Look for files starting with your project ID

2. **Check browser popup blocker**
   - Allow popups for console.cloud.google.com
   - Try a different browser (Chrome recommended)

3. **Manually check downloads**
   - Press `Ctrl + J` (or `Cmd + J` on Mac) to open downloads
   - Look for a JSON file with your project name

4. **Try incognito/private mode**
   - Sometimes browser extensions block downloads
   - Try in incognito mode

---

## Alternative: Create Key via gcloud CLI

If the web interface isn't working, you can use the command line:

```bash
# Install gcloud CLI first (if not installed)
# Then authenticate:
gcloud auth login

# Create a key for your service account:
gcloud iam service-accounts keys create ~/service-account-key.json \
  --iam-account=YOUR_SERVICE_ACCOUNT_EMAIL@YOUR_PROJECT.iam.gserviceaccount.com
```

Replace:
- `YOUR_SERVICE_ACCOUNT_EMAIL` with your actual service account email
- `YOUR_PROJECT` with your project ID

---

## What the JSON File Should Look Like

After downloading, open the file in a text editor. It should contain:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "backup-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**If it looks like this, you're good!** ✅

---

## Quick Checklist

- [ ] Project is selected in Google Cloud Console
- [ ] Went to IAM & Admin → Service Accounts
- [ ] Clicked on the service account email (not just viewing list)
- [ ] Clicked on "Keys" tab
- [ ] Clicked "ADD KEY" → "Create new key"
- [ ] Selected "JSON" as key type
- [ ] Clicked "CREATE"
- [ ] File downloaded automatically
- [ ] Saved the file securely

---

## Still Having Issues?

1. **Take a screenshot** of what you see in the Keys tab
2. **Check browser console** (F12) for any errors
3. **Try a different browser** (Chrome works best)
4. **Verify permissions** - make sure you have access to create keys

---

## Security Reminder

⚠️ **Important:**
- The JSON file contains sensitive credentials
- Save it in a secure location (e.g., `/etc/backup/`)
- Set permissions: `chmod 600 filename.json`
- Never commit it to version control (Git)
- This is the ONLY time you can download it - save it immediately!

