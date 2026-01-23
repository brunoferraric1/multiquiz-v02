import { createHmac } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import type { WebhookConfig, WebhookPayload, QuizAttempt } from '@/types';

/**
 * Build HMAC-SHA256 signature for webhook payload
 */
export function signPayload(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return 'sha256=' + hmac.digest('hex');
}

/**
 * Get webhook config for a user (server-side using Admin SDK)
 */
async function getWebhookConfigAdmin(userId: string): Promise<WebhookConfig | null> {
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  const data = userDoc.data();
  const webhookConfig = data?.webhookConfig as WebhookConfig | undefined;

  if (!webhookConfig || !webhookConfig.enabled || !webhookConfig.url) {
    return null;
  }

  return webhookConfig;
}

/**
 * Get quiz data by ID (server-side using Admin SDK)
 */
async function getQuizAdmin(quizId: string): Promise<{
  id: string;
  title: string;
  ownerId: string;
  visualBuilderData?: string;
} | null> {
  const db = getAdminDb();
  const quizDoc = await db.collection('quizzes').doc(quizId).get();

  if (!quizDoc.exists) {
    return null;
  }

  const data = quizDoc.data();
  return {
    id: quizDoc.id,
    title: data?.title || 'Untitled Quiz',
    ownerId: data?.ownerId,
    visualBuilderData: data?.visualBuilderData,
  };
}

/**
 * Get attempt data by ID (server-side using Admin SDK)
 */
async function getAttemptAdmin(attemptId: string): Promise<QuizAttempt | null> {
  const db = getAdminDb();
  const attemptDoc = await db.collection('quiz_attempts').doc(attemptId).get();

  if (!attemptDoc.exists) {
    return null;
  }

  const data = attemptDoc.data();
  return {
    id: attemptDoc.id,
    quizId: data?.quizId,
    userId: data?.userId,
    startedAt: data?.startedAt?.toMillis?.() || data?.startedAt || Date.now(),
    completedAt: data?.completedAt?.toMillis?.() || data?.completedAt,
    lastUpdatedAt: data?.lastUpdatedAt?.toMillis?.() || data?.lastUpdatedAt || Date.now(),
    currentQuestionId: data?.currentQuestionId,
    answers: data?.answers || {},
    fieldResponses: data?.fieldResponses || [],
    lead: data?.lead,
    resultOutcomeId: data?.resultOutcomeId,
    status: data?.status || 'started',
    ctaClickedAt: data?.ctaClickedAt,
    isOwnerAttempt: data?.isOwnerAttempt,
  } as QuizAttempt;
}

/**
 * Build webhook payload from attempt and quiz data
 */
