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

// ─── SUBJECT ROUTER V1.0 ────────────────────────────────────────────────────
function buildSubjectContext(contents, missionType) {
  const fullText = contents.map(c => c.text || '').join(' ');
  const text = fullText.toLowerCase();
  const ctxMatch = fullText.match(/\[CONTEXT\]([^\[]+)/);
  const ctxLine = ctxMatch ? ctxMatch[1] : '';
  const detectedUni = (ctxLine.match(/University:\s*([^|\n]+)/i) || [])[1]?.trim() || '';
  const detectedMajor = (ctxLine.match(/Course[^:]*:\s*([^|\n]+)/i) || [])[1]?.trim() || '';
  const detectedCountry = (ctxLine.match(/Country:\s*([^|\n]+)/i) || [])[1]?.trim() || '';

  // ── MATH / STATISTICS — check FIRST before engineering (overlapping keywords) ───
  if (/calculus|integral|derivative|differentiat|marginal|optimization|maximiz|minimiz|profit function|cost function|demand function|correlation|standard deviation|regression|statistics|probability|hypothesis|normal distribution|binomial|poisson|variance|covariance|pearson|spearman|t-test|chi.square|anova|forecasting|predictive model|linear model|matrix|eigenvalue|fourier|laplace|\u0625\u062D\u0635\u0627\u0621|\u062A\u0641\u0627\u0636\u0644|\u062A\u0643\u0627\u0645\u0644|\u0627\u062D\u062A\u0645\u0627\u0644\u0627\u062A|\u0627\u0646\u062D\u062F\u0627\u0631|\u062A\u0648\u0632\u064A\u0639 \u0637\u0628\u064A\u0639\u064A/.test(text)) {
    return {
      domain: 'MATH_STATS',
      rules: `MATHEMATICS & STATISTICS DOMAIN:
- Show EVERY algebraic step. Never skip. Never say "it can be shown."
- Derive, don't state. Box final answers: \\boxed{x = 267}
- For optimization: Given → Find → Revenue → Cost → Profit → Differentiate → Set to zero → Verify with second derivative test
- If dataset referenced but not provided: GENERATE realistic synthetic data (24 rows minimum for statistics)
- Calculate ALL statistics with actual numbers: mean, deviations, squared deviations, sum of squares, Pearson formula with substituted values
- Standard deviation: show every sub-step — mean → deviations → squared → sum → divide → sqrt
- Interpret every result in context — what does r=-0.88 mean for THIS specific project/investor?
- Minimum 15 blocks in reconstructed_doc. Every math block needs solution_steps array (min 5 steps each).
- Table blocks must contain ACTUAL data rows, never empty shells.`
    };
  }

  // ── ENGINEERING — structural, civil, mechanical, chemical, solar, process ──────
  if (/reinforced concrete|beam design|slab design|column design|ecp 203|structural engineering|foundation design|steel design|load combination|dead load|live load|kn\/m\u00B2|\\bmpa\\b|egyptian code|aci 318|eurocode|bs 8110|moment distribution|shear force|bending moment|bbs|bar bending|rebar|stirrup|bar schedule|retaining wall|pid controller|mechanical engineering|thermodynamic|hydraulic engineering|electrical engineering|\u0647\u0646\u062F\u0633\u0629 \u0645\u062F\u0646\u064A\u0629|\u0647\u0646\u062F\u0633\u0629 \u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629|\u062E\u0631\u0633\u0627\u0646\u0629 \u0645\u0633\u0644\u062D\u0629|\u062D\u062F\u064A\u062F \u062A\u0633\u0644\u064A\u062D|\u0639\u0632\u0645 \u0627\u0646\u0639\u0637\u0627\u0641|\u0642\u0635|\u0623\u0633\u0627\u0633\u0627\u062A|reverse osmosis|desalination plant|membrane filtration|osmotic pressure|solar pv|photovoltaic|peak sun hours|kwp|kwh\/m|recovery ratio|permeate flux|brine discharge|feed water|salinity ppm|high.pressure pump|process flow diagram|pfd|chemical engineering|heat exchanger|distillation column|mass transfer|fluid mechanics|bernoulli equation|reynolds number|darcy.weisbach|turbine design|compressor design|reactor design|aerospace engineering|civil engineering project|water treatment plant/.test(text)) {
    return {
      domain: 'ENGINEERING',
      rules: `ENGINEERING DOMAIN:
- FORMAT MANDATORY: Given → Find → Assumptions → Solution (every sub-step) → Verify → Safety Factor
- SELF-CHECK: After each calculation state "✓ Check: [result] is reasonable because [reason]"
- Egypt: cite ECP 203-2018 by section number (e.g. "ECP 203 Section 4.2.1")
- Saudi: cite SBC 304 (concrete), SBC 301 (loads), SBC 601 (energy)
- UAE/International: BS 8110 or Eurocode 2 with clause references
- Units: always label (kN, kN/m\u00B2, m, mm, MPa, kWh, kWp, m\u00B3/day, °C, kJ/kg·°C)
- Safety factors: sliding ≥ 1.5, overturning ≥ 2.0, bearing capacity ≥ 3.0
- SVG DIAGRAMS MANDATORY: every engineering assignment needs at least ONE svg block
  * Structural: cross-section with bar marks, stirrup spacing, cover, dimension lines
  * Process systems (RO, solar, HVAC): full schematic showing all components, flow direction, labels
  * Solar: collector → pipe → tank with height differential (thermosyphon: min 30cm tank above collector)
  * Fluid: pipe schematic with flow rates, pressures, valve positions labeled
- BBS TABLE: when rebar/reinforcement/stirrups/\u062A\u0633\u0644\u064A\u062D/BBS appears, generate full table:
  Bar Mark | Shape Code | Dia (mm) | A | B | C | Cut Length (mm) | No. Bars | Total Length (m) | Weight (kg)
  BS 8666 shape codes: 00=straight, 11=L-bar, 21=U-bar, 51=closed stirrup
  Weight = (d²/162.2) × total length in metres
- SIZING CALCULATOR: for parametric designs, populate data_sheet with input variables and calculated outputs
- PRESENTATIONS: 10 slides minimum. Structure: Title/Hook → Problem + Given Data → Calculations (3 slides) → System Schematic → Results Summary → Recommendations → Conclusion
- PFD for process engineering assignments showing all unit operations, streams, control points`
    };
  }

  // ── BUSINESS / MANAGEMENT ─────────────────────────────────────────────────────
  // Guard: تحليل is too generic alone — require at least one specific business keyword
  if (/pestel|swot|porter|business plan|marketing strategy|competitive analysis|market analysis|financial model|cash flow|npv|irr|break.even|stakeholder|supply chain|balanced scorecard|\u062E\u0637\u0629 \u0623\u0639\u0645\u0627\u0644|(\u062A\u062D\u0644\u064A\u0644.*(\u0633\u0648\u0642|\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A|pestel|swot|\u0628\u064A\u0626\u064A))|\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629.*(\u0623\u0639\u0645\u0627\u0644|\u062A\u0633\u0648\u064A\u0642|\u0646\u0645\u0648)|\u062A\u0633\u0648\u064A\u0642|\u0631\u0628\u062D\u064A\u0629|\u0627\u0633\u062A\u062B\u0645\u0627\u0631/.test(text)) {
    return {
      domain: 'BUSINESS',
      rules: `BUSINESS DOMAIN:
- McKinsey/BCG standard: every claim backed by a number or logical deduction
- PESTEL MANDATORY as table block: headers=["Factor","Analysis","Impact Level"] with 6 rows (P,E,S,T,E,L)
- SWOT MANDATORY as table block: headers=["Category","Points"] 4 rows (Strengths, Weaknesses, Opportunities, Threats)
- Porter's Five Forces: use table block with headers=["Force","Intensity","Rationale"]
- NPV/IRR: show full DCF table — one row per year with CF, discount factor, PV. State WACC assumption.
- Executive Summary: exactly 3 sentences (Context → Key Finding → Recommendation)
- Financial figures: always include currency and time period
- Conclude with 3 specific, numbered, actionable recommendations
- domain_extras.business REQUIRED: executive_summary_200w + financial_projections + consumer_data`
    };
  }

  // ── LAW ───────────────────────────────────────────────────────────────────────
  if (/contract|tort|liability|negligence|jurisdiction|statute|plaintiff|defendant|case law|legal|legislation|breach|damages|constitutional|intellectual property|arbitration|irac|force majeure|\u0639\u0642\u062F|\u0645\u0633\u0626\u0648\u0644\u064A\u0629|\u0642\u0627\u0646\u0648\u0646|\u0645\u062D\u0643\u0645\u0629|\u062F\u0639\u0648\u0649|\u0642\u0636\u0627\u0626\u064A\u0629|\u062A\u0634\u0631\u064A\u0639|\u062A\u0639\u0648\u064A\u0636|\u0628\u0646\u062F|\u0646\u0632\u0627\u0639|\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0647\u0644\u0643|\u0645\u062F\u0646\u064A|\u062C\u0646\u0627\u0626\u064A|\u0628\u0631\u0627\u0621\u0629|\u0645\u0644\u0643\u064A\u0629 \u0641\u0643\u0631\u064A\u0629|\u0627\u0633\u062A\u0626\u0646\u0627\u0641|\u062D\u0643\u0645|\u0634\u0631\u064A\u0639\u0629|\u0642\u0627\u0646\u0648\u0646 \u0645\u062F\u0646\u064A|\u0642\u0627\u0646\u0648\u0646 \u062A\u062C\u0627\u0631\u064A/.test(text)) {
    return {
      domain: 'LAW',
      rules: `LAW DOMAIN:
- IRAC STRUCTURE MANDATORY: Issue → Rule → Application → Conclusion for EVERY legal question
- LEGAL MEMORANDUM FORMAT: To/From/Date/Re header → Executive Summary → Facts → Legal Analysis (IRAC) → Conclusion → Recommendations
- EGYPTIAN LAW: cite Egyptian Civil Code (Law 131/1948) by article number. Commercial Code (Law 17/1999). Labor Law (Law 12/2003). Consumer Protection (Law 181/2018).
- SAUDI LAW: cite Saudi Civil Transactions Law (Royal Decree M/191), Saudi Commercial Court Law, Vision 2030 regulatory framework
- UAE LAW: cite UAE Civil Transactions Code (Federal Law No. 5/1985), DIFC Law, UAE Commercial Companies Law
- INTERNATIONAL: cite CISG (UN Sales Convention), ICC Rules, UNCITRAL Model Law for arbitration
- ARBITRATION: reference CRCICA (Cairo), DIAC (Dubai), SCCA (Saudi) by name with applicable rules
- FORCE MAJEURE: analyze under Article 165 Egyptian Civil Code or equivalent with full elements test
- FORMAL NOTICES: include bilingual (Arabic/English) formal notice template where relevant
- CONTRACT ANALYSIS: identify offer, acceptance, consideration, capacity, legality — flag voidable/void clauses
- Always cite specific article numbers. NEVER write "the law provides" without citing the exact article
- domain_extras.law REQUIRED: irac object + case_references array + legal_framework string`
    };
  }

  // ── MEDICAL / NURSING / PHARMACY ──────────────────────────────────────────────
  const hasEngineeringIntent = /membrane|osmosis|desalination|solar pv|photovoltaic|pump|kwp|kwh|hydraulic|structural|reinforced concrete|ecp|sbc|pid controller|heat exchanger|thermosyphon|solar collector|thermal|collector area|flat.plate|evacuated tube|circuit design|database|algorithm/.test(text);
  if (!hasEngineeringIntent && /patient|diagnosis|treatment|clinical|nursing|pharmacy|drug|dosage|symptom|pathophysiology|anatomy|medical|healthcare|care plan|pharmacology|\u0645\u0631\u064A\u0636|\u062A\u0634\u062E\u064A\u0635|\u0639\u0644\u0627\u062C|\u062F\u0648\u0627\u0621|\u062C\u0631\u0639\u0629|\u0645\u0633\u062A\u0634\u0641\u0649|\u0631\u0639\u0627\u064A\u0629|\u062A\u0645\u0631\u064A\u0636|\u0635\u064A\u062F\u0644\u0629/.test(text)) {
    return {
      domain: 'MEDICAL',
      rules: `MEDICAL DOMAIN:
- SOAP FORMAT MANDATORY: Subjective → Objective → Assessment → Plan for every clinical case
- ADPIE for nursing: Assessment → Diagnosis → Planning → Implementation → Evaluation
- CARDIAC: MONA protocol (Morphine 2-4mg IV, Oxygen if SpO2<94%, Nitrates sublingual, Aspirin 300mg load) + ECG interpretation + Troponin trend + STEMI vs NSTEMI classification
- DIFFERENTIAL DIAGNOSIS: minimum 3 differentials ranked by probability with clinical reasoning
- INVESTIGATIONS: justify every test ordered (ECG, CBC, troponin, echo, CXR, renal function, etc.)
- Egypt: Egyptian MOH clinical guidelines + Egyptian Heart Association protocols
- Saudi: Saudi MOH guidelines + Saudi Heart Association + Vision 2030 Health Transformation
- UAE: MOHAP guidelines + Dubai Health Authority (DHA) clinical protocols
- WHO guidelines apply when no local guideline specified
- Drug interactions: check CYP450 pathway, renal/hepatic dose adjustments, contraindications
- DRUG COMPARISON TABLE: when comparing drugs, use table block: [Drug, Mechanism, Dose, Side Effects, Contraindications, Cost]
- Always follow: Chief Complaint → History → Examination → Investigations → Diagnosis → Management → Follow-up
- domain_extras.medical REQUIRED: soap_note object + drug_interaction_matrix (min 3 pairs) + patient_leaflet string`
    };
  }

  // ── COMPUTER SCIENCE / SOFTWARE ENGINEERING ───────────────────────────────────
  // Guard: avoid matching "system design" in non-CS contexts by requiring code-specific terms
  if (/algorithm|data structure|sql|rest api|endpoint|backend|frontend|web app|mobile app|machine learning|neural network|operating system|programming|oop|uml|er diagram|entity.*relationship|schema|crud|mvc|microservice|docker|authentication|jwt|middleware|\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A|\u0628\u0631\u0645\u062C\u0629|\u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0629|\u0643\u0648\u062F|(database(?!.*hospital administration|.*management system(?!.*software)))/.test(text) || /\bcode\b|\bfunction\b|\bclass\b|\bobject\b/.test(text)) {
    return {
      domain: 'CS',
      rules: `CS DOMAIN:
- ER DIAGRAM MANDATORY for database assignments: SVG showing entities (rectangles), attributes (ovals), PKs (underlined), FKs (dashed), relationships with cardinality (1:1, 1:N, M:N)
- NORMALIZATION: walk through 1NF → 2NF → 3NF with example tables at each stage showing the transformation
- CODE: complete, runnable, properly commented. NEVER pseudocode. Include: imports, main function, sample input/output
- README: environment setup, all dependencies (pip install / npm install), how to run, expected output, env variables
- API DOCUMENTATION: table block with columns [Method, Endpoint, Description, Request Body, Response, Status Codes]
- COMPLEXITY: state time AND space complexity in Big O notation for every algorithm
- UML: class diagrams for OOP, sequence diagrams for API flows, use case diagrams for system design
- SECURITY: mention JWT for auth, input sanitization, SQL injection prevention, HTTPS enforcement
- SQL: CREATE TABLE with all constraints (PK, FK, UNIQUE, NOT NULL, CHECK), sample INSERT, useful SELECT queries with JOINs
- domain_extras.data_science when ML/AI is involved: model_summary + hyperparameters + environment_setup`
    };
  }

  // ── SPORTS / CLUBS / ORGANIZATIONS ───────────────────────────────────────────
  if (/\u0646\u0627\u062F\u064A|\u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645|football|soccer|club|sport|player|match|league|champion|tournament|stadium|coach|season|trophy|\u0627\u0644\u0623\u0647\u0644\u064A|\u0627\u0644\u0632\u0645\u0627\u0644\u0643|barcelona|real madrid|al ahly|zamalek|\u0646\u0627\u062F\u064A \u0631\u064A\u0627\u0636\u064A|\u062F\u0648\u0631\u064A|\u0628\u0637\u0648\u0644\u0629|\u0645\u0628\u0627\u0631\u0627\u0629|\u0644\u0627\u0639\u0628|\u0645\u062F\u0631\u0628|\u0645\u0644\u0639\u0628|\u0643\u0623\u0633|\u062A\u0634\u0643\u064A\u0644|\u0645\u0648\u0633\u0645/.test(text)) {
    return {
      domain: 'SPORTS',
      rules: `SPORTS & ORGANIZATIONS DOMAIN:
- Write analytically: history, achievements, management strategy, digital transformation, financials, fan engagement
- Use management frameworks where relevant (SWOT, revenue streams, stakeholder mapping)
- DO NOT generate SQL, Python code, or data science appendices — this is NOT a data science assignment
- For presentations: 10 slides minimum. Structure: Hook/Title → Problem/Context → Analysis (3-4 slides) → Key Impact → Strategy/Future → Conclusion
- Each slide: power_heading (max 6 words, insight not label), content_bullets (3-5 bullets, max 12 words each with real numbers), speaker_notes (60-90 sec script), image_prompt (4-6 word Pexels-searchable phrase)
- Cite REAL verifiable statistics: trophy counts, revenue, social media followers, stadium capacity, win rates, attendance
- DATA SHEET: always populate data_sheet with a season-by-season or year-by-year stats table. For players: Season | Goals | Assists | Apps | Minutes | xG/90. For clubs: Season | Trophies | Revenue (£M) | Avg Attendance | League Position
- Tone: authoritative sports journalism meets management consulting`
    };
  }

  // ── HUMANITIES — Literature, History, Philosophy, Sociology ──────────────────
  // Guard: "analysis" and "theory" alone are too generic — require domain-specific terms
  if (/literature|literary|philosophy|sociology|anthropology|cultural studies|discourse analysis|narrative theory|postcolonial|feminism|marxism|psychoanalysis|historiography|\u0639\u0644\u0645 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639|\u0641\u0644\u0633\u0641\u0629|\u0623\u062F\u0628|\u0646\u0642\u062F \u0623\u062F\u0628\u064A|\u062F\u0631\u0627\u0633\u0627\u062A \u062B\u0642\u0627\u0641\u064A\u0629/.test(text) || (/\b(history|historical|thesis)\b/.test(text) && !/engineering|medical|business|law|computer|sport|marketing|digital/.test(text))) {
    return {
      domain: 'HUMANITIES',
      rules: `HUMANITIES DOMAIN:
- THESIS STATEMENT: one clear arguable claim in the introduction — entire paper defends it
- CITATION STYLES: AUC/AUB/LAU → APA 7th. Egyptian public unis → check brief. BUE → Harvard. US curriculum → Chicago/MLA. Default: APA 7th.
- APA 7th: Author, A. A. (Year). Title. Publisher. https://doi.org/xxxxx
- HARVARD: Author (Year) 'Title', Journal, vol(issue), pp. xx-xx.
- COUNTER-ARGUMENTS: minimum 2 opposing views with rebuttals — demonstrates critical thinking
- ALTERNATIVE FRAMEWORKS: include 2 alternative theoretical lenses considered
- FACTUAL ACCURACY: ONLY state verifiable facts. For niche figures/works, focus on frameworks and context — never invent quotes, dates, or titles.
- WORD COUNT: minimum 900 words in paragraph blocks
- STRUCTURE: Introduction (hook + context + thesis) → Body (3+ paragraphs: topic sentence + evidence + analysis) → Conclusion (synthesis, not summary)
- domain_extras.humanities REQUIRED: thesis_statement + counter_arguments + primary_sources`
    };
  }

  // ── Country/university curriculum anchors for GENERAL ────────────────────────
  const getCountryStandards = (country, uni) => {
    const c = country.toLowerCase(), u = uni.toLowerCase();
    if (c.includes('egypt') || u.includes('cairo') || u.includes('ain shams') || u.includes('guc') || u.includes('auc') || u.includes('bue') || u.includes('miu')) {
      if (u.includes('auc') || u.includes('bue') || u.includes('guc')) return 'International standards (AUC=US, GUC=German, BUE=British). APA 7th default. English academic register.';
      return 'Egyptian academic standards. Reference ECP 203 for structures, Egyptian Civil Code for law. Arabic or English per assignment language.';
    }
    if (c.includes('saudi') || u.includes('kfupm') || u.includes('king') || u.includes('kaust') || u.includes('alfaisal'))
      return 'Saudi academic standards. Reference SBC, Saudi Green Initiative, Vision 2030 frameworks. SI units.';
    if (c.includes('uae') || u.includes('uaeu') || u.includes('aus') || u.includes('zayed') || u.includes('khalifa'))
      return 'UAE academic standards. Reference UAE Building Code, UAE Vision 2031 for business context.';
    if (c.includes('kuwait')) return 'Kuwait academic standards. GCC standards.';
    if (c.includes('jordan')) return 'Jordanian academic standards. Jordanian Building Code.';
    return 'International academic standards. Internationally recognized codes and frameworks.';
  };

  const curriculumNote = [
    detectedUni ? `University: ${detectedUni} — ${getCountryStandards(detectedCountry, detectedUni)}` : '',
    detectedMajor ? `Major: ${detectedMajor} — use discipline-specific terminology and assessment criteria` : '',
    detectedCountry && !detectedUni ? `Country: ${detectedCountry} — ${getCountryStandards(detectedCountry, '')}` : '',
  ].filter(Boolean).join('\n');

  // ── MULTI-DOMAIN detection ────────────────────────────────────────────────────
  const domainScores = {
    MEDICAL: /patient|diagnosis|stroke|hemiparesis|triage|ct scan|tpa|thrombolytic|ischemic|hemorrhagic|fast assessment|symptom|pathophysiology|anatomy|medical|healthcare|care plan|pharmacology|\u0645\u0631\u064A\u0636|\u062A\u0634\u062E\u064A\u0635|\u0639\u0644\u0627\u062C|\u062F\u0648\u0627\u0621/.test(text) ? 1 : 0,
    ENGINEERING: /retaining wall|ecp|lateral earth pressure|safety factor|pid controller|reinforced concrete|beam|slab|column|structural|foundation|steel design|load|moment|shear|\u0647\u0646\u062F\u0633\u0629 \u0645\u062F\u0646\u064A\u0629/.test(text) ? 1 : 0,
    BUSINESS: /pestel|swot|npv|irr|feasibility|market analysis|financial model|cash flow|investment/.test(text) ? 1 : 0,
    MATH_STATS: /correlation|calculus|optimization|standard deviation|regression|statistical/.test(text) ? 1 : 0,
  };
  const activeDomainsCount = Object.values(domainScores).filter(v => v > 0).length;
  const activeDomains = Object.entries(domainScores).filter(([,v]) => v > 0).map(([k]) => k);

  if (activeDomainsCount >= 2) {
    return {
      domain: 'MULTI: ' + activeDomains.join('+'),
      rules: `MULTI-DOMAIN ASSIGNMENT: ${activeDomains.join(' + ')}
CRITICAL: This assignment covers MULTIPLE domains. Address EVERY part completely with separate headed sections.
${domainScores.MEDICAL ? 'MEDICAL: SOAP note, FAST protocol, clinical terminology, ADPIE if nursing.' : ''}
${domainScores.ENGINEERING ? 'ENGINEERING: ECP 203 references, full calculation steps, safety factors.' : ''}
${domainScores.BUSINESS ? 'BUSINESS: PESTEL/SWOT as table blocks, NPV/IRR with DCF shown.' : ''}
${domainScores.MATH_STATS ? 'MATH: Show every algebraic step, LaTeX notation, boxed final answers.' : ''}
${curriculumNote ? 'CURRICULUM: ' + curriculumNote : ''}
OUTPUT: reconstructed_doc must have separate headed sections for EACH part.`
    };
  }

  // ── GENERAL fallback ──────────────────────────────────────────────────────────
  return {
    domain: 'GENERAL',
    rules: `GENERAL ACADEMIC DOMAIN:
- Match the discipline conventions from the assignment context
- Academic register: confident, evidence-based, no filler phrases
- DO NOT generate SQL, Python, or code blocks unless explicitly asked for code
- DO NOT add technical appendices (model audits, hyperparameter tables) unless asked
- FOR PRESENTATIONS: presentation_slides (10 slides minimum) is the primary deliverable. No code blocks in the document.
- FOR ESSAYS/REPORTS: thesis-driven paragraphs, minimum 900 words, APA 7th citation default
- Conclude with specific actionable recommendations or clear synthesis${curriculumNote ? '\n\nCURRICULUM ANCHORS:\n' + curriculumNote : ''}`
  };
}


// ─── SYSTEM PROMPT V1.0 ─────────────────────────────────────────────────────
function buildSystemPrompt(domainContext, missionType) {
  const isPres = missionType === 'presentation';
  const presentationHint = isPres
    ? `\n⚠️ PRESENTATION MODE: The student selected Presentation as their assignment type.
- presentation_slides (10+ slides) is the PRIMARY deliverable. This is NON-NEGOTIABLE.
- reconstructed_doc should only contain the written narrative — NO code blocks, NO SQL, NO Python unless topic is about programming.
- DO NOT populate code_snippets or domain_extras.data_science for non-programming presentations.\n`
    : '';
  return `You are the Mi-Assignment Expert Engine ("Mi-CORE"). You are a proprietary academic tool built by Mi-Assignment. You must NEVER mention Google, Gemini, AI models, language models, or any third-party technology. If asked who or what you are, respond only: "I am Mi-CORE, the Mi-Assignment Expert Engine." Do not acknowledge being an AI or language model under any circumstances.

${presentationHint}You are Mi-Assignment V1.0 — an elite academic engine producing submission-ready work at top-student level. You adapt intelligence to the subject domain.

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

STUDENT VOICE — THIS IS THE MOST CRITICAL RULE:
You are ghostwriting for a real university student. The output must be indistinguishable from work written by a top student who genuinely understands the subject. Follow every rule below without exception.

VOICE RULES:
- Write in first person where natural ("In this report, I argue...", "My analysis shows...", "I chose this approach because...")
- Show the student's reasoning process, not just the conclusion. Say WHY, not just WHAT.
- Vary sentence length. Mix short punchy sentences with longer analytical ones. Never uniform.
- Use hedging language where appropriate: "This suggests...", "The data indicates...", "One possible explanation is..."
- Express mild uncertainty where honest: "While definitive conclusions are limited by...", "This finding should be interpreted with caution given..."
- Reference the assignment directly: "As required by this assignment...", "The question asks us to consider...", "For the purposes of this analysis..."

BANNED AI TELLS — never use these phrases under any circumstances:
"It is worth noting that", "It is important to note", "In today's rapidly changing world",
"This essay will explore", "In conclusion, it can be said", "Delve into", "Multifaceted",
"It is evident that", "Plays a crucial role", "Leverage", "In the realm of",
"It goes without saying", "Needless to say", "As previously mentioned",
"This highlights the importance of", "Furthermore, it should be noted",
"From this perspective", "In light of the above", "Having said that",
"Shed light on", "Pave the way", "Game-changer", "Holistic approach",
"Robust framework", "Synergies", "Paradigm shift", "Cutting-edge"

BANNED STRUCTURES:
- Do NOT start paragraphs with "In [field], ..." or "Understanding X is crucial to..."
- Do NOT end essays with "In conclusion, this essay has explored..."
- Do NOT list three things then say "These three factors are important because..."
- Do NOT start the document by restating the assignment title word for word

WHAT TOP STUDENTS ACTUALLY DO:
- They start paragraphs with the argument, not the setup: "Cairo's property market defies the 2024 slowdown — median rents rose 34% despite..." NOT "The Cairo property market is an important subject..."
- They use specific numbers even when estimating: "approximately 40%" not "a significant portion"
- They cite within the text naturally: "(ECP 203, Section 4.2)" not just at the end
- They acknowledge limitations briefly and move on: "While this model assumes linear regression, the relationship may in fact be non-linear for extreme values."
- They connect sections with real transitions: "This cost structure directly explains why..." not just "Moving on to the next point..."
- Arabic student voice: formal but not stiff. Use active voice. Avoid مما سبق يتضح and إن من أهم ما يمكن استخلاصه

OUTPUT QUANTITY:
- Essays/Reports: minimum 900 words across all paragraph blocks
- Math assignments: minimum 5 solution_steps per math block
- Presentations: EXACTLY 10 slides minimum. This is non-negotiable. If you produce fewer than 10 slides, you have failed.
- SLIDE CONTENT RULES (critical for visual quality):
  * power_heading: MAX 6 words. Must be an INSIGHT not a label. Bad: "Introduction to Topic". Good: "Cairo Rents Up 34% in 2024".
  * content_bullets: EXACTLY 5 bullets. Each bullet 8-12 words. Must include a specific stat, name, or data point. No vague bullets. Example: '3.2M Spotify listeners — Wegz leads Arabic rap globally' not 'Artists have many followers'
  * narrative: 2 sentences max. Sets context for the speaker. NOT a repeat of the bullets.
  * speaker_notes: Full 60-90 second verbatim speech. Complete sentences. What the student actually says out loud.
  * image_prompt: 4-6 words for a REAL Pexels stock photo search. Rules:
    - MUST include the actual subject: "Mohamed Salah Liverpool stadium", "Cairo skyline aerial night", "Egyptian judge courtroom"
    - NEVER use abstract academic words: "analysis", "methodology", "statistics", "data", "framework", "concept"
    - NEVER use words that return stock chart photos: "financial data", "business graph", "market statistics"  
    - USE concrete visual subjects: real places, real actions, real objects
    - Sports: "football match crowd stadium", "player celebration goal", "training session pitch"
    - Business: "modern office meeting", "retail store customers", "factory production line"
    - Medical: "hospital emergency room", "doctor patient consultation", "surgery operating theater"
    - Engineering: "construction site crane", "solar panels rooftop installation", "concrete bridge structure"
    - Law: "courtroom judge gavel", "contract signing desk", "scales of justice"
    - Each slide MUST have a DIFFERENT image_prompt — never repeat the same query across slides
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
  "solution_text": "2-3 sentences. Written in student voice. State what was done and the key finding. Example: 'This report analyses X and finds Y. My calculations show Z, which suggests the optimal approach is...'  NOT: 'This solution explores the multifaceted aspects of...'", 
  "assignment_type": "essay|report|case_study|presentation|research_paper|math|physics|engineering|chemistry|biology|computer_science|data_analysis|sql_database|business_plan|lab_report|literature_review|law|nursing|other",
  "domain": "${domainContext.domain}",
  "reconstructed_doc": {
    "title": "Full assignment title",
    "word_count": 0,
    "blocks": [
      {"type": "heading", "content": "Section Title", "level": 1},
      {"type": "paragraph", "content": "Full paragraph in student voice — start with the argument or finding, not setup. Topic sentence + evidence + analysis + so-what. Min 80 words. Never a placeholder. Never start with 'It is important to note' or 'In today's world'"},
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
    const { contents, lang, missionType = 'other' } = body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Missing contents array' });
    }

    // ── Sanitize all text fields — strip hidden unicode AI watermarks ────────
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return text;
      // Remove hidden AI watermark characters using char codes (no literal unicode in source)
      return text.split('').filter(ch => {
        const c = ch.charCodeAt(0);
        if (c === 0x200B || c === 0x200C || c === 0x200D || c === 0x200E || c === 0x200F) return false;
        if (c >= 0x2060 && c <= 0x2064) return false;
        if (c === 0xFEFF) return false;
        if (c >= 0x202A && c <= 0x202E) return false;
        if (c === 0x2028 || c === 0x2029) return false;
        if (c === 0x00AD) return false;
        return true;
      }).join('').replace(/\xa0/g, ' ').replace(/\u202f/g, ' ').trim();
    };

    const sanitizeDeep = (obj) => {
      if (typeof obj === 'string') return sanitizeText(obj);
      if (Array.isArray(obj)) return obj.map(sanitizeDeep);
      if (obj && typeof obj === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(obj)) out[k] = sanitizeDeep(v);
        return out;
      }
      return obj;
    };

    const domainContext = buildSubjectContext(contents, missionType);
    const systemPrompt = buildSystemPrompt(domainContext, missionType);

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
    const isHeavyDomain = /ENGINEERING|MATH|MEDICAL|CS|SCIENCE|DATA/.test((domainContext.domain || '').toUpperCase());
    const geminiPayload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: {
        // Only set thinkingBudget for domains that support it — omit entirely otherwise
        ...(isHeavyDomain ? { thinkingConfig: { thinkingBudget: 8000 } } : {}),
        temperature: 0.65,
        topP: 0.85,
        topK: 40,
        responseMimeType: 'application/json',
        // Domain-aware token budget
        maxOutputTokens: /ENGINEERING|MATH|MEDICAL|CS|LAW/.test(
          (domainContext?.domain || '').toUpperCase()
        ) ? 16000 : 10000,
      },
    };

    // Model waterfall — try each model with 55s timeout
    // If one hangs or 503s, move to the next immediately
    const MODEL_WATERFALL = [
      'gemini-3-flash-preview',
      'gemini-2.0-flash',
    ];

  let geminiRes = null;
  let lastError = '';

  for (const model of MODEL_WATERFALL) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
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

    // Strip all hidden unicode chars from every text field before sending
    const cleanResult = sanitizeDeep(result);
    return res.status(200).json(cleanResult);

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
