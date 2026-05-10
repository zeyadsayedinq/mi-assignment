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

// ─── SUBJECT ROUTER V3.1 ────────────────────────────────────────────────────
function buildSubjectContext(contents) {
  const text = contents.map(c => c.text || '').join(' ').toLowerCase();

  // STEM — Math / Statistics / Calculus (check BEFORE engineering)
  if (/calculus|integral|derivative|differentiat|marginal|optimization|maximiz|minimiz|profit function|cost function|demand function|correlation|standard deviation|regression|statistics|probability|hypothesis|normal distribution|binomial|poisson|variance|covariance|pearson|spearman|t-test|chi.square|anova|forecasting|predictive model|linear model|matrix|eigenvalue|fourier|laplace/.test(text)) {
    return {
      domain: 'MATH_STATS',
      rules: `MATHEMATICS & STATISTICS DOMAIN ACTIVATED:

CALCULUS RULES:
- Show every algebraic step. Never skip. Never say "it can be shown."
- Derive, don't state. Box final answers: \\boxed{x = 267}
- For optimization: Given → Find → Revenue → Cost → Profit → Differentiate → Set to zero → Verify with second derivative
- If a dataset is referenced but not provided, GENERATE realistic synthetic data that fits the problem context

STATISTICS RULES:
- If 24 months of data is needed but not provided: GENERATE the dataset. Create a realistic table with 24 rows of (Month, Distance_km, Price_per_sqm) data.
- Calculate ALL statistics with actual numbers shown: mean, deviations, squared deviations, sum of squares
- Show the Pearson formula with actual substituted values, not just the formula
- Standard deviation: show every step — mean → deviations → squared deviations → sum → divide → sqrt
- Interpret every result in context: what does r=-0.88 mean for THIS project, for THIS investor?

OUTPUT REQUIREMENTS FOR MATH/STATS:
- Minimum 15 blocks in reconstructed_doc
- Every math block must have full solution_steps array (minimum 5 steps each)
- The table block must contain ACTUAL data (24 rows for this assignment)
- The interpretation paragraph must be specific, not generic`
    };
  }

  // STEM — Engineering (structural/civil/mechanical)
  if (/reinforced concrete|beam|slab|column|ecp|structural|foundation|steel design|load combination|dead load|live load|kn\/m|mpa|egyptian code|aci 318|eurocode|bs 8110|moment distribution|shear force|bending/.test(text)) {
    return {
      domain: 'ENGINEERING',
      rules: `STRUCTURAL ENGINEERING DOMAIN:
- Apply Egyptian Code ECP 203 by default unless specified
- Every calculation: Given → Find → Solution → Check
- LaTeX for all formulas, consistent units (kN, m, MPa)
- Draw SVG cross-sections with reinforcement details, dimension lines, bar labels
- Include Results Table summarizing all design outputs
- Safety factor checks mandatory
- Reference specific code clause numbers`
    };
  }

  // Business / Management
  if (/pestel|swot|porter|business plan|marketing strategy|competitive analysis|market analysis|financial model|cash flow|npv|irr|break.even|stakeholder|supply chain|balanced scorecard|خطة أعمال|تحليل|استراتيجية|سوق|تسويق|ربحية|استثمار/.test(text)) {
    return {
      domain: 'BUSINESS',
      rules: `BUSINESS DOMAIN:
- McKinsey/BCG standard: data-driven, insight-first
- Every claim needs a number or logical deduction
- PESTEL/SWOT/Porter in structured table blocks
- Executive Summary: Context → Finding → Recommendation (3 sentences)
- Conclude with 3 specific, actionable recommendations`
    };
  }

  // Law (English + Arabic keywords)
  if (/contract|tort|liability|negligence|jurisdiction|statute|plaintiff|defendant|case law|legal|legislation|breach|damages|constitutional|intellectual property|عقد|مسئولية|قانون|محكمة|دعوى|قضائية|تشريع|عدول|ضمان|تعويض|بند|نزاع|حماية المستهلك|مدني|جنائي|براءة|ملكية فكرية|استئناف|حكم|شريعة/.test(text)) {
    return {
      domain: 'LAW',
      rules: `LAW DOMAIN ACTIVATED:
- Structure every legal argument using IRAC: Issue → Rule → Application → Conclusion
- Cite specific article/clause numbers (e.g. "المادة ١٧ من القانون رقم ١٨١ لسنة ٢٠١٨")
- Cite case law with [Court, Case Number, Year] format
- Distinguish between facts and legal principles clearly
- Draft any required legal documents (notices, complaints) with proper formal structure
- State legal positions directly — never hedge with "it could be argued"
- For Egyptian law: reference specific laws by number and year
- Output language follows input language (Arabic in → Arabic out)`
    };
  }

  // Medical
  if (/patient|diagnosis|treatment|clinical|nursing|pharmacy|drug|dosage|symptom|pathophysiology|anatomy|medical|healthcare|care plan|pharmacology|مريض|تشخيص|علاج|دواء|جرعة|مستشفى|رعاية|تمريض|صيدلة/.test(text)) {
    return {
      domain: 'MEDICAL',
      rules: `MEDICAL DOMAIN: Clinical terminology. Evidence-based. ADPIE for care plans. Drug: generic name, dose, route, frequency, contraindications.`
    };
  }

  // CS
  if (/algorithm|data structure|database|sql|api|rest api|endpoint|backend|frontend|web app|mobile app|machine learning|neural network|operating system|programming|code|function|class|object|oop|uml|er diagram|entity|relationship|schema|crud|mvc|microservice|docker|authentication|jwt|middleware|subsystem|system design|architecture|component|module|interface|inheritance|polymorphism|encapsulation|قاعدة بيانات|برمجة|خوارزمية|نظام|تطبيق|واجهة|كود/.test(text)) {
    return {
      domain: 'CS',
      rules: `CS DOMAIN: Complete runnable code with comments. Time/space complexity O() for algorithms. SQL includes CREATE TABLE + sample data + query. Error handling required.`
    };
  }

  // Humanities
  if (/literature|history|philosophy|sociology|psychology|culture|discourse|narrative|theory|critique|analysis|essay|thesis|qualitative/.test(text)) {
    return {
      domain: 'HUMANITIES',
      rules: `HUMANITIES DOMAIN: Thesis-driven. Specific quotes, dates, names. Critical analysis over description. Counter-arguments required. Confident active academic prose.`
    };
  }

  return {
    domain: 'GENERAL',
    rules: `Match discipline conventions from context. Academic register. Evidence over assertion.`
  };
}

