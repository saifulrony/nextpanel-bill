# Google Drive Service Account Setup Guide

This guide will help you set up Google Drive integration for automated backup storage.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Google Cloud Project](#step-1-create-google-cloud-project)
3. [Step 2: Enable Google Drive API](#step-2-enable-google-drive-api)
4. [Step 3: Create Service Account](#step-3-create-service-account)
5. [Step 4: Download Credentials JSON File](#step-4-download-credentials-json-file)
6. [Step 5: Create Backup Folder in Google Drive](#step-5-create-backup-folder-in-google-drive)
7. [Step 6: Share Folder with Service Account](#step-6-share-folder-with-service-account)
8. [Step 7: Get Folder ID](#step-7-get-folder-id)
9. [Step 8: Configure in Billing System](#step-8-configure-in-billing-system)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ Google account (Gmail or Google Workspace)
- ✅ Access to Google Cloud Console (free tier is sufficient)
- ✅ Server access to upload the credentials file

## ⚠️ Important: No App Approval Needed!

**For private/internal use (like backups), you do NOT need:**
- ❌ OAuth consent screen setup
- ❌ App verification
- ❌ Google's approval process
- ❌ Publishing your app

**Service accounts are designed for server-to-server communication** and work immediately for your own Google account. You only need app verification if you're creating a public app that other users will use.

**What you DO need:**
- ✅ Create the service account (takes 2 minutes)
- ✅ Share your Google Drive folder with the service account email
- ✅ That's it! No approval process.

---

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account
   - **Note:** Free tier is available - no credit card required for basic setup

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click **"New Project"**
   - Enter project name: `Backup System` (or any name you prefer)
   - Click **"Create"**
   - Wait for the project to be created (usually takes a few seconds)

3. **Select Your Project**
   - Make sure your new project is selected in the top dropdown

---

## Step 2: Enable Google Drive API

1. **Navigate to APIs & Services**
   - In the left sidebar, go to **"APIs & Services"** → **"Library"**

2. **Search for Google Drive API**
   - In the search box, type: `Google Drive API`
   - Click on **"Google Drive API"** from the results

3. **Enable the API**
   - Click the **"Enable"** button
   - Wait for the API to be enabled (usually instant)
   - **Note:** You may see a warning about OAuth consent screen - you can ignore this for private use!

---

## Step 3: Create Service Account

**📖 Official Documentation:** [Create Service Accounts](https://docs.cloud.google.com/iam/docs/service-accounts-create)

1. **Go to Service Accounts**
   - In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
   - Click **"Create Credentials"** dropdown
   - Select **"Service account"**

2. **Fill in Service Account Details**
   - **Service account name**: `backup-service` (or any name)
   - **Service account ID**: Will be auto-generated (e.g., `backup-service@your-project.iam.gserviceaccount.com`)
   - **Description**: `Service account for automated backups`
   - Click **"Create and Continue"**

3. **Grant Roles (Optional)**
   - You can skip this step for now (click **"Continue"**)
   - We'll grant access directly to the folder instead

4. **Finish Creation**
   - Click **"Done"**
   - You'll see your service account in the list

---

## Step 4: Download Credentials JSON File

**Important:** You need to create a KEY for the service account first. The JSON file is not automatically available - you must create it.

### Method 1: From Service Accounts Page (Recommended)

1. **Go to Service Accounts List**
   - In Google Cloud Console, go to **"IAM & Admin"** → **"Service Accounts"** (in the left sidebar)
   - You should see your service account listed (e.g., `backup-service@your-project.iam.gserviceaccount.com`)

2. **Click on Your Service Account**
   - Click on the service account email/name to open its details page

3. **Go to Keys Tab**
   - At the top of the page, you'll see tabs: **"Details"**, **"Permissions"**, **"Keys"**
   - Click on the **"Keys"** tab

4. **Create New Key**
   - Click the **"ADD KEY"** button (usually at the top right)
   - Select **"Create new key"** from the dropdown
   - A dialog will appear asking for key type
   - Select **"JSON"** (this is important!)
   - Click **"CREATE"**

5. **File Downloads Automatically**
   - The JSON file will automatically download to your browser's default download folder
   - **File name format:** `your-project-id-xxxxx-xxxxxxxxxxxx.json`
   - **Important**: This is the ONLY time you can download this file! Save it securely.

### Method 2: From Credentials Page (Alternative)

1. **Go to Credentials Page**
   - In the left sidebar, go to **"APIs & Services"** → **"Credentials"**

2. **Find Your Service Account**
   - Scroll down to the **"Service Accounts"** section
   - Find your service account in the list

3. **Click on the Service Account**
   - Click on the service account email to open it

4. **Follow Steps 3-5 from Method 1 above**

### Troubleshooting: Can't Find the Keys Tab?

If you don't see a "Keys" tab:
- Make sure you clicked on the service account email/name (not just viewing the list)
- The service account details page should show tabs at the top
- If you're on the "Credentials" page, try going to "IAM & Admin" → "Service Accounts" instead

### After Downloading

1. **Note the Service Account Email**
   - Copy the service account email address (visible on the service account details page)
   - Format: `backup-service@your-project.iam.gserviceaccount.com`
   - You'll need this email in Step 6 to share the folder

2. **Verify the JSON File**
   - Open the downloaded file in a text editor
   - It should contain JSON with fields like:
     ```json
     {
       "type": "service_account",
       "project_id": "your-project-id",
       "private_key_id": "...",
       "private_key": "-----BEGIN PRIVATE KEY-----\n...",
       "client_email": "backup-service@your-project.iam.gserviceaccount.com",
       ...
     }
     ```
   - If it looks correct, you're good to go!

---

## Step 5: Create Backup Folder in Google Drive

1. **Open Google Drive**
   - Go to: https://drive.google.com/
   - Sign in with your Google account

2. **Create New Folder**
   - Click **"New"** → **"Folder"**
   - Name it: `Backups` (or any name you prefer)
   - Click **"Create"**

---

## Step 6: Share Folder with Service Account

1. **Right-click on the Folder**
   - In Google Drive, right-click on your backup folder
   - Select **"Share"**

2. **Add Service Account Email**
   - In the "Add people and groups" field, paste your service account email:
     ```
     backup-service@your-project.iam.gserviceaccount.com
     ```
   - **Important**: Use the email from Step 4, not your personal email!

3. **Set Permissions**
   - Click on the permission dropdown next to the email
   - Select **"Editor"** (this allows the service account to upload files)
   - **Uncheck** "Notify people" (service accounts don't need notifications)
   - Click **"Share"**

4. **Verify Access**
   - The service account email should now appear in the folder's sharing list
   - Make sure it has "Editor" permission

---

## Step 7: Get Folder ID

1. **Open the Folder**
   - In Google Drive, click on your backup folder to open it

2. **Get Folder ID from URL**
   - Look at the URL in your browser
   - The URL will look like:
     ```
     https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
     ```
   - The **Folder ID** is the long string after `/folders/`
   - In this example, it's: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

3. **Copy the Folder ID**
   - Copy this entire string
   - You'll need it in the next step

---

## Step 8: Configure in Billing System

1. **Upload Credentials File to Server**
   - Upload the JSON credentials file to your server
   - Recommended location: `/etc/backup/google-credentials.json`
   - Set secure permissions:
     ```bash
     sudo chmod 600 /etc/backup/google-credentials.json
     sudo chown your-user:your-user /etc/backup/google-credentials.json
     ```

2. **Open Backup Configuration**
   - Go to: `http://your-server:4000/admin/backup`
   - Click on the **"Configuration"** tab

3. **Enable Google Drive**
   - Toggle **"Enable Google Drive"** to ON

4. **Enter Credentials Path**
   - In **"Service Account Credentials File Path"**, enter:
     ```
     /etc/backup/google-credentials.json
     ```
   - (Or the path where you uploaded your file)

5. **Enter Folder ID**
   - In **"Google Drive Folder ID"**, paste the folder ID from Step 7
   - Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

6. **Test Connection**
   - Click **"Test Connection"** button
   - You should see: ✅ "Google Drive connection successful!"

7. **Save Configuration**
   - Click **"Save Configuration"** button
   - Your backups will now automatically upload to Google Drive!

---

## Frequently Asked Questions

### Q: Do I need Google's approval or app verification?

**A: No!** For private/internal use (like automated backups), you don't need any approval. Service accounts work immediately for your own Google account. You only need app verification if you're building a public app that other users will connect to.

### Q: What about the OAuth consent screen warning?

**A: You can ignore it!** When you enable the Google Drive API, you might see a warning about setting up an OAuth consent screen. This is only required for public apps. For private use with service accounts, you can skip this entirely.

### Q: Will this work with my personal Gmail account?

**A: Yes!** Service accounts work with both personal Gmail accounts and Google Workspace accounts. Just make sure to share the folder with the service account email.

### Q: Is there a cost?

**A: No!** Google Drive API has a generous free tier. For backups, you're unlikely to hit any limits unless you're doing massive amounts of data transfers.

---

## Troubleshooting

### Error: "Service account credentials file not found"

**Solution:**
- Verify the file path is correct
- Check file permissions: `ls -la /etc/backup/google-credentials.json`
- Make sure the file exists: `cat /etc/backup/google-credentials.json`

### Error: "Access denied" or "Permission denied"

**Solution:**
- Make sure you shared the folder with the service account email (not your personal email)
- Verify the service account has "Editor" permission on the folder
- Check that the folder ID is correct

### Error: "Invalid folder ID" or "Folder not found"

**Solution:**
- Double-check the folder ID from the URL
- Make sure you copied the entire ID (it's usually 33 characters long)
- Verify the folder exists and is accessible

### Error: "Google APIs not available"

**Solution:**
- Install the required package:
  ```bash
  cd billing-frontend
  npm install googleapis
  ```
- Restart your application

### Error: "Failed to initialize Google Drive service"

**Solution:**
- Check the JSON file is valid: `cat /etc/backup/google-credentials.json | jq .`
- Verify the file contains all required fields (type, project_id, private_key, client_email, etc.)
- Make sure the file wasn't corrupted during upload

### Service Account Email Not Working

**Solution:**
- Go back to Google Cloud Console
- Navigate to: **APIs & Services** → **Credentials**
- Find your service account and copy the email again
- Make sure you're using the full email: `name@project-id.iam.gserviceaccount.com`

---

## Security Best Practices

1. **File Permissions**
   - Always set credentials file to `600` (read/write for owner only)
   - Never make the file world-readable

2. **File Location**
   - Store credentials in a secure location (e.g., `/etc/backup/`)
   - Never commit credentials to version control (Git)
   - Add to `.gitignore` if storing in project directory

3. **Service Account Permissions**
   - Only grant "Editor" access to the specific backup folder
   - Don't grant organization-wide permissions
   - Use a dedicated service account for backups only

4. **Regular Rotation**
   - Consider rotating service account keys periodically
   - Delete old keys from Google Cloud Console

---

## Quick Reference

### Credentials File Path
```
/etc/backup/google-credentials.json
```

### Required Permissions
- Service account: Editor access to backup folder
- Credentials file: `chmod 600`

### Folder ID Format
```
1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```
(33 characters, alphanumeric)

### Service Account Email Format
```
service-name@project-id.iam.gserviceaccount.com
```

---

## Need Help?

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all steps were completed correctly
3. Test the connection using the "Test Connection" button
4. Review the troubleshooting section above

---

**✅ You're all set!** Your backups will now automatically upload to Google Drive.

