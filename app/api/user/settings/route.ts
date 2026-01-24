import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin';
import { WebhookConfigSchema } from '@/types';

export const runtime = 'nodejs';

/**
 * GET /api/user/settings
 * Returns the user's webhook configuration
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let userId = '';

  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(token);
    userId = decoded.uid;
  } catch (error) {
    console.error('[User Settings API] Failed to authorize', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ webhookConfig: null });
    }

    const data = userDoc.data();
    const webhookConfig = data?.webhookConfig || null;

    return NextResponse.json({ webhookConfig });
  } catch (error) {
    console.error('[User Settings API] Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/settings
 * Updates the user's webhook configuration
 */
export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let userId = '';

  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(token);
    userId = decoded.uid;
  } catch (error) {
    console.error('[User Settings API] Failed to authorize', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { webhookConfig } = body;

    // Validate webhook config if provided
    if (webhookConfig) {
      const validation = WebhookConfigSchema.safeParse(webhookConfig);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid webhook configuration', details: validation.error.issues },
          { status: 400 }
        );
      }
    }

    const db = getAdminDb();
    await db.collection('users').doc(userId).set(
      {
        webhookConfig: webhookConfig || null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[User Settings API] Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
