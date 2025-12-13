// Test Google Drive authentication directly
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testGoogleDrive() {
  try {
    // Read credentials
    const credentialsPath = '/home/saiful/nextpanel-bill/test.json';
    const creds = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    console.log('Service Account Email:', creds.client_email);
    console.log('Project ID:', creds.project_id);
    console.log('');
    
    // Create auth
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    console.log('Authenticating...');
    const authClient = await auth.getClient();
    console.log('✅ Authentication successful');
    console.log('');
    
    // Create drive client
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    // Test 1: Get service account info
    console.log('Test 1: Getting service account info...');
    try {
      const about = await drive.about.get({ fields: 'user,storageQuota' });
      console.log('✅ Can access Drive API');
      console.log('   User:', about.data.user);
    } catch (e) {
      console.log('❌ Cannot access Drive API:', e.message);
    }
    console.log('');
    
    // Test 2: Try to access a folder
    const folderId = process.argv[2] || '15mPixU7ENEoTx9-7ATkabBFUA8dIno06';
    console.log(`Test 2: Accessing folder ${folderId}...`);
    try {
      const folder = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,permissions,shared',
      });
      console.log('✅ Folder found:', folder.data.name);
      console.log('   Shared:', folder.data.shared);
      console.log('   Permissions:', folder.data.permissions?.length || 0);
    } catch (e) {
      console.log('❌ Cannot access folder:', e.message);
      console.log('   Error code:', e.code);
      if (e.code === 403) {
        console.log('');
        console.log('🔴 ACCESS DENIED');
        console.log('   The service account does not have access to this folder.');
        console.log('   Share the folder with:', creds.client_email);
        console.log('   Set permission to: Editor');
      } else if (e.code === 404) {
        console.log('');
        console.log('🔴 FOLDER NOT FOUND');
        console.log('   The folder ID is incorrect or folder does not exist.');
      }
    }
    console.log('');
    
    // Test 3: Try to list files in folder
    console.log(`Test 3: Listing files in folder ${folderId}...`);
    try {
      const files = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name)',
        pageSize: 5,
      });
      console.log('✅ Can list files in folder');
      console.log('   Files found:', files.data.files?.length || 0);
    } catch (e) {
      console.log('❌ Cannot list files:', e.message);
      console.log('   Error code:', e.code);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testGoogleDrive();

