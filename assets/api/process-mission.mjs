/**
 * process-mission.mjs
 * Receives the assignment prompt + files from the frontend,
 * calls Gemini server-side (GEMINI_API_KEY never leaves the server),
 * returns the parsed JSON result.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI that produces complete, submission-ready solutions for ANY university assignment. You write authentically like a real student, never like an AI.

═══ ABSOLUTE RULES ═══
1. Return ONE valid JSON object only. Zero markdown outside JSON. Zero preamble. Nothing before the opening {. Nothing after the closing }.
2. NEVER truncate. NEVER use placeholders like "[add content here]". Every section must be fully written.
3. Write like a real student: engaged, earnest, occasionally imperfect. NOT like a textbook or AI assistant.
4. BANNED PHRASES: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "It is evident that", "In today's rapidly changing world", "Furthermore," as opener, "In conclusion, it can be said".
5. When lang=ar: ALL prose fields in Modern Standard Arabic (فصحى). Code, math, SQL, variable names stay in English.
6. Match the academic level: IGCSE/A-Level (clear, structured), IB (analytical), Year 1-2 (intro theory), Year 3-4 (critical analysis), Masters (rigorous, concise).
7. For math/physics/engineering/chemistry: always show full step-by-step working with LaTeX notation in the steps array AND in blocks of type "math".
8. For code: always include complete runnable code with comments in code_snippets. Never pseudocode unless explicitly asked.
9. For presentations: always generate exactly 10 slides minimum, never fewer. Every slide MUST have: power_heading, at least 5 content_bullets, narrative, speaker_notes, image_prompt.
10. For essays/reports: reconstructed_doc must have Introduction, 3+ body sections, Conclusion, References. Minimum 800 words.
11. LANGUAGE RULE: Detect the language of the [ASSIGNMENT] text. If English → respond in English. If Arabic → respond in Arabic.

═══ ASSIGNMENT TYPES ═══
essay | report | literature_review | case_study | lab_report | presentation | research_paper | math | physics | engineering | chemistry | biology | computer_science | data_analysis | sql_database | business_plan | financial_model | legal_brief | design_brief | architecture | psychology | sociology | history | economics | marketing | accounting | statistics | nursing | pharmacy | law | other

═══ JSON OUTPUT SCHEMA ═══
{
  "solution_text": "2-3 casual sentences summarizing what was done",
  "assignment_type": "type from list above",
  "reconstructed_doc": {
    "title": "Full assignment title",
    "word_count": 0,
    "blocks": [
      { "type": "heading", "content": "Section heading", "level": 1 },
      { "type": "paragraph", "content": "Full paragraph text" },
      { "type": "list", "content": "Item 1\nItem 2\nItem 3" },
      { "type": "math", "content": "LaTeX expression", "solution_steps": ["Step 1", "Step 2"] },
      { "type": "code", "content": "// code here", "language": "python" },
      { "type": "table", "headers": ["Col1","Col2"], "rows": [["v1","v2"]] },
      { "type": "svg", "content": "<svg>...</svg>" }
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "Punchy title",
      "content_bullets": ["Point 1","Point 2","Point 3","Point 4","Point 5"],
      "narrative": "2-3 sentences",
      "speaker_notes": "Full 60-90 second speech",
      "image_prompt": "Specific visual description",
      "image_layout": "left"
    }
  ],
  "data_sheet": { "sheet_name": "Name", "headers": ["Col1"], "rows": [["val"]] },
  "code_snippets": [{ "language": "python", "filename": "main.py", "code": "# code", "explanation": "desc" }],
  "steps": [{ "title": "Step 1", "content": "Full explanation" }]
}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseResponse(text) {
  if (!text || text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    throw new Error('RETRYABLE: HTML error page received');
  }
  let clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const first = clean.indexOf('{'), last = clean.lastIndexOf('}');
  if (first === -1) throw new Error('RETRYABLE: No JSON object in response');
  clean = clean.slice(first, last + 1);
  try { return JSON.parse(clean); } catch {}
  try { return JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); } catch {}
  throw new Error('Parse failed after cleanup');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).end(); }
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Netlify environment variables.' });
  }

  try {
    const { contents, lang } = req.body;
    if (!contents || !Array.isArray(contents)) {
      Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(400).json({ error: 'Missing contents array' });
    }

    const DELAYS = [8000, 20000];
    let result = null;
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(DELAYS[attempt - 1]);

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ role: 'user', parts: contents }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (geminiRes.status === 503 || geminiRes.status === 429) {
          lastError = `Gemini ${geminiRes.status}`;
          continue;
        }

        if (!geminiRes.ok) {
          const errBody = await geminiRes.text();
          lastError = `Gemini error ${geminiRes.status}: ${errBody.slice(0, 200)}`;
          if (attempt < 2) continue;
          throw new Error(lastError);
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        result = parseResponse(rawText);
        break;

      } catch (e) {
        lastError = e.message || '';
        const retryable = lastError.includes('RETRYABLE') || lastError.includes('503') || lastError.includes('429') || lastError.includes('unavailable');
        if (!retryable || attempt === 2) throw e;
      }
    }

    if (!result) throw new Error(lastError || 'AI failed after 3 attempts');

    // Fill defaults
    if (!result.solution_text) result.solution_text = '';
    if (!result.assignment_type) result.assignment_type = 'other';
    if (!result.reconstructed_doc) result.reconstructed_doc = { title: '', word_count: 0, blocks: [] };
    if (!result.reconstructed_doc.blocks) result.reconstructed_doc.blocks = [];
    if (!result.presentation_slides) result.presentation_slides = [];
    if (!result.code_snippets) result.code_snippets = [];
    if (!result.steps) result.steps = [];

    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(200).json(result);

  } catch (e) {
    console.error('process-mission error:', e.message);
    const isRetryable = e.message?.includes('503') || e.message?.includes('busy') || e.message?.includes('unavailable');
    Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v)); return res.status(isRetryable ? 503 : 500).json({ error: e.message || 'Mission failed. Please try again.' });
  }
};
