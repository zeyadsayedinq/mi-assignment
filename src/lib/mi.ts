import { GoogleGenAI } from "@google/genai";
export { generateCustomImage, generatePresentationImage } from './pollinations';
import { generatePresentationImage } from './pollinations';

const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI that produces complete, submission-ready solutions for ANY university assignment. You write authentically like a real student, never like an AI.

═══ ABSOLUTE RULES ═══
1. Return ONE valid JSON object only. Zero markdown outside JSON. Zero preamble. Nothing before the opening {. Nothing after the closing }.
2. NEVER truncate. NEVER use placeholders like "[add content here]". Every section must be fully written.
3. Write like a real student: engaged, earnest, occasionally imperfect. NOT like a textbook or AI assistant.
4. BANNED PHRASES: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "It is evident that", "In today's rapidly changing world", "Furthermore," as opener, "In conclusion, it can be said".
5. When lang=ar: ALL prose fields in Modern Standard Arabic (فصحى). Code, math, SQL, variable names stay in English.
6. Match the academic level: IGCSE/A-Level (clear, structured), IB (analytical), Year 1-2 (intro theory), Year 3-4 (critical analysis), Masters (rigorous, concise).
7. For math/physics/engineering/chemistry: always show full step-by-step working with LaTeX notation in the steps array AND in reconstructed_doc blocks of type "math".
8. For code assignments: always include complete runnable code with comments in code_snippets. Never pseudocode unless explicitly asked.
9. For presentations: always generate exactly 10 slides minimum, never fewer. Every slide MUST have: power_heading (punchy, max 8 words), content_bullets (minimum 5 substantive points with data/evidence), narrative (2-3 sentences), speaker_notes (full 60-90 second speech), image_prompt (specific visual description). Never output a presentation with only 1 slide.
10b. For engineering/architecture/structural assignments: generate a detailed SVG technical drawing as a block of type "svg" showing the cross-section, reinforcement layout, dimensions, and labels in engineering notation. The SVG must: use viewBox="0 0 1000 400", include a title block, dimension lines with arrows, hatching for concrete (pattern of lines), reinforcement bars shown as filled circles or lines with labels (e.g. "3Ø16"), support symbols, and a scale bar. This replaces AutoCAD output — make it as detailed and professional as possible.
10c. For engineering/structural assignments: also generate a DXF-compatible text representation in a code block with language="dxf" showing the key entities (LINE, CIRCLE, TEXT) so it can be imported into AutoCAD. Format as valid minimal DXF with ENTITIES section.
10. For essays/reports: reconstructed_doc must have: title block, at minimum — Introduction, 3+ body sections with headings, Conclusion, References. Minimum 800 words for any essay.

═══ ASSIGNMENT TYPES (set assignment_type field) ═══
essay | report | literature_review | case_study | lab_report | presentation | research_paper | math | physics | engineering | chemistry | biology | computer_science | data_analysis | sql_database | business_plan | financial_model | legal_brief | design_brief | architecture | psychology | sociology | history | economics | marketing | accounting | statistics | nursing | pharmacy | law | other

