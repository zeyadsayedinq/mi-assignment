// imageService.ts — Mi-Assignment Image Engine V1.0
// Waterfall: Pexels → Unsplash → Pixabay → Pollinations (Image Lab only)

const PEXELS_KEY   = import.meta.env.VITE_PEXELS_API_KEY   || 'HfLNkod8pFrjPIB4fd4H2a5Iddt05SCcDcEOward18GA5fomCFoFxzqL';
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY      || '';
const PIXABAY_KEY  = import.meta.env.VITE_PIXABAY_KEY       || '';

// ── 1. PEXELS — fast, reliable, free (200 req/hr, 20k/mo) ───────────────────
async function fetchPexels(query: string): Promise<string | null> {
  try {
    const clean = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(' ').slice(0, 5).join(' ');
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(clean)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos: any[] = data.photos || [];
    if (!photos.length) return null;
    const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 6))];
    return photo.src?.landscape || photo.src?.large2x || photo.src?.large || null;
  } catch {
    return null;
  }
}

// ── 2. UNSPLASH — editorial quality, magazine-grade (50 req/hr demo, 5k production) ──
async function fetchUnsplash(query: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null;
  try {
    const clean = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(' ').slice(0, 5).join(' ');
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(clean)}&per_page=12&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_KEY}`,
          'Accept-Version': 'v1',
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: any[] = data.results || [];
    if (!results.length) return null;
    const photo = results[Math.floor(Math.random() * Math.min(results.length, 6))];
    // Unsplash requires triggering a download event (their API terms)
    if (photo.links?.download_location) {
      fetch(`${photo.links.download_location}&client_id=${UNSPLASH_KEY}`).catch(() => {});
    }
    // Return full-width landscape URL — 1280px wide
    return photo.urls?.regular || photo.urls?.full || null;
  } catch {
    return null;
  }
}

// ── 3. PIXABAY — unlimited requests, no attribution required ─────────────────
async function fetchPixabay(query: string): Promise<string | null> {
  if (!PIXABAY_KEY) return null;
  try {
    const clean = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(' ').slice(0, 5).join('+');
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(clean)}&image_type=photo&orientation=horizontal&per_page=15&min_width=1280&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hits: any[] = data.hits || [];
    if (!hits.length) return null;
    const photo = hits[Math.floor(Math.random() * Math.min(hits.length, 6))];
    return photo.largeImageURL || photo.webformatURL || null;
  } catch {
    return null;
  }
}

// ── 4. POLLINATIONS — AI generation, Image Lab only ──────────────────────────
async function fetchPollinations(prompt: string): Promise<string | null> {
  try {
    const enhanced = `professional_minimalist_${prompt}_cinematic_lighting_high_resolution_photorealistic_4k_no_text_no_watermark`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?model=flux&width=1280&height=720&nologo=true&enhance=true&seed=${Math.random() * 99999 | 0}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Domain-aware query builder ────────────────────────────────────────────────
function buildImageQuery(prompt: string, major?: string, topic?: string): string {
  const stopWords = new Set([
    'the','and','for','with','using','based','study','report','assignment',
    'university','college','student','introduction','conclusion','overview',
    'according','therefore','however','methodology','analysis','impact',
    'approach','framework','model','system','process','result','effect',
  ]);

  const topicWords = (topic || '')
    .replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3);

  const promptWords = prompt
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
    .slice(0, 4);

  const allWords = [...new Set([...topicWords.slice(0, 1), ...promptWords])].slice(0, 5);
  return allWords.join(' ').trim() || prompt.slice(0, 40);
}

// ── Domain fallback queries ───────────────────────────────────────────────────
function getDomainFallback(domain: string, topic: string): string {
  const t = (topic || '').toLowerCase();
  if (/football|soccer|club|sport|player|أهلي|زمالك|salah|مباراة/.test(t))
    return 'football stadium crowd match action';
  if (/patient|nursing|medical|hospital|doctor|مريض/.test(t))
    return 'modern hospital doctor patient care';
  if (/engineering|concrete|structural|solar|beam|هندسة/.test(t))
    return 'civil engineering construction site';
  if (/business|marketing|pestel|swot|استراتيجية/.test(t))
    return 'business team meeting boardroom';
  if (/law|legal|contract|قانون|عقد/.test(t))
    return 'courtroom judge legal books';
  if (/code|software|database|algorithm|برمجة/.test(t))
    return 'software developer coding laptop';
  if (/math|calculus|statistics|إحصاء/.test(t))
    return 'university mathematics equations lecture';
  if (/history|philosophy|literature|أدب/.test(t))
    return 'university library books research';
  return 'university student study academic';
}

// ── Used query tracker — prevents duplicate images across slides ──────────────
const sessionUsedQueries = new Set<string>();

// ── Main export: 3-source waterfall, deduplication ───────────────────────────
export async function generatePresentationImage(
  prompt: string,
  major?: string,
  topic?: string
): Promise<string> {
  const domain = major || '';
  let primaryQuery = buildImageQuery(prompt, major, topic);

  // Deduplicate — if this exact query was used already, tweak it
  if (sessionUsedQueries.has(primaryQuery)) {
    const promptWords = prompt.split(' ').filter(w => w.length > 3);
    // Rotate to a different word combination
    primaryQuery = promptWords.slice(1).join(' ') || primaryQuery;
  }
  sessionUsedQueries.add(primaryQuery);

  // ── Waterfall ─────────────────────────────────────────────────────────────

  // 1. Pexels — primary
  const pexels1 = await fetchPexels(primaryQuery);
  if (pexels1) return pexels1;

  // 2. Unsplash — editorial quality fallback
  const unsplash = await fetchUnsplash(primaryQuery);
  if (unsplash) return unsplash;

  // 3. Pexels again with domain fallback query
  const fallbackQuery = getDomainFallback(domain, topic || prompt);
  if (fallbackQuery !== primaryQuery) {
    const pexels2 = await fetchPexels(fallbackQuery);
    if (pexels2) return pexels2;
  }

  // 4. Pixabay — unlimited, no attribution
  const pixabay = await fetchPixabay(primaryQuery);
  if (pixabay) return pixabay;

  // 5. Pixabay with fallback query
  if (fallbackQuery !== primaryQuery) {
    const pixabay2 = await fetchPixabay(fallbackQuery);
    if (pixabay2) return pixabay2;
  }

  // 6. Dark branded placeholder — never Pollinations for presentations
  return `https://placehold.co/1280x720/0F172A/22D3EE?text=${encodeURIComponent((topic || prompt).slice(0, 20))}`;
}

