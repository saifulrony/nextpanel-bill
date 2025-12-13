import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = '/tmp/backup-config.json';

export async function GET() {
  try {
    // Try to read existing config
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      return NextResponse.json(config);
    } catch {
      // Return default config if file doesn't exist
      const defaultConfig = {
        googleDrive: {
          enabled: false,
          folderId: '',
          credentialsPath: '',
          autoUpload: false,
          encrypt: false,
        },
        notifications: {
          email: true,
          successAlerts: true,
          failureAlerts: true,
          quotaAlerts: true,
          recipient: '',
        },
        advanced: {
          retention: 30,
          compressionLevel: 6,
          maxConcurrent: 2,
          timeout: 30,
          encrypt: true,
        },
      };
      return NextResponse.json(defaultConfig);
    }
  } catch (error) {
    console.error('Error loading backup configuration:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validate configuration
    if (!validateConfig(config)) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    // Save configuration to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    // Update environment variables or other systems as needed
    await updateEnvironmentConfig(config);

    return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving backup configuration:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

function validateConfig(config: any): boolean {
  // Basic validation
  if (!config.googleDrive || !config.notifications || !config.advanced) {
    return false;
  }

  // Validate Google Drive config
  if (config.googleDrive.enabled && !config.googleDrive.folderId) {
    return false;
  }

  // Validate notification config
  if (config.notifications.email && !config.notifications.recipient) {
    return false;
  }

  // Validate advanced config
  if (config.advanced.retention < 1 || config.advanced.retention > 365) {
    return false;
  }

  if (config.advanced.compressionLevel < 1 || config.advanced.compressionLevel > 9) {
    return false;
  }

  if (config.advanced.maxConcurrent < 1 || config.advanced.maxConcurrent > 5) {
    return false;
  }

  if (config.advanced.timeout < 5 || config.advanced.timeout > 120) {
    return false;
  }

  return true;
}

async function updateEnvironmentConfig(config: any) {
  try {
    // Update environment variables or configuration files as needed
    // This could include updating .env files, system configurations, etc.
    
    console.log('Configuration updated:', {
      googleDriveEnabled: config.googleDrive.enabled,
      retention: config.advanced.retention,
      compressionLevel: config.advanced.compressionLevel,
    });
  } catch (error) {
    console.error('Error updating environment configuration:', error);
  }
}
