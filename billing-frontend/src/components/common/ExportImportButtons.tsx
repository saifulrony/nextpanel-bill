'use client';

import { useRef } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { exportToExcel, exportToCSV, handleFileImport } from '@/lib/excel-utils';

interface ExportImportButtonsProps {
  data: any[];
  filename: string;
  sheetName?: string;
  onImportSuccess?: (data: any[]) => void;
  onImportError?: (error: string) => void;
  exportDataMapper?: (item: any) => any;
}

export default function ExportImportButtons({
  data,
  filename,
  sheetName = 'Sheet1',
  onImportSuccess,
  onImportError,
  exportDataMapper,
}: ExportImportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const exportData = exportDataMapper ? data.map(exportDataMapper) : data;
    exportToExcel(exportData, filename, sheetName);
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const exportData = exportDataMapper ? data.map(exportDataMapper) : data;
    exportToCSV(exportData, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFileImport(
      file,
      (importedData) => {
        if (onImportSuccess) {
          onImportSuccess(importedData);
        } else {
          alert(`Successfully imported ${importedData.length} records.`);
        }
      },
      (error) => {
        if (onImportError) {
          onImportError(error);
        } else {
          alert(`Import error: ${error}`);
        }
      }
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 border-r border-gray-300 pr-2">
      <button
        onClick={handleExportExcel}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Export to Excel"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
        Excel
      </button>
      <button
        onClick={handleExportCSV}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Export to CSV"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
        CSV
      </button>
      <button
        onClick={handleImportClick}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Import from Excel/CSV"
      >
        <ArrowUpTrayIcon className="h-5 w-5 mr-1" />
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

