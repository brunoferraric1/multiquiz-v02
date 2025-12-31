import { NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

type OpenRouterPayload = {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  tools?: unknown;
  tool_choice?: string;
  max_tokens?: number;
  temperature?: number;
  title?: string;
};

export async function POST(request: Request) {
  // Read API key at request time, not module load time (important for serverless)
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('[OpenRouter] API key not configured. OPENROUTER_API_KEY is missing from environment.');
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
  }

  let payload: OpenRouterPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { title, ...body } = payload;
  const origin =
    request.headers.get('origin') ||
    request.headers.get('referer') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    '';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'X-Title': title || 'MultiQuiz v2',
  };

  if (origin) {
    headers['HTTP-Referer'] = origin;
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const responseBody = await response.text();
    const contentType = response.headers.get('Content-Type') || 'application/json';

    // Log errors for debugging in production
    if (!response.ok) {
      console.error('[OpenRouter] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.slice(0, 500),
        keyPrefix: apiKey.slice(0, 10) + '...',
        origin,
      });
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('[OpenRouter] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to OpenRouter API' },
      { status: 502 }
    );
  }
}
