# How to Share Google Drive Folder with Service Account

## ⚠️ Current Error
"Google Drive connection failed. Please verify the folder ID exists and the service account has access to it."

This means the folder needs to be shared with your service account.

---

## 📋 Step-by-Step: Share Folder

### Step 1: Get Your Service Account Email

Your service account email is:
```
backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
```

**Copy this email** - you'll need it in Step 3.

---

### Step 2: Open Your Google Drive Folder

1. Go to Google Drive: https://drive.google.com/
2. Find the folder with ID: `15mPixU7ENEoTx9-7ATkabBFUA8dIno06`
   - Or open the folder and check the URL: `https://drive.google.com/drive/folders/15mPixU7ENEoTx9-7ATkabBFUA8dIno06`
3. **Click on the folder** to open it

---

### Step 3: Share the Folder

1. **Right-click** on the folder (or click the folder, then click the **Share** button)
2. Click **"Share"** or the share icon
3. In the "Add people and groups" field, paste this email:
   ```
   backup-service@thermal-history-481016-t5.iam.gserviceaccount.com
   ```
   ⚠️ **Important:** Use the FULL email address above, not your personal email!

4. **Set Permission:**
   - Click the dropdown next to the email
   - Select **"Editor"** (this allows the service account to upload files)
   - **DO NOT** select "Viewer" - it won't work!

5. **Uncheck "Notify people"** (service accounts don't need notifications)

6. Click **"Share"** or **"Send"**

---

### Step 4: Verify Sharing

After sharing, you should see:
- The service account email appears in the folder's sharing list
- It shows "Editor" permission
- The folder icon may show a "shared" indicator

---

### Step 5: Test Connection Again

1. Go back to your backup configuration: `http://192.168.177.129:4000/admin/backup`
2. Click **"Test Connection"** again
3. It should now show: ✅ "Google Drive connection successful!"

---

## 🔍 Troubleshooting

### Problem: Can't find the folder

**Solution:**
- Make sure you're signed into the correct Google account
- Check the folder ID in the URL matches: `15mPixU7ENEoTx9-7ATkabBFUA8dIno06`
- Try creating a new folder and using that folder ID instead

### Problem: "Access denied" error after sharing

**Solutions:**
1. **Double-check the email:**
   - Make sure you used: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
   - Not your personal email
   - No typos or spaces

2. **Check permission level:**
   - Must be **"Editor"** (not "Viewer")
   - "Viewer" won't allow uploading files

3. **Wait a few seconds:**
   - Google Drive sharing can take 10-30 seconds to propagate
   - Try testing again after waiting

4. **Verify sharing:**
   - Right-click folder → Share
   - Check if the service account email is in the list
   - If not, add it again

### Problem: Folder ID seems wrong

**To get the correct folder ID:**
1. Open the folder in Google Drive
2. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Copy the `FOLDER_ID_HERE` part
4. Update it in your backup configuration

---

## ✅ Quick Checklist

- [ ] Opened Google Drive folder
- [ ] Right-clicked folder → Share
- [ ] Added email: `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- [ ] Set permission to **"Editor"**
- [ ] Unchecked "Notify people"
- [ ] Clicked "Share"
- [ ] Verified service account appears in sharing list
- [ ] Tested connection again

---

## 📝 Your Configuration

- **Service Account Email:** `backup-service@thermal-history-481016-t5.iam.gserviceaccount.com`
- **Folder ID:** `15mPixU7ENEoTx9-7ATkabBFUA8dIno06`
- **Credentials File:** `/home/saiful/nextpanel-bill/test.json`

---

## 🎯 After Sharing

Once you've shared the folder:
1. The error message will be more specific if there are still issues
2. You'll see: ✅ "Google Drive connection successful!"
3. Backups will automatically upload to this folder

---

**Need help?** The improved error messages will now tell you exactly what's wrong!

