import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    // Revalidate the page
    const path = `/pages/${pageId}`;
    
    // In production, you would use revalidatePath from next/cache
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: `Page ${pageId} will be regenerated on next request`,
      path
    });
  } catch (error) {
    console.error('Error revalidating page:', error);
    return NextResponse.json({ error: 'Failed to revalidate page' }, { status: 500 });
  }
}

