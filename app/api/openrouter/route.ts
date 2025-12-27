import { NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
  if (!OPENROUTER_API_KEY) {
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
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'X-Title': title || 'MultiQuiz v2',
  };

  if (origin) {
    headers['HTTP-Referer'] = origin;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const responseBody = await response.text();
  const contentType = response.headers.get('Content-Type') || 'application/json';

  return new NextResponse(responseBody, {
    status: response.status,
    headers: { 'Content-Type': contentType },
  });
}
