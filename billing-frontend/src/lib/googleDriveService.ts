import fs from 'fs/promises';
import path from 'path';

// Optional Google APIs dependency
let google: any = null;

try {
  google = require('googleapis').google;
} catch (error) {
  console.warn('Google APIs not available:', error instanceof Error ? error.message : 'Unknown error');
}

export interface GoogleDriveConfig {
  credentialsPath?: string;
  folderId: string;
  scopes: string[];
}

export class GoogleDriveService {
  private drive: any;
  private folderId: string;
  private initialized: boolean = false;

  constructor(config: GoogleDriveConfig) {
    this.folderId = config.folderId;
    this.initializeDrive(config);
  }

  private async initializeDrive(config: GoogleDriveConfig) {
    if (!google) {
      console.warn('Google APIs not available - Google Drive service disabled');
      this.initialized = false;
      return;
    }

    try {
      const credentialsPath = config.credentialsPath || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
      
      if (!credentialsPath) {
        console.error('No credentials path provided');
        this.initialized = false;
        return;
      }

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(credentialsPath)) {
        console.error(`Credentials file not found: ${credentialsPath}`);
        this.initialized = false;
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: config.scopes || ['https://www.googleapis.com/auth/drive'],
      });

      // Get credentials to verify authentication works
      await auth.getClient();

      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;
      
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize Google Drive service:', errorMessage);
      console.error('Error details:', error);
      this.initialized = false;
    }
  }

  public async uploadFile(
    filePath: string, 
    fileName: string, 
    mimeType?: string
  ): Promise<string | null> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const fileMetadata = {
        name: fileName,
        parents: [this.folderId],
      };

      const media = {
        mimeType: mimeType || this.getMimeType(fileName),
        body: require('fs').createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,size',
      });

      console.log(`File uploaded to Google Drive: ${fileName} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  public async downloadFile(fileId: string, downloadPath: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, {
        responseType: 'stream',
      });

      const writer = require('fs').createWriteStream(downloadPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      throw error;
    }
  }

  public async deleteFile(fileId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      await this.drive.files.delete({
        fileId: fileId,
      });

      console.log(`File deleted from Google Drive: ${fileId}`);
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw error;
    }
  }

  public async listFiles(): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.list({
        q: `parents in '${this.folderId}' and trashed=false`,
        fields: 'files(id,name,size,createdTime,modifiedTime,mimeType)',
        orderBy: 'createdTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }

  public async getFileInfo(fileId: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,createdTime,modifiedTime,mimeType,parents',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file info from Google Drive:', error);
      throw error;
    }
  }

  public async createFolder(folderName: string, parentId?: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : [this.folderId],
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      console.log(`Folder created in Google Drive: ${folderName} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error('Error creating folder in Google Drive:', error);
      throw error;
    }
  }

  public async getStorageQuota(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.about.get({
        fields: 'storageQuota',
      });

      return response.data.storageQuota;
    } catch (error) {
      console.error('Error getting storage quota from Google Drive:', error);
      throw error;
    }
  }

  public async searchFiles(query: string): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const response = await this.drive.files.list({
        q: `name contains '${query}' and parents in '${this.folderId}' and trashed=false`,
        fields: 'files(id,name,size,createdTime,modifiedTime,mimeType)',
        orderBy: 'createdTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error searching files in Google Drive:', error);
      throw error;
    }
  }

  public async syncBackupToDrive(backupPath: string, fileName: string): Promise<string | null> {
    try {
      // Check if file already exists
      const existingFiles = await this.searchFiles(fileName);
      if (existingFiles.length > 0) {
        console.log(`File ${fileName} already exists in Google Drive`);
        return existingFiles[0].id;
      }

      // Upload the file
      const fileId = await this.uploadFile(backupPath, fileName);
      return fileId;
    } catch (error) {
      console.error('Error syncing backup to Google Drive:', error);
      throw error;
    }
  }

  public async downloadBackupFromDrive(fileId: string, localPath: string): Promise<void> {
    try {
      await this.downloadFile(fileId, localPath);
      console.log(`Backup downloaded from Google Drive to: ${localPath}`);
    } catch (error) {
      console.error('Error downloading backup from Google Drive:', error);
      throw error;
    }
  }

  public async deleteBackupFromDrive(fileId: string): Promise<void> {
    try {
      await this.deleteFile(fileId);
      console.log(`Backup deleted from Google Drive: ${fileId}`);
    } catch (error) {
      console.error('Error deleting backup from Google Drive:', error);
      throw error;
    }
  }

  public async getBackupFiles(): Promise<any[]> {
    try {
      const files = await this.listFiles();
      return files.filter(file => 
        file.name.includes('backup') || 
        file.mimeType === 'application/gzip' ||
        file.mimeType === 'application/sql' ||
        file.mimeType === 'application/json'
      );
    } catch (error) {
      console.error('Error getting backup files from Google Drive:', error);
      return [];
    }
  }

  private getMimeType(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();
    
    switch (extension) {
      case '.tar.gz':
        return 'application/gzip';
      case '.sql':
        return 'application/sql';
      case '.json':
        return 'application/json';
      case '.csv':
        return 'text/csv';
      case '.txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.initialized) {
        console.error('Google Drive service not initialized');
        return false;
      }

      // First, try to get the folder info to verify it exists and is accessible
      try {
        const folderInfo = await this.drive.files.get({
          fileId: this.folderId,
          fields: 'id,name,mimeType,permissions',
        });
        console.log('Folder found:', folderInfo.data.name);
      } catch (folderError: any) {
        // If folder doesn't exist or access denied, the error will be caught
        if (folderError?.code === 404) {
          console.error('Google Drive folder not found. Folder ID:', this.folderId);
          throw new Error(`Folder not found. Please verify the folder ID is correct: ${this.folderId}`);
        } else if (folderError?.code === 403) {
          console.error('Access denied to folder. Folder ID:', this.folderId);
          throw new Error(`Access denied. Please share the folder with the service account: ${this.folderId}`);
        } else {
          console.error('Error accessing folder:', folderError?.message || folderError);
          throw new Error(`Cannot access folder: ${folderError?.message || 'Unknown error'}`);
        }
      }

      // Try to list files to test connection and folder access
      try {
        await this.listFiles();
        return true;
      } catch (listError: any) {
        console.error('Error listing files:', listError?.message || listError);
        if (listError?.code === 403) {
          throw new Error(`Access denied. Please share the folder with the service account email and give it Editor permission.`);
        }
        throw listError;
      }
    } catch (error) {
      console.error('Google Drive connection test failed:', error);
      throw error; // Re-throw to get detailed error message
    }
  }
}

// Create singleton instance
export const googleDriveService = new GoogleDriveService({
  folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'your-folder-id',
  scopes: ['https://www.googleapis.com/auth/drive'],
});
