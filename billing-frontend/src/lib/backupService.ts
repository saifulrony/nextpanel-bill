import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

// Optional dependencies
let cron: any = null;

try {
  cron = require('node-cron');
} catch (error) {
  console.warn('node-cron not available:', error.message);
}

const execAsync = promisify(exec);

export interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'database' | 'settings' | 'stats';
  schedule: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual';
  cronExpression: string;
  lastRun: Date | null;
  nextRun: Date | null;
  status: 'active' | 'paused' | 'error';
  retention: number; // days
  googleDrive: boolean;
  enabled: boolean;
}

export class BackupService {
  private jobs: Map<string, BackupJob> = new Map();
  private cronTasks: Map<string, cron.ScheduledTask> = new Map();
  private backupPath: string;

  constructor(backupPath: string = '/tmp/backups') {
    this.backupPath = backupPath;
    this.initializeBackupDirectory();
    this.loadExistingJobs();
  }

  private async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  private loadExistingJobs() {
    // Load existing backup jobs from database or config file
    // For now, we'll add some default jobs
    const defaultJobs: BackupJob[] = [
      {
        id: 'full-daily',
        name: 'Full System Backup',
        type: 'full',
        schedule: 'daily',
        cronExpression: '0 3 * * *', // Daily at 3 AM
        lastRun: null,
        nextRun: null,
        status: 'active',
        retention: 30,
        googleDrive: true,
        enabled: true,
      },
      {
        id: 'database-daily',
        name: 'Database Backup',
        type: 'database',
        schedule: 'daily',
        cronExpression: '30 2 * * *', // Daily at 2:30 AM
        lastRun: null,
        nextRun: null,
        status: 'active',
        retention: 14,
        googleDrive: true,
        enabled: true,
      },
      {
        id: 'settings-weekly',
        name: 'Settings Backup',
        type: 'settings',
        schedule: 'weekly',
        cronExpression: '0 1 * * 0', // Weekly on Sunday at 1 AM
        lastRun: null,
        nextRun: null,
        status: 'active',
        retention: 90,
        googleDrive: false,
        enabled: true,
      },
      {
        id: 'stats-monthly',
        name: 'Stats Backup',
        type: 'stats',
        schedule: 'monthly',
        cronExpression: '0 0 1 * *', // Monthly on 1st at midnight
        lastRun: null,
        nextRun: null,
        status: 'paused',
        retention: 365,
        googleDrive: true,
        enabled: false,
      },
    ];

    defaultJobs.forEach(job => {
      this.addJob(job);
    });
  }

