# Verify Service Account Access - Step by Step

## 🔴 Still Getting "Access Denied" After Sharing?

If you've shared the folder with Editor permission but still getting access denied, let's verify everything step by step.

---

## ✅ Step 1: Verify Service Account Email is EXACT

**Your service account email MUST be:**
```
backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
```

### How to Verify:

1. **Check your credentials file:**
   ```bash
   cat /home/saiful/nextpanel-bill/test.json | grep client_email
   ```

2. **Copy the EXACT email** that appears (should match above)

3. **When sharing in Google Drive:**
   - Paste the EXACT email
   - NO spaces before or after
   - NO typos
   - Must include the full domain: `@thermal-history-481016-t5.iam.gserviceaccount.com`

---

## ✅ Step 2: Verify Sharing is Correct

### Method 1: Check Sharing List

1. **Open the folder in Google Drive**
2. **Click "Share" button**
3. **Look for this email in the list:**
   ```
   backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
   ```
4. **Verify it shows "Editor"** next to it
5. **If you DON'T see it:**
   - The sharing didn't work
   - Remove it and add again
   - Make sure to click "Share" after adding

### Method 2: Check Advanced Sharing

1. **Open folder → Share**
2. **Click "Settings" or gear icon** (if available)
3. **Check "People with access"**
4. **Verify service account is listed with "Editor"**

---

## ✅ Step 3: Verify Folder ID is Correct

1. **Open the folder in Google Drive**
2. **Look at the URL:**
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```
3. **Copy the FOLDER_ID_HERE part**
4. **Compare with what you entered in backup config**
5. **They must match EXACTLY**

---

## ✅ Step 4: Try This Alternative Method

Sometimes the standard sharing doesn't work. Try this:

### Method A: Share via Email (Alternative)

1. **Open folder → Share**
2. **Instead of typing in the field, click "Get link"**
3. **Set permission to "Anyone with the link" → "Editor"**
4. **Copy the link**
5. **Then add the service account email specifically:**
   - Click "Add people and groups"
   - Add: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
   - Set to "Editor"
   - Share

### Method B: Use Google Cloud Console

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click on your service account
3. Go to "Permissions" tab
4. Check if it has any Drive-related permissions

---

## ✅ Step 5: Verify Google Drive API is Enabled

1. **Go to:** https://console.cloud.google.com/apis/library
2. **Search:** "Google Drive API"
3. **Make sure it shows "Enabled"** (green checkmark)
4. **If not enabled:**
   - Click on it
   - Click "Enable"
   - Wait 1-2 minutes

---

## ✅ Step 6: Check if Using Personal Google Account

If you're using a **personal Gmail account** (not Google Workspace):

1. **Service accounts work differently with personal accounts**
2. **You MUST share the folder with the service account email**
3. **The service account email acts like a regular user**
4. **Make sure you're sharing from the SAME Google account** that created the service account

---

## ✅ Step 7: Create Test File to Verify Access

After sharing, try this:

1. **Manually upload a test file** to the folder
2. **The service account should be able to see it**
3. **If the service account can't see files you upload, sharing isn't working**

---

## ✅ Step 8: Double-Check Everything

### Complete Checklist:

- [ ] Service account email is EXACT: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- [ ] Email appears in folder's sharing list
- [ ] Permission shows "Editor" (not Viewer)
- [ ] Folder ID is correct
- [ ] Waited at least 2 minutes after sharing
- [ ] Google Drive API is enabled
- [ ] Using the same Google account that created the service account
- [ ] Credentials file path is correct: `/home/saiful/nextpanel-bill/test.json`

---

## 🆘 If Still Not Working

### Try Creating a Completely New Setup:

1. **Create new Google Cloud project** (optional, but fresh start)
2. **Create new service account**
3. **Download new credentials JSON**
4. **Create new folder in Google Drive**
5. **Share new folder with new service account (Editor)**
6. **Use new folder ID and new credentials path**
7. **Test**

### Or Use Domain-Wide Delegation (Advanced)

If you're using Google Workspace, you might need domain-wide delegation. But for personal accounts, this shouldn't be necessary.

---

## 📞 Your Current Configuration

- **Service Account:** `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- **Folder ID:** (check what you're using)
- **Credentials:** `/home/saiful/nextpanel-bill/test.json`
- **Project:** `thermal-history-481016-t5`

---

## 💡 Most Common Issues

1. **Typo in service account email** - Double-check it's EXACT
2. **Permission set to Viewer instead of Editor** - Must be Editor
3. **Not waiting long enough** - Needs 1-2 minutes
4. **Folder in Shared Drive** - Needs different setup
5. **Wrong Google account** - Must use same account that created service account

---

**Try Step 1 first - verify the service account email is EXACT when sharing!**