═══ JSON OUTPUT SCHEMA — follow exactly ═══
{
  "solution_text": "2-3 sentences summarizing what was done and key findings. Casual student voice.",
  "assignment_type": "one type from the list above",
  "reconstructed_doc": {
    "title": "Full assignment title",
    "word_count": 0,
    "blocks": [
      {
        "type": "heading",
        "content": "Section heading text",
        "level": 1
      },
      {
        "type": "paragraph",
        "content": "Full paragraph text — NEVER truncated, NEVER a placeholder"
      },
      {
        "type": "list",
        "content": "Item 1\nItem 2\nItem 3"
      },
      {
        "type": "math",
        "content": "LaTeX expression or full solution block",
        "solution_steps": ["Step 1: state the formula", "Step 2: substitute values", "Step 3: solve"]
      },
      {
        "type": "code",
        "content": "// full runnable code here",
        "language": "python"
      },
      {
        "type": "table",
        "headers": ["Column 1", "Column 2", "Column 3"],
        "rows": [["val1", "val2", "val3"], ["val4", "val5", "val6"]]
      },
      {
        "type": "svg",
        "content": "<svg>...</svg>"
      }
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "Punchy, bold slide title",
      "content_bullets": ["Substantive point with detail", "Another key insight", "Supporting evidence or statistic", "Implication or application", "Memorable takeaway"],
      "narrative": "What this slide covers in 2-3 sentences",
      "speaker_notes": "Full verbatim text the presenter would say for 60-90 seconds",
      "image_prompt": "Hyper-specific photographic or illustrative description for AI image generation",
      "image_layout": "left | right | background | full"
    }
  ],
  "data_sheet": {
    "sheet_name": "Descriptive sheet name",
    "headers": ["Column 1", "Column 2"],
    "rows": [["value1", "value2"]]
  },
  "code_snippets": [
    {
      "language": "python",
      "filename": "main.py",
      "code": "# Complete runnable code with comments",
      "explanation": "What this code does and how to run it"
    },
    {
      "language": "dxf",
      "filename": "reinforcement_detail.dxf",
      "code": "0\nSECTION\n2\nENTITIES\n... DXF entities ...",
      "explanation": "AutoCAD-importable DXF file of the reinforcement detail"
    }
  ],
  "steps": [
    {
      "title": "Step title",
      "content": "Full explanation of this step with working shown"
    }
  ]
}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown code fences and extract the JSON object from any raw string */
function extractJSON(raw: string): string {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response from AI');

  // Remove markdown code fences: ```json ... ``` or ``` ... ```
  let clean = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // If the response starts with something before {, strip it
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('AI response did not contain a JSON object');
  }

  return clean.slice(firstBrace, lastBrace + 1);
}

