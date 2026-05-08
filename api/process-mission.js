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

const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI producing complete, submission-ready university assignment solutions. Write like a real student, never like an AI.

RULES:
1. Return ONE valid JSON object only. Nothing before {. Nothing after }.
2. NEVER truncate. Every field must be fully written.
3. LANGUAGE: If assignment text is English respond in English. If Arabic respond in Arabic.
4. Presentations: exactly 10 slides minimum, never fewer.
5. Essays: minimum 800 words, Introduction + body sections + Conclusion + References.
6. Math/engineering: full step-by-step working with LaTeX notation.
7. Code: complete runnable code with comments, never pseudocode.

JSON SCHEMA:
{
  "solution_text": "2-3 sentence summary in student voice",
  "assignment_type": "essay|report|case_study|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|lab_report|other",
  "reconstructed_doc": {
    "title": "Assignment title",
    "word_count": 0,
    "blocks": [
      {"type": "heading", "content": "Section Title", "level": 1},
      {"type": "paragraph", "content": "Full paragraph text"},
      {"type": "list", "content": "Item 1\nItem 2\nItem 3"},
      {"type": "math", "content": "LaTeX expression", "solution_steps": ["Step 1", "Step 2"]},
      {"type": "code", "content": "# full code", "language": "python"},
      {"type": "table", "headers": ["Col1","Col2"], "rows": [["v1","v2"]]},
      {"type": "svg", "content": "<svg viewBox='0 0 400 200'>...</svg>"}
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "Slide Title",
      "content_bullets": ["Point 1","Point 2","Point 3","Point 4","Point 5"],
      "narrative": "2-3 sentences",
      "speaker_notes": "Full 60-90 second speech",
      "image_prompt": "Specific visual description",
      "image_layout": "left"
    }
  ],
  "data_sheet": {"sheet_name": "Name", "headers": ["Col"], "rows": [["val"]]},
  "code_snippets": [{"language": "python", "filename": "main.py", "code": "# code", "explanation": "desc"}],
  "steps": [{"title": "Step 1", "content": "Full working shown"}]
}`;

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const GEMINI_KEY =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_KEY;

    if (!GEMINI_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel environment variables.' });
    }

    const body = await parseBody(req);
    const { contents, lang } = body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Missing contents array' });
    }

    // Single attempt — no retry delays eating the 60s budget
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
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (geminiRes.status === 503 || geminiRes.status === 429) {
      return res.status(503).json({ error: 'AI service busy. Please try again in a moment.' });
    }

    if (geminiRes.status === 403) {
      const errData = await geminiRes.json().catch(() => ({}));
      return res.status(403).json({ error: `API key error: ${errData?.error?.message || 'Invalid or revoked API key.'}` });
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', geminiRes.status, errText.slice(0, 300));
      return res.status(500).json({ error: `AI request failed (${geminiRes.status}). Please try again.` });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText || rawText.trim().startsWith('<!') || rawText.trim().startsWith('<html')) {
      return res.status(503).json({ error: 'AI service returned an error. Please try again.' });
    }

    // Parse JSON safely
    let clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    if (first === -1) {
      return res.status(500).json({ error: 'AI response was not valid JSON. Please try again.' });
    }
    clean = clean.slice(first, last + 1);

    let result;
    try { result = JSON.parse(clean); }
    catch {
      try { result = JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); }
      catch (e) {
        return res.status(500).json({ error: `Response parse failed: ${e.message}` });
      }
    }

    // Fill defaults so UI never crashes
    if (!result.solution_text) result.solution_text = '';
    if (!result.assignment_type) result.assignment_type = 'other';
    if (!result.reconstructed_doc) result.reconstructed_doc = { title: '', word_count: 0, blocks: [] };
    if (!result.reconstructed_doc.blocks) result.reconstructed_doc.blocks = [];
    if (!result.presentation_slides) result.presentation_slides = [];
    if (!result.code_snippets) result.code_snippets = [];
    if (!result.steps) result.steps = [];

    return res.status(200).json(result);

  } catch (e) {
    console.error('process-mission FATAL:', e.message);
    return res.status(500).json({ error: e.message || 'Mission failed. Please try again.' });
  }
}
