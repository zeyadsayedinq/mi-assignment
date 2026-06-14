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
      rules: `ENGINEERING DOMAIN:
- FORMAT: Given → Find → Assumptions → Solution (every sub-step shown) → Verify → Safety Factor
- SELF-CHECK MANDATORY: After each calculation, verify with a sanity check. State "✓ Check: [result] is reasonable because [reason]". Never leave contradictory results — if you recalculate, explicitly state "Revised calculation:" and use ONLY the revised value thereafter.
- Egypt: cite ECP 203-2018 by section (e.g. "ECP 203 Section 4.2.1")
- Saudi: cite SBC 304 (concrete), SBC 301 (loads), SBC 601 (energy)
- UAE: cite UAE Building Code and BS 8110 / Eurocode 2
- Units: always label (kN, kN/m², m, mm, MPa, kWh, kWp, m³/day, °C, kJ/kg·°C)
- Safety factors: sliding ≥ 1.5, overturning ≥ 2.0, bearing ≥ 3.0 — always state which applies
- SVG DIAGRAMS MANDATORY: every engineering assignment must include at minimum ONE svg block
- PROCESS SYSTEMS (solar, RO, HVAC, water treatment): include system schematic SVG showing all components with dimensions and flow direction labels
- SOLAR SYSTEMS: show collector → pipe → tank with height differential labeled (thermosyphon: min 30cm tank above collector)
- STRUCTURAL: cross-section SVG with bar marks, stirrup spacing, concrete cover, dimension lines
- BBS TABLE: when rebar present, generate full table (Mark|Shape|Dia|A|B|C|Cut Length|No.|Weight)
- SIZING CALCULATOR: for parametric designs (solar, RO, HVAC), generate a data_sheet with input variables and calculated outputs so the student can see how results change with parameters
- PRESENTATIONS: MANDATORY 10 slides minimum. Each slide must have power_heading (max 6 words, insight not label), content_bullets (max 5 bullets, max 10 words each with actual numbers), speaker_notes (60-90 second script), and image_prompt (4-6 word Pexels-searchable description). Engineering slide structure: Slide 1 Title/Hook → Slides 2-3 Problem + Given Data → Slides 4-6 Calculations (show key equations and results) → Slide 7 System Diagram/Schematic → Slide 8 Results Summary → Slide 9 Recommendations → Slide 10 Conclusion
- PFD for process systems showing all components, flow streams, control valves`
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
      rules: `LAW DOMAIN:
- IRAC STRUCTURE MANDATORY: Issue → Rule → Application → Conclusion for EVERY legal question
- LEGAL MEMORANDUM FORMAT: To/From/Date/Re header → Executive Summary → Facts → Legal Analysis (IRAC) → Conclusion → Recommendations
- EGYPTIAN LAW: cite Egyptian Civil Code (Law 131/1948) by article number. Commercial Code (Law 17/1999). Labor Law (Law 12/2003). Consumer Protection (Law 181/2018)
- SAUDI LAW: cite Saudi Civil Transactions Law (Royal Decree M/191), Saudi Commercial Court Law, Vision 2030 regulatory framework
- UAE LAW: cite UAE Civil Transactions Code (Federal Law No. 5/1985), DIFC Law, UAE Commercial Companies Law
- INTERNATIONAL: cite CISG (UN Sales Convention), ICC Rules, UNCITRAL Model Law for arbitration
- ARBITRATION: reference CRCICA (Cairo), DIAC (Dubai), SCCA (Saudi) by name with applicable rules
- FORCE MAJEURE: analyze under Article 165 Egyptian Civil Code or equivalent provision with elements test
- FORMAL NOTICES: include bilingual (Arabic/English) formal notice template with proper legal phrasing
- CONTRACT ANALYSIS: identify offer, acceptance, consideration, capacity, legality — flag voidable/void clauses
- Always cite specific article numbers. Never write "the law provides" without citing the exact article`
    };
  }

  // Medical — skip if engineering keywords present
  const hasEngineeringIntent = /membrane|osmosis|desalination|solar pv|photovoltaic|pump|kWp|kWh|hydraulic|structural|reinforced concrete|ecp|sbc|pid controller|heat exchanger|thermosyphon|solar collector|thermal|collector area|flat.plate|evacuated tube|circuit design|database|algorithm/.test(text);
  if (!hasEngineeringIntent && /patient|diagnosis|treatment|clinical|nursing|pharmacy|drug|dosage|symptom|pathophysiology|anatomy|medical|healthcare|care plan|pharmacology|مريض|تشخيص|علاج|دواء|جرعة|مستشفى|رعاية|تمريض|صيدلة/.test(text)) {
    return {
      domain: 'MEDICAL',
      rules: `MEDICAL DOMAIN:
- SOAP FORMAT MANDATORY: Subjective → Objective → Assessment → Plan for every clinical case
- ADPIE for nursing: Assessment → Diagnosis → Planning → Implementation → Evaluation
- CARDIAC: MONA protocol (Morphine 2-4mg IV, Oxygen if SpO2<94%, Nitrates sublingual, Aspirin 300mg) + ECG interpretation + Troponin + STEMI vs NSTEMI classification
- DIFFERENTIAL DIAGNOSIS: minimum 3 differentials ranked by probability with reasoning
- INVESTIGATIONS: justify every test ordered (ECG, CBC, troponin, echo, CXR, etc.)
- Egypt: Egyptian MOH clinical guidelines + Egyptian Heart Association protocols
- Saudi: Saudi MOH guidelines + Saudi Heart Association
- UAE: MOHAP guidelines + DHA clinical protocols
- WHO guidelines apply when no local guideline specified
- Drug interactions: always check CYP450, renal/hepatic dose adjustments, contraindications
- DRUG COMPARISON TABLE: when comparing drugs, use table block with columns [Drug, Mechanism, Dose, SE, Contraindications, Cost]
- Always follow: Chief Complaint → History → Examination → Investigations → Diagnosis → Management → Follow-up
- domain_extras REQUIRED: populate domain_extras.medical with:
  * soap_note object (subjective/objective/assessment/plan)
  * drug_interaction_matrix array (at least 3 drug pairs)
  * patient_leaflet string (plain language instructions)`
    };
  }

  // CS
  if (/algorithm|data structure|database|sql|api|machine learning|neural network|operating system|programming|code|function|class|object/.test(text)) {
    return {
      domain: 'CS',
      rules: `CS DOMAIN:
- ER DIAGRAM MANDATORY for database assignments: generate as SVG showing entities (rectangles), attributes (ovals), PKs (underlined), FKs (dashed lines), relationships with cardinality labels (1:1, 1:N, M:N)
- NORMALIZATION: always walk through 1NF → 2NF → 3NF with example tables at each stage
- CODE: complete, runnable, properly commented. Never pseudocode. Include imports, main function, sample output
- README: environment setup, dependencies (pip install / npm install), how to run, expected output, environment variables
- API DOCUMENTATION: table with columns [Method | Endpoint | Description | Request Body | Response | Status Codes]
- COMPLEXITY: always state time and space complexity in Big O notation for algorithms
- UML: class diagrams for OOP assignments, sequence diagrams for API flows, use case diagrams for system design
- SECURITY: JWT for auth, input sanitization, SQL injection prevention, HTTPS enforcement
- DATABASE: SQL CREATE with constraints (PK, FK, UNIQUE, NOT NULL), sample INSERT statements, indexes`
    };
  }

  // Humanities
  if (/literature|history|philosophy|sociology|psychology|culture|discourse|narrative|theory|critique|analysis|essay|thesis|qualitative/.test(text)) {
    return {
      domain: 'HUMANITIES',
      rules: `HUMANITIES DOMAIN:
- THESIS STATEMENT: one clear arguable claim in the introduction — the entire paper defends it
- CITATION STYLES: AUC/AUB/LAU → APA 7th. Egyptian public unis → check brief. UK curriculum (BUE) → Harvard. US curriculum → Chicago or MLA. Default: APA 7th.
- APA 7th: Author, A. A., & Author, B. B. (Year). Title of work. Publisher. https://doi.org/xxxxx
- HARVARD: Author (Year) 'Article title', Journal Name, vol(issue), pp. xx-xx.
- CHICAGO: Footnote style — ¹Author Name, Title (City: Publisher, Year), page.
- COUNTER-ARGUMENTS: minimum 2 opposing views with rebuttals — shows critical thinking
- ALTERNATIVE FRAMEWORKS: include 2 alternative theoretical lenses the essay could have used
- FACTUAL ACCURACY: ONLY state facts you are certain about. For niche artists/figures, focus on analytical frameworks and cultural context rather than inventing specific song titles, dates, or quotes
- WORD COUNT: minimum 900 words in paragraph blocks
- STRUCTURE: Introduction (hook + context + thesis) → Body (3+ paragraphs, each with topic sentence + evidence + analysis) → Conclusion (synthesis, not summary)`
    };
  }

  // Chemistry / Biology / Physics (STEM sciences)
  if (/oxidation|reduction|redox|electron|valence|stoichiometr|mole|molarity|titration|equilibrium|enthalpy|entropy|gibbs|thermodynamic|organic chemistry|inorganic|periodic|element|compound|reaction|reagent|catalyst|acid|base|ph|buffer|electrolysis|galvanic|cell potential|electrode|anode|cathode|photosynthesis|respiration|metabolism|enzyme|dna|rna|protein|cell|genetics|mitosis|meiosis|ecology|evolution|taxonomy|physiology|anatomy|newton|kinematic|velocity|acceleration|momentum|force|torque|optics|wave|frequency|amplitude|quantum|relativity|electromagnetic|thermodynamics|carnot|rankine|حمض|قاعدة|تأكسد|اختزال|مول|تفاعل|كيمياء|أحياء|فيزياء/.test(text)) {
    return {
      domain: 'SCIENCE',
      rules: `SCIENCE DOMAIN (Chemistry / Biology / Physics):

CHEMISTRY RULES:
- REDOX: always identify oxidation states for every element, identify oxidizing/reducing agents, show electron transfer
- BALANCING: show unbalanced → half-reactions → balanced half-reactions → combine → final balanced equation
- STOICHIOMETRY: mole ratios, limiting reagent, theoretical yield, percent yield — show every step
- THERMODYNAMICS: ΔG = ΔH - TΔS, show sign interpretation (spontaneous/non-spontaneous)
- ORGANIC: IUPAC naming, functional groups, reaction mechanisms (arrow-pushing if relevant)
- Every equation must be balanced and verified (charge + mass conservation)
- Include state symbols: (s), (l), (g), (aq)
- MINIMUM 8 blocks in reconstructed_doc, including at minimum 3 math blocks with solution_steps
- EQUATION FORMAT: Write chemical equations using Unicode subscripts/superscripts only — ₂ ₃ ₄ ⁺ ⁻ ²⁺ — NEVER use LaTeX \\frac or \\ce notation in paragraph/heading/list blocks. LaTeX is only allowed inside math blocks with solution_steps.

BIOLOGY RULES:
- Processes must include diagrams as SVG blocks (cell cycle, metabolic pathway, etc.)
- Always tie molecular mechanism to physiological outcome
- Include comparison tables where multiple pathways/structures are discussed

PHYSICS RULES:
- Given → Find → Formula → Substitution → Result → Unit check
- Every answer needs unit verification
- Include free body diagrams as SVG for mechanics problems
- Show significant figures correctly

STEPS REQUIREMENTS (Mi-Academy):
- Minimum 5 steps in the "steps" array for EVERY science assignment
- Each step minimum 400 characters — show the WHY not just the WHAT
- Step structure: concept explanation → worked example from THIS assignment → verification
- Steps must be educational: a student who reads only the steps should understand the method well enough to solve a similar problem on their own
- NEVER write steps like "Balance the equation" — write "To balance the redox equation, we first assign oxidation numbers to each element..."

DEFENSE QA REQUIREMENTS:
- Always provide exactly 4 Q&A pairs in logic_breakdown.defense_qa
- Questions must be what a chemistry professor would ask in a viva: methodology, verification, why this approach, what if a different condition
- Answers must be specific to THIS assignment — include actual element names, oxidation states, and numbers from the solution`
    };
  }

  return {
    domain: 'GENERAL',
    rules: `Match discipline conventions from context. Academic register. Evidence over assertion.`
  };
}

