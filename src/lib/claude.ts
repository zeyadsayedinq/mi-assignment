// claude.ts — MI-CORE Frontend AI Library
// Calls the local Express server proxy which calls Claude API securely server-side.

import { generatePresentationImage as fetchImage } from './pollinations';
export { generateCustomImage } from './pollinations';

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
    const topic = data.reconstructed_doc?.title || data.payload_name || '';
    const domain = data.domain || '';
    await Promise.allSettled(
      data.presentation_slides.map(async (slide: any) => {
        if (slide.image_prompt) {
          try { slide.image_url = await fetchImage(slide.image_prompt, domain, topic); }
          catch { slide.image_url = null; }
        }
      })
    );
  }

  return data;
}
