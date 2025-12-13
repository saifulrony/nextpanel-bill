# Google Drive Backup Configuration

## ✅ Your Service Account Credentials

**File Location:** `/home/saiful/nextpanel-bill/backup-config/google-credentials.json`

**Service Account Email:** `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`

## 📋 Next Steps

### Step 1: Share Google Drive Folder

1. Go to Google Drive: https://drive.google.com/
2. Create a folder (or use existing one) for backups
3. Right-click the folder → **"Share"**
4. Add this email: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
5. Give it **"Editor"** permission
6. **Uncheck** "Notify people"
7. Click **"Share"**

### Step 2: Get Folder ID

1. Open the folder in Google Drive
2. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Copy the **FOLDER_ID_HERE** part (long string)

### Step 3: Configure in Billing System

1. Go to: `http://192.168.177.129:4000/admin/backup`
2. Click **"Configuration"** tab
3. Enable **"Google Drive"**
4. Enter:
   - **Credentials Path:** `/home/saiful/nextpanel-bill/backup-config/google-credentials.json`
   - **Folder ID:** (paste the folder ID from Step 2)
5. Click **"Test Connection"**
6. If successful, click **"Save Configuration"**

## ✅ Configuration Summary

- ✅ Credentials file: `/home/saiful/nextpanel-bill/backup-config/google-credentials.json`
- ✅ Service account: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- ⏳ Folder ID: (get from Google Drive)
- ⏳ Test connection: (after sharing folder)

## 🔒 Security

- Credentials file has secure permissions (600)
- Never commit this file to Git
- Keep the file secure

