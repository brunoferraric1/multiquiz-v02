import { NextResponse } from 'next/server';

type UnsplashResult = {
  url: string;
  attribution: string;
};

type UnsplashPhoto = {
  width?: number;
  height?: number;
  urls?: { regular?: string; full?: string };
  description?: string;
  alt_description?: string;
  slug?: string;
  likes?: number;
  tags?: { title?: string }[];
  topic_submissions?: Record<string, { status?: string }>;
  user?: { name?: string; links?: { html?: string } };
};

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const QUERY_TRANSLATION_MODEL = 'google/gemini-2.5-flash-lite';

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
const randomSig = () => Math.random().toString(36).slice(2);

/**
 * Use AI to translate Portuguese quiz context into optimal English Unsplash search keywords.
 * This dramatically improves search relevance since Unsplash metadata is primarily in English.
 */
const translateToImageQuery = async (prompt: string, referer?: string): Promise<string> => {
  if (!OPENROUTER_API_KEY) {
    console.warn('No OpenRouter API key - falling back to basic keyword extraction');
    return extractBasicEnglishKeywords(prompt);
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'X-Title': 'MultiQuiz Image Search',
    };

    if (referer) {
      headers['HTTP-Referer'] = referer;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: QUERY_TRANSLATION_MODEL,
        messages: [
          {
            role: 'system',
            content: `You convert quiz topics into optimal Unsplash stock photo search queries.

OUTPUT FORMAT: Return ONLY 3-5 English keywords separated by spaces. Nothing else.

RULES:
- Use ENGLISH words only (translate Portuguese if needed)
- Focus on CONCRETE VISUAL objects that appear in photos
- Think: "What would literally be IN this photo?"
- Prefer nouns over adjectives
- NO abstract concepts (avoid: theme, concept, style, illustration)
- NO meta words (avoid: quiz, test, image, photo, background)
- NO brand names or trademarks (avoid: Spider-Man, G.I. Joe, Marvel, Nike, etc.) - use generic terms instead
- Keep it GENERIC and SEARCHABLE - Unsplash has stock photos, not branded content

EXAMPLES:
"papelaria de casamento, convite" → "wedding invitation envelope wax seal"
"quiz sobre café e barista" → "coffee beans espresso cup latte"
"tecnologia mobile app" → "smartphone hand mobile screen"
"fitness musculação" → "gym dumbbells workout weights"
"viagem e turismo" → "passport suitcase travel map"
"negócios empreendedorismo" → "laptop desk office workspace"
"saúde bem-estar" → "yoga meditation wellness"
"educação online" → "laptop books study desk"
"bonecos de ação Spider-Man G.I. Joe" → "action figure toy collectible"
"boneco de ação em estúdio" → "action figure toy studio"`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 30,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.warn('AI query translation failed, using fallback', response.status);
      return extractBasicEnglishKeywords(prompt);
    }

    const data = await response.json();
    const translatedQuery = data.choices?.[0]?.message?.content?.trim();

    if (translatedQuery && translatedQuery.length > 2 && translatedQuery.length < 100) {
      console.info('AI translated query:', { original: prompt, translated: translatedQuery });
      return translatedQuery;
    }

    return extractBasicEnglishKeywords(prompt);
  } catch (error) {
    console.error('AI query translation error:', error);
    return extractBasicEnglishKeywords(prompt);
  }
};

/**
 * Simple Portuguese-to-English keyword mapping for common quiz topics.
 * Used as fallback when AI translation is unavailable.
 */
const PT_TO_EN_MAP: Record<string, string> = {
  casamento: 'wedding',
  papelaria: 'stationery',
  convite: 'invitation',
  cafe: 'coffee',
  café: 'coffee',
  tecnologia: 'technology',
  negocio: 'business',
  negócio: 'business',
  saude: 'health',
  saúde: 'health',
  viagem: 'travel',
  fitness: 'fitness',
  educacao: 'education',
  educação: 'education',
  marketing: 'marketing',
  vendas: 'sales',
  finanças: 'finance',
  financas: 'finance',
  mulher: 'woman',
  homem: 'man',
  criança: 'child',
  familia: 'family',
  família: 'family',
  comida: 'food',
  bebida: 'drink',
  moda: 'fashion',
  beleza: 'beauty',
  esporte: 'sports',
  musica: 'music',
  música: 'music',
  arte: 'art',
  natureza: 'nature',
  animais: 'animals',
  carro: 'car',
  casa: 'home',
  jardim: 'garden',
  praia: 'beach',
  montanha: 'mountain',
};

const extractBasicEnglishKeywords = (prompt: string): string => {
  const normalized = prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = normalized.split(/[\s,;:.!?]+/).filter((w) => w.length > 2);

  const englishWords: string[] = [];
  for (const word of words) {
    const translated = PT_TO_EN_MAP[word];
    if (translated) {
      englishWords.push(translated);
    } else if (/^[a-z]+$/.test(word) && word.length > 3) {
      // Keep words that look like English already
      englishWords.push(word);
    }
  }

  return englishWords.slice(0, 5).join(' ') || 'abstract minimal';
};

const MAX_QUERY_LENGTH = 200;
const STOPWORDS = new Set([
  'para',
  'com',
  'sem',
  'como',
  'isso',
  'essa',
  'este',
  'esse',
  'quiz',
  'sobre',
  'descubra',
  'discover',
  'the',
  'and',
  'que',
  'dos',
  'das',
  'uma',
  'um',
  'a',
  'o',
  'de',
  'do',
  'da',
  'nos',
  'nas',
  'por',
  'onde',
  'qual',
  'quem',
  'isto',
]);

const buildQuery = (keywords: string[]) =>
  keywords
    .filter(Boolean)
    .join(' ')
    .slice(0, MAX_QUERY_LENGTH)
    .trim();

const sanitizeToken = (token: string) =>
  token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
    .trim();

const extractTokens = (text: string): string[] =>
  text
    .split(/[\s,.;:!?/]+/)
    .map((token) => sanitizeToken(token))
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const MAX_TOKENS_FOR_SCORE = 6;

const computePhotoScore = (photo: UnsplashPhoto, promptTokens: string[]): number => {
  if (!promptTokens.length) {
    return photo.likes ? Math.min(photo.likes, 50) / 50 : 0;
  }

  const haystackSources = [
    photo.description,
    photo.alt_description,
    photo.slug,
    ...(photo.tags?.map((tag) => tag.title) || []),
    ...(photo.topic_submissions ? Object.keys(photo.topic_submissions) : []),
  ]
    .filter(Boolean)
    .join(' ');

  const haystackTokens = new Set(extractTokens(haystackSources));
  let matches = 0;
  const limitedTokens = promptTokens.slice(0, MAX_TOKENS_FOR_SCORE);
  limitedTokens.forEach((token) => {
    if (haystackTokens.has(token)) {
      matches += 1;
    }
  });

  const coverage = matches / limitedTokens.length;
  const popularity = photo.likes ? Math.min(photo.likes, 50) / 100 : 0;
  const aspectPreference = photo.width && photo.height ? Math.min(photo.width / photo.height, 2) / 2 : 0.5;
  const semanticScore = matches > 0 ? coverage : 0.05;
  return semanticScore * 0.8 + popularity * 0.15 + aspectPreference * 0.05;
};

const pickBestPhoto = (photos: UnsplashPhoto[], prompt: string): UnsplashPhoto | undefined => {
  if (!photos?.length) return undefined;
  const promptTokens = extractTokens(prompt);
  const landscapePhotos = photos.filter((photo) => (photo.width || 0) >= (photo.height || 0));
  const pool = landscapePhotos.length > 0 ? landscapePhotos : photos;

  const ranked = pool
    .map((photo) => ({ photo, score: computePhotoScore(photo, promptTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) {
    // Pick randomly from top 5 results to provide variety when user asks for different images
    const topN = Math.min(5, ranked.length);
    const randomIndex = Math.floor(Math.random() * topN);
    console.info('Image selection:', { totalRanked: ranked.length, topN, selectedIndex: randomIndex });
    return ranked[randomIndex]?.photo;
  }

  // As a last resort, return a random landscape photo or random result
  const randomFallbackIndex = Math.floor(Math.random() * pool.length);
  return pool[randomFallbackIndex] || photos[0];
};

/**
 * Search Unsplash with a single query
 */
const searchUnsplash = async (query: string): Promise<UnsplashPhoto[]> => {
  if (!UNSPLASH_ACCESS_KEY || !query) return [];

  const searchParams = new URLSearchParams({
    query,
    per_page: '12',
    orientation: 'landscape',
    content_filter: 'high',
    order_by: 'relevant',
  });

  const response = await fetch(`https://api.unsplash.com/search/photos?${searchParams.toString()}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.warn('Unsplash search failed', response.status, response.statusText);
    return [];
  }

  const data = await response.json();
  return data?.results || [];
};

/**
 * Two-stage search strategy:
 * 1. Try the full AI-translated query
 * 2. If 0 results, try simplified query (first 2 words only)
 * 3. If still 0, try just the first word
 */
const fetchViaUnsplashApi = async (query: string, prompt: string): Promise<UnsplashResult | undefined> => {
  if (!UNSPLASH_ACCESS_KEY || !query) return undefined;

  const queryWords = query.split(' ').filter(Boolean);
  
  // Stage 1: Try full query
  let photos = await searchUnsplash(query);
  console.info('Image suggestion search (full query)', { query, returned: photos.length });

  // Stage 2: If no results, try first 2-3 words (simpler query)
  if (photos.length === 0 && queryWords.length > 2) {
    const simplifiedQuery = queryWords.slice(0, 2).join(' ');
    photos = await searchUnsplash(simplifiedQuery);
    console.info('Image suggestion search (simplified)', { query: simplifiedQuery, returned: photos.length });
  }

  // Stage 3: If still no results, try just first word
  if (photos.length === 0 && queryWords.length > 1) {
    const singleWordQuery = queryWords[0];
    photos = await searchUnsplash(singleWordQuery);
    console.info('Image suggestion search (single word)', { query: singleWordQuery, returned: photos.length });
  }

  if (photos.length === 0) {
    console.warn('No Unsplash results for any query variation', { originalQuery: query });
    return undefined;
  }

  const bestPhoto = pickBestPhoto(photos, prompt);
  const imageUrl: string | undefined = bestPhoto?.urls?.regular || bestPhoto?.urls?.full;

  if (!imageUrl) return undefined;

  const photographer = bestPhoto?.user?.name;
  const photographerLink = bestPhoto?.user?.links?.html;
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const origin =
      request.headers.get('origin') ||
      request.headers.get('referer') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt ausente' }, { status: 400 });
    }

    // Step 1: Use AI to translate the prompt to optimal English Unsplash keywords
    const translatedQuery = await translateToImageQuery(prompt, origin);
    console.info('Image suggestion query translation', { original: prompt, translated: translatedQuery });

    try {
      // Step 2: Search Unsplash with the AI-optimized query (no keyword dilution)
      const unsplashResult = await fetchViaUnsplashApi(translatedQuery, prompt);

      if (unsplashResult) {
        console.info('Image suggestion resolved via Unsplash search', {
          prompt,
          translatedQuery,
          url: unsplashResult.url,
        });
        return NextResponse.json(unsplashResult);
      }

      // Fallback: try with basic extracted keywords
      const fallbackKeywords = extractBasicEnglishKeywords(prompt).split(' ');
      const sourceResult = await fetchViaSourceEndpoint(fallbackKeywords);
      console.info('Image suggestion resolved via source.unsplash fallback', {
        prompt,
        fallbackKeywords,
        url: sourceResult,
      });

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
