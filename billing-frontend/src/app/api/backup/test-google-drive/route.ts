import { NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/googleDriveService';

export async function GET() {
  try {
    // Test Google Drive connection
    const isConnected = await googleDriveService.testConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        success: true, 
        message: 'Google Drive connection successful' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Drive connection failed' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Google Drive connection test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Google Drive connection test failed' 
    }, { status: 500 });
  }
}
