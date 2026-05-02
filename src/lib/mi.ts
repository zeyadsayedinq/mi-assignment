export { generateCustomImage, generatePresentationImage } from './pollinations';
import { generatePresentationImage } from './pollinations';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyB3G6AZhRi1uE34qLcljO6KUlhlR1F_H20';
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY   || '';
const XAI_KEY    = import.meta.env.VITE_XAI_API_KEY    || '';

const SYSTEM_PROMPT = `You are Mi-Assignment — an academic AI that produces complete, submission-ready solutions for ANY university assignment. Output reads like a real student wrote it.

ABSOLUTE RULES:
1. Return ONE valid JSON object ONLY. No markdown fences. Nothing before {. Nothing after }.
2. NEVER truncate. NEVER use placeholders like "[add content here]". Write everything fully.
3. Write like a real student. BANNED: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "In conclusion it can be said".
4. When lang=ar: ALL prose fields in Modern Standard Arabic (فصحى). Code, math, SQL stay in English.
5. SOLVE the assignment directly. Never describe or summarize what was given.
6. For chemistry: balance equations step by step. For math: show every calculation. For code: write complete runnable files.

ASSIGNMENT TYPES: essay|report|literature_review|case_study|lab_report|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|financial_model|legal_brief|design_brief|other

JSON SCHEMA (use only fields relevant to assignment type):
{"solution_text":"2-3 sentence summary","assignment_type":"type from list above","reconstructed_doc":{"title":"","word_count":0,"blocks":[{"type":"heading|paragraph|list|math|code|table","content":"full text — never truncated","level":1,"solution_steps":["Step 1: ...","Step 2: ..."]}]},"presentation_slides":[{"power_heading":"punchy title","content_bullets":["real substantive point"],"narrative":"student speaker voice","speaker_notes":"verbatim script","image_prompt":"detailed visual description","image_layout":"left|right|background|full"}],"data_sheet":{"sheet_name":"","headers":[],"rows":[]},"code_snippets":[{"language":"","filename":"","code":"complete runnable code","explanation":""}],"steps":[{"title":"","content":""}]}`;

// ── Gemini ──────────────────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastError = '';
  for (const model of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_KEY },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );
      if (resp.status === 429) {
        // Wait 5 seconds then try next model
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      if (!resp.ok) { lastError = `Gemini ${resp.status}`; continue; }
      const data: any = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return text;
    } catch (e: any) { lastError = e.message; continue; }
  }
  throw new Error(lastError || 'Gemini unavailable');
}

// ── xAI ─────────────────────────────────────────────────────────────────────
async function callXAI(prompt: string): Promise<string> {
  const resp = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 8000,
    }),
  });
  if (!resp.ok) throw new Error(`xAI ${resp.status}`);
  const data: any = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ── Groq ─────────────────────────────────────────────────────────────────────
async function callGroq(prompt: string): Promise<string> {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 8000,
    }),
  });
  if (!resp.ok) throw new Error(`Groq ${resp.status}`);
  const data: any = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ── JSON parser ──────────────────────────────────────────────────────────────
function parseJSON(raw: string): any {
  // Strip markdown fences
  let cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  // Find first { and last }
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON in response. Please retry.');
  cleaned = cleaned.substring(first, last + 1);
  try { return JSON.parse(cleaned); }
  catch { throw new Error('Could not parse AI response. Please retry.'); }
}

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

  // ── Build context string ──
  const ctx = [
    universityContext && `University: ${universityContext}`,
    courseContext     && `Course: ${courseContext}`,
    systemContext     && `Academic System: ${systemContext}`,
    referenceContext  && `Reference Style: ${referenceContext}`,
    missionType       && `Assignment Type: ${missionType}`,
    lang === 'ar'     && 'Language: Arabic — ALL prose must be in Modern Standard Arabic (فصحى). Code/math stay in English.',
  ].filter(Boolean).join(' | ');

  // ── Extract file content ──
  let fileContent = '';
  for (const file of files) {
    try {
      if (file.name.match(/\.docx$/i)) {
        const { default: mammoth } = await import('mammoth');
        const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        fileContent += `\n[FILE: ${file.name}]\n${value}\n`;
      } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv|sql|py|js|ts|html|css|java|cpp|c|r|json|xml)$/i)) {
        fileContent += `\n[FILE: ${file.name}]\n${await file.text()}\n`;
      } else if (file.name.match(/\.pdf$/i)) {
        fileContent += `\n[FILE: ${file.name} — PDF. Extract all text, equations, tables and solve based on the content.]\n`;
      } else if (file.type.startsWith('image/')) {
        fileContent += `\n[IMAGE: ${file.name} — Analyze the image content and solve the assignment shown in it.]\n`;
      }
    } catch {}
  }

  const fullPrompt = [
    ctx          && `[CONTEXT] ${ctx}`,
    fileContent  && `[UPLOADED FILES]${fileContent}`,
    `[ASSIGNMENT TO SOLVE] ${lang === 'ar' ? 'أجب باللغة العربية الفصحى. ' : ''}${prompt}`,
  ].filter(Boolean).join('\n\n');

  // ── Call AI — Gemini first, then xAI, then Groq ──
  let raw = '';
  const errors: string[] = [];

  if (GEMINI_KEY) {
    try { raw = await callGemini(fullPrompt); }
    catch (e: any) { errors.push(`Gemini: ${e.message}`); }
  }
  if (!raw && XAI_KEY) {
    try { raw = await callXAI(fullPrompt); }
    catch (e: any) { errors.push(`xAI: ${e.message}`); }
  }
  if (!raw && GROQ_KEY) {
    try { raw = await callGroq(fullPrompt); }
    catch (e: any) { errors.push(`Groq: ${e.message}`); }
  }

  if (!raw) {
    const isRateLimit = errors.some(e => e.includes('429'));
    throw new Error(
      isRateLimit
        ? (lang === 'ar' ? 'الخادم مشغول. انتظر ٣٠ ثانية وحاول تاني.' : 'AI is busy (rate limit). Wait 30 seconds and retry.')
        : (lang === 'ar' ? 'فشل الاتصال بالذكاء الاصطناعي. حاول تاني.' : `AI call failed. Please retry. (${errors.join(' | ')})`)
    );
  }

  const result = parseJSON(raw);

  // ── Generate slide images via Pollinations ──
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

  // ── Save to Supabase missions table ──
  try {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      await supabase.from('missions').insert({
        user_id: userId,
        payload_name: files.length > 0 ? files[0].name : prompt.substring(0, 80),
        university: universityContext || null,
        course: courseContext || null,
        assignment_type: result.assignment_type || 'other',
        status: 'SUCCESS',
        summary: result.solution_text?.substring(0, 300) || '',
        solution_data: result,
        lang,
      });
    }
  } catch {}

  return result;
}
