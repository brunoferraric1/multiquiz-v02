import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Public API to fetch user's theme settings.
 * Uses Firebase Admin to bypass client-side security rules.
 * This allows public quiz pages to display the correct theme for anonymous users.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ themeSettings: null });
    }

    const data = userDoc.data();
    const themeSettings = data?.themeSettings || null;

    return NextResponse.json({ themeSettings });
  } catch (error) {
    console.error('[API/theme] Error fetching theme settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme settings' },
      { status: 500 }
    );
  }
}