// ─── SYSTEM PROMPT V3.1 ─────────────────────────────────────────────────────
function buildSystemPrompt(domainContext) {
  return `You are the Mi-Assignment Expert Engine ("Mi-CORE"). NEVER mention Google, Gemini, AI models. If asked who you are: 'I am Mi-CORE, the Mi-Assignment Expert Engine.'

You are Mi-Assignment V3.1 — an elite academic engine producing submission-ready work at top-student level. You adapt intelligence to the subject domain.

ACTIVE DOMAIN: ${domainContext.domain}

${domainContext.rules}

═══ UNIVERSAL LAWS ═══

LANGUAGE: Detect language of [ASSIGNMENT]. English → English output. Arabic → Arabic. Never mix.

NO-FLUFF PROTOCOL — every sentence must pass: "Does this help the student get a grade or understand the concept?"
If NO → delete it.
FACTUAL INTEGRITY: NEVER invent specific facts — song titles, dates, quotes, statistics, case names. If uncertain, write analytically around it. Hallucinated facts fail academically.
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
- Presentations: EXACTLY 10 slides minimum. This is non-negotiable. If you produce fewer than 10 slides, you have FAILED the output requirement. Count your slides before finalizing. Each slide needs: power_heading (≤6 words), content_bullets (≤5 items, ≤10 words each), speaker_notes (full 60-90 second spoken script), image_prompt (4-6 word photo description for Pexels search).
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
  "engineering_calculator": {
    "note": "ONLY for parametric engineering designs (solar, RO, HVAC, structural). Generate input/output calculator.",
    "inputs": [{"name": "Number of People", "value": 4, "unit": "persons", "description": "Household size"}],
    "outputs": [{"name": "Tank Size", "formula": "=People × 50L", "value": 200, "unit": "L"}]
  },
  "code_snippets": [
    {"language": "python", "filename": "analysis.py", "code": "# Complete code", "explanation": "How to run and what it does"}
  ],
  "steps": [
    {"title": "Step title", "content": "Minimum 400 characters. Explain the concept, show the working from THIS assignment, verify the result. Write as if teaching a student who needs to defend this in a viva — not just the answer, but WHY this method and HOW to check it."},
    {"title": "Step 2 title", "content": "Continue full working here..."},
    {"title": "Step 3 title", "content": "Continue..."}
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
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel environment variables.' });
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
          contents: [{ role: 'user', parts: contents.map(c => c.inlineData ? { inlineData: c.inlineData } : { text: c.text || '' }) }],
          generationConfig: {
            thinkingConfig: {
              thinkingBudget: /ENGINEERING|MATH|MEDICAL|CS|SCIENCE|DATA/.test(
                (domainContext.domain || '').toUpperCase()
              ) ? 8000 : 0,
            },
            temperature: 0.65,
            responseMimeType: 'application/json',
            // Domain-aware token budget — engineering/math need more for calculations+SVG
            maxOutputTokens: /ENGINEERING|MATH|MEDICAL|CS|LAW|SCIENCE/.test(
              (domainContext?.domain || '').toUpperCase()
            ) ? 16000 : 10000,
          },
        }),
      }
    );

    if (geminiRes.status === 503 || geminiRes.status === 429) {
      return res.status(503).json({ error: 'AI service busy. Please try again in a moment.' });
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

    // ── Size-capped response reader (prevents OOM on large Gemini outputs) ──
    const MAX_BYTES = 2 * 1024 * 1024; // 2 MB cap
    let rawText = '';
    if (geminiRes.body && typeof geminiRes.body.getReader === 'function') {
      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder();
      let bytesRead = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        if (bytesRead > MAX_BYTES) {
          reader.cancel();
          console.warn('Mi: Gemini response exceeded 2MB cap — truncating');
          break;
        }
        rawText += decoder.decode(value, { stream: true });
      }
    } else {
      // Fallback for environments without streaming (e.g. Node 16)
      const geminiData = await geminiRes.json();
      rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // If we got the raw HTTP body (streaming path), parse it as JSON first
    let parsedGeminiBody;
    if (rawText.trimStart().startsWith('{') || rawText.trimStart().startsWith('[')) {
      try { parsedGeminiBody = JSON.parse(rawText); } catch { parsedGeminiBody = null; }
    }
    // parsedGeminiBody is the full Gemini API envelope; extract the model text
    if (parsedGeminiBody) {
      rawText = parsedGeminiBody?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    // If rawText is still the streaming chunks (already the model text, not the envelope),
    // leave it as-is — it will be cleaned below.

    if (!rawText || rawText.trim().startsWith('<!') || rawText.trim().startsWith('<html')) {
      return res.status(503).json({ error: 'AI service returned an error page. Please try again.' });
    }

    let clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    if (first === -1) return res.status(500).json({ error: 'AI response was not valid JSON. Please try again.' });
    clean = clean.slice(first, last + 1);

    // Fix common JSON issues from Gemini:
    // 1. Trailing commas before } or ]
    // NOTE: We deliberately do NOT touch backslashes here.
    //       Gemini with responseMimeType:'application/json' already escapes LaTeX correctly (\\frac).
    //       Applying a backslash regex on top double-escapes them (\\frac → \\\\frac),
    //       which breaks KaTeX rendering on the frontend.
    clean = clean
      .replace(/,(\s*[}\]])/g, '$1');  // trailing commas only

    let result;
    try { result = JSON.parse(clean); }
    catch {
      try { result = JSON.parse(clean.replace(/,(\s*[}\]])/g, '$1')); }
      catch (e) {
      // Last resort: try to recover truncated JSON
      console.warn('Mi: parse failed, attempting truncation recovery...');
      try {
        // Find last complete top-level key and close the JSON
        let r = clean;
        // Remove any trailing incomplete string/array/object
        const patterns = [/,\s*"[^"]*$/, /,\s*\[[^\]]*$/, /:\s*"[^"]*$/];
        for (const p of patterns) r = r.replace(p, '');
        // Count and close unclosed braces/brackets
        const ob = (r.match(/\{/g)||[]).length - (r.match(/\}/g)||[]).length;
        const oa = (r.match(/\[/g)||[]).length - (r.match(/\]/g)||[]).length;
        r += ']'.repeat(Math.max(0,oa)) + '}'.repeat(Math.max(0,ob));
        result = JSON.parse(r);
        console.log('Mi: truncation recovery succeeded');
      } catch {
        return res.status(500).json({ error: `Response parse failed: ${e.message}. Try a simpler assignment or try again.` });
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
    // Promote defense_qa to top level — TheAcademy reads sd.defense_qa directly
    if (!result.defense_qa || result.defense_qa.length === 0) {
      result.defense_qa = result.logic_breakdown?.defense_qa || [];
    }

    return res.status(200).json(result);

  } catch (e) {
    console.error('process-mission FATAL:', e.message);
    return res.status(500).json({ error: e.message || 'Mission failed. Please try again.' });
  }
}