/** Attempt JSON.parse with fallback sanitization for common Gemini quirks */
function robustParse(raw: string, lang: string): any {
  const extracted = extractJSON(raw);

  // First attempt: direct parse
  try {
    return JSON.parse(extracted);
  } catch {}

  // Second attempt: fix unescaped newlines inside string values
  try {
    const fixed = extracted
      .replace(/(?<=":[ ]*"[^"]*)\n(?=[^"]*")/g, '\\n')
      .replace(/\t/g, '\\t');
    return JSON.parse(fixed);
  } catch {}

  // Third attempt: use regex to extract the largest valid JSON-like structure
  try {
    // Remove any trailing commas before } or ]
    const noTrailingCommas = extracted
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(noTrailingCommas);
  } catch (e: any) {
    throw new Error(
      lang === 'ar'
        ? `خطأ في معالجة رد الذكاء الاصطناعي: ${e.message}`
        : `Failed to parse AI response: ${e.message}`
    );
  }
}

/** Detect if the response text is an error page or non-JSON (e.g. HTML from a 503) */
function isErrorResponse(text: string): boolean {
  if (!text) return true;
  const t = text.trim();
  // HTML error pages
  if (t.startsWith('<!') || t.startsWith('<html') || t.startsWith('<HTML')) return true;
  // Plain error strings
  if (t.startsWith('Error:') || t.startsWith('error:')) return true;
  // Must start with { to be our JSON
  if (!t.startsWith('{') && !t.includes('{')) return true;
  return false;
}

/** Sleep for ms milliseconds */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Language auto-detection from prompt content ─────────────────────────────
// Detects whether the user's prompt is primarily Arabic or English,
// regardless of what the UI language is set to.
function detectPromptLanguage(prompt: string, files: File[]): 'ar' | 'en' {
  if (!prompt && files.length === 0) return 'en';
  // Count Arabic Unicode characters in the prompt
  const arabicChars = (prompt.match(/[؀-ۿݐ-ݿࢠ-ࣿ]/g) || []).length;
  const totalChars = prompt.replace(/\s/g, '').length;
  // If >20% of non-space chars are Arabic → respond in Arabic
  if (totalChars > 0 && arabicChars / totalChars > 0.20) return 'ar';
  return 'en';
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
  // Language is detected from the PROMPT content, not the UI language setting.
  // This ensures an English assignment always gets an English solution,
  // even if the user has the app in Arabic mode.
  const uiLang = langContext || localStorage.getItem('mi_lang') || 'en';
  const promptLang = detectPromptLanguage(prompt, files);
  // promptLang takes priority — only use UI lang as fallback for empty prompts
  const lang = (prompt && prompt.trim().length > 10) ? promptLang : uiLang;

  // 1. Get User ID + email (single session call)
  const session = await (async () => {
    try {
      const { supabase } = await import('./supabase');
      const { data: { session: s } } = await supabase.auth.getSession();
      return s;
    } catch { return null; }
  })();

  const userId = session?.user?.id;
  const userEmail = session?.user?.email || null;

  if (!userId) {
    throw new Error(lang === 'ar' ? 'لازم تسجل دخول الأول.' : 'Please sign in first.');
  }

  // 2. Check Quota via Backend
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

  // 3. Prepare Prompt contents
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
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  for (const file of files) {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const base64 = await fileToBase64(file);
      contents.push({ inlineData: { data: base64, mimeType: file.type } });
    } else {
      const text = await file.text();
      contents.push({ text: `[FILE: ${file.name}]\n${text}` });
    }
  }

  contents.push({
    text: `[ASSIGNMENT] ${lang === 'ar' ? 'أجب باللغة العربية الفصحى. ' : ''}${prompt}`,
  });

  // 4. Call Gemini with retry on 503 / transient errors
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

  let lastError: Error = new Error('Unknown error');
  let raw: string | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retrying
        await sleep(RETRY_DELAYS[attempt - 1]);
      }

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: contents },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });

      raw = aiResponse.text ?? null;

      // Detect 503 / HTML error pages returned as "text"
      if (!raw || isErrorResponse(raw)) {
        const errMsg = raw ? raw.substring(0, 200) : 'Empty response';
        throw new Error(`AI service temporarily unavailable (attempt ${attempt + 1}). ${errMsg}`);
      }

      // Got a real response — break out of retry loop
      break;

    } catch (err: any) {
      lastError = err;

      // Detect retryable errors: 503, UNAVAILABLE, rate limit, network errors
      const msg = (err.message || '').toLowerCase();
      const isRetryable =
        msg.includes('503') ||
        msg.includes('unavailable') ||
        msg.includes('high demand') ||
        msg.includes('rate limit') ||
        msg.includes('quota') ||
        msg.includes('temporarily') ||
        msg.includes('network') ||
        msg.includes('fetch');

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        // Non-retryable or exhausted retries
        throw new Error(
          lang === 'ar'
            ? `فشل الذكاء الاصطناعي بعد ${attempt + 1} محاولات: ${err.message}`
            : `AI failed after ${attempt + 1} attempt${attempt > 0 ? 's' : ''}: ${err.message}`
        );
      }

      // Retryable — continue loop
      console.warn(`Mi retry ${attempt + 1}/${MAX_RETRIES} after: ${err.message}`);
      raw = null;
    }
  }

  if (!raw) {
    throw new Error(
      lang === 'ar'
        ? 'فشل الذكاء الاصطناعي في الاستجابة بعد عدة محاولات. حاول مرة أخرى.'
        : 'AI failed to respond after multiple attempts. Please try again.'
    );
  }

  // 5. Parse JSON response robustly
  const result = robustParse(raw, lang);

  // 6. Validate minimum structure — fill defaults if missing
  if (!result.solution_text) result.solution_text = '';
  if (!result.assignment_type) result.assignment_type = missionType || 'other';
  if (!result.reconstructed_doc) {
    result.reconstructed_doc = { title: prompt.substring(0, 80), word_count: 0, blocks: [] };
  }
  if (!result.reconstructed_doc.blocks) result.reconstructed_doc.blocks = [];
  if (!result.presentation_slides) result.presentation_slides = [];
  if (!result.code_snippets) result.code_snippets = [];
  if (!result.steps) result.steps = [];

  // 7. Record Mission (fire-and-forget, never blocks the UI)
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
      lang,
    }),
  }).catch(() => {});

  // 8. Generate Presentation Images (parallel, non-blocking per slide)
  if (result.presentation_slides?.length) {
    await Promise.allSettled(
      result.presentation_slides.map(async (slide: any) => {
        if (slide.image_prompt) {
          try {
            slide.image_url = await generatePresentationImage(slide.image_prompt);
          } catch {
            slide.image_url = null;
          }
        }
      })
    );
  }

  return result;
}
