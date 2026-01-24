# Webhook CRM Integration - Technical Decision

**Date:** 2026-01-23
**Status:** Implemented
**Author:** Claude Code

---

## Context

Users need to send quiz completion data to external CRMs (HubSpot, Pipedrive, custom systems) automatically. This requires a webhook system that fires when quizzes are completed.

## Decision

Implement **account-level webhooks** (single configuration applies to all quizzes) with HMAC-SHA256 signature verification.

### Why Account-Level Instead of Per-Quiz?

| Approach | Pros | Cons |
|----------|------|------|
| **Account-level** (chosen) | Configure once, works for all quizzes; simpler UX; less data duplication | Can't send different quizzes to different endpoints |
| Per-quiz | Granular control per quiz | More complex UI; users must configure each quiz; data duplication |

**Decision:** Start with account-level. Can add per-quiz overrides later if needed.

---

## Architecture

### Data Flow

```
Quiz Completed (client)
       │
       ▼
AnalyticsService.updateAttempt()
       │
       ▼ (async, non-blocking)
POST /api/webhooks/deliver
       │
       ▼
WebhookService.sendQuizCompletedWebhook()
       │
       ├─► Fetch quiz (get ownerId)
       │
       ├─► Fetch owner's webhook config
       │
       ├─► Build payload
       │
       ├─► Sign with HMAC-SHA256
       │
       └─► POST to configured URL
```

### Files Structure

```
lib/services/
├── webhook-service.ts      # Server-side: build payload, sign, deliver
├── user-settings-service.ts # Client-side: CRUD for webhook config

app/api/
├── user/settings/route.ts   # GET/PUT webhook configuration
├── webhooks/
│   ├── test/route.ts        # POST test webhook
│   └── deliver/route.ts     # POST trigger webhook delivery

app/dashboard/settings/
└── integrations/page.tsx    # UI for webhook configuration

types/index.ts               # WebhookConfigSchema, WebhookPayload
```

---

## Data Storage

Webhook config stored in user document:

```typescript
// Firestore: users/{userId}
{
  webhookConfig: {
    enabled: boolean,
    url: string,
    secret: string,  // Auto-generated, format: whsec_<64-hex-chars>
    updatedAt: Timestamp
  }
}
```

---

## Webhook Payload

```typescript
type WebhookPayload = {
  event: 'quiz.completed';
  timestamp: string;  // ISO 8601
  quiz: {
    id: string;
    title: string;
  };
  lead: Record<string, string>;  // Dynamic: email, phone, name, custom fields
  result: {
    outcomeId: string;
    outcomeName: string;
    outcomeTitle: string;
  } | null;
  answers: {
    question: string;
    selected: string[];
  }[];
};
```

### Example Payload

```json
{
  "event": "quiz.completed",
  "timestamp": "2026-01-23T15:30:00.000Z",
  "quiz": {
    "id": "abc123",
    "title": "Descubra seu perfil"
  },
  "lead": {
    "email": "joao@example.com",
    "nome": "João Silva",
    "telefone": "+5511999999999",
    "empresa": "Acme Corp"
  },
  "result": {
    "outcomeId": "outcome-1",
    "outcomeName": "Perfil A",
    "outcomeTitle": "Você é um Líder!"
  },
  "answers": [
    {
      "question": "Qual é sua área de atuação?",
      "selected": ["Tecnologia"]
    },
    {
      "question": "Quantos anos de experiência?",
      "selected": ["5-10 anos"]
    }
  ]
}
```

---

## Security

### HMAC-SHA256 Signature

Every webhook request includes:

```
X-MultiQuiz-Signature: sha256=<hmac>
X-MultiQuiz-Timestamp: <unix-timestamp>
```

**Signature computation:**

```typescript
const signature = HMAC-SHA256(secret, timestamp + '.' + body)
```

### Verification on CRM Side

```typescript
// Pseudocode for receiving endpoint
const secret = process.env.MULTIQUIZ_WEBHOOK_SECRET;
const signature = headers['x-multiquiz-signature'];
const timestamp = headers['x-multiquiz-timestamp'];
const body = await request.text();

const expected = 'sha256=' + hmac('sha256', secret, timestamp + '.' + body);

if (signature !== expected) {
  return Response(401, 'Invalid signature');
}

// Optionally: reject if timestamp is too old (replay attack prevention)
const age = Date.now() / 1000 - parseInt(timestamp);
if (age > 300) { // 5 minutes
  return Response(401, 'Request too old');
}
```

