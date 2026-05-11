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
  const fullText = contents.map(c => c.text || '').join(' ');
  const text = fullText.toLowerCase();
  const ctxMatch = fullText.match(/\[CONTEXT\]([^\[]+)/);
  const ctxLine = ctxMatch ? ctxMatch[1] : '';
  const detectedUni = (ctxLine.match(/University:\s*([^|\n]+)/i) || [])[1]?.trim() || '';
  const detectedMajor = (ctxLine.match(/Course[^:]*:\s*([^|\n]+)/i) || [])[1]?.trim() || '';
  const detectedCountry = (ctxLine.match(/Country:\s*([^|\n]+)/i) || [])[1]?.trim() || '';

  // Business / Management
  if (/pestel|swot|porter|business plan|marketing strategy|competitive analysis|market analysis|financial model|cash flow|npv|irr|break.even|stakeholder|supply chain|balanced scorecard|خطة أعمال|تحليل|استراتيجية|سوق|تسويق|ربحية|استثمار/.test(text)) {
    return {
      domain: 'BUSINESS',
      rules: `BUSINESS DOMAIN ACTIVATED:
- McKinsey/BCG standard: every claim needs a number or logical deduction
- PESTEL MUST be a table block: headers=["Factor","Analysis","Impact"] with 6 rows (P,E,S,T,E,L)
- SWOT MUST be a table block: headers=["Strengths","Weaknesses","Opportunities","Threats"] 1 row with bullet lists
- NPV/IRR: show full DCF table — one row per year with CF, discount factor, PV
- Executive Summary: exactly 3 sentences (Context → Finding → Recommendation)
- Financial figures: always include currency and time period
- Conclude with 3 specific, actionable, numbered recommendations`
    };
  }

  // Medical — but NOT if engineering keywords are present
  const hasEngineeringIntent = /membrane|osmosis|reverse osmosis|desalination|solar pv|photovoltaic|pump|pressure drop|flow rate|kwp|kwh|hydraulic|structural|circuit design|algorithm|database|api endpoint|system design|pid controller|retaining wall|beam design|bbs|bar bending|reinforced concrete|ecp 203|mechanical design|thermodynamic|heat exchanger|chemical reactor|distillation|filtration|permeate|brine|recovery ratio|van.t hoff|osmotic pressure/.test(text);
  if (!hasEngineeringIntent && /patient|diagnosis|treatment|clinical|nursing|pharmacy|drug|dosage|symptom|pathophysiology|anatomy|medical|healthcare|care plan|pharmacology|مريض|تشخيص|علاج|دواء|جرعة|مستشفى|رعاية|تمريض|صيدلة/.test(text)) {
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

  // Country-specific academic standards
  const getCountryStandards = (country, uni) => {
    const c = country.toLowerCase();
    const u = uni.toLowerCase();
    if (c.includes('egypt') || u.includes('cairo') || u.includes('ain shams') || u.includes('guc') || u.includes('auc') || u.includes('bue') || u.includes('miu')) {
      if (u.includes('auc') || u.includes('bue') || u.includes('guc')) return 'International/US standards (AUC=US, GUC=German, BUE=British). Use APA 7th unless specified. English academic register.';
      return 'Egyptian academic standards. Reference Egyptian codes (ECP 203 for structures, Egyptian Civil Code for law). Arabic or English per assignment language.';
    }
    if (c.includes('saudi') || u.includes('kfupm') || u.includes('king') || u.includes('kaust') || u.includes('alfaisal')) {
      return 'Saudi Arabian academic standards. Reference Saudi Building Code (SBC), Saudi Green Initiative for sustainability, Vision 2030 frameworks for business. Use SI units.';
    }
    if (c.includes('uae') || u.includes('uaeu') || u.includes('aus') || u.includes('zayed') || u.includes('khalifa')) {
      return 'UAE academic standards. Reference UAE Fire and Life Safety Code, UAE Building Code, and UAE Vision 2031 for business context.';
    }
    if (c.includes('kuwait')) return 'Kuwait academic standards. Reference Kuwait Municipal Code and Gulf Cooperation Council (GCC) standards.';
    if (c.includes('jordan')) return 'Jordanian academic standards. Reference Jordanian Building Code and Arab Engineering standards.';
    return 'International academic standards. Use internationally recognized codes and frameworks.';
  };

  const curriculumNote = [
    detectedUni ? `University: ${detectedUni} — ${getCountryStandards(detectedCountry, detectedUni)}` : '',
    detectedMajor ? `Major: ${detectedMajor} — use discipline-specific terminology, frameworks, and assessment criteria for this field` : '',
    detectedCountry && !detectedUni ? `Country: ${detectedCountry} — ${getCountryStandards(detectedCountry, '')}` : '',
  ].filter(Boolean).join('\n');

  // MULTI-DOMAIN detection: if multiple domains detected, use comprehensive mode
  const domainScores = {
    MEDICAL: /patient|diagnosis|treatment|clinical|nursing|stroke|hemiparesis|triage|CT scan|tPA|thrombolytic|ischemic|hemorrhagic|FAST assessment|symptom|pathophysiology|anatomy|medical|healthcare|care plan|pharmacology|مريض|تشخيص|علاج|دواء/.test(text) ? 1 : 0,
    ENGINEERING: /retaining wall|ECP|lateral earth pressure|safety factor|PID controller|reinforced concrete|beam|slab|column|structural|foundation|steel design|load|moment|shear|هندسة مدنية/.test(text) ? 1 : 0,
    BUSINESS: /PESTEL|SWOT|NPV|IRR|feasibility|logistics|NEOM|Red Sea Global|market analysis|financial model|cash flow|investment/.test(text) ? 1 : 0,
    MATH_STATS: /correlation|NPV|IRR|calculus|optimization|standard deviation|regression|statistical/.test(text) ? 1 : 0,
  };
  
  const activeDomainsCount = Object.values(domainScores).filter(v => v > 0).length;
  const activeDomains = Object.entries(domainScores).filter(([,v]) => v > 0).map(([k]) => k);
  
  if (activeDomainsCount >= 2) {
    // Multi-domain assignment — address ALL parts
    return {
      domain: 'MULTI: ' + activeDomains.join('+'),
      rules: `MULTI-DOMAIN ASSIGNMENT DETECTED: ${activeDomains.join(' + ')}

CRITICAL INSTRUCTION: This assignment has MULTIPLE PARTS covering different academic domains.
You MUST address EVERY part completely. Do NOT skip any section.
Structure the document with clearly labeled sections for each part.

${domainScores.MEDICAL ? `MEDICAL SECTIONS:
- Use clinical terminology and evidence-based medicine
- FAST Assessment, stroke protocol, CT scan justification
- tPA window (4.5 hours), secondary prevention protocols
- ADPIE nursing framework if care plan required` : ''}

${domainScores.ENGINEERING ? `ENGINEERING SECTIONS:
- Apply ECP 203 for Egyptian projects, reference specific clauses
- Show full calculation: Given → Find → Solution → Check
- Include safety factors (sliding, overturning)
- PID: define Kp, Ki, Kd with transfer function` : ''}

${domainScores.BUSINESS ? `BUSINESS SECTIONS:
- PESTEL as structured table block (type: "table")
- SWOT as 2x2 matrix table
- NPV/IRR with full DCF calculations shown` : ''}

${domainScores.MATH_STATS ? `QUANTITATIVE SECTIONS:
- Show every algebraic step
- LaTeX for all formulas
- Box final answers` : ''}

${curriculumNote ? 'CURRICULUM ANCHORS:\n' + curriculumNote : ''}

OUTPUT RULE: The reconstructed_doc must have separate headed sections for EACH part of the assignment. A student reading this should have a complete answer to every question asked.`
    };
  }





  // STEM — Engineering (structural/civil/mechanical)
  if (/reinforced concrete|beam|slab|column|ecp|structural|foundation|steel design|load combination|dead load|live load|kn\/m|mpa|egyptian code|aci 318|eurocode|bs 8110|moment distribution|shear force|bending|bbs|bar bending|rebar|stirrup|bar schedule|retaining wall|pid controller|mechanical|thermodynamic|hydraulic|circuit|electrical|هندسة|خرسانة|حديد|تسليح|عزم|قص|أساس|BBS|جدول الحديد|قفل|كانة|reverse osmosis|desalination|membrane|osmotic pressure|van.t hoff|solar pv|photovoltaic|peak sun hours|kWp|kWh\/m|recovery ratio|permeate|brine|feed water|salinity|ppm|high.pressure pump|process flow diagram|pfd|chemical engineering|heat exchanger|distillation|absorption|mass transfer|fluid mechanics|bernoulli|reynolds|darcy|turbine|compressor|reactor design|catalysis|polymer|composite|aerospace|civil engineering|urban planning|water treatment/.test(text)) {
    return {
      domain: 'ENGINEERING',
      rules: `ENGINEERING DOMAIN:
- Full calculation: Given → Find → Assumptions → Solution (step-by-step) → Verify → Safety Factor
- Egypt: cite ECP 203 clauses (e.g. "ECP 203-2018 Section 4.2.1")
- Saudi: cite SBC 304 (concrete), SBC 301 (loads)
- UAE/International: BS 8110 or Eurocode 2
- Always label units: kN, kN/m², m, mm, MPa, bar, kWh, kWp, m³/day
- Safety factors: sliding ≥ 1.5, overturning ≥ 2.0, bearing capacity ≥ 3.0
- SVG diagrams MANDATORY: every engineering assignment must include at least one svg block
- For process systems (RO, water treatment, chemical): include Process Flow Diagram (PFD) as svg block
  showing: Intake → Pre-treatment → Pump → Membrane/Reactor → Post-treatment → Output
- For solar/energy systems: include system schematic showing panels, inverter, battery, load
- For structural: cross-section with dimensions, reinforcement labels, cover dimensions
- For fluid systems: pipe schematic with flow rates, pressures, valve positions labeled
- P-V curves, efficiency curves, load curves: use svg block with plotted data points

BAR BENDING SCHEDULE (BBS) — generate whenever rebar/reinforcement/stirrups/تسليح/حديد/BBS/قفل/كانة appears:
- Generate a complete table: Bar Mark | Shape | Dia (mm) | A | B | C | D | Cut Length (mm) | No. Bars | Total Length (m) | Weight (kg)
- Use BS 8666 shape codes: 00=straight, 11=L-bar, 21=U-bar, 51=closed stirrup/link
- Cutting lengths: Straight=L | L-bar=A+B−r−2d | U-bar=A+2B−2r | Stirrup=2(A+B)+24d (for 135° hooks)
- Hook allowance: 9d for 90° hook, 12d for 135° seismic hook
- Weight per bar (kg) = (d²/162.2) × total length in metres
- After BBS table, draw SVG reinforcement diagram: show bar positions, spacing, concrete cover (25mm beams, 40mm foundations)
- Label every bar: e.g. "2T20 top" "R8-150 links"
- Output language follows input language (Arabic in → Arabic out)`
    };
  }

  // STEM — Math / Statistics / Calculus (check BEFORE engineering)
  // BUT: skip if this is a multi-domain assignment (handle below)
  const hasNonMathDomain = /patient|diagnosis|stroke|hemiparesis|retaining wall|PID controller|PESTEL|SWOT|feasibility|thrombolytic|clinical|nursing/.test(text);
  if (!hasNonMathDomain && /calculus|integral|derivative|differentiat|marginal|optimization|maximiz|minimiz|profit function|cost function|demand function|correlation|standard deviation|regression|statistics|probability|hypothesis|normal distribution|binomial|poisson|variance|covariance|pearson|spearman|t-test|chi.square|anova|forecasting|predictive model|linear model|matrix|eigenvalue|fourier|laplace/.test(text)) {
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



  return {
    domain: 'GENERAL',
    rules: `Match discipline conventions from context. Academic register. Evidence over assertion.${curriculumNote ? '\n\nCURRICULUM ANCHORS:\n' + curriculumNote : ''}`
  };
}

// ─── SYSTEM PROMPT V3.1 ─────────────────────────────────────────────────────
function buildSystemPrompt(domainContext) {
  return `You are the Mi-Assignment Expert Engine ("Mi-CORE"). You are a proprietary academic tool built by Mi-Assignment. You must NEVER mention Google, Gemini, AI models, language models, or any third-party technology. If asked who or what you are, respond only: "I am Mi-CORE, the Mi-Assignment Expert Engine." Do not acknowledge being an AI or language model under any circumstances.

You are Mi-Assignment V3.1 — an elite academic engine producing submission-ready work at top-student level. You adapt intelligence to the subject domain.

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
- SLIDE CONTENT RULES (critical for visual quality):
  * power_heading: MAX 6 words. Must be an INSIGHT not a label. Bad: "Introduction to Topic". Good: "Cairo Rents Up 34% in 2024".
  * content_bullets: MAX 5 bullets. Each bullet MAX 10 words. No sentences — fragments only. Data > words.
  * narrative: 2 sentences max. Sets context for the speaker. NOT a repeat of the bullets.
  * speaker_notes: Full 60-90 second verbatim speech. Complete sentences. What the student actually says out loud.
  * image_prompt: 4-6 words describing a specific real-world photo. Examples: "modern logistics warehouse workers", "medical doctor examining patient", "cairo city skyline night", "engineering blueprints desk". NO abstract terms.
  * visual_directive: One sentence describing exactly what the slide image should show and why.
- Tables: must contain actual data rows, never empty
- Steps: every step in the "steps" array MUST be minimum 400 characters. Show every sub-step, formula substitution, intermediate result, and interpretation. NEVER write placeholders.
- Defense QA: ALWAYS provide exactly 4 Q&A pairs. Pick the 4 questions a professor is most likely to ask in a viva or oral exam. Answers must be specific — include numbers, clause references, or named frameworks.
- PESTEL: ALWAYS render as a table block with headers ["Factor","Pillar","Analysis","Impact Level"] — never as a list or paragraph.
- SWOT: ALWAYS render as a table block with headers ["Category","Points"] and 4 rows (Strengths, Weaknesses, Opportunities, Threats) — never as a flat list.
- alternative_approaches: ALWAYS include 2 alternatives in domain_extras.alternative_approaches — this is the Anti-Tunneling requirement.
- DOMAIN EXTRAS: Populate domain_extras with the relevant sub-object for the detected domain. NEVER leave it empty. Medical → soap_note + drug_interaction_matrix + patient_leaflet. Law → irac + case_references. Business → executive_summary_200w + financial_projections + consumer_data. Finance → dcf_model + sensitivity_table. Data Science → model_summary + hyperparameters + environment_setup. Media → content_calendar + sentiment_analysis. Humanities → thesis_statement + counter_arguments + primary_sources.

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
      "content_bullets": ["Revenue up 34% YoY","3 markets, 1 platform","Break-even: Month 18","NPS score: 72","Cairo leads at 41%"],
      "visual_directive": "Exact description of what visual to insert and what it shows",
      "image_prompt": "4-6 word photo description e.g. 'modern office team meeting' or 'cairo skyline aerial view'",
      "image_layout": "left|right|background|full",
      "speaker_notes": "Full 60-90 second verbatim script. What the student says while this slide is shown. Complete sentences. Include transition to next slide."
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
  "domain_extras": {
    "type": "OMIT THIS ENTIRE FIELD if domain is GENERAL. Otherwise populate the relevant sub-object below based on domain:",
    "alternative_approaches": [
      {"title": "Alternative approach title", "description": "Why this was considered and why the chosen approach is better"}
    ],
    "bibliography": [
      {"ref": "Author, A. (Year). Title. Journal. DOI."}
    ],
    "medical": {
      "soap_note": {"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."},
      "drug_interaction_matrix": [{"drug_a": "", "drug_b": "", "interaction": "", "severity": "low|moderate|high", "management": ""}],
      "patient_leaflet": "Plain language discharge instructions in patient's language. No jargon."
    },
    "law": {
      "legal_framework": "Applicable codes and articles cited",
      "case_references": [{"case_name": "", "court": "", "year": "", "relevance": ""}],
      "irac": {"issue": "", "rule": "", "application": "", "conclusion": ""}
    },
    "business": {
      "executive_summary_200w": "Exactly 200 words: Problem → Approach → Key Finding → Recommendation",
      "financial_projections": {
        "headers": ["Year", "Revenue", "COGS", "Gross Profit", "EBITDA", "Net Income"],
        "rows": [["Year 1","","","","",""],["Year 2","","","","",""],["Year 3","","","","",""]]
      },
      "consumer_data": {
        "headers": ["Segment", "Size", "Avg Spend", "CAC", "LTV", "LTV/CAC"],
        "rows": []
      }
    },
    "finance": {
      "dcf_model": {
        "headers": ["Year", "FCF", "Discount Factor", "PV", "Cumulative PV"],
        "rows": [],
        "wacc": "", "terminal_value": "", "enterprise_value": "", "equity_value": ""
      },
      "sensitivity_table": {
        "headers": ["WACC \\ Growth", "1%", "2%", "3%", "4%", "5%"],
        "rows": []
      }
    },
    "data_science": {
      "model_summary": {"algorithm": "", "accuracy": "", "precision": "", "recall": "", "f1": "", "auc_roc": ""},
      "hyperparameters": [{"param": "", "value": "", "justification": ""}],
      "environment_setup": "pip install requirements or conda env create instructions"
    },
    "media": {
      "content_calendar": {
        "headers": ["Week", "Platform", "Content Type", "Topic", "Format", "KPI Target"],
        "rows": []
      },
      "sentiment_analysis": [{"segment": "", "sentiment": "positive|neutral|negative", "score": 0.0, "key_themes": []}]
    },
    "humanities": {
      "thesis_statement": "One sentence claim the entire paper argues",
      "counter_arguments": [{"argument": "", "rebuttal": ""}],
      "primary_sources": [{"source": "", "type": "archive|interview|document", "annotation": ""}]
    }
  },
  "steps": [
    {"title": "Step 1 title", "content": "Full explanation — minimum 400 characters. Show every sub-step, formula substitution, intermediate result, and interpretation. A student must be able to reproduce this from scratch by reading only this field."},
    {"title": "Step 2 title", "content": "Continue full working here..."},
    {"title": "Step 3 title", "content": "Continue..."}
  ],
  "logic_breakdown": {
    "summary": "How to explain this if a professor asks. 3-5 confident sentences.",
    "key_concepts": ["Concept explained in plain language"],
    "common_mistakes": ["Mistake to avoid"],
    "defense_qa": [
      {"q": "Professor question 1 — most likely to be asked", "a": "Confident specific answer the student can say out loud"},
      {"q": "Professor question 2 — about methodology", "a": "Precise answer with numbers or references"},
      {"q": "Professor question 3 — about limitations or assumptions", "a": "Honest, nuanced answer showing depth"},
      {"q": "Professor question 4 — 'devil's advocate' challenge", "a": "Strong rebuttal with evidence"}
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
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel environment variables.' });
    }

    const body = await parseBody(req);
    const { contents, lang } = body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Missing contents array' });
    }

    const domainContext = buildSubjectContext(contents);
    const systemPrompt = buildSystemPrompt(domainContext);

    // Transform contents into Gemini API format
    // Frontend sends [{text:"..."}, {inlineData:{...}}]
    // Gemini needs [{role:"user", parts:[{text:"..."},{inlineData:{...}}]}]
    const geminiContents = [{
      role: 'user',
      parts: contents.map(c => {
        if (c.inlineData) return { inlineData: c.inlineData };
        return { text: c.text || '' };
      })
    }];

    // Build Gemini API request payload
    const geminiPayload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        thinkingConfig: {
          // Thinking only for domains that need deep reasoning
          thinkingBudget: /ENGINEERING|MATH|MEDICAL|CS|SCIENCE|DATA/.test(
            (domainContext.domain || '').toUpperCase()
          ) ? 8000 : 0,
        },
        temperature: 0.65,
        topP: 0.85,
        topK: 40,
        responseMimeType: 'application/json',
        maxOutputTokens: 10000,
      },
    };

    // Model waterfall — try each model with 28s timeout
  // If one hangs or 503s, move to the next immediately
  const MODEL_WATERFALL = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
  ];

  let geminiRes = null;
  let lastError = '';

  for (const model of MODEL_WATERFALL) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 28000);
    try {
      console.log(`Mi — trying ${model}`);
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          signal: ctrl.signal,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        }
      );
      clearTimeout(timer);
      // Accept any non-5xx response — even 400s we handle below
      if (r.status < 500) {
        geminiRes = r;
        console.log(`Mi — ${model} responded with ${r.status}`);
        break;
      }
      lastError = `${model}: ${r.status}`;
      console.log(`Mi — ${model} returned ${r.status}, trying next...`);
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = `${model}: timeout`;
        console.log(`Mi — ${model} timed out at 28s, trying next...`);
        continue;
      }
      throw err;
    }
  }

  if (!geminiRes) {
    setCORS(res);
    return res.status(503).json({
      error: `Mi Engine is under heavy load right now. Please try again in 30 seconds. (${lastError})`
    });
  }



    if (geminiRes.status === 403) {
      const e = await geminiRes.json().catch(() => ({}));
      return res.status(403).json({ error: `API key error: ${e?.error?.message || 'Invalid or revoked key.'}` });
    }
    if (!geminiRes.ok) {
      const t = await geminiRes.text();
      console.error('Gemini error:', geminiRes.status, t.slice(0, 300));
      return res.status(500).json({ error: `AI request failed (${geminiRes.status}). Please try again.` });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText || rawText.trim().startsWith('<!') || rawText.trim().startsWith('<html')) {
      return res.status(503).json({ error: 'AI service returned an error page. Please try again.' });
    }

    let clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const first = clean.indexOf('{');
    if (first === -1) return res.status(500).json({ error: 'AI response was not valid JSON. Please try again.' });
    // Find the matching closing brace using bracket counting (not lastIndexOf)
    // This handles cases where Gemini appends text after the JSON object
    let depth = 0, last = -1;
    for (let i = first; i < clean.length; i++) {
      if (clean[i] === '{') depth++;
      else if (clean[i] === '}') {
        depth--;
        if (depth === 0) { last = i; break; }
      }
    }
    if (last === -1) return res.status(500).json({ error: 'Incomplete JSON response. Please try again.' });
    clean = clean.slice(first, last + 1);

    let result;
    try { result = JSON.parse(clean); }
    catch {
      // Fix trailing commas
      try { result = JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); }
      catch {
        // Gemini hit token limit mid-JSON — reconstruct by closing all open brackets
        try {
          let fixed = clean;
          // Count unclosed brackets
          let opens = 0, inStr = false, escape = false;
          for (const ch of fixed) {
            if (escape) { escape = false; continue; }
            if (ch === '\\') { escape = true; continue; }
            if (ch === '"') { inStr = !inStr; continue; }
            if (!inStr) {
              if (ch === '{' || ch === '[') opens++;
              else if (ch === '}' || ch === ']') opens--;
            }
          }
          // Close any unclosed strings and brackets
          if (inStr) fixed += '"';
          // Remove trailing comma before we close
          fixed = fixed.replace(/,\s*$/, '');
          // Close brackets
          const stack = [];
          inStr = false; escape = false;
          for (const ch of fixed) {
            if (escape) { escape = false; continue; }
            if (ch === '\\') { escape = true; continue; }
            if (ch === '"') { inStr = !inStr; continue; }
            if (!inStr) {
              if (ch === '{') stack.push('}');
              else if (ch === '[') stack.push(']');
              else if ((ch === '}' || ch === ']') && stack.length) stack.pop();
            }
          }
          fixed += stack.reverse().join('');
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
          result = JSON.parse(fixed);
        } catch (e) {
          return res.status(500).json({ error: `Response parse failed: ${e.message}` });
        }
      }
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
    if (e && e.name === 'AbortError') {
      console.error('Mi Engine: 50s timeout');
      setCORS(res);
      return res.status(503).json({ error: 'This assignment took too long to process. Please try again or break it into smaller parts.' });
    }
    console.error('Mi Engine FATAL:', e.message);
    return res.status(500).json({ error: e.message || 'Mission failed. Please try again.' });
  }
}
