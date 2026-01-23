import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { sendTestWebhook } from '@/lib/services/webhook-service';

/**
 * POST /api/webhooks/test
 * Sends a test webhook to verify configuration
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.error('[Webhook Test API] Missing or invalid authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!token || token === 'undefined' || token === 'null') {
    console.error('[Webhook Test API] Token is empty or undefined');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    await auth.verifyIdToken(token);
  } catch (error) {
    console.error('[Webhook Test API] Failed to verify token:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, secret } = body;

    if (!url || !secret) {
      return NextResponse.json(
        { error: 'URL and secret are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const result = await sendTestWebhook(url, secret);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test webhook sent successfully',
        statusCode: result.statusCode,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        statusCode: result.statusCode,
      });
    }
  } catch (error) {
    console.error('[Webhook Test API] Error sending test webhook:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}
