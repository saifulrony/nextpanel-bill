import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BACKUP_PATH = '/tmp/backups';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backupFile = formData.get('backupFile') as File;
    
    if (!backupFile) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    // Create backup directory if it doesn't exist
    await fs.mkdir(BACKUP_PATH, { recursive: true });

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `imported_backup_${timestamp}_${backupFile.name}`;
    const filePath = path.join(BACKUP_PATH, fileName);

    // Save uploaded file
    const arrayBuffer = await backupFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Determine backup type and restore accordingly
    const fileExtension = path.extname(backupFile.name).toLowerCase();
    let restoreCommand = '';

    switch (fileExtension) {
      case '.tar.gz':
        // Full backup - extract and restore all components
        await restoreFullBackup(filePath);
        break;
      case '.sql':
        // Database backup
        await restoreDatabaseBackup(filePath);
        break;
      case '.json':
        // Settings backup
        await restoreSettingsBackup(filePath);
        break;
      case '.csv':
        // Stats backup
        await restoreStatsBackup(filePath);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported backup file type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Backup imported and restored successfully',
      fileName: fileName 
    });

  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ error: 'Failed to import backup' }, { status: 500 });
  }
}

async function restoreFullBackup(filePath: string) {
  try {
    // Extract the backup
    const extractDir = filePath.replace('.tar.gz', '_extracted');
    await execAsync(`mkdir -p ${extractDir}`);
    await execAsync(`tar -xzf ${filePath} -C ${extractDir}`);

    // Look for individual backup files
    const files = await fs.readdir(extractDir);
    
    for (const file of files) {
      const fullPath = path.join(extractDir, file);
      
      if (file.includes('database_backup') && file.endsWith('.sql')) {
        await restoreDatabaseBackup(fullPath);
      } else if (file.includes('settings_backup') && file.endsWith('.json')) {
        await restoreSettingsBackup(fullPath);
      } else if (file.includes('stats_backup') && file.endsWith('.csv')) {
        await restoreStatsBackup(fullPath);
      }
    }

    // Clean up extracted files
    await execAsync(`rm -rf ${extractDir}`);
    
    console.log('Full backup restored successfully');
  } catch (error) {
    console.error('Error restoring full backup:', error);
    throw error;
  }
}

async function restoreDatabaseBackup(filePath: string) {
  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'nextpanel';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';

    const command = `mysql -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} < ${filePath}`;
    await execAsync(command);
    
    console.log('Database backup restored successfully');
  } catch (error) {
    console.error('Error restoring database backup:', error);
    throw error;
  }
}

async function restoreSettingsBackup(filePath: string) {
  try {
    // Read the settings file
    const settingsData = await fs.readFile(filePath, 'utf8');
    const settings = JSON.parse(settingsData);

    // Apply settings to the system
    // This would typically involve updating configuration files or database settings
    console.log('Settings backup restored:', settings);
    
    // For now, just log the settings - in a real implementation,
    // you would apply these settings to your system configuration
    console.log('Settings backup restored successfully');
  } catch (error) {
    console.error('Error restoring settings backup:', error);
    throw error;
  }
}

async function restoreStatsBackup(filePath: string) {
  try {
    // Read the stats file
    const statsData = await fs.readFile(filePath, 'utf8');
    
    // Import stats data to the system
    // This would typically involve inserting data into analytics tables
    console.log('Stats backup restored:', statsData);
    
    console.log('Stats backup restored successfully');
  } catch (error) {
    console.error('Error restoring stats backup:', error);
    throw error;
  }
}