// ── Reset session deduplication (call at start of each new mission) ───────────
export function resetImageSession(): void {
  sessionUsedQueries.clear();
}

// ── Custom image for Image Lab — Pollinations AI only ────────────────────────
export async function generateCustomImage(
  prompt: string,
  style: string,
  width = 1280,
  height = 720
): Promise<string> {
  // Image Lab: try Pexels first for photorealistic style, AI for everything else
  if (style === 'photorealistic') {
    const pexels = await fetchPexels(prompt);
    if (pexels) return pexels;
  }

  const styles: Record<string, string> = {
    photorealistic: 'photorealistic, DSLR quality, cinematic, highly detailed',
    illustration:   'digital illustration, vibrant colors, clean lines, professional',
    infographic:    'clean infographic, flat design, professional, data visualization',
    technical:      'technical diagram, blueprint style, precise, schematic',
    abstract:       'abstract art, fluid shapes, gradient colors, modern, artistic',
    cinematic:      'cinematic still, film grain, dramatic lighting, movie quality',
    watercolor:     'watercolor painting, soft colors, artistic brushstrokes',
    '3d':           '3D render, octane render, studio lighting, photorealistic materials',
  };
  const styleStr = styles[style] || styles.photorealistic;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${styleStr}`)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux&seed=${Math.random() * 99999 | 0}`;
}
