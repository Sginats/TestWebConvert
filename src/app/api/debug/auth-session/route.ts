import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Use protocol + host from request or env
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host');
  const sessionUrl = `${protocol}://${host}/api/auth/session`;

  try {
    const res = await fetch(sessionUrl, {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const bodyText = await res.text();
    const sanitizedBody = bodyText.substring(0, 100).replace(/\n/g, ' ');

    return NextResponse.json({
      status: res.status,
      contentType,
      bodyPreview: sanitizedBody,
      isHtml: contentType.includes('text/html') || bodyText.trim().startsWith('<'),
      message: 'This endpoint is for debugging only. It checks if /api/auth/session returns JSON or HTML.',
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'Failed to fetch session',
      message: err.message,
    }, { status: 500 });
  }
}