---

## Trigger Point

Webhooks fire in `lib/services/analytics-service.ts`:

```typescript
// In updateAttempt(), after incrementing completions
if (updates.status === 'completed' && targetQuizId && !isOwnerAttempt) {
  await QuizService.incrementStat(targetQuizId, 'completions');

  // Fire webhook asynchronously (don't await)
  fetch('/api/webhooks/deliver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attemptId, quizId: targetQuizId }),
  }).catch(err => console.warn('[Analytics] Webhook delivery request failed:', err));
}
```

**Key decisions:**
- Async (non-blocking): Quiz completion UX not affected by webhook
- Fire-and-forget: No retry logic in MVP
- Server-side delivery: Secret never exposed to client

---

## UI Design

Accordion-style integration cards:

```
┌─────────────────────────────────────────────────────────────┐
│ [icon] Webhook CRM                    [Active badge] [toggle]│
│         Send lead data to your CRM automatically             │
├─────────────────────────────────────────────────────────────┤
│ (Expanded when enabled)                                      │
│                                                              │
│ URL do webhook                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://my-crm.com/api/webhooks/multiquiz               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Segredo de verificação                                       │
│ ┌───────────────────────────────────────┐ [copy] [refresh]  │
│ │ whsec_abc123...                       │                   │
│ └───────────────────────────────────────┘                   │
│                                                              │
│ [Send Test]  [Save]                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [icon] WhatsApp                       [Soon badge] [toggle]  │
│         Receive lead notifications on WhatsApp (disabled)    │
└─────────────────────────────────────────────────────────────┘
```

**"Active" badge logic:** Only shows when config is saved with enabled=true AND has URL configured.

---

## i18n

Translations added to all three languages:
- `messages/pt-BR/integrations.json`
- `messages/en/integrations.json`
- `messages/es/integrations.json`

Plus settings.json updated with integrations section link.

---

## Future Enhancements

| Enhancement | Priority | Notes |
|-------------|----------|-------|
| Per-quiz webhook overrides | Medium | Send specific quiz to different endpoint |
| Multiple webhooks | Medium | Send to multiple CRMs |
| Retry with exponential backoff | Medium | Handle transient failures |
| Webhook delivery logs | Low | Dashboard to see delivery history |
| Native Zapier integration | Low | Direct Zapier app |
| Additional events | Low | `quiz.started`, `quiz.abandoned` |
| Field mapping UI | Low | Map quiz fields to CRM fields |

---

## Testing

1. **Manual testing with webhook.site**: Inspect payload structure
2. **Test with real CRM sandbox**: HubSpot/Pipedrive developer accounts
3. **E2E test**: Complete quiz → verify lead appears in CRM

---

## Deployment Considerations

The webhook API routes (`/api/webhooks/*`, `/api/user/settings`) require Firebase Admin SDK for authentication. See **[FIREBASE_ADMIN_SDK_CONFIGURATION.md](./FIREBASE_ADMIN_SDK_CONFIGURATION.md)** for:

- Turbopack bundling workaround
- Application Default Credentials (ADC) on Cloud Run
- Staging vs production environment detection

**Key points:**
- On Cloud Run (Firebase Hosting), no service account key is needed - ADC is used automatically
- Locally, `FIREBASE_SERVICE_ACCOUNT_KEY` must be set in `.env.local`
- The test webhook feature requires a publicly accessible URL (localhost won't work from Cloud Run)

---

## Related Files

- `lib/firebase-admin.ts` - Firebase Admin SDK initialization (see FIREBASE_ADMIN_SDK_CONFIGURATION.md)
- `lib/services/webhook-service.ts` - Core webhook logic
- `lib/services/user-settings-service.ts` - User settings CRUD
- `app/api/webhooks/deliver/route.ts` - Async delivery endpoint
- `app/api/webhooks/test/route.ts` - Test endpoint
- `app/api/user/settings/route.ts` - Settings API
- `app/dashboard/settings/integrations/page.tsx` - UI
- `types/index.ts` - WebhookConfigSchema, WebhookPayload types
