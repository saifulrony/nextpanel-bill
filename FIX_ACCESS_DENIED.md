# Fix "Access Denied" Error - Step by Step

## 🔴 Current Error
"Access denied" - The service account cannot access the Google Drive folder.

---

## ✅ Solution: Share Folder Correctly

### Step 1: Verify Service Account Email

Your service account email is:
```
backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
```

**Copy this EXACT email** (no spaces, no typos).

---

### Step 2: Open Google Drive Folder

1. Go to: https://drive.google.com/
2. Open the folder with this URL:
   ```
   https://drive.google.com/drive/folders/15mPixU7ENEoTx9-7ATkabBFUA8dIno06
   ```
3. Make sure you can see the folder contents

---

### Step 3: Share with Service Account

**IMPORTANT:** Follow these steps EXACTLY:

1. **Right-click** on the folder name (in the left sidebar or in the main view)
   - OR click the folder, then click the **"Share"** button (top right)

2. In the "Share" dialog:
   - **Add people and groups:** Paste this email:
     ```
     backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
     ```
   - ⚠️ **CRITICAL:** Make sure there are NO spaces before or after the email
   - ⚠️ **CRITICAL:** Use the FULL email address above

3. **Set Permission:**
   - Click the dropdown next to the email (it might say "Viewer" by default)
   - **MUST select "Editor"** (not "Viewer", not "Commenter")
   - "Editor" allows uploading files

4. **Uncheck "Notify people"** checkbox
   - Service accounts don't need email notifications

5. Click **"Share"** or **"Send"**

---

### Step 4: Verify Sharing Worked

After clicking Share:

1. The dialog should close
2. Click the folder again → **Share** button
3. You should see the service account email in the list:
   ```
   backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
   ```
4. It should show **"Editor"** next to the email

**If you don't see it:**
- The sharing didn't work
- Try again, making sure to use the EXACT email

---

### Step 5: Wait and Test

1. **Wait 10-30 seconds** (Google needs time to propagate permissions)
2. Go back to: `http://192.168.177.129:4000/admin/backup`
3. Click **"Test Connection"** again

---

## 🔍 Common Mistakes

### ❌ Wrong: Using your personal email
```
your-email@gmail.com  ← WRONG!
```

### ✅ Correct: Using service account email
```
backup-service@thermal-history-481016-t5.iam.gserviceaccount.com  ← CORRECT!
```

---

### ❌ Wrong: Setting permission to "Viewer"
- "Viewer" cannot upload files
- Will cause "Access denied" error

### ✅ Correct: Setting permission to "Editor"
- "Editor" can upload files
- This is what you need

---

### ❌ Wrong: Typo in email
```
backup-service@thermal-history-481016-t5.iam.gserviceaccount.com  ← Missing character
```

### ✅ Correct: Exact email
```
backup-service@thermal-history-481016-t5.iam.gserviceaccount.com  ← Perfect!
```

---

## 🛠️ Alternative: Create New Folder

If sharing isn't working, try creating a fresh folder:

1. **Create new folder:**
   - Go to Google Drive
   - Click "New" → "Folder"
   - Name it: "Backups" (or any name)

2. **Get new folder ID:**
   - Open the folder
   - Copy the ID from URL: `https://drive.google.com/drive/folders/NEW_FOLDER_ID`

3. **Share new folder:**
   - Right-click → Share
   - Add: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
   - Set to "Editor"
   - Share

4. **Update configuration:**
   - Use the NEW folder ID in your backup configuration
   - Test connection

---

## 🔐 Verify Service Account Has Access

### Method 1: Check Sharing List
1. Open folder → Share button
2. Look for: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
3. Should show "Editor" permission

### Method 2: Check Folder Permissions
1. Right-click folder → Share
2. Click "Advanced" or settings icon
3. Verify service account is listed with "Editor" role

---

## 📋 Checklist

Before testing again, verify:

- [ ] Used EXACT email: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- [ ] Set permission to **"Editor"** (not Viewer)
- [ ] Service account appears in sharing list
- [ ] Waited 10-30 seconds after sharing
- [ ] Folder ID is correct: `15mPixU7ENEoTx9-7ATkabBFUA8dIno06`

---

## 🆘 Still Getting "Access Denied"?

### Try These:

1. **Remove and re-add:**
   - Open folder → Share
   - Remove the service account email
   - Add it again with "Editor" permission

2. **Check folder is not in Trash:**
   - Make sure folder is not deleted/trashed

3. **Try different folder:**
   - Create a new folder
   - Share it with service account
   - Use new folder ID

4. **Verify credentials:**
   - Make sure credentials file is correct
   - File path: `/home/saiful/nextpanel-bill/test.json`

5. **Check Google Drive API is enabled:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search "Google Drive API"
   - Make sure it's enabled

---

## 📞 Your Current Setup

- **Service Account:** `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- **Folder ID:** `15mPixU7ENEoTx9-7ATkabBFUA8dIno06`
- **Credentials:** `/home/saiful/nextpanel-bill/test.json`

---

## ✅ Expected Result

After correctly sharing:
- ✅ Test Connection shows: "Google Drive connection successful!"
- ✅ Backups will upload automatically to the folder

---

**The most common issue is using the wrong permission level (Viewer instead of Editor) or a typo in the email address.**