export function buildPayload(
  attempt: QuizAttempt,
  quiz: { id: string; title: string; visualBuilderData?: string }
): WebhookPayload {
  // Parse visualBuilderData to extract question text and outcome info
  let visualData: { steps?: any[]; outcomes?: any[] } = { steps: [], outcomes: [] };
  if (quiz.visualBuilderData) {
    try {
      visualData = JSON.parse(quiz.visualBuilderData);
    } catch (e) {
      console.warn('[WebhookService] Failed to parse visualBuilderData:', e);
    }
  }

  // Build lead object from fieldResponses (primary) or legacy lead object
  const lead: Record<string, string> = {};

  if (attempt.fieldResponses && attempt.fieldResponses.length > 0) {
    for (const field of attempt.fieldResponses) {
      // Use field label as key, normalized to lowercase
      const key = field.label.toLowerCase().replace(/\s+/g, '_');
      lead[key] = field.value;
    }
  } else if (attempt.lead) {
    // Fallback to legacy lead object
    if (attempt.lead.email) lead.email = attempt.lead.email;
    if (attempt.lead.phone) lead.phone = attempt.lead.phone;
    if (attempt.lead.name) lead.name = attempt.lead.name;
  }

  // Build answers array
  const answers: WebhookPayload['answers'] = [];
  const questionSteps = visualData.steps?.filter((s: any) => s.type === 'question') || [];

  for (const [questionId, optionId] of Object.entries(attempt.answers || {})) {
    // Find the question step
    const questionStep = questionSteps.find((s: any) => s.id === questionId);
    if (!questionStep) continue;

    // Get question text from header block
    const headerBlock = questionStep.blocks?.find((b: any) => b.type === 'header');
    const questionText = headerBlock?.content?.text || 'Unknown question';

    // Get selected option text from options block
    const optionsBlock = questionStep.blocks?.find((b: any) => b.type === 'options');
    const selectedOptions: string[] = [];

    if (optionsBlock?.content?.items) {
      // Handle both single and multiple selections
      const selectedIds = Array.isArray(optionId) ? optionId : [optionId];
      for (const id of selectedIds) {
        const option = optionsBlock.content.items.find((item: any) => item.id === id);
        if (option) {
          selectedOptions.push(option.text || 'Unknown option');
        }
      }
    }

    answers.push({
      question: questionText,
      selected: selectedOptions,
    });
  }

  // Get result outcome info
  let result: WebhookPayload['result'] = null;
  if (attempt.resultOutcomeId && visualData.outcomes) {
    const outcome = visualData.outcomes.find((o: any) => o.id === attempt.resultOutcomeId);
    if (outcome) {
      // Get outcome title from header block
      const headerBlock = outcome.blocks?.find((b: any) => b.type === 'header');
      result = {
        outcomeId: outcome.id,
        outcomeName: outcome.name || 'Unknown outcome',
        outcomeTitle: headerBlock?.content?.text || outcome.name || 'Unknown outcome',
      };
    }
  }

  return {
    event: 'quiz.completed',
    timestamp: new Date().toISOString(),
    quiz: {
      id: quiz.id,
      title: quiz.title,
    },
    lead,
    result,
    answers,
  };
}

/**
 * Send webhook for a completed quiz attempt
 * This is the main entry point called after quiz completion
 */
export async function sendQuizCompletedWebhook(
  attemptId: string,
  quizId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get quiz data to find owner
    const quiz = await getQuizAdmin(quizId);
    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Get owner's webhook config
    const webhookConfig = await getWebhookConfigAdmin(quiz.ownerId);
    if (!webhookConfig) {
      // No webhook configured or disabled - this is not an error
      return { success: true };
    }

    // Get attempt data
    const attempt = await getAttemptAdmin(attemptId);
    if (!attempt) {
      return { success: false, error: 'Attempt not found' };
    }

    // Build and send the webhook
    const payload = buildPayload(attempt, quiz);
    const result = await deliverWebhook(webhookConfig.url, payload, webhookConfig.secret);

    return result;
  } catch (error) {
    console.error('[WebhookService] Error sending webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Deliver webhook to the configured URL
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(timestamp + '.' + body, secret);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MultiQuiz-Signature': signature,
        'X-MultiQuiz-Timestamp': timestamp,
      },
      body,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    return { success: true, statusCode: response.status };
  } catch (error) {
    console.error('[WebhookService] Delivery error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Send a test webhook with sample data
 */
export async function sendTestWebhook(
  url: string,
  secret: string
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const testPayload: WebhookPayload = {
    event: 'quiz.completed',
    timestamp: new Date().toISOString(),
    quiz: {
      id: 'test-quiz-id',
      title: 'Test Quiz',
    },
    lead: {
      email: 'test@example.com',
      name: 'Test User',
      phone: '+5511999999999',
    },
    result: {
      outcomeId: 'test-outcome-id',
      outcomeName: 'Test Outcome',
      outcomeTitle: 'You are a Leader!',
    },
    answers: [
      {
        question: 'What is your role?',
        selected: ['Manager'],
      },
      {
        question: 'How many years of experience?',
        selected: ['5-10 years'],
      },
    ],
  };

  return deliverWebhook(url, testPayload, secret);
}
