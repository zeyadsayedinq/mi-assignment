// mi.ts — Mi-Assignment AI Library
// Calls Groq API directly from browser (CORS enabled, free)
// Falls back to Gemini if Groq key not set

export { generateCustomImage, generatePresentationImage } from './pollinations';
import { generatePresentationImage } from './pollinations';

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const XAI_KEY = import.meta.env.VITE_XAI_API_KEY || '';

const SYSTEM_PROMPT = `You are Mi-Assignment — an academic AI that solves any university assignment with output that reads like a real student wrote it, not an AI.

RULES:
1. Return ONE valid JSON object only. Zero markdown. Zero preamble. Nothing before {.
2. Complete assignments FULLY. Never truncate. Never use placeholders.
3. Write like a real student. AVOID: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging".
4. When lang=ar: ALL prose in Modern Standard Arabic (فصحى). Code/math in English.
5. CRITICAL: Read the assignment carefully and solve EXACTLY what is asked. For chemistry: balance equations, show calculations. For math: solve step by step. For essays: write about the exact topic given.
6. NEVER describe what was given to you. SOLVE it directly.

TYPES: essay|report|literature_review|case_study|lab_report|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|financial_model|legal_brief|design_brief|other

JSON SCHEMA:
{"solution_text":"2-3 summary sentences","assignment_type":"type","reconstructed_doc":{"title":"","word_count":0,"blocks":[{"type":"heading|paragraph|list|math|code|table","content":"","level":1,"solution_steps":[]}]},"presentation_slides":[{"power_heading":"","content_bullets":[],"narrative":"","speaker_notes":"","image_prompt":"","image_layout":"left"}],"data_sheet":{"sheet_name":"","headers":[],"rows":[]},"code_snippets":[{"language":"","filename":"","code":"","explanation":""}],"steps":[{"title":"","content":""}]}`;

async function callGroq(prompt: string): Promise<string> {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });
  if (!resp.ok) {
    const err: any = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${resp.status}`);
  }
  const data: any = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt: string): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  for (const model of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );
      if (resp.ok) {
        const data: any = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      }
    } catch { continue; }
  }
  throw new Error('Gemini unavailable');
}

async function callXAI(prompt: string): Promise<string> {
  const resp = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });
  if (!resp.ok) {
    const err: any = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `xAI error ${resp.status}`);
  }
  const data: any = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

function parseJSON(raw: string): any {
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const first = raw.indexOf('{'), last = raw.lastIndexOf('}');
    if (first !== -1 && last > first) {
      try { return JSON.parse(raw.substring(first, last + 1)); } catch {}
    }
    throw new Error('Could not parse AI response. Please retry.');
  }
}

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

  if (!GROQ_KEY && !GEMINI_KEY && !XAI_KEY) {
    throw new Error(lang === 'ar'
      ? 'لم يتم إعداد خدمة الذكاء الاصطناعي. أضف VITE_GROQ_API_KEY في Netlify.'
      : 'AI service not configured. Add VITE_GROQ_API_KEY to Netlify environment variables.');
  }

  // Build context
  const ctx = [
    universityContext && `University: ${universityContext}`,
    courseContext && `Course: ${courseContext}`,
    systemContext && `Academic System: ${systemContext}`,
    referenceContext && `Reference Style: ${referenceContext}`,
    missionType && `Assignment Type: ${missionType}`,
    lang === 'ar' && 'Language: Arabic — respond in Modern Standard Arabic (فصحى). Code/math in English.',
  ].filter(Boolean).join(' | ');

  // Convert files to text (Groq/Gemini browser calls don't support binary uploads easily)
  let fileContent = '';
  for (const file of files) {
    try {
      if (file.name.endsWith('.docx')) {
        const mammoth = (await import('mammoth')).default;
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        fileContent += `\n[FILE: ${file.name}]\n${value}\n`;
      } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|sql|py|js|ts|html|css|java|cpp|c|r)$/i)) {
        const text = await file.text();
        fileContent += `\n[FILE: ${file.name}]\n${text}\n`;
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        fileContent += `\n[FILE: ${file.name} — PDF attached, extract and use all content]\n`;
      } else {
        fileContent += `\n[FILE: ${file.name} — incorporate this file's content in your solution]\n`;
      }
    } catch {}
  }

  const fullPrompt = [
    ctx && `[CONTEXT] ${ctx}`,
    fileContent && `[FILES]${fileContent}`,
    `[MISSION] ${lang === 'ar' ? 'أجب باللغة العربية الفصحى في جميع حقول النص. ' : ''}${prompt}`,
  ].filter(Boolean).join('\n\n');

  // Try AI providers in order — Gemini first (best quality free option)
  let raw = '';
  if (GEMINI_KEY) {
    try { raw = await callGemini(fullPrompt); } catch {}
  }
  if (!raw && XAI_KEY) {
    try { raw = await callXAI(fullPrompt); } catch {}
  }
  if (!raw && GROQ_KEY) {
    try { raw = await callGroq(fullPrompt); } catch {}
  }
  if (!raw) throw new Error(lang === 'ar' ? 'فشل الاتصال بالذكاء الاصطناعي. حاول تاني.' : 'AI call failed. Please retry.');

  const result = parseJSON(raw);

  // Generate slide images
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

  // Save to vault
  try {
    const sbKey = Object.keys(localStorage).find(k => k.endsWith('-auth-token') && k.startsWith('sb-'));
    const userId = sbKey ? JSON.parse(localStorage.getItem(sbKey) || '{}')?.user?.id : null;
    const vaultKey = `mi_vault_${userId || 'anon'}`;
    const existing = JSON.parse(localStorage.getItem(vaultKey) || '[]');
    const entry = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      payload_name: files.length > 0 ? files[0].name : prompt.substring(0, 60),
      university: universityContext || '',
      course: courseContext || '',
      assignment_type: result.assignment_type || 'other',
      status: 'SUCCESS',
      summary: result.solution_text?.substring(0, 300) || '',
      solution_data: result,
      lang,
    };
    localStorage.setItem(vaultKey, JSON.stringify([entry, ...existing].slice(0, 100)));
  } catch {}

  return result;
}
