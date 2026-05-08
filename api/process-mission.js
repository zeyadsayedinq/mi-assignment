const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI that produces complete, submission-ready solutions for ANY university assignment. You write authentically like a real student, never like an AI.

RULES:
1. Return ONE valid JSON object only. Nothing before {. Nothing after }.
2. NEVER truncate. Every section must be fully written.
3. LANGUAGE RULE: If the assignment text is in English, respond in English. If Arabic, respond in Arabic.
4. For presentations: exactly 10 slides minimum, never fewer.
5. For essays: minimum 800 words, with Introduction, body sections, Conclusion, References.
6. For math/engineering: show full step-by-step working.
7. For code: complete runnable code with comments.

JSON SCHEMA:
{
  "solution_text": "2-3 sentence summary",
  "assignment_type": "essay|report|case_study|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|lab_report|other",
  "reconstructed_doc": {
    "title": "title",
    "word_count": 0,
    "blocks": [
      {"type": "heading", "content": "text", "level": 1},
      {"type": "paragraph", "content": "text"},
      {"type": "list", "content": "item1\nitem2"},
      {"type": "math", "content": "LaTeX", "solution_steps": ["step1"]},
      {"type": "code", "content": "code", "language": "python"},
      {"type": "table", "headers": ["col1"], "rows": [["val1"]]},
      {"type": "svg", "content": "<svg>...</svg>"}
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "title",
      "content_bullets": ["point1","point2","point3","point4","point5"],
      "narrative": "2-3 sentences",
      "speaker_notes": "full speech",
      "image_prompt": "visual description",
      "image_layout": "left"
    }
  ],
  "data_sheet": {"sheet_name": "name", "headers": ["col"], "rows": [["val"]]},
  "code_snippets": [{"language": "python", "filename": "main.py", "code": "# code", "explanation": "desc"}],
  "steps": [{"title": "Step 1", "content": "explanation"}]
}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    // Try all possible env var names
    const GEMINI_KEY =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_KEY;

    if (!GEMINI_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY not set in Vercel environment variables. Go to Vercel → Settings → Environment Variables and add it.'
      });
    }

    // Parse body
    const body = await parseBody(req);
    const { contents, lang } = body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({
        error: `Missing or empty contents array. Received: ${JSON.stringify(body).slice(0, 100)}`
      });
    }

    // Call Gemini with retries
    const DELAYS = [8000, 20000];
    let result = null;
    let lastError = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(DELAYS[attempt - 1]);

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,
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
          lastError = `Gemini busy (${geminiRes.status})`;
          if (attempt < 2) continue;
          return res.status(503).json({ error: 'AI service busy. Please try again in a moment.' });
        }

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          lastError = `Gemini ${geminiRes.status}: ${errText.slice(0, 200)}`;
          console.error('Gemini error:', lastError);
          if (attempt < 2) continue;
          return res.status(500).json({ error: `AI request failed: ${lastError}` });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!rawText || rawText.trim().startsWith('<!') || rawText.trim().startsWith('<html')) {
          lastError = 'Got HTML instead of JSON from Gemini';
          if (attempt < 2) continue;
          throw new Error(lastError);
        }

        // Parse JSON
        let clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first === -1) throw new Error('No JSON object in response');
        clean = clean.slice(first, last + 1);

        try { result = JSON.parse(clean); }
        catch {
          try { result = JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); }
          catch (pe) { throw new Error(`JSON parse failed: ${pe.message}`); }
        }

        break; // success

      } catch (e) {
        lastError = e.message || '';
        const retryable = lastError.includes('503') || lastError.includes('429') || lastError.includes('busy') || lastError.includes('HTML');
        if (!retryable || attempt === 2) throw e;
      }
    }

    if (!result) return res.status(503).json({ error: lastError || 'AI failed. Please try again.' });

    // Fill defaults
    if (!result.solution_text) result.solution_text = '';
    if (!result.assignment_type) result.assignment_type = 'other';
    if (!result.reconstructed_doc) result.reconstructed_doc = { title: '', word_count: 0, blocks: [] };
    if (!result.reconstructed_doc.blocks) result.reconstructed_doc.blocks = [];
    if (!result.presentation_slides) result.presentation_slides = [];
    if (!result.code_snippets) result.code_snippets = [];
    if (!result.steps) result.steps = [];

    return res.status(200).json(result);

  } catch (e) {
    const msg = e?.message || String(e) || 'Unknown error';
    console.error('process-mission FATAL:', msg);
    return res.status(500).json({ error: msg });
  }
}
