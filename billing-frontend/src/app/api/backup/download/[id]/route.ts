import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_PATH = '/tmp/backups';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params;
    const backupPath = path.join(BACKUP_PATH, backupId);

    // Check if file exists with common extensions
    const extensions = ['.tar.gz', '.sql', '.json', '.csv'];
    let filePath = '';
    let mimeType = 'application/octet-stream';

    for (const ext of extensions) {
      const fullPath = `${backupPath}${ext}`;
      try {
        await fs.access(fullPath);
        filePath = fullPath;
        
        // Set appropriate MIME type
        switch (ext) {
          case '.tar.gz':
            mimeType = 'application/gzip';
            break;
          case '.sql':
            mimeType = 'application/sql';
            break;
          case '.json':
            mimeType = 'application/json';
            break;
          case '.csv':
            mimeType = 'text/csv';
            break;
        }
        break;
      } catch {
        continue;
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    // Return the file as a download
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 });
  }
}
