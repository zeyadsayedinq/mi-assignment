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
  // ── HARDCODED CURRICULUM DATABASE ────────────────────────────────────────────
  // Keyed by university/country, contains domain-specific standards per institution
  const CURRICULUM = {
    // ── EGYPT: PUBLIC UNIVERSITIES ──────────────────────────────────────────────
    'cairo': {
      style: 'Egyptian public university. Arabic-first. Formal فصحى.',
      engineering: 'ECP 203-2018 (concrete), ECP 201 (loads), ECP 205 (steel). Cite by section number. SI units. Safety factors: sliding≥1.5, overturning≥2.0, bearing≥3.0. Report format: Given→Find→Assumptions→Solution→Verify.',
      medical: 'Egyptian MOH clinical guidelines. Egyptian Heart Association protocols. MOHP drug formulary. Cairo University Faculty of Medicine grading rubric: Introduction→Case History→Examination→Investigations→Diagnosis→Management→Follow-up.',
      law: 'Egyptian Civil Code (Law 131/1948). Egyptian Commercial Code (Law 17/1999). Egyptian Labor Law (Law 12/2003). Consumer Protection Law (181/2018). Cite articles by number. Format: IRAC. Courts: Ibtidaʾi→Istinaf→Naqd.',
      business: 'Egyptian Exchange (EGX) references. Central Bank of Egypt (CBE) rates. Egyptian Competition Authority. CAPMAS data for demographics. Currency: EGP. Fiscal year: July-June.',
      cs: 'Standard IEEE/ACM curriculum. Arabic UI considerations. Egyptian e-government API standards. Focus on practical implementation.',
      math: 'Egyptian national curriculum standards. Show full Arabic mathematical notation where applicable. Reference Egyptian university exam format.',
      citation: 'Arabic essays: no specific style enforced — use inline references. English essays: APA 7th.',
    },
    'ain_shams': {
      style: 'Egyptian public university. Arabic-first. Similar to Cairo University standards.',
      engineering: 'ECP 203-2018. Ain Shams Faculty of Engineering known for soil mechanics and geotechnical focus. Reference ECP 202 (soil).',
      medical: 'Ain Shams University Hospital protocols. Egyptian MOH guidelines. Strong clinical case study tradition.',
      law: 'Egyptian Civil Code. Ain Shams Faculty of Law focuses on comparative law (Egyptian + French civil law tradition).',
      business: 'Ain Shams Faculty of Commerce standards. Focus on Egyptian market analysis.',
      citation: 'APA 7th for English. No strict style for Arabic.',
    },
    'alexandria': {
      style: 'Egyptian public university. Arabic-first. Mediterranean academic tradition.',
      engineering: 'ECP 203-2018. Alexandria known for marine/coastal engineering. Reference coastal engineering standards.',
      medical: 'Alexandria University Medical School protocols. Egyptian MOH guidelines.',
      citation: 'APA 7th for English.',
    },
    'mansoura': {
      style: 'Egyptian public university. Arabic-first. Known for medicine and engineering.',
      medical: 'Mansoura University Hospital (MUCH) protocols. Transplant surgery pioneer institution. Reference Egyptian MOH + MUCH clinical pathways.',
      engineering: 'ECP 203-2018. Delta region construction considerations.',
      citation: 'APA 7th for English.',
    },
    'helwan': {
      style: 'Egyptian public university. Arabic-first. Strong in applied arts and engineering.',
      engineering: 'ECP 203-2018. Industrial engineering focus.',
      citation: 'APA 7th for English.',
    },
    'azhar': {
      style: 'Al-Azhar University. Arabic. Islamic academic tradition. Sharia law framework.',
      law: 'Islamic Sharia law primary source. Egyptian Civil Code as secondary. Quran + Sunnah citations. Fiqh schools: Hanafi (Egypt official), Maliki, Shafi\'i, Hanbali.',
      citation: 'Classical Islamic citation style. APA 7th for scientific papers.',
    },

    // ── EGYPT: PRIVATE/INTERNATIONAL UNIVERSITIES ───────────────────────────────
    'guc': {
      style: 'German University in Cairo. English and German. German academic standards. Structured, precise, formal.',
      engineering: 'Eurocode 2 (EN 1992) for concrete, Eurocode 3 (EN 1993) for steel, Eurocode 7 (EN 1997) for geotechnical. German DIN standards where applicable. SI units strictly. Format: Aufgabe→Lösung→Kontrolle or Given→Required→Solution→Check.',
      business: 'German business frameworks. Porter\'s Five Forces, BCG Matrix. DIN ISO standards. European market context alongside Egyptian.',
      cs: 'German software engineering standards. UML mandatory. Clean code principles (German precision culture). IEEE documentation.',
      citation: 'German citation style or APA 7th. IEEE for engineering.',
      grading: 'German grading: 1 (sehr gut) to 5 (nicht bestanden). GPA equivalent.',
    },
    'auc': {
      style: 'American University in Cairo. English only. American liberal arts tradition. Writing-intensive.',
      engineering: 'ACI 318 (concrete), AISC (steel), ASCE 7 (loads). US customary or SI units. ABET outcomes.',
      medical: 'US clinical guidelines. UpToDate references. AHA/ACC protocols.',
      law: 'Common law tradition + Egyptian Civil Code. Case-based analysis. Bluebook citation.',
      business: 'Harvard Business School case method. US GAAP accounting. AUC School of Business standards.',
      cs: 'US ACM/IEEE curriculum. Python/Java focus. Agile methodology.',
      humanities: 'Chicago/MLA citation. Writing Center standards. Thesis-driven. Peer review required.',
      citation: 'APA 7th default. Chicago for humanities. IEEE for engineering.',
      grading: 'US GPA 4.0 scale. Letter grades A-F.',
    },
    'bue': {
      style: 'British University in Egypt. English only. British academic standards.',
      engineering: 'BS 8110 (concrete), BS 5950 (steel), Eurocode as supplement. British Standards Institution (BSI).',
      law: 'English common law + Egyptian Civil Code. OSCOLA citation. Essay-based exams.',
      business: 'UK business frameworks. ACCA/CIMA accounting standards. UK market context.',
      cs: 'BCS (British Computer Society) standards. Object-oriented focus.',
      citation: 'Harvard referencing (Leeds style). OSCOLA for law.',
      grading: 'UK grading: First (70%+), 2:1 (60-69%), 2:2 (50-59%), Third (40-49%).',
    },
    'miu': {
      style: 'Misr International University. English-medium. American-style curriculum.',
      engineering: 'ACI 318, ASCE 7. American standards.',
      business: 'American business education model.',
      citation: 'APA 7th.',
      grading: 'US GPA scale.',
    },
    'msa': {
      style: 'MSA University. English-medium. British-accredited programs.',
      citation: 'Harvard referencing.',
      grading: 'UK grading scale.',
    },
    'must': {
      style: 'Misr University for Science and Technology. Arabic and English.',
      engineering: 'ECP 203-2018. Applied focus.',
      citation: 'APA 7th for English.',
    },
    'future': {
      style: 'Future University in Egypt. Arabic and English.',
      citation: 'APA 7th.',
    },
    'october6': {
      style: 'October 6 University. Arabic-first.',
      engineering: 'ECP 203-2018.',
      citation: 'APA 7th for English.',
    },
    'aast': {
      style: 'Arab Academy for Science, Technology and Maritime Transport. English-medium. Strong maritime and engineering focus.',
      engineering: 'International maritime standards (IMO, SOLAS). Lloyd\'s Register. ACI/AISC for civil/structural.',
      cs: 'IEEE standards. Network engineering focus.',
      citation: 'IEEE for engineering. APA 7th.',
    },
    'nile': {
      style: 'Nile University. English-medium. Research-focused. Technology and entrepreneurship.',
      cs: 'Research-oriented. IEEE standards. Machine learning and AI focus.',
      business: 'Technology entrepreneurship. Egyptian startup ecosystem context.',
      citation: 'IEEE for tech. APA 7th.',
    },

    // ── SAUDI ARABIA ────────────────────────────────────────────────────────────
    'kfupm': {
      style: 'King Fahd University of Petroleum and Minerals. English-medium. US-style ABET-accredited. Engineering and petroleum focus.',
      engineering: 'SBC 304 (concrete), SBC 301 (loads), SBC 601 (energy). Saudi Aramco Engineering Standards (SAES) for petroleum. API standards for oil/gas. SABIC standards for petrochemicals. SI units.',
      cs: 'ACM/IEEE curriculum. KFUPM known for computing research.',
      math: 'US university math curriculum. Rigorous proof-based.',
      business: 'Vision 2030 frameworks. Saudi investment frameworks. GOSI, ZATCA regulations.',
      citation: 'APA 7th. IEEE for engineering.',
      grading: 'US GPA 4.0 scale.',
    },
    'ksu': {
      style: 'King Saud University. Arabic and English. Saudi MOE standards.',
      engineering: 'SBC 304, SBC 301. Saudi standards.',
      medical: 'Saudi MOH clinical guidelines. Saudi Heart Association. NCBE (National Competency-Based Exam) preparation.',
      law: 'Saudi legal system: Sharia law primary. Basic Law of Governance. Labor Law (Royal Decree M/51). HRSD regulations.',
      business: 'Vision 2030. Saudi market. Tadawul (Saudi Exchange) references.',
      citation: 'APA 7th for English. No strict style for Arabic.',
    },
    'kaust': {
      style: 'King Abdullah University of Science and Technology. English only. Graduate research institution. International faculty. Highest academic standards.',
      engineering: 'International standards. Nature/Science level research quality. Computational methods emphasized.',
      cs: 'Cutting-edge AI/ML research. Top-tier conference standards (NeurIPS, ICML, CVPR).',
      math: 'Graduate-level rigor. Proof-based.',
      citation: 'Nature/IEEE/ACM citation styles.',
      grading: 'Research output based.',
    },
    'alfaisal': {
      style: 'Alfaisal University. English-medium. American model. Riyadh.',
      engineering: 'ABET-accredited. SBC + ACI/AISC.',
      business: 'American business school model. Vision 2030 context.',
      citation: 'APA 7th. IEEE for engineering.',
    },
    'psu_saudi': {
      style: 'Prince Sultan University. English-medium. Riyadh.',
      citation: 'APA 7th.',
    },
    'iau': {
      style: 'Imam Abdulrahman Bin Faisal University. Arabic and English. Eastern Province.',
      medical: 'Saudi MOH guidelines. Dammam Medical Complex protocols.',
      citation: 'APA 7th for English.',
    },
    'umm_al_qura': {
      style: 'Umm Al-Qura University. Arabic-first. Mecca. Islamic studies focus.',
      law: 'Islamic Sharia law. Saudi legal system.',
      citation: 'Classical Islamic + APA 7th.',
    },

    // ── UAE ──────────────────────────────────────────────────────────────────────
    'uaeu': {
      style: 'UAE University. Arabic and English. UAE national university. Al Ain.',
      engineering: 'UAE Building Code (UAEBC). Dubai Building Code (DBC). Abu Dhabi International Building Code (ADIBC). Estidama (green building) standards. SI units.',
      medical: 'MOHAP (UAE Ministry of Health and Prevention) guidelines. DHA (Dubai Health Authority) protocols. HAAD (Abu Dhabi) standards.',
      law: 'UAE Civil Transactions Code (Federal Law No. 5/1985). DIFC Law. UAE Commercial Companies Law (Federal Law No. 2/2015). UAE Labor Law (Federal Decree-Law No. 33/2021).',
      business: 'UAE Vision 2031. Dubai Economic Agenda D33. Free zone regulations (DMCC, DIFC, ADGM). AED currency.',
      citation: 'APA 7th. IEEE for engineering.',
    },
    'aus': {
      style: 'American University of Sharjah. English only. ABET/AACSB accredited. US academic standards.',
      engineering: 'ABET outcomes. ACI 318, AISC, ASCE 7. UAE Building Code for local context.',
      business: 'AACSB standards. Case-based. UAE and Gulf market context.',
      humanities: 'Liberal arts tradition. Chicago/MLA.',
      citation: 'APA 7th. Chicago for humanities. IEEE for engineering.',
      grading: 'US GPA 4.0.',
    },
    'khalifa': {
      style: 'Khalifa University. English-medium. Abu Dhabi. Research-intensive. Masdar City partnership.',
      engineering: 'Advanced research standards. Sustainability focus. Masdar clean energy context. UAE Building Code.',
      cs: 'AI and robotics research focus. IEEE standards.',
      citation: 'IEEE. APA 7th.',
    },
    'zayed': {
      style: 'Zayed University. English-medium. Abu Dhabi and Dubai. Professional focus.',
      business: 'Communication and business focus. UAE Vision 2031.',
      citation: 'APA 7th.',
    },
    'sharjah': {
      style: 'University of Sharjah. Arabic and English.',
      engineering: 'UAE Building Code.',
      medical: 'MOHAP guidelines.',
      citation: 'APA 7th.',
    },
    'hct': {
      style: 'Higher Colleges of Technology. English-medium. Applied/vocational focus. UAE.',
      citation: 'APA 7th.',
    },

    // ── KUWAIT ───────────────────────────────────────────────────────────────────
    'kuwait_uni': {
      style: 'Kuwait University. Arabic and English. Kuwait national university.',
      engineering: 'Kuwait Municipality building codes. GCC standards. KUNA references.',
      medical: 'Kuwait MOH guidelines. Kuwait Cancer Control Center (KCCC) for oncology.',
      law: 'Kuwait Civil Code. Kuwaiti Commercial Law.',
      business: 'Kuwait stock market (Boursa Kuwait). KD currency. Gulf market.',
      citation: 'APA 7th for English.',
    },
    'gust': {
      style: 'Gulf University for Science and Technology. English-medium. US-model. Kuwait.',
      citation: 'APA 7th. IEEE for engineering.',
      grading: 'US GPA 4.0.',
    },
    'auk': {
      style: 'American University of Kuwait. English-medium. Liberal arts. US model.',
      citation: 'APA 7th. Chicago for humanities.',
    },

    // ── BAHRAIN ──────────────────────────────────────────────────────────────────
    'uob': {
      style: 'University of Bahrain. Arabic and English.',
      engineering: 'Bahrain building regulations. GCC standards.',
      business: 'Bahrain Economic Vision 2030. BHD currency. Bahrain Bourse.',
      citation: 'APA 7th.',
    },
    'ama_bahrain': {
      style: 'AMA International University Bahrain. English-medium.',
      citation: 'APA 7th.',
    },
    'rcsi_bahrain': {
      style: 'RCSI Bahrain. English. Irish medical education model.',
      medical: 'Irish/UK clinical guidelines. RCSI standards. NICE guidelines apply.',
      citation: 'Vancouver/APA 7th.',
    },

    // ── JORDAN ───────────────────────────────────────────────────────────────────
    'jordan_uni': {
      style: 'University of Jordan. Arabic-first. Jordan national university. Amman.',
      engineering: 'Jordanian Building Code (JBC). Arabic standards.',
      medical: 'Jordanian MOH guidelines. Royal Medical Services (RMS) protocols.',
      law: 'Jordanian Civil Code (Law No. 43/1976). Jordan Companies Law.',
      business: 'Amman Stock Exchange (ASE). JD currency.',
      citation: 'APA 7th for English.',
    },
    'yarmouk': {
      style: 'Yarmouk University. Arabic-first. Irbid, Jordan.',
      citation: 'APA 7th.',
    },
    'just': {
      style: 'Jordan University of Science and Technology. English-medium. ABET. Irbid.',
      engineering: 'ABET. JBC + international standards.',
      medical: 'JUST Faculty of Medicine. Jordanian MOH.',
      citation: 'APA 7th. IEEE for engineering.',
    },
    'gju': {
      style: 'German-Jordanian University. English and German. German academic model.',
      engineering: 'Eurocode + Jordanian standards.',
      business: 'German business frameworks.',
      citation: 'APA 7th. German citation style.',
    },

    // ── LEBANON ──────────────────────────────────────────────────────────────────
    'aub': {
      style: 'American University of Beirut. English-medium. Oldest research university in Arab world. US liberal arts + research.',
      engineering: 'ACI 318, AISC, ASCE 7. Lebanese building standards.',
      medical: 'AUB Medical Center (AUBMC) protocols. JCI-accredited. US clinical guidelines (UpToDate, AHA).',
      law: 'Lebanese Civil Code (French civil law tradition). Lebanese commercial law.',
      business: 'AUB Suliman S. Olayan School of Business. AACSB. Case method.',
      humanities: 'Strong research tradition. Chicago/MLA. Peer-reviewed standards.',
      citation: 'APA 7th. Chicago for humanities. Vancouver for medicine.',
      grading: 'US GPA 4.0.',
    },
    'lau': {
      style: 'Lebanese American University. English-medium. AACSB/ABET accredited.',
      engineering: 'ABET. ACI 318.',
      business: 'AACSB. American business model.',
      citation: 'APA 7th. IEEE for engineering.',
    },
    'ndu': {
      style: 'Notre Dame University Lebanon. English-medium. Catholic liberal arts tradition.',
      humanities: 'Strong liberal arts. Chicago/MLA.',
      citation: 'APA 7th. Chicago.',
    },
    'leb_uni': {
      style: 'Lebanese University. Arabic and French. French academic tradition.',
      law: 'Lebanese Civil Code. French civil law. French citation style.',
      citation: 'French citation style. APA 7th for English papers.',
    },
  };

  // Match university name to curriculum entry
  const matchCurriculum = (uni) => {
    const u = (uni || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    // Direct matches
    const directMap = {
      'cairo': 'cairo', 'cairo_university': 'cairo', 'cu': 'cairo',
      'ain_shams': 'ain_shams', 'ain_shams_university': 'ain_shams', 'asu': 'ain_shams',
      'alexandria': 'alexandria', 'alexandria_university': 'alexandria',
      'mansoura': 'mansoura', 'mansoura_university': 'mansoura',
      'helwan': 'helwan', 'helwan_university': 'helwan',
      'al_azhar': 'azhar', 'azhar': 'azhar',
      'guc': 'guc', 'german_university_in_cairo': 'guc',
      'auc': 'auc', 'american_university_in_cairo': 'auc',
      'bue': 'bue', 'british_university_in_egypt': 'bue',
      'miu': 'miu', 'misr_international': 'miu',
      'msa': 'msa', 'msa_university': 'msa',
      'must': 'must', 'misr_university': 'must',
      'future': 'future', 'future_university': 'future',
      'october_6': 'october6', 'october6': 'october6', '6_october': 'october6',
      'aast': 'aast', 'arab_academy': 'aast',
      'nile': 'nile', 'nile_university': 'nile',
      'kfupm': 'kfupm', 'king_fahd': 'kfupm',
      'ksu': 'ksu', 'king_saud': 'ksu',
      'kaust': 'kaust', 'king_abdullah': 'kaust',
      'alfaisal': 'alfaisal', 'alfaisal_university': 'alfaisal',
      'psu': 'psu_saudi', 'prince_sultan': 'psu_saudi',
      'iau': 'iau', 'imam_abdulrahman': 'iau',
      'umm_al_qura': 'umm_al_qura', 'uqu': 'umm_al_qura',
      'uaeu': 'uaeu', 'uae_university': 'uaeu', 'united_arab_emirates_university': 'uaeu',
      'aus': 'aus', 'american_university_of_sharjah': 'aus',
      'khalifa': 'khalifa', 'khalifa_university': 'khalifa',
      'zayed': 'zayed', 'zayed_university': 'zayed',
      'sharjah': 'sharjah', 'university_of_sharjah': 'sharjah',
      'hct': 'hct',
      'kuwait': 'kuwait_uni', 'kuwait_university': 'kuwait_uni',
      'gust': 'gust',
      'auk': 'auk', 'american_university_of_kuwait': 'auk',
      'uob': 'uob', 'university_of_bahrain': 'uob',
      'ama': 'ama_bahrain',
      'rcsi': 'rcsi_bahrain',
      'ju': 'jordan_uni', 'jordan_university': 'jordan_uni', 'university_of_jordan': 'jordan_uni',
      'yarmouk': 'yarmouk', 'yarmouk_university': 'yarmouk',
      'just': 'just',
      'gju': 'gju', 'german_jordanian': 'gju',
      'aub': 'aub', 'american_university_of_beirut': 'aub',
      'lau': 'lau', 'lebanese_american': 'lau',
      'ndu': 'ndu', 'notre_dame': 'ndu',
      'lu': 'leb_uni', 'lebanese_university': 'leb_uni',
    };
    for (const [key, val] of Object.entries(directMap)) {
      if (u.includes(key)) return CURRICULUM[val];
    }
    return null;
  };

  const curriculumData = matchCurriculum(detectedUni);
  const domain = domainContext?.domain?.toLowerCase().split(':')[0].trim() || 'general';
  const domainKey = domain.includes('engineer') ? 'engineering' :
    domain.includes('medical') || domain.includes('nurs') ? 'medical' :
    domain.includes('law') ? 'law' :
    domain.includes('business') ? 'business' :
    domain.includes('cs') || domain.includes('computer') ? 'cs' :
    domain.includes('math') ? 'math' :
    domain.includes('human') ? 'humanities' : 'general';

  const buildCurriculumNote = () => {
    if (!curriculumData && !detectedUni && !detectedCountry) return '';
    const lines = [];
    if (curriculumData) {
      lines.push(`INSTITUTION: ${detectedUni} — ${curriculumData.style}`);
      if (curriculumData[domainKey]) lines.push(`DOMAIN STANDARDS: ${curriculumData[domainKey]}`);
      if (curriculumData.citation) lines.push(`CITATION STYLE: ${curriculumData.citation}`);
      if (curriculumData.grading) lines.push(`GRADING CONTEXT: ${curriculumData.grading}`);
    } else if (detectedUni) {
      lines.push(`INSTITUTION: ${detectedUni} — ${getCountryStandards(detectedCountry, detectedUni)}`);
    } else if (detectedCountry) {
      lines.push(`COUNTRY: ${detectedCountry} — ${getCountryStandards(detectedCountry, '')}`);
    }
    if (detectedMajor) lines.push(`MAJOR: ${detectedMajor}`);
    return lines.join('\n');
  };

  const curriculumNote = buildCurriculumNote();



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

${missionType !== 'presentation' ? 'IMPORTANT: This is NOT a presentation assignment. Set presentation_slides to an empty array []. Do NOT generate slides.' : ''}
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

AUTHENTIC WRITING ENGINE — CRITICAL. Academic writing quality is measured by three statistical properties: PERPLEXITY (varied word choice), BURSTINESS (varied sentence length), and PHRASE DIVERSITY (avoiding repetitive constructions). You must write with the natural variation of an authentic student voice. Every rule below targets one of these qualities.

━━ RULE 1: SENTENCE RHYTHM (vary sentence length) ━━
Formulaic writing has uniform sentence lengths. Natural writing is irregular.
MANDATORY PATTERN — vary sentence length aggressively within every paragraph:
- Short burst (3-7 words): State the conclusion bluntly. "The numbers don't lie." "Salah is an outlier."
- Medium (12-18 words): Develop it with one piece of evidence or reasoning.
- Long complex (25-45 words): Unpack the implication, add a sub-clause, connect to broader context, acknowledge a nuance.
- Short burst again: Pivot or land the point. "That gap matters."
NEVER write three consecutive sentences of similar length. If you do, you have failed this rule.

━━ RULE 2: WORD VARIETY (authentic word choice) ━━
Formulaic writing always picks the safest word. A genuine student picks the word that fits their voice.
MANDATORY:
- Replace "demonstrates" → "shows" or "points to" or "makes clear"
- Replace "significant" → "real", "notable", "considerable", "meaningful" (vary — never use same word twice)
- Replace "therefore" → "so", "which means", "and that's why", "hence" (mix formal/informal)
- Replace "utilizes" → "uses"
- Replace "implement" → "apply", "put in place", "run with"
- Use subject-specific slang where real students use it: "crunch the numbers", "the maths works out", "on paper at least"
- Occasionally use a slightly unusual but accurate word that a knowledgeable student would know: "heteroscedastic", "refractory", "stochastic" — but only when genuinely appropriate
- Include ONE deliberate near-miss phrasing per 300 words that a human would write but an AI wouldn't: "more or less consistent with", "roughly in line with what you'd expect", "not exactly a surprise given"

━━ RULE 3: PHRASE DIVERSITY (avoid repeated constructions) ━━
Formulaic writing reuses the same sentence templates. Authentic writing doesn't.
BANNED — these phrases signal low-quality formulaic writing:
"It is worth noting", "It is important to note", "it is crucial to", "it is essential to",
"In today's rapidly changing", "This essay will explore", "In conclusion it can be said",
"Delve into", "Multifaceted", "It is evident that", "Plays a crucial role", "Leverage" (as verb),
"In the realm of", "Shed light on", "Pave the way", "Game-changer", "Holistic approach",
"Robust framework", "Synergies", "Paradigm shift", "Cutting-edge", "Furthermore it should be noted",
"This highlights the importance", "Having said that", "In light of the above",
"Needless to say", "As previously mentioned", "From this perspective",
"It goes without saying", "This underscores", "This demonstrates the importance of",
"A comprehensive understanding", "In the context of", "With regard to the aforementioned"
BANNED PARAGRAPH OPENERS: "In [field], ...", "Understanding X is crucial", "When examining", "Upon analysis"
BANNED ENDINGS: "In conclusion, this essay has...", "To summarize the above points", "As discussed throughout"

━━ RULE 4: REASONING ARTIFACTS ━━
Authentic student writing contains thinking traces. Add these:
- Self-correction mid-paragraph: "— or more precisely, ..." / "what I mean is..." / "to be more specific..."
- Genuine hedging tied to the specific topic: "This assumes the 2023 data is still representative, which may not hold post-inflation."
- A mild opinion: "Personally, I find the second approach more convincing because..." / "My reading of this is..."
- Transition that shows actual thinking: "This made me reconsider..." / "Which raises the question..." / "The problem with that view is..."
- One rhetorical question per major section: "But does that actually hold up under scrutiny?"
- Direct address of the assignment brief: "The question specifically asks for..." / "This assignment requires me to..."

━━ RULE 5: STRUCTURAL VARIETY ━━
- Every paragraph must start differently. No two paragraphs can begin with the same word or construction.
- Vary paragraph length: one short paragraph (2-3 sentences) for every two long ones (4-6 sentences).
- Include at least ONE em-dash construction per page: "The result — a 23% improvement — exceeded expectations."
- Include at least ONE parenthetical aside per page: "This figure (which excludes outliers) suggests..."
- Include at least ONE mid-sentence pivot: "The theory works, or at least it does under these specific conditions."
- Numbers: mix formats naturally like a human would. "nearly half", "47%", "about 2 in 5" — not always the same format.

━━ WHAT TOP STUDENTS ACTUALLY WRITE ━━
Start paragraphs with the argument: "Cairo rents rose 34% in 2024 — and that's despite a broader slowdown."
NOT: "The Cairo property market is an important subject that warrants analysis."
Use specific numbers: "roughly 40%" not "a significant portion"
Cite naturally mid-sentence: "(ECP 203, Section 4.2)" not just at the end
Acknowledge limits briefly: "This model assumes linearity — which may not hold at the extremes."
Real transitions: "That cost structure is exactly why..." not "Moving on to the next point..."
Arabic student voice: formal فصحى but not textbook-stiff. Use active voice (بدلاً من المجهول). Avoid مما سبق يتضح and إن من أهم ما يمكن استخلاصه.

OUTPUT QUANTITY:
- Essays/Reports: minimum 500 words across all paragraph blocks
- Math assignments: minimum 5 solution_steps per math block
- Presentations: 6 slides maximum when missionType is NOT 'presentation'. 10 slides ONLY when missionType is 'presentation'.
- SLIDE CONTENT RULES (critical for visual quality):
  * power_heading: MAX 6 words. Must be an INSIGHT not a label. Bad: "Introduction to Topic". Good: "Cairo Rents Up 34% in 2024".
  * content_bullets: EXACTLY 5 bullets. Each bullet 8-12 words. Must include a specific stat, name, or data point. No vague bullets. Example: '3.2M Spotify listeners — Wegz leads Arabic rap globally' not 'Artists have many followers'
  * narrative: 2 sentences max. Sets context for the speaker. NOT a repeat of the bullets.
  * speaker_notes: 2-3 sentences max. Key talking points only.
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
- Steps: every step minimum 100 characters. Show sub-steps and intermediate results.
- Defense QA: Provide 2-3 Q&A pairs. Answers must be specific.
- PESTEL: ALWAYS render as a table block with headers ["Factor","Pillar","Analysis","Impact Level"] — never as a list or paragraph.
- SWOT: ALWAYS render as a table block with headers ["Category","Points"] and 4 rows (Strengths, Weaknesses, Opportunities, Threats) — never as a flat list.
- alternative_approaches: ALWAYS include 2 alternatives in domain_extras.alternative_approaches — this is the Anti-Tunneling requirement.
- DOMAIN EXTRAS: Populate domain_extras ONLY for Medical (soap_note), Law (irac), Business (executive_summary_200w). Skip for all other domains.

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
  speaker_notes: 2-3 key talking points only.

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
      {"type": "paragraph", "content": "Full paragraph in student voice — start with the argument or finding, not setup. Topic sentence + evidence + analysis + so-what. Min 60 words. Never a placeholder. Never start with 'It is important to note' or 'In today's world'"},
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
      "speaker_notes": "2-3 key talking points for this slide."
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
        temperature: 0.4,
        topP: 0.85,
        topK: 40,
        responseMimeType: 'application/json',
        // Token budget: enough for complete JSON, low enough to avoid timeouts
        // 5000 was truncating JSON. 16000 was causing 45s hangs. 7000 is the sweet spot.
        maxOutputTokens: /ENGINEERING|MATH|MEDICAL|CS|LAW/.test(
          (domainContext?.domain || '').toUpperCase()
        ) ? 7000 : 6000,
      },
    };

    // Model waterfall — try each model with 55s timeout
    // If one hangs or 503s, move to the next immediately
    const MODEL = 'gemini-3-flash-preview';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);

    let geminiRes = null;
    try {
      console.log(`Mi — calling ${MODEL}`);
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          signal: ctrl.signal,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        }
      );
      clearTimeout(timer);
      console.log(`Mi — ${MODEL} responded with ${geminiRes.status}`);
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return res.status(503).json({ error: 'Assignment took too long. Please try again or simplify your prompt.' });
      }
      throw err;
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

    // Check for safety block or empty response
    if (geminiData?.promptFeedback?.blockReason) {
      console.error('Mi: prompt blocked:', geminiData.promptFeedback.blockReason);
      return res.status(500).json({ error: 'Assignment could not be processed. Please rephrase and try again.' });
    }
    if (!geminiData?.candidates?.length) {
      console.error('Mi: empty candidates array:', JSON.stringify(geminiData).slice(0, 200));
      return res.status(500).json({ error: 'AI returned an empty response. Please try again.' });
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText || rawText.trim().startsWith('<!') || rawText.trim().startsWith('<html')) {
      return res.status(503).json({ error: 'AI service returned an error page. Please try again.' });
    }

    let clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // DIAGNOSTIC: log response size and structure
    console.log(`Mi — rawText length: ${rawText.length} chars, starts: ${rawText.slice(0,50)}, ends: ${rawText.slice(-50)}`);

    const first = clean.indexOf('{');
    if (first === -1) return res.status(500).json({ error: 'AI response was not valid JSON. Please try again.' });

    // Find the matching closing brace using bracket counting
    let depth = 0, last = -1;
    for (let i = first; i < clean.length; i++) {
      if (clean[i] === '{') depth++;
      else if (clean[i] === '}') {
        depth--;
        if (depth === 0) { last = i; break; }
      }
    }

    console.log(`Mi — first: ${first}, last: ${last}, depth after scan: ${depth}, clean length: ${clean.length}`);

    // Parse JSON — handle truncation gracefully
    let result;
    const jsonToParse = last !== -1 ? clean.slice(first, last + 1) : clean.slice(first);

    const tryParse = (s) => {
      try { return JSON.parse(s); } catch {}
      try { return JSON.parse(s.replace(/,(\s*[}\]])/g, '$1')); } catch {}
      return null;
    };

    result = tryParse(jsonToParse);

    if (!result) {
      console.error(`Mi — JSON truncated at ${clean.length} chars, depth=${depth}. Attempting recovery...`);
      let fixed = jsonToParse;
      fixed = fixed.replace(/,\s*"[^"]*$/, '');
      fixed = fixed.replace(/:\s*"[^"]*$/, ': ""');
      fixed = fixed.replace(/,\s*\[$/, '');
      fixed = fixed.replace(/,\s*{[^}]*$/, '');
      fixed = fixed.replace(/,\s*$/, '');
      const stk = [];
      let inS = false, esc = false;
      for (const ch of fixed) {
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inS = !inS; continue; }
        if (!inS) {
          if (ch === '{') stk.push('}');
          else if (ch === '[') stk.push(']');
          else if ((ch === '}' || ch === ']') && stk.length) stk.pop();
        }
      }
      if (inS) fixed += '"';
      fixed = fixed.replace(/,\s*$/, '');
      fixed += stk.reverse().join('');
      result = tryParse(fixed);
      if (result) {
        console.log('Mi — truncation recovery succeeded');
      } else {
        console.error('Mi — recovery failed');
        return res.status(500).json({ error: 'Response was too large. Please simplify your assignment or try again.' });
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