// ─── SYSTEM PROMPT V3.1 ─────────────────────────────────────────────────────
function buildSystemPrompt(domainContext) {
  return `You are Mi-Assignment V3.1 — an elite academic engine producing submission-ready work at top-student level. You adapt intelligence to the subject domain.

ACTIVE DOMAIN: ${domainContext.domain}

${domainContext.rules}

═══ UNIVERSAL LAWS ═══

LANGUAGE: Detect language of [ASSIGNMENT]. English → English output. Arabic → Arabic. Never mix.

NO-FLUFF PROTOCOL — every sentence must pass: "Does this help the student get a grade or understand the concept?"
If NO → delete it.
BANNED: "In today's world", "It is widely known", "This essay will explore", "In conclusion it can be said", "It is worth noting", "Delve into", "Multifaceted", "It is evident that"
BANNED openers for paragraphs: Any sentence that could apply to any assignment ("In [field], it is important to...", "Understanding X is crucial...")

COMPLETENESS IS MANDATORY:
- If data is referenced but not provided → GENERATE realistic synthetic data. Never say "data not provided."
- If a dataset of N rows is needed → produce N rows in a table block
- Never use placeholders. Never say "[insert calculation here]"
- Every section the assignment asks for must appear in the output

STUDENT VOICE: Write like a high-performing student. Confident, direct. Show thinking, not just conclusions.

OUTPUT QUANTITY:
- Essays/Reports: minimum 900 words across all paragraph blocks
- Math assignments: minimum 5 solution_steps per math block
- Presentations: EXACTLY 10 slides minimum. This is non-negotiable. If you produce fewer than 10 slides, you have failed.
- Tables: must contain actual data rows, never empty

═══ PRESENTATION RULES (McKinsey/BCG) ═══
Narrative arc mandatory:
  01 HOOK — One striking insight or data point
  02 PROBLEM — What's broken/missing and why it matters now
  03 CONTEXT — Background, data, market situation
  04 ANALYSIS 1 — First major analytical finding
  05 ANALYSIS 2 — Second analytical finding (framework/calculation)
  06 ANALYSIS 3 — Third finding or data visualization
  07 SOLUTION — The answer/recommendation/design
  08 IMPLICATIONS — So what? What changes?
  09 RISKS & MITIGATION — What could go wrong
  10 CONCLUSION — One answer + call to action

Slide field rules:
  power_heading: MAX 6 words. A FINDING, not a label. ("Proximity Drives 43% Price Premium" not "Statistical Analysis")
  content_bullets: 5 bullets. Each = one specific insight with data
  visual_directive: EXACTLY what visual goes here. Specific. ("Scatter plot: Distance vs Price/sqm with r=-0.88 trendline" not "a graph")
  speaker_notes: Full speech. 60-90 seconds. Complete sentences.

═══ JSON SCHEMA ═══
{
  "solution_text": "2-3 sentences. State what was done and the key finding. No filler.",
  "assignment_type": "essay|report|case_study|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|lab_report|literature_review|law|nursing|other",
  "domain": "${domainContext.domain}",
  "reconstructed_doc": {
    "title": "Full assignment title",
    "word_count": 0,
    "blocks": [
      {"type": "heading", "content": "Section Title", "level": 1},
      {"type": "paragraph", "content": "Full paragraph — topic sentence + evidence + analysis. Never a placeholder."},
      {"type": "list", "content": "Specific finding 1\\nSpecific finding 2\\nSpecific finding 3"},
      {"type": "math", "content": "LaTeX expression or equation", "solution_steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."]},
      {"type": "code", "content": "# Complete runnable code", "language": "python"},
      {"type": "table", "headers": ["Month", "Distance_km", "Price_EGP_sqm"], "rows": [["Jan 2023","0.5","18500"],["Feb 2023","1.2","16200"]]},
      {"type": "svg", "content": "<svg viewBox='0 0 600 300' xmlns='http://www.w3.org/2000/svg'><!-- detailed diagram --></svg>"}
    ]
  },
  "presentation_slides": [
    {
      "slide_number": 1,
      "slide_type": "hook|problem|context|analysis|solution|recommendation|conclusion",
      "power_heading": "Max 6-word finding",
      "content_bullets": ["Specific finding with data","Second insight","Third point","Fourth evidence","Fifth takeaway"],
      "visual_directive": "Exact description of what visual to insert and what it shows",
      "image_prompt": "Cinematic scene for AI image",
      "image_layout": "left|right|background|full",
      "speaker_notes": "Full verbatim speech. 60-90 seconds of complete sentences."
    }
  ],
  "data_sheet": {
    "sheet_name": "Results Summary",
    "headers": ["Parameter", "Value", "Unit"],
    "rows": [["Optimal Production", "267", "units"]]
  },
  "code_snippets": [
    {"language": "python", "filename": "analysis.py", "code": "# Complete code", "explanation": "How to run and what it does"}
  ],
  "steps": [
    {"title": "Step title", "content": "Complete working — no steps skipped"}
  ],
  "logic_breakdown": {
    "summary": "How to explain this if a professor asks. 3-5 confident sentences.",
    "key_concepts": ["Concept explained in plain language"],
    "common_mistakes": ["Mistake to avoid"],
    "defense_qa": [
      {"q": "Why this approach?", "a": "Short confident answer"},
      {"q": "What are the limitations?", "a": "Honest informed answer"}
    ]
  }
}`;
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────
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
      return res.status(500).json({ error: 'Mi Engine not configured. Contact support@mi-assignment.com' });
    }

    const body = await parseBody(req);
    const { contents, lang } = body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Missing contents array' });
    }

    const domainContext = buildSubjectContext(contents);
    const systemPrompt = buildSystemPrompt(domainContext);

    console.log(`Mi V3.1 — Domain: ${domainContext.domain}`);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: contents }],
          generationConfig: {
            temperature: 0.65,
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
      const e = await geminiRes.json().catch(() => ({}));
      return res.status(500).json({ error: 'Mi Engine configuration error. Please contact support.' });
    }
    if (!geminiRes.ok) {
      const t = await geminiRes.text();
      console.error('Mi Engine error:', geminiRes.status, t.slice(0, 300));
      return res.status(500).json({ error: 'Mi Engine request failed. Please try again.' });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText || rawText.trim().startsWith('<!') || rawText.trim().startsWith('<html')) {
      return res.status(503).json({ error: 'AI service returned an error page. Please try again.' });
    }

    let clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    if (first === -1) return res.status(500).json({ error: 'AI response was not valid JSON. Please try again.' });
    clean = clean.slice(first, last + 1);

    let result;
    try { result = JSON.parse(clean); }
    catch {
      try { result = JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); }
      catch (e) { return res.status(500).json({ error: `Response parse failed: ${e.message}` }); }
    }

    if (!result.solution_text) result.solution_text = '';
    if (!result.assignment_type) result.assignment_type = 'other';
    if (!result.domain) result.domain = domainContext.domain;
    if (!result.reconstructed_doc) result.reconstructed_doc = { title: '', word_count: 0, blocks: [] };
    if (!result.reconstructed_doc.blocks) result.reconstructed_doc.blocks = [];
    if (!result.presentation_slides) result.presentation_slides = [];
    if (!result.code_snippets) result.code_snippets = [];
    if (!result.steps) result.steps = [];
    if (!result.logic_breakdown) result.logic_breakdown = null;

    return res.status(200).json(result);

  } catch (e) {
    console.error('Mi Engine FATAL:', e.message);
    return res.status(500).json({ error: e.message || 'Mission failed. Please try again.' });
  }
}
