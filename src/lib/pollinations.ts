// imageService.ts — Mi-Assignment Image Engine
// Primary: Pexels (reliable, fast, no timeout)
// Fallback: Pollinations.ai (free, no key needed)

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY || 'HfLNkod8pFrjPIB4fd4H2a5Iddt05SCcDcEOward18GA5fomCFoFxzqL';

// ── Pexels: reliable stock photos ────────────────────────────────────────────
async function fetchPexels(query: string): Promise<string | null> {
  try {
    const clean = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(' ').slice(0, 5).join(' ');
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(clean)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos: any[] = data.photos || [];
    if (!photos.length) return null;
    // Pick randomly from top 4 results for variety
    const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 4))];
    return photo.src?.landscape || photo.src?.large2x || photo.src?.large || null;
  } catch {
    return null;
  }
}

// ── Pollinations: free fallback ───────────────────────────────────────────────
async function fetchPollinations(prompt: string): Promise<string | null> {
  try {
    const enhanced = `professional_minimalist_${prompt}_cinematic_lighting_high_resolution_photorealistic_4k_no_text_no_watermark`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?model=flux&width=1280&height=720&nologo=true&enhance=true&seed=${Math.random() * 99999 | 0}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
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

// ── Build smart Pexels query from slide content ───────────────────────────────
function buildImageQuery(prompt: string, major?: string, topic?: string): string {
  // Extract meaningful keywords — strip academic jargon
  const stopWords = new Set(['the','and','for','with','using','based','analysis','study','report','assignment','university','college','student','introduction','conclusion','overview','according','therefore','however','methodology']);
  
  let combined = [topic || '', major || '', prompt].join(' ');
  const words = combined.toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 5);
  
  return words.join(' ') || prompt.slice(0, 40);
}

// ── Main export: Pexels first, Pollinations fallback ─────────────────────────
export async function generatePresentationImage(
  prompt: string,
  major?: string,
  topic?: string
): Promise<string> {
  const query = buildImageQuery(prompt, major, topic);
  
  // Try Pexels first (fast, reliable)
  const pexels = await fetchPexels(query);
  if (pexels) return pexels;
  
  // Fallback to Pollinations
  const pollinations = await fetchPollinations(prompt);
  if (pollinations) return pollinations;
  
  // Final fallback — branded placeholder
  return `https://placehold.co/1280x720/020617/22D3EE?text=${encodeURIComponent(query.slice(0, 20))}`;
}

// ── Custom image for Image Lab ────────────────────────────────────────────────
export async function generateCustomImage(prompt: string, style: string, width = 1280, height = 720): Promise<string> {
  // Try Pexels first
  const pexels = await fetchPexels(prompt);
  if (pexels) return pexels;
  
  // Pollinations with style
  const styles: Record<string, string> = {
    photorealistic: 'photorealistic, DSLR quality, cinematic, highly detailed',
    illustration: 'digital illustration, vibrant colors, clean lines, professional',
    infographic: 'clean infographic, flat design, professional, data visualization',
    technical: 'technical diagram, blueprint style, precise, schematic',
    abstract: 'abstract art, fluid shapes, gradient colors, modern, artistic',
    cinematic: 'cinematic still, film grain, dramatic lighting, movie quality',
    watercolor: 'watercolor painting, soft colors, artistic brushstrokes',
    '3d': '3D render, octane render, studio lighting, photorealistic materials',
  };
  const styleStr = styles[style] || styles.photorealistic;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${styleStr}`)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux&seed=${Math.random() * 99999 | 0}`;
}
