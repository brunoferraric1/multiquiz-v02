import { NextResponse } from 'next/server';

type UnsplashResult = {
  url: string;
  attribution: string;
};

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
const randomSig = () => Math.random().toString(36).slice(2);
const DEFAULT_KEYWORDS = ['digital illustration', 'clean background', 'high detail', 'no text overlay'];

const MAX_QUERY_LENGTH = 400;

const buildQuery = (keywords: string[]) =>
  keywords
    .filter(Boolean)
    .join(' ')
    .slice(0, MAX_QUERY_LENGTH)
    .trim();

const fetchViaUnsplashApi = async (query: string): Promise<UnsplashResult | undefined> => {
  if (!UNSPLASH_ACCESS_KEY || !query) return undefined;

  const searchParams = new URLSearchParams({
    query,
    count: '1',
    orientation: 'landscape',
    content_filter: 'high',
  });

  const response = await fetch(`https://api.unsplash.com/photos/random?${searchParams.toString()}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
    // Avoid Next's default caching for ISR/SSG
    cache: 'no-store',
  });

  if (!response.ok) {
    console.warn('Unsplash API fallback to source endpoint', response.status, response.statusText);
    return undefined;
  }

  const data = await response.json();
  const photo = Array.isArray(data) ? data[0] : data;
  const imageUrl: string | undefined = photo?.urls?.regular || photo?.urls?.full;

  if (!imageUrl) return undefined;

  const photographer = photo?.user?.name;
  const photographerLink = photo?.user?.links?.html;
  const attribution = photographer
    ? `Foto de ${photographer}${photographerLink ? ` (${photographerLink})` : ''} via Unsplash`
    : 'Sugestão automática via Unsplash';

  return { url: imageUrl, attribution };
};

const fetchViaSourceEndpoint = async (keywords: string[]): Promise<string> => {
  const query = encodeURIComponent(keywords.join(','));
  const candidateUrl = `https://source.unsplash.com/random/1200x800/?${query}&sig=${randomSig()}`;
  const response = await fetch(candidateUrl, { method: 'GET', redirect: 'follow', cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Imagem não retornada (${response.status})`);
  }

  return response.url || candidateUrl;
};

const deriveKeywords = (prompt: string): string[] => {
  const normalized = prompt.replace(/\s+/g, ' ').trim();
  if (!normalized) return DEFAULT_KEYWORDS;

  const sections = normalized
    .split(/[\n,.;]/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 2);

  const keywords = new Set<string>();
  if (normalized) keywords.add(normalized);
  sections.forEach((chunk) => keywords.add(chunk));

  const noPeoplePattern = /(sem pessoas|sem rosto|sem face|no people|without people|sem figuras humanas)/i;
  if (noPeoplePattern.test(normalized)) {
    keywords.add('no people');
    keywords.add('no human face');
  }

  const photoPattern = /(foto|photography|photograph|retrato|portrait)/i;
  if (!photoPattern.test(normalized)) {
    keywords.add('concept illustration');
    keywords.add('digital art');
  }

  DEFAULT_KEYWORDS.forEach((word) => keywords.add(word));

  return Array.from(keywords);
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt ausente' }, { status: 400 });
    }

    const keywords = deriveKeywords(prompt);
    const fullQuery = buildQuery(keywords);

    try {
      const unsplashResult = await fetchViaUnsplashApi(fullQuery);

      if (unsplashResult) {
        return NextResponse.json(unsplashResult);
      }

      const sourceResult = await fetchViaSourceEndpoint(keywords);

      return NextResponse.json({
        url: sourceResult,
        attribution: 'Sugestão automática via Unsplash',
      });
    } catch (error) {
      console.error('Erro ao sugerir imagem de capa', error);
      return NextResponse.json({
        url: DEFAULT_FALLBACK,
        attribution: 'Imagem de fallback',
      });
    }
  } catch (error) {
    console.error('Erro inesperado no endpoint de sugestão de capa', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
