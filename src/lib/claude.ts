// claude.ts — MI-CORE Frontend AI Library
// Calls the local Express server proxy which calls Claude API securely server-side.

export async function generatePresentationImage(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(`${prompt}, cinematic lighting, highly detailed, 8K quality, professional photography`);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&enhance=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url; // fallback to direct URL
  }
}

export async function generateCustomImage(prompt: string, style: string, width = 1280, height = 720): Promise<string> {
  const styleMap: Record<string, string> = {
    photorealistic: 'photorealistic, DSLR quality, cinematic, highly detailed',
    illustration: 'digital illustration, vibrant colors, clean lines, professional design',
    infographic: 'clean infographic style, flat design, professional, data visualization',
    technical: 'technical diagram, blueprint style, precise, schematic, professional',
    abstract: 'abstract art, fluid shapes, gradient colors, modern, artistic',
    cinematic: 'cinematic still, film grain, dramatic lighting, movie quality',
    watercolor: 'watercolor painting, soft colors, artistic brushstrokes, beautiful',
    '3d': '3D render, octane render, studio lighting, photorealistic materials',
  };
  const styleStr = styleMap[style] || styleMap.photorealistic;
  const encoded = encodeURIComponent(`${prompt}, ${styleStr}`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`;
}

export async function processMission(
  files: File[],
  prompt: string,
  universityContext?: string,
  courseContext?: string,
  systemContext?: string,
  referenceContext?: string,
  missionType?: string
) {
  const lang = localStorage.getItem('mi_lang') || 'en';
  const userId = (() => {
    try {
      const raw = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      return raw ? JSON.parse(raw)?.user?.id : null;
    } catch { return null; }
  })();

  // Convert files to base64
  const filePayloads = await Promise.all(
    files.map(async (file) => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      });
      return {
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: base64.includes(',') ? base64.split(',')[1] : base64,
      };
    })
  );

  const response = await fetch('/api/process-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: filePayloads,
      prompt,
      university: universityContext,
      course: courseContext,
      system: systemContext,
      reference: referenceContext,
      missionType,
      userId,
      lang,
    }),
  });

  if (!response.ok) {
    const err: any = await response.json().catch(() => ({}));
    let msg = err.error || `Server error ${response.status}`;
    if (response.status === 429) msg = lang === 'ar' ? 'الخادم مشغول. حاول بعد ٣٠ ثانية.' : 'Server busy. Retry in 30 seconds.';
    if (response.status === 402) msg = err.message || (lang === 'ar' ? 'وصلت للحد المجاني. اشترك في برو.' : 'Free limit reached. Upgrade to Pro.');
    if (response.status === 400 && msg.includes('API_KEY')) msg = lang === 'ar' ? 'MI-CORE غير متصل. GEMINI_API_KEY مش متضاف.' : 'MI-CORE offline: GEMINI_API_KEY not configured.';
    throw new Error(msg);
  }

  const data = await response.json();

  // Generate images for all presentation slides in parallel
  if (data.presentation_slides?.length) {
    await Promise.allSettled(
      data.presentation_slides.map(async (slide: any) => {
        if (slide.image_prompt) {
          try { slide.image_url = await generatePresentationImage(slide.image_prompt); }
          catch { slide.image_url = null; }
        }
      })
    );
  }

  return data;
}