  public addJob(job: BackupJob): boolean {
    try {
      this.jobs.set(job.id, job);
      
      if (job.enabled && job.status === 'active') {
        this.scheduleJob(job);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to add job ${job.id}:`, error);
      return false;
    }
  }

  public removeJob(jobId: string): boolean {
    try {
      // Stop the cron task if it exists
      const task = this.cronTasks.get(jobId);
      if (task) {
        task.stop();
        this.cronTasks.delete(jobId);
      }
      
      // Remove the job
      this.jobs.delete(jobId);
      
      return true;
    } catch (error) {
      console.error(`Failed to remove job ${jobId}:`, error);
      return false;
    }
  }

  public updateJob(jobId: string, updates: Partial<BackupJob>): boolean {
    try {
      const job = this.jobs.get(jobId);
      if (!job) return false;

      const updatedJob = { ...job, ...updates };
      this.jobs.set(jobId, updatedJob);

      // Reschedule if necessary
      if (updates.cronExpression || updates.enabled || updates.status) {
        this.rescheduleJob(jobId);
      }

      return true;
    } catch (error) {
      console.error(`Failed to update job ${jobId}:`, error);
      return false;
    }
  }

  public toggleJob(jobId: string): boolean {
    try {
      const job = this.jobs.get(jobId);
      if (!job) return false;

      const newStatus = job.status === 'active' ? 'paused' : 'active';
      return this.updateJob(jobId, { status: newStatus });
    } catch (error) {
      console.error(`Failed to toggle job ${jobId}:`, error);
      return false;
    }
  }

  public getAllJobs(): BackupJob[] {
    return Array.from(this.jobs.values());
  }

  public getJob(jobId: string): BackupJob | undefined {
    return this.jobs.get(jobId);
  }

  private scheduleJob(job: BackupJob): void {
    if (!cron) {
      console.warn('node-cron not available - scheduled backups disabled');
      return;
    }

    try {
      // Stop existing task if it exists
      const existingTask = this.cronTasks.get(job.id);
      if (existingTask) {
        existingTask.stop();
      }

      // Create new cron task
      const task = cron.schedule(job.cronExpression, async () => {
        await this.executeBackup(job);
      }, {
        scheduled: false, // Don't start immediately
        timezone: 'UTC',
      });

      // Start the task
      task.start();
      this.cronTasks.set(job.id, task);

      // Update next run time
      const nextRun = this.getNextRunTime(job.cronExpression);
      this.updateJob(job.id, { nextRun });

      console.log(`Scheduled backup job: ${job.name} (${job.id})`);
    } catch (error) {
      console.error(`Failed to schedule job ${job.id}:`, error);
    }
  }

  private rescheduleJob(jobId: string): void {
    try {
      const job = this.jobs.get(jobId);
      if (!job) return;

      // Stop existing task
      const existingTask = this.cronTasks.get(jobId);
      if (existingTask) {
        existingTask.stop();
        this.cronTasks.delete(jobId);
      }

      // Schedule again if job is active and enabled
      if (job.status === 'active' && job.enabled) {
        this.scheduleJob(job);
      }
    } catch (error) {
      console.error(`Failed to reschedule job ${jobId}:`, error);
    }
  }

  private async executeBackup(job: BackupJob): Promise<void> {
    try {
      console.log(`Starting backup job: ${job.name}`);
      
      // Update last run time
      this.updateJob(job.id, { lastRun: new Date() });

      // Create the backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${job.type}_backup_${timestamp}`;
      
      let command = '';
      
      switch (job.type) {
        case 'full':
          command = await this.createFullBackupCommand(backupName);
          break;
        case 'database':
          command = await this.createDatabaseBackupCommand(backupName);
          break;
        case 'settings':
          command = await this.createSettingsBackupCommand(backupName);
          break;
        case 'stats':
          command = await this.createStatsBackupCommand(backupName);
          break;
        default:
          throw new Error(`Unknown backup type: ${job.type}`);
      }

      // Execute backup command
      await execAsync(command);

      // Upload to Google Drive if enabled
      if (job.googleDrive) {
        await this.uploadToGoogleDrive(backupName);
      }

      // Clean up old backups based on retention policy
      await this.cleanupOldBackups(job);

      // Update next run time
      const nextRun = this.getNextRunTime(job.cronExpression);
      this.updateJob(job.id, { nextRun });

      console.log(`Backup job completed: ${job.name}`);
    } catch (error) {
      console.error(`Backup job failed: ${job.name}`, error);
      this.updateJob(job.id, { status: 'error' });
    }
  }

  private async createFullBackupCommand(backupName: string): Promise<string> {
    // Create a directory for the full backup
    const fullBackupDir = `${this.backupPath}/${backupName}_full`;
    await execAsync(`mkdir -p ${fullBackupDir}`);
    
    // Create individual backups
    const dbBackup = await this.createDatabaseBackupCommand(`${fullBackupDir}/database_backup`);
    const settingsBackup = await this.createSettingsBackupCommand(`${fullBackupDir}/settings_backup`);
    const statsBackup = await this.createStatsBackupCommand(`${fullBackupDir}/stats_backup`);
    
    // Execute all backups
    await execAsync(dbBackup);
    await execAsync(settingsBackup);
    await execAsync(statsBackup);
    
    // Create a combined archive
    return `tar -czf ${this.backupPath}/${backupName}.tar.gz -C ${fullBackupDir} .`;
  }

  private async createDatabaseBackupCommand(backupName: string): Promise<string> {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'nextpanel';
    const dbUser = process.env.DB_USER || 'root';
    
    return `mysqldump -h ${dbHost} -u ${dbUser} -p${process.env.DB_PASSWORD} ${dbName} > ${this.backupPath}/${backupName}.sql`;
  }

  private async createSettingsBackupCommand(backupName: string): Promise<string> {
    const settings = {
      system: {
        version: process.env.NEXT_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
      // Add other settings as needed
    };

    await fs.writeFile(
      `${this.backupPath}/${backupName}.json`,
      JSON.stringify(settings, null, 2)
    );

    return 'echo "Settings backup created"';
  }

  private async createStatsBackupCommand(backupName: string): Promise<string> {
    // This would export analytics and stats data
    // For now, just create a placeholder file
    await fs.writeFile(
      `${this.backupPath}/${backupName}.csv`,
      'date,orders,revenue\n2024-01-01,10,1000\n'
    );

    return 'echo "Stats backup created"';
  }

  private async uploadToGoogleDrive(backupName: string): Promise<void> {
    // This would implement Google Drive upload
    // For now, just log the action
    console.log(`Would upload ${backupName} to Google Drive`);
  }

  private async cleanupOldBackups(job: BackupJob): Promise<void> {
    try {
      const files = await fs.readdir(this.backupPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - job.retention);

      for (const file of files) {
        if (file.includes(job.type)) {
          const filePath = path.join(this.backupPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.birthtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`Deleted old backup: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  private getNextRunTime(cronExpression: string): Date {
    // This is a simplified version - in a real implementation,
    // you'd use a proper cron parser library
    const now = new Date();
    
    // Parse cron expression and calculate next run time
    // For now, return a placeholder
    const nextRun = new Date(now);
    nextRun.setHours(nextRun.getHours() + 24); // Next day as placeholder
    
    return nextRun;
  }

  public async createManualBackup(type: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${type}_backup_${timestamp}`;
    
    let command = '';
    
    switch (type) {
      case 'full':
        command = await this.createFullBackupCommand(backupName);
        break;
      case 'database':
        command = await this.createDatabaseBackupCommand(backupName);
        break;
      case 'settings':
        command = await this.createSettingsBackupCommand(backupName);
        break;
      case 'stats':
        command = await this.createStatsBackupCommand(backupName);
        break;
      default:
        throw new Error(`Unknown backup type: ${type}`);
    }

    await execAsync(command);
    return backupName;
  }

  public async restoreBackup(backupId: string, type: string): Promise<void> {
    const backupPath = path.join(this.backupPath, backupId);
    
    let command = '';
    
    switch (type) {
      case 'full':
        command = `tar -xzf ${backupPath}.tar.gz -C /`;
        break;
      case 'database':
        command = `mysql -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${backupPath}.sql`;
        break;
      case 'settings':
        // Implement settings restoration
        break;
      case 'stats':
        // Implement stats restoration
        break;
      default:
        throw new Error(`Unknown backup type: ${type}`);
    }

    if (command) {
      await execAsync(command);
    }
  }

  public async deleteBackup(backupId: string): Promise<void> {
    const extensions = ['.tar.gz', '.sql', '.json', '.csv'];
    
    for (const ext of extensions) {
      try {
        const filePath = path.join(this.backupPath, `${backupId}${ext}`);
        await fs.unlink(filePath);
        break; // Found and deleted the file
      } catch {
        continue; // File doesn't exist with this extension
      }
    }
  }

  public async getBackupFiles(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.backupPath);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupPath, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          id: file,
          name: file,
          type: this.getBackupType(file),
          createdAt: stats.birthtime.toISOString(),
          size: this.formatFileSize(stats.size),
          status: 'completed',
          location: 'local',
        });
      }

      return backups;
    } catch (error) {
      console.error('Error getting backup files:', error);
      return [];
    }
  }

  private getBackupType(filename: string): string {
    if (filename.includes('full_backup')) return 'full';
    if (filename.includes('database_backup')) return 'database';
    if (filename.includes('settings_backup')) return 'settings';
    if (filename.includes('stats_backup')) return 'stats';
    return 'unknown';
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  public shutdown(): void {
    // Stop all cron tasks
    if (cron) {
      this.cronTasks.forEach((task) => {
        task.stop();
      });
      this.cronTasks.clear();
    }
  }
}

// Create singleton instance
export const backupService = new BackupService();
