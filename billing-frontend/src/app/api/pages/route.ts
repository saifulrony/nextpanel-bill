import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (in production, use a database)
const pageLayouts: Record<string, any> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('id');

  if (pageId) {
    const layout = pageLayouts[pageId];
    if (layout) {
      return NextResponse.json(layout);
    }
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  // Return all pages
  return NextResponse.json(Object.keys(pageLayouts).map(id => ({
    id,
    ...pageLayouts[id]
  })));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, components, metadata } = body;

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    pageLayouts[id] = {
      id,
      title: title || 'Untitled Page',
      description: description || '',
      components: components || [],
      metadata: metadata || {},
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      page: pageLayouts[id]
    });
  } catch (error) {
    console.error('Error saving page:', error);
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    if (pageLayouts[pageId]) {
      delete pageLayouts[pageId];
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}

