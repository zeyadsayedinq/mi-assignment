// mi.ts — Mi-Assignment AI Library
// All AI calls go through Netlify Functions (/api/process-mission)
// which try Anthropic Claude first, then Gemini as fallback
// No backend server needed — runs serverlessly on Netlify

export { generateCustomImage, generatePresentationImage } from './pollinations';
import { generatePresentationImage } from './pollinations';

export async function processMission(
  files: File[],
  prompt: string,
  universityContext?: string,
  courseContext?: string,
  systemContext?: string,
  referenceContext?: string,
  missionType?: string,
  langContext?: string
) {
  const lang = langContext || localStorage.getItem('mi_lang') || 'en';

  // Get userId from Supabase session
  let userId: string | null = null;
  try {
    const sbKey = Object.keys(localStorage).find(k => k.endsWith('-auth-token') && k.startsWith('sb-'));
    if (sbKey) userId = JSON.parse(localStorage.getItem(sbKey) || '{}')?.user?.id || null;
  } catch {}

  // Convert files to base64
  const filePayloads = await Promise.all(
    files.map(async (file) => {
      if (file.name.endsWith('.docx')) {
        try {
          const mammoth = (await import('mammoth')).default;
          const arrayBuffer = await file.arrayBuffer();
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          return { name: file.name, type: 'text/plain', data: btoa(unescape(encodeURIComponent(value))), isText: true };
        } catch {
          return { name: file.name, type: 'text/plain', data: btoa('Could not parse docx'), isText: true };
        }
      }
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv)$/i)) {
        const text = await file.text();
        return { name: file.name, type: 'text/plain', data: btoa(unescape(encodeURIComponent(text))), isText: true };
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      return { name: file.name, type: file.type || 'application/octet-stream', data: base64.includes(',') ? base64.split(',')[1] : base64 };
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
    const contentType = response.headers.get('content-type') || '';
    let err: any = {};
    if (contentType.includes('application/json')) {
      err = await response.json().catch(() => ({}));
    }

    if (err.error === 'LIMIT_REACHED' || response.status === 402) {
      const e: any = new Error(err.message || 'Limit reached');
      e.code = 'LIMIT_REACHED'; e.plan = err.plan; e.limit = err.limit; e.missionsUsed = err.missionsUsed;
      throw e;
    }
    if (response.status === 429) throw new Error(lang === 'ar' ? 'الخادم مشغول. حاول بعد ٣٠ ثانية.' : 'Server busy. Retry in 30 seconds.');
    if (response.status === 503) throw new Error(lang === 'ar' ? 'خدمة الذكاء الاصطناعي غير متاحة. تأكد من إضافة GEMINI_API_KEY في Netlify.' : 'AI service unavailable. Add GEMINI_API_KEY to Netlify environment variables.');
    throw new Error(err.error || `Error ${response.status}. Please retry.`);
  }

  const data = await response.json();

  // Generate slide images via Pollinations (free)
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
