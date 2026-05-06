// pollinations.ts — Free AI image generation (Pollinations.ai, no API key)

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generatePresentationImage(prompt: string): Promise<string> {
  const enhanced = `${prompt}, professional, cinematic lighting, high quality, 4k, detailed`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?model=flux&width=1280&height=720&nologo=true&seed=${Math.random() * 99999 | 0}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    return await blobToBase64(blob);
  } catch {
    clearTimeout(timeout);
    return `https://placehold.co/1280x720/020617/22D3EE?text=AI+Visual`;
  }
}

export async function generateCustomImage(prompt: string, style: string, width = 1280, height = 720): Promise<string> {
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
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${styleStr}`)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux&seed=${Math.random() * 99999 | 0}`;
  return url;
}
