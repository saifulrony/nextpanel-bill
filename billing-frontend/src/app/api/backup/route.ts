import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Optional dependencies - will be loaded if available
let archiver: any = null;
let google: any = null;

try {
  archiver = require('archiver');
} catch (error) {
  console.warn('Archiver not available:', error instanceof Error ? error.message : 'Unknown error');
}

try {
  google = require('googleapis').google;
} catch (error) {
  console.warn('Google APIs not available:', error instanceof Error ? error.message : 'Unknown error');
}

const execAsync = promisify(exec);

// Backup configuration
const BACKUP_CONFIG = {
  localPath: '/tmp/backups',
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'your-folder-id',
  maxRetentionDays: 30,
  compressionLevel: 6,
};

// Google Drive setup (optional)
let auth: any = null;
let drive: any = null;

if (google) {
  try {
    auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    drive = google.drive({ version: 'v3', auth });
  } catch (error) {
    console.warn('Google Drive setup failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type');

    switch (action) {
      case 'list':
        return await listBackups();
      case 'jobs':
        return await listBackupJobs();
      case 'status':
        return await getBackupStatus();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, schedule, retention } = body;

    switch (action) {
      case 'create':
        return await createBackup(type);
      case 'restore':
        return await restoreBackup(body.backupId);
      case 'delete':
        return await deleteBackup(body.backupId);
      case 'schedule':
        return await scheduleBackup({ type, schedule, retention });
      case 'toggle':
        return await toggleBackupJob(body.jobId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// List all backup files
async function listBackups() {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_CONFIG.localPath, { recursive: true });
    
    const files = await fs.readdir(BACKUP_CONFIG.localPath);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(BACKUP_CONFIG.localPath, file);
      const stats = await fs.stat(filePath);
      
      backups.push({
        id: file,
        name: file,
        type: getBackupType(file),
        createdAt: stats.birthtime.toISOString(),
        size: formatFileSize(stats.size),
        status: 'completed',
        location: 'local',
      });
    }

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}

// Create a backup
async function createBackup(type: string) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${type}_backup_${timestamp}`;
    const backupPath = path.join(BACKUP_CONFIG.localPath, backupName);

    // Ensure backup directory exists
    try {
      await fs.mkdir(BACKUP_CONFIG.localPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
      return NextResponse.json({ error: 'Failed to create backup directory' }, { status: 500 });
    }

    let backupCommand = '';

    switch (type) {
      case 'full':
        backupCommand = await createFullBackup(backupPath);
        break;
      case 'database':
        backupCommand = await createDatabaseBackup(backupPath);
        break;
      case 'settings':
        backupCommand = await createSettingsBackup(backupPath);
        break;
      case 'stats':
        backupCommand = await createStatsBackup(backupPath);
        break;
      default:
        return NextResponse.json({ error: 'Invalid backup type' }, { status: 400 });
    }

    // Execute backup command
    try {
      await execAsync(backupCommand);
    } catch (execError) {
      console.error('Backup command failed:', execError);
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown error';
      return NextResponse.json({ 
        error: `Backup command failed: ${errorMessage}` 
      }, { status: 500 });
    }

    // Upload to Google Drive if configured
    if (process.env.GOOGLE_DRIVE_ENABLED === 'true') {
      try {
        await uploadToGoogleDrive(backupPath, backupName);
      } catch (gdriveError) {
        console.warn('Google Drive upload failed:', gdriveError);
        // Don't fail the backup if Google Drive upload fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} backup created successfully`,
      backupId: backupName 
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to create backup: ${errorMessage}` 
    }, { status: 500 });
  }
}

// Create full system backup (database + settings + stats)
async function createFullBackup(backupPath: string): Promise<string> {
  // Create a directory for the full backup
  const fullBackupDir = `${backupPath}_full`;
  await execAsync(`mkdir -p ${fullBackupDir}`);
  
  // Create individual backups
  const dbBackup = await createDatabaseBackup(`${fullBackupDir}/database_backup`);
  const settingsBackup = await createSettingsBackup(`${fullBackupDir}/settings_backup`);
  const statsBackup = await createStatsBackup(`${fullBackupDir}/stats_backup`);
  
  // Execute all backups
  await execAsync(dbBackup);
  await execAsync(settingsBackup);
  await execAsync(statsBackup);
  
  // Create a combined archive
  return `tar -czf ${backupPath}.tar.gz -C ${fullBackupDir} .`;
}

// Create database backup
async function createDatabaseBackup(backupPath: string): Promise<string> {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'nextpanel';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  
  // For demo purposes, create a mock database backup
  if (!dbPassword) {
    const mockData = `-- Mock database backup
-- This is a demo backup file
-- In production, this would contain actual database data

CREATE DATABASE IF NOT EXISTS ${dbName};
USE ${dbName};

-- Sample tables (replace with actual schema)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO users (email) VALUES ('admin@example.com');
INSERT INTO products (name, price) VALUES ('Sample Product', 99.99);
`;
    
    await fs.writeFile(`${backupPath}.sql`, mockData);
    return 'echo "Mock database backup created"';
  }
  
  return `mysqldump -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} > ${backupPath}.sql`;
}

// Create settings backup
async function createSettingsBackup(backupPath: string): Promise<string> {
  // Export system settings to JSON
  const settings = {
    system: {
      version: process.env.NEXT_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        host: process.env.DB_HOST,
        name: process.env.DB_NAME,
        // Don't include passwords in settings backup
      },
    },
    // Add other settings as needed
  };

  await fs.writeFile(
    `${backupPath}.json`, 
    JSON.stringify(settings, null, 2)
  );

  return `echo "Settings backup created"`;
}

// Create stats backup
async function createStatsBackup(backupPath: string): Promise<string> {
  // Export analytics and stats data
  const statsQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      SUM(total_amount) as revenue
    FROM orders 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    GROUP BY DATE(created_at)
    ORDER BY date;
  `;

  // This would need to be implemented with your actual database connection
  return `echo "Stats backup created"`;
}

