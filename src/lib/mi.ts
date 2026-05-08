import { generateCustomImage, generatePresentationImage } from './pollinations';
export { generateCustomImage, generatePresentationImage };

// ── Main export ───────────────────────────────────────────────────────────────
// The Gemini API key lives ONLY in the Netlify Function (process-mission.mjs).
// This file builds the payload and sends it to /api/process-mission.
// Nothing here gets baked into the browser bundle.

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

  // 1. Get User ID + email
  const { userId, userEmail } = await (async () => {
    try {
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      return { userId: session?.user?.id, userEmail: session?.user?.email || null };
    } catch { return { userId: null, userEmail: null }; }
  })();

  if (!userId) {
    throw new Error(lang === 'ar' ? 'لازم تسجل دخول الأول.' : 'Please sign in first.');
  }

  // 2. Check Quota
  const quotaResp = await fetch('/api/check-quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email: userEmail, lang }),
  });

  if (!quotaResp.ok) {
    const err = await quotaResp.json().catch(() => ({}));
    if (quotaResp.status === 402) {
      const e = new Error(err.message || 'Limit reached');
      (e as any).code = 'LIMIT_REACHED';
      (e as any).plan = err.plan;
      (e as any).limit = err.limit;
      (e as any).missionsUsed = err.missionsUsed;
      throw e;
    }
    throw new Error(err.error || 'Server busy. Please try again.');
  }

  // 3. Build contents array for Gemini
  const ctx = [
    universityContext && `University: ${universityContext}`,
    courseContext     && `Course: ${courseContext}`,
    systemContext     && `Academic System: ${systemContext}`,
    referenceContext  && `Reference Style: ${referenceContext}`,
    missionType       && `Assignment Type: ${missionType}`,
    lang === 'ar'     && 'Language: Arabic — ALL prose must be in Modern Standard Arabic (فصحى). Code/math stay in English.',
  ].filter(Boolean).join(' | ');

  const contents: any[] = [];
  if (ctx) contents.push({ text: `[CONTEXT] ${ctx}` });

  for (const file of files) {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      contents.push({ inlineData: { data: base64, mimeType: file.type } });
    } else {
      contents.push({ text: `[FILE: ${file.name}]\n${await file.text()}` });
    }
  }

  contents.push({ text: `[ASSIGNMENT] ${prompt}` });

  // 4. Call Netlify Function (Gemini runs server-side there)
  const missionResp = await fetch('/api/process-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, lang, userId }),
  });

  if (!missionResp.ok) {
    const err = await missionResp.json().catch(() => ({}));
    const msg = err.error || '';
    if (missionResp.status === 503 || msg.includes('busy') || msg.includes('unavailable')) {
      throw new Error(lang === 'ar' ? 'الخدمة مشغولة مؤقتاً. حاول مرة أخرى.' : 'AI service busy. Please try again in a moment.');
    }
    throw new Error(msg || `Mission failed (${missionResp.status})`);
  }

  const result = await missionResp.json();

  // 5. Record mission (fire-and-forget)
  fetch('/api/record-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, result, files: files.map(f => ({ name: f.name })), prompt, university: universityContext, course: courseContext, missionType, lang }),
  }).catch(() => {});

  // 6. Generate presentation images
  if (result.presentation_slides?.length) {
    await Promise.allSettled(
      result.presentation_slides.map(async (slide: any) => {
        if (slide.image_prompt) {
          try { slide.image_url = await generatePresentationImage(slide.image_prompt); }
          catch { slide.image_url = null; }
        }
      })
    );
  }

  return result;
}
