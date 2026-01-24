import { NextRequest, NextResponse } from 'next/server';
import { sendQuizCompletedWebhook } from '@/lib/services/webhook-service';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/deliver
 * Triggers webhook delivery for a completed quiz attempt
 * This is called asynchronously from the client after quiz completion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, quizId } = body;

    if (!attemptId || !quizId) {
      return NextResponse.json(
        { error: 'attemptId and quizId are required' },
        { status: 400 }
      );
    }

    // Fire webhook (don't wait for response, just acknowledge)
    // The actual delivery happens asynchronously
    sendQuizCompletedWebhook(attemptId, quizId)
      .then((result) => {
        if (!result.success) {
          console.warn('[Webhook Deliver] Delivery failed:', result.error);
        }
      })
      .catch((err) => {
        console.error('[Webhook Deliver] Error:', err);
      });

    return NextResponse.json({ success: true, message: 'Webhook delivery initiated' });
  } catch (error) {
    console.error('[Webhook Deliver API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate webhook delivery' },
      { status: 500 }
    );
  }
}