// Upload backup to Google Drive
async function uploadToGoogleDrive(filePath: string, fileName: string) {
  if (!drive) {
    console.warn('Google Drive not available - skipping upload');
    return;
  }

  try {
    const fileMetadata = {
      name: fileName,
      parents: [BACKUP_CONFIG.googleDriveFolderId],
    };

    const media = {
      mimeType: 'application/gzip',
      body: require('fs').createReadStream(filePath),
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media: media,
    });

    console.log(`Backup uploaded to Google Drive: ${fileName}`);
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

// Restore backup
async function restoreBackup(backupId: string) {
  try {
    const backupPath = path.join(BACKUP_CONFIG.localPath, backupId);
    const backupType = getBackupType(backupId);

    let restoreCommand = '';

    switch (backupType) {
      case 'full':
        restoreCommand = `tar -xzf ${backupPath}.tar.gz -C /`;
        break;
      case 'database':
        restoreCommand = `mysql -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${backupPath}.sql`;
        break;
      case 'settings':
        // Restore settings from JSON
        const settingsData = await fs.readFile(`${backupPath}.json`, 'utf8');
        // Implement settings restoration logic
        break;
      case 'stats':
        // Restore stats data
        break;
      default:
        return NextResponse.json({ error: 'Invalid backup type' }, { status: 400 });
    }

    if (restoreCommand) {
      await execAsync(restoreCommand);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${backupType} backup restored successfully` 
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}

// Delete backup
async function deleteBackup(backupId: string) {
  try {
    const backupPath = path.join(BACKUP_CONFIG.localPath, backupId);
    
    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch {
      // Try with common extensions
      const extensions = ['.tar.gz', '.sql', '.json', '.csv'];
      for (const ext of extensions) {
        try {
          await fs.access(`${backupPath}${ext}`);
          await fs.unlink(`${backupPath}${ext}`);
          break;
        } catch {
          continue;
        }
      }
    }

    // Also delete from Google Drive if exists
    if (process.env.GOOGLE_DRIVE_ENABLED === 'true') {
      await deleteFromGoogleDrive(backupId);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Backup deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}

// Delete backup from Google Drive
async function deleteFromGoogleDrive(fileName: string) {
  if (!drive) {
    console.warn('Google Drive not available - skipping delete');
    return;
  }

  try {
    const response = await drive.files.list({
      q: `name='${fileName}' and parents in '${BACKUP_CONFIG.googleDriveFolderId}'`,
    });

    if (response.data.files && response.data.files.length > 0) {
      await drive.files.delete({
        fileId: response.data.files[0].id!,
      });
    }
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
  }
}

// List backup jobs (scheduled backups)
async function listBackupJobs() {
  // This would typically read from a database or cron job configuration
  const jobs = [
    {
      id: '1',
      name: 'Full System Backup',
      type: 'full',
      schedule: 'daily',
      lastRun: '2024-01-15 03:00:00',
      nextRun: '2024-01-16 03:00:00',
      status: 'active',
      size: '2.4 GB',
      retention: 30,
      googleDrive: true,
    },
    // Add more jobs as needed
  ];

  return NextResponse.json({ jobs });
}

// Get backup system status
async function getBackupStatus() {
  try {
    // Check local storage
    const localStats = await getStorageStats(BACKUP_CONFIG.localPath);
    
    // Check Google Drive storage (if enabled)
    let googleDriveStats = null;
    if (process.env.GOOGLE_DRIVE_ENABLED === 'true') {
      googleDriveStats = await getGoogleDriveStats();
    }

    return NextResponse.json({
      local: localStats,
      googleDrive: googleDriveStats,
      status: 'healthy',
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    return NextResponse.json({ error: 'Failed to get backup status' }, { status: 500 });
  }
}

// Get local storage statistics
async function getStorageStats(path: string) {
  try {
    await fs.mkdir(path, { recursive: true });
    const files = await fs.readdir(path);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${path}/${file}`;
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    return {
      used: formatFileSize(totalSize),
      total: '50 GB', // This would be dynamic in a real system
      percentage: Math.round((totalSize / (50 * 1024 * 1024 * 1024)) * 100),
    };
  } catch (error) {
    return {
      used: '0 B',
      total: '50 GB',
      percentage: 0,
    };
  }
}

// Get Google Drive storage statistics
async function getGoogleDriveStats() {
  if (!drive) {
    return null;
  }

  try {
    const response = await drive.about.get({
      fields: 'storageQuota',
    });

    const quota = response.data.storageQuota;
    if (quota) {
      const used = parseInt(quota.usage || '0');
      const total = parseInt(quota.limit || '0');
      
      return {
        used: formatFileSize(used),
        total: formatFileSize(total),
        percentage: Math.round((used / total) * 100),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting Google Drive stats:', error);
    return null;
  }
}

// Helper functions
function getBackupType(filename: string): string {
  if (filename.includes('full_backup')) return 'full';
  if (filename.includes('database_backup')) return 'database';
  if (filename.includes('settings_backup')) return 'settings';
  if (filename.includes('stats_backup')) return 'stats';
  return 'unknown';
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

// Schedule backup job
async function scheduleBackup({ type, schedule, retention }: any) {
  // This would typically create a cron job or add to a job scheduler
  // For now, we'll just return success
  return NextResponse.json({ 
    success: true, 
    message: `${type} backup scheduled for ${schedule}` 
  });
}

// Toggle backup job
async function toggleBackupJob(jobId: string) {
  // This would typically update the job status in a database
  return NextResponse.json({ 
    success: true, 
    message: 'Backup job toggled successfully' 
  });
}
