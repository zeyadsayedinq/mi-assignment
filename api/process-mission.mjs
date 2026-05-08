const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI that produces complete, submission-ready solutions for ANY university assignment. You write authentically like a real student, never like an AI.

═══ ABSOLUTE RULES ═══
1. Return ONE valid JSON object only. Zero markdown outside JSON. Zero preamble. Nothing before the opening {. Nothing after the closing }.
2. NEVER truncate. NEVER use placeholders. Every section must be fully written.
3. Write like a real student: engaged, earnest, occasionally imperfect. NOT like a textbook.
4. BANNED PHRASES: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "It is evident that", "In today's rapidly changing world".
5. When lang=ar: ALL prose in Modern Standard Arabic (فصحى). Code/math stay in English.
6. LANGUAGE RULE: Detect the language of [ASSIGNMENT] text. English prompt → English response. Arabic prompt → Arabic response.
7. For math/physics/engineering: full step-by-step working with LaTeX in steps array and math blocks.
8. For code: complete runnable code with comments. Never pseudocode.
9. For presentations: exactly 10 slides minimum, never fewer. Every slide needs power_heading, 5+ content_bullets, narrative, speaker_notes, image_prompt.
10. For essays: Introduction, 3+ body sections, Conclusion, References. Minimum 800 words.

═══ JSON OUTPUT SCHEMA ═══
{
  "solution_text": "2-3 casual sentences summarizing what was done",
  "assignment_type": "essay|report|case_study|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|lab_report|literature_review|other",
  "reconstructed_doc": {
    "title": "Full title",
    "word_count": 0,
    "blocks": [
      { "type": "heading", "content": "text", "level": 1 },
      { "type": "paragraph", "content": "full text" },
      { "type": "list", "content": "Item 1\nItem 2" },
      { "type": "math", "content": "LaTeX", "solution_steps": ["Step 1"] },
      { "type": "code", "content": "// code", "language": "python" },
      { "type": "table", "headers": ["Col1"], "rows": [["val"]] },
      { "type": "svg", "content": "<svg>...</svg>" }
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "Title",
      "content_bullets": ["Point 1","Point 2","Point 3","Point 4","Point 5"],
      "narrative": "2-3 sentences",
      "speaker_notes": "Full speech 60-90 seconds",
      "image_prompt": "Specific visual",
      "image_layout": "left"
    }
  ],
  "data_sheet": { "sheet_name": "Name", "headers": ["Col"], "rows": [["val"]] },
  "code_snippets": [{ "language": "python", "filename": "main.py", "code": "# code", "explanation": "desc" }],
  "steps": [{ "title": "Step 1", "content": "Full working shown" }]
}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseResponse(text) {
  if (!text || text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    throw new Error('RETRYABLE');
  }
  let clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const first = clean.indexOf('{'), last = clean.lastIndexOf('}');
  if (first === -1) throw new Error('RETRYABLE');
  clean = clean.slice(first, last + 1);
  try { return JSON.parse(clean); } catch {}
  try { return JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); } catch (e) {
    throw new Error('Parse failed: ' + e.message);
  }
}


async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body; // already parsed
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // Try all possible env var names for the Gemini key
  const GEMINI_KEY =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (!GEMINI_KEY) {
    return res.status(500).json({
      error: 'Gemini API key not configured. Add GEMINI_API_KEY to Vercel environment variables.',
    });
  }

  try {
    const { contents, lang } = await parseBody(req);
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Missing contents array' });
    }

    const DELAYS = [8000, 20000];
    let result = null;
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(DELAYS[attempt - 1]);

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: [{ role: 'user', parts: contents }],
              generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
            }),
          }
        );

        if (geminiRes.status === 503 || geminiRes.status === 429) {
          lastError = `Gemini ${geminiRes.status}`;
          if (attempt < 2) continue;
          return res.status(503).json({ error: 'AI service busy. Please try again in a moment.' });
        }

        if (!geminiRes.ok) {
          const errBody = await geminiRes.text();
          lastError = `Gemini error ${geminiRes.status}`;
          console.error('Gemini error:', errBody.slice(0, 300));
          if (attempt < 2) continue;
          return res.status(500).json({ error: 'AI request failed. Please try again.' });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        result = parseResponse(rawText);
        break;

      } catch (e) {
        lastError = e.message || '';
        const retryable = lastError.includes('RETRYABLE') || lastError.includes('503') || lastError.includes('429');
        if (!retryable || attempt === 2) throw e;
      }
    }

    if (!result) return res.status(503).json({ error: lastError || 'AI failed after 3 attempts. Please try again.' });

    if (!result.solution_text) result.solution_text = '';
    if (!result.assignment_type) result.assignment_type = 'other';
    if (!result.reconstructed_doc) result.reconstructed_doc = { title: '', word_count: 0, blocks: [] };
    if (!result.reconstructed_doc.blocks) result.reconstructed_doc.blocks = [];
    if (!result.presentation_slides) result.presentation_slides = [];
    if (!result.code_snippets) result.code_snippets = [];
    if (!result.steps) result.steps = [];

    return res.status(200).json(result);

  } catch (e) {
    console.error('process-mission error:', e.message);
    return res.status(500).json({ error: e.message || 'Mission failed. Please try again.' });
  }
}
