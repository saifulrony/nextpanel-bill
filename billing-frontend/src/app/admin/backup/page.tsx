'use client';

import { useState, useEffect } from 'react';
import {
  ArchiveBoxIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  ServerIcon,
  DocumentTextIcon,
  ChartBarIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import BackupConfig from '@/components/backup/BackupConfig';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'database' | 'settings' | 'stats';
  schedule: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual';
  lastRun: string | null;
  nextRun: string | null;
  status: 'active' | 'paused' | 'error';
  size: string;
  retention: number; // days
  googleDrive: boolean;
}

interface BackupFile {
  id: string;
  name: string;
  type: 'full' | 'database' | 'settings' | 'stats';
  createdAt: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
  location: 'local' | 'google_drive' | 'both';
  downloadUrl?: string;
}

export default function BackupPage() {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([
    {
      id: '1',
      name: 'Full Data Backup',
      type: 'full',
      schedule: 'daily',
      lastRun: '2024-01-15 03:00:00',
      nextRun: '2024-01-16 03:00:00',
      status: 'active',
      size: '2.4 GB',
      retention: 30,
      googleDrive: true,
    },
    {
      id: '2',
      name: 'Database Backup',
      type: 'database',
      schedule: 'daily',
      lastRun: '2024-01-15 02:30:00',
      nextRun: '2024-01-16 02:30:00',
      status: 'active',
      size: '156 MB',
      retention: 14,
      googleDrive: true,
    },
    {
      id: '3',
      name: 'Settings Backup',
      type: 'settings',
      schedule: 'weekly',
      lastRun: '2024-01-14 01:00:00',
      nextRun: '2024-01-21 01:00:00',
      status: 'active',
      size: '12 MB',
      retention: 90,
      googleDrive: false,
    },
    {
      id: '4',
      name: 'Stats Backup',
      type: 'stats',
      schedule: 'monthly',
      lastRun: '2024-01-01 00:00:00',
      nextRun: '2024-02-01 00:00:00',
      status: 'paused',
      size: '8.2 MB',
      retention: 365,
      googleDrive: true,
    },
  ]);

  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([
    {
      id: '1',
      name: 'full_backup_2024-01-15_03-00-00.tar.gz',
      type: 'full',
      createdAt: '2024-01-15 03:05:00',
      size: '2.4 GB',
      status: 'completed',
      location: 'both',
      downloadUrl: '/api/backup/download/1',
    },
    {
      id: '2',
      name: 'database_backup_2024-01-15_02-30-00.sql',
      type: 'database',
      createdAt: '2024-01-15 02:35:00',
      size: '156 MB',
      status: 'completed',
      location: 'both',
      downloadUrl: '/api/backup/download/2',
    },
    {
      id: '3',
      name: 'settings_backup_2024-01-14_01-00-00.json',
      type: 'settings',
      createdAt: '2024-01-14 01:05:00',
      size: '12 MB',
      status: 'completed',
      location: 'local',
    },
    {
      id: '4',
      name: 'stats_backup_2024-01-01_00-00-00.csv',
      type: 'stats',
      createdAt: '2024-01-01 00:05:00',
      size: '8.2 MB',
      status: 'completed',
      location: 'google_drive',
    },
  ]);

  const [selectedTab, setSelectedTab] = useState<'jobs' | 'files' | 'settings'>('jobs');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    full: false,
    database: false,
    settings: false,
    stats: false,
  });
  const [storageStats, setStorageStats] = useState({
    local: { used: '15.2 GB', total: '50 GB', percentage: 30 },
    googleDrive: { used: '8.7 GB', total: '15 GB', percentage: 58 },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <ArchiveBoxIcon className="h-5 w-5 text-blue-500" />;
      case 'database':
        return <ServerIcon className="h-5 w-5 text-green-500" />;
      case 'settings':
        return <Cog6ToothIcon className="h-5 w-5 text-purple-500" />;
      case 'stats':
        return <ChartBarIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateBackup = async (type?: string) => {
    if (type) {
      // Single backup type
      await createSingleBackup(type);
    } else {
      // Show modal for multiple options
      setShowBackupModal(true);
    }
  };

  const createSingleBackup = async (type: string) => {
    setIsCreatingBackup(true);
    try {
      console.log('Creating backup of type:', type);
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          type: type,
        }),
      });
      
      console.log('Backup API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        
        // Add new backup file
        const newBackup: BackupFile = {
          id: result.backupId || Date.now().toString(),
          name: `${type}_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${type === 'database' ? 'sql' : type === 'settings' ? 'json' : 'tar.gz'}`,
          type: type as any,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          size: type === 'full' ? '2.4 GB' : type === 'database' ? '156 MB' : '12 MB',
          status: 'completed',
          location: 'local',
          downloadUrl: `/api/backup/download/${result.backupId || Date.now()}`,
        };
        
        setBackupFiles(prev => [newBackup, ...prev]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create backup: ${errorMessage}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleCreateSelectedBackups = async () => {
    const selectedTypes = Object.entries(backupOptions)
      .filter(([_, selected]) => selected)
      .map(([type, _]) => type);

    if (selectedTypes.length === 0) {
      alert('Please select at least one backup type.');
      return;
    }

    setIsCreatingBackup(true);
    setShowBackupModal(false);

    try {
      // Create backups for each selected type
      for (const type of selectedTypes) {
        await createSingleBackup(type);
        // Add a small delay between backups
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Multiple backup creation failed:', error);
      alert('Some backups failed to create. Please check the backup files list.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleToggleJob = (jobId: string) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: job.status === 'active' ? 'paused' : 'active' }
        : job
    ));
  };

  const handleDeleteBackup = async (fileId: string) => {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          backupId: fileId,
        }),
      });

      if (response.ok) {
        setBackupFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Delete backup failed:', error);
      alert('Failed to delete backup. Please try again.');
    }
  };

  const handleDownloadBackup = (fileId: string) => {
    // Open download link
    window.open(`/api/backup/download/${fileId}`, '_blank');
  };

  const handleRestoreBackup = async (fileId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      return;
    }

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore',
          backupId: fileId,
        }),
      });

      if (response.ok) {
        alert('Backup restored successfully!');
      } else {
        throw new Error('Failed to restore backup');
      }
    } catch (error) {
      console.error('Restore backup failed:', error);
      alert('Failed to restore backup. Please try again.');
    }
  };

  const handleImportBackup = async () => {
    if (!importFile) {
      alert('Please select a backup file to import.');
      return;
    }

    if (!confirm('Are you sure you want to import this backup? This will overwrite current data.')) {
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', importFile);

      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Backup imported successfully!');
        setShowImportModal(false);
        setImportFile(null);
        // Refresh the backup files list
        window.location.reload();
      } else {
        throw new Error('Failed to import backup');
      }
    } catch (error) {
      console.error('Import backup failed:', error);
      alert('Failed to import backup. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.tar.gz', '.sql', '.json', '.csv'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        alert('Please select a valid backup file (.tar.gz, .sql, .json, or .csv)');
        return;
      }
      
      setImportFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-gray-600 mt-1">Manage system backups, schedules, and restore points</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Import Backup
          </button>
          <button
            onClick={() => handleCreateBackup()}
            disabled={isCreatingBackup}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArchiveBoxIcon className="h-4 w-4 mr-2" />
            {isCreatingBackup ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Local Storage</h3>
            <FolderIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used: {storageStats.local.used}</span>
              <span className="text-gray-600">Total: {storageStats.local.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${storageStats.local.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{storageStats.local.percentage}% used</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Google Drive</h3>
            {googleDriveConnected ? (
              <CloudArrowUpIcon className="h-5 w-5 text-green-500" />
            ) : (
              <CloudArrowDownIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used: {storageStats.googleDrive.used}</span>
              <span className="text-gray-600">Total: {storageStats.googleDrive.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${storageStats.googleDrive.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{storageStats.googleDrive.percentage}% used</p>
          </div>
          {!googleDriveConnected && (
            <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-700">
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'jobs', name: 'Backup Jobs', count: backupJobs.length },
            { id: 'files', name: 'Backup Files', count: backupFiles.length },
            { id: 'settings', name: 'Settings', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Backup Jobs Tab */}
      {selectedTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Scheduled Backup Jobs</h2>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              + Add New Job
            </button>
          </div>

          <div className="grid gap-4">
            {backupJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTypeIcon(job.type)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{job.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          Schedule: <span className="font-medium">{job.schedule}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Size: <span className="font-medium">{job.size}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Retention: <span className="font-medium">{job.retention} days</span>
                        </span>
                        {job.googleDrive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CloudArrowUpIcon className="h-3 w-3 mr-1" />
                            Google Drive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium capitalize">{job.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Last run: {job.lastRun}</p>
                      <p className="text-sm text-gray-500">Next run: {job.nextRun}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleJob(job.id)}
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          job.status === 'active'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {job.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Cog6ToothIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup Files Tab */}
      {selectedTab === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Backup Files</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCreateBackup('database')}
                className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Database
              </button>
              <button
                onClick={() => handleCreateBackup('settings')}
                className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Settings
              </button>
              <button
                onClick={() => handleCreateBackup('stats')}
                className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Stats
              </button>
              <button
                onClick={() => handleCreateBackup()}
                className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded"
              >
                Custom
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {backupFiles.map((file) => (
                <li key={file.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getTypeIcon(file.type)}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              Created: {file.createdAt}
                            </span>
                            <span className="text-sm text-gray-500">
                              Size: {file.size}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(file.status)}`}>
                              {file.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              Location: {file.location.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.location === 'google_drive' && (
                          <CloudArrowUpIcon className="h-4 w-4 text-green-500" />
                        )}
                        {file.location === 'both' && (
                          <div className="flex items-center space-x-1">
                            <FolderIcon className="h-4 w-4 text-blue-500" />
                            <CloudArrowUpIcon className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                        <button
                          onClick={() => handleDownloadBackup(file.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(file.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Restore"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(file.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && <BackupConfig />}

      {/* Backup Selection Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Select Backup Types</h3>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Choose which components you want to include in your backup:
                </p>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupOptions.full}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, full: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <ArchiveBoxIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Full Data Backup</div>
                        <div className="text-xs text-gray-500">Complete data backup including database, settings, and statistics</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupOptions.database}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, database: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <ServerIcon className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Database Backup</div>
                        <div className="text-xs text-gray-500">Backup all database tables and data</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupOptions.settings}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, settings: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <Cog6ToothIcon className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Settings Backup</div>
                        <div className="text-xs text-gray-500">Backup system configuration and settings</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupOptions.stats}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, stats: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <ChartBarIcon className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Statistics Backup</div>
                        <div className="text-xs text-gray-500">Backup analytics data and statistics</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSelectedBackups}
                  disabled={isCreatingBackup}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingBackup ? 'Creating...' : 'Create Selected Backups'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Backup Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import Backup</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select a backup file to import. This will restore your system to the state when the backup was created.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Backup File
                    </label>
                    <input
                      type="file"
                      accept=".tar.gz,.sql,.json,.csv"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {importFile && (
                      <p className="mt-2 text-sm text-green-600">
                        Selected: {importFile.name} ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Importing a backup will overwrite all current data. Make sure you have a current backup before proceeding.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportBackup}
                  disabled={!importFile || isImporting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import Backup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
