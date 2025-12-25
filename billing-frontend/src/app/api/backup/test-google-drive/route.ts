import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/lib/googleDriveService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const credentialsPathParam = searchParams.get('credentialsPath');
    
    // Try to get credentials path from parameter, config file, or environment variable
    let credentialsPath = credentialsPathParam;
    let testFolderId = folderId;
    
    // If not provided, try to get from config file
    if (!testFolderId || !credentialsPath) {
      try {
        const fs = require('fs/promises');
        const configPath = '/tmp/backup-config.json';
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        if (!testFolderId) {
          testFolderId = config.googleDrive?.folderId;
        }
        if (!credentialsPath) {
          credentialsPath = config.googleDrive?.credentialsPath;
        }
      } catch {
        // Config file doesn't exist or can't be read
      }
    }
    
    // If still no folder ID, use environment variable or default
    if (!testFolderId) {
      testFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'your-folder-id';
    }
    
    // If still no credentials path, use environment variable
    if (!credentialsPath) {
      credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || null;
    }
    
    // Validate folder ID
    if (!testFolderId || testFolderId === 'your-folder-id' || testFolderId.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide a valid Google Drive folder ID' 
      }, { status: 400 });
    }
    
    // Check if Google service account credentials are configured
    if (!credentialsPath || credentialsPath.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Drive service account credentials not configured. Please provide the path to your service account JSON key file in the configuration.' 
      }, { status: 400 });
    }
    
    // Verify credentials file exists and is readable
    try {
      const fs = require('fs');
      if (!fs.existsSync(credentialsPath)) {
        return NextResponse.json({ 
          success: false, 
          message: `Credentials file not found at: ${credentialsPath}. Please verify the file path is correct.` 
        }, { status: 400 });
      }
      
      // Check file permissions
      try {
        fs.accessSync(credentialsPath, fs.constants.R_OK);
      } catch (permError) {
        return NextResponse.json({ 
          success: false, 
          message: `Cannot read credentials file: ${credentialsPath}. Please check file permissions.` 
        }, { status: 400 });
      }
    } catch (fsError) {
      return NextResponse.json({ 
        success: false, 
        message: `Error accessing credentials file: ${fsError instanceof Error ? fsError.message : 'Unknown error'}` 
      }, { status: 400 });
    }

    // Create and initialize a new instance with the provided folder ID and credentials path for testing
    // Using the factory method ensures initialization is complete before proceeding
    let testService: GoogleDriveService;
    try {
      testService = await GoogleDriveService.create({
        folderId: testFolderId,
        credentialsPath: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } catch (initError) {
      const errorMessage = initError instanceof Error ? initError.message : 'Unknown error';
      console.error('Failed to initialize Google Drive service:', initError);
      
      // Provide specific error messages for initialization failures
      if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
        return NextResponse.json({ 
          success: false, 
          message: `Credentials file not found: ${credentialsPath}. Please verify the file path is correct.` 
        }, { status: 400 });
      } else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
        return NextResponse.json({ 
          success: false, 
          message: `Invalid credentials file format. Please ensure the file is valid JSON and contains service account credentials.` 
        }, { status: 400 });
      } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
        return NextResponse.json({ 
          success: false, 
          message: `Cannot access credentials file: ${credentialsPath}. Please check file permissions.` 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: `Google Drive service failed to initialize: ${errorMessage}. Please check: 1) Credentials file path is correct, 2) File has valid JSON format, 3) Service account has proper permissions.` 
      }, { status: 400 });
    }
    
    // Check if service is initialized (should always be true after create(), but check for safety)
    if (!testService.isInitialized()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Drive service failed to initialize. Please check: 1) Credentials file path is correct, 2) File has valid JSON format, 3) Service account has proper permissions.' 
      }, { status: 400 });
    }
    
    // Get service account email from credentials for better error messages
    let serviceAccountEmail = 'your-service-account@project.iam.gserviceaccount.com';
    try {
      const fs = require('fs');
      const credData = fs.readFileSync(credentialsPath, 'utf8');
      const credJson = JSON.parse(credData);
      serviceAccountEmail = credJson.client_email || serviceAccountEmail;
    } catch (e) {
      // Ignore if we can't read the email
    }

    // Test Google Drive connection by trying to access the folder
    try {
      const isConnected = await testService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        success: true, 
          message: 'Google Drive connection successful!' 
      });
    } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Google Drive connection failed. Please verify the folder ID exists and the service account has access to it.' 
        }, { status: 400 });
      }
    } catch (testError) {
      const errorMessage = testError instanceof Error ? testError.message : 'Unknown error';
      console.error('Google Drive test connection error:', testError);
      
      // Provide more specific error messages
      if (errorMessage.includes('Folder not found') || errorMessage.includes('404')) {
        return NextResponse.json({ 
          success: false, 
          message: `Folder not found. Please verify the folder ID "${testFolderId}" is correct. Open the folder in Google Drive and check the URL.` 
        }, { status: 400 });
      } else if (errorMessage.includes('Access denied') || errorMessage.includes('403') || errorMessage.includes('permission')) {
        return NextResponse.json({ 
          success: false, 
          message: `Access denied. Please share the Google Drive folder with this service account email:\n\n${serviceAccountEmail}\n\nSteps:\n1. Open the folder in Google Drive\n2. Right-click → Share\n3. Add the email above\n4. Give it "Editor" permission\n5. Uncheck "Notify people"\n6. Click Share` 
        }, { status: 400 });
      } else if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
        return NextResponse.json({ 
          success: false, 
          message: 'Service account credentials file not found. Please check the credentials file path.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: `Google Drive connection test failed: ${errorMessage}` 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Google Drive connection test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      message: `Google Drive connection test failed: ${errorMessage}` 
    }, { status: 500 });
  }
}
