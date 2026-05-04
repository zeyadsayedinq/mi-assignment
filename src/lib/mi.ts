import { GoogleGenAI } from "@google/genai";
export { generateCustomImage, generatePresentationImage } from './pollinations';
import { generatePresentationImage } from './pollinations';

const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI that produces complete, submission-ready solutions for ANY university assignment. You write authentically like a real student, never like an AI.

═══ ABSOLUTE RULES ═══
1. Return ONE valid JSON object only. Zero markdown outside JSON. Zero preamble. Nothing before the opening {.
2. NEVER truncate. NEVER use placeholders like "[add content here]". Every section must be fully written.
3. Write like a real student: engaged, earnest, occasionally imperfect. NOT like a textbook or AI assistant.
4. BANNED PHRASES: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "It is evident that", "In today's rapidly changing world", "Furthermore," as opener, "In conclusion, it can be said".
5. When lang=ar: ALL prose fields in Modern Standard Arabic (فصحى). Code, math, SQL, variable names stay in English.
6. Match the academic level: IGCSE/A-Level (clear, structured), IB (analytical), Year 1-2 (intro theory), Year 3-4 (critical analysis), Masters (rigorous, concise).

═══ ASSIGNMENT TYPES (set assignment_type) ═══
essay | report | literature_review | case_study | lab_report | presentation | research_paper | math | physics | engineering | chemistry | biology | computer_science | data_analysis | sql_database | business_plan | financial_model | legal_brief | design_brief | architecture | psychology | sociology | history | economics | marketing | accounting | statistics | nursing | pharmacy | law | other

═══ JSON OUTPUT SCHEMA ═══
{
  "solution_text": "2-3 casual sentences summarizing what was done and key findings",
  "assignment_type": "type from the list above",
  "reconstructed_doc": {
    "title": "Full assignment title",
    "word_count": 0,
    "blocks": [
      {
        "type": "heading | paragraph | list | math | code | table | svg",
        "content": "Full text — NEVER truncated",
        "level": 1,
        "solution_steps": ["Step 1: ..."],
        "language": "python",
        "headers": ["Col1", "Col2"],
        "rows": [["val1", "val2"]]
      }
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "Punchy title",
      "content_bullets": ["Substantive point"],
      "narrative": "Speaker voice",
      "speaker_notes": "Verbatim speech",
      "image_prompt": "Hyper-specific visual description",
      "image_layout": "left | right | background | full"
    }
  ],
  "data_sheet": {
    "sheet_name": "Sheet name",
    "headers": ["Col1"],
    "rows": [["val1"]]
  },
  "code_snippets": [
    {
      "language": "python",
      "filename": "main.py",
      "code": "# Code",
      "explanation": "Desc"
    }
  ],
  "steps": [
    { "title": "Step 1", "content": "Desc" }
  ]
}`;

// ── Main export ──────────────────────────────────────────────────────────────
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
  
  // 1. Get User ID
  const userId = await (async () => {
    try {
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id;
    } catch { return null; }
  })();

  if (!userId) {
    throw new Error(lang === 'ar' ? 'لازم تسجل دخول الأول.' : 'Please sign in first.');
  }

  // 2. Check Quota via Backend
  const quotaResp = await fetch('/api/check-quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, lang }),
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
    throw new Error(err.error || 'Server busy');
  }

  // 3. Prepare Prompt
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

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  for (const file of files) {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const base64 = await fileToBase64(file);
      contents.push({
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      });
    } else {
      const text = await file.text();
      contents.push({ text: `[FILE: ${file.name}]\n${text}` });
    }
  }

  contents.push({ text: `[ASSIGNMENT] ${lang === 'ar' ? 'أجب باللغة العربية الفصحى. ' : ''}${prompt}` });

  // 4. Call Gemini directly from frontend
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const aiResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: contents },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  });

  const raw = aiResponse.text;
  if (!raw) throw new Error(lang === 'ar' ? 'فشل الذكاء الاصطناعي في الرد.' : 'AI failed to respond.');

  let result: any;
  try {
    result = JSON.parse(raw);
  } catch {
    // Fallback parser if JSON mode fails
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
    else throw new Error(lang === 'ar' ? 'خطأ في معالجة الرد.' : 'Error parsing response.');
  }

  // 4b. Record Mission via Backend (asynchronous)
  fetch('/api/record-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      result,
      files: files.map(f => ({ name: f.name })),
      prompt,
      university: universityContext,
      course: courseContext,
      missionType,
      lang
    }),
  }).catch(() => {});

  // 5. Generate Images
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
