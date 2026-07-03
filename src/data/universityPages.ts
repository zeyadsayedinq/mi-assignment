// ─────────────────────────────────────────────────────────────────────────────
// University SEO landing-page data
// Each entry powers /universities/:slug with UNIQUE bilingual body content.
// Uniqueness matters: Google penalizes near-duplicate programmatic pages.
// ─────────────────────────────────────────────────────────────────────────────

export interface UniFAQ {
  qEn: string; aEn: string;
  qAr: string; aAr: string;
}

export interface UniversityPageData {
  slug: string;
  nameEn: string;
  nameAr: string;
  shortName: string;          // e.g. "GUC"
  country: 'EG' | 'SA' | 'AE' | 'LB';
  countryEn: string;
  countryAr: string;
  city: string;
  cityAr: string;
  // Unique paragraph — what makes assignments at THIS university different
  uniqueEn: string;
  uniqueAr: string;
  // Academic standards Mi applies for this university
  standards: string[];
  popularMajors: string[];
  citationStyles: string[];
  faqs: UniFAQ[];
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export const UNIVERSITY_PAGES: UniversityPageData[] = [
  // ═══ EGYPT ═══
  {
    slug: 'guc-assignment-help',
    nameEn: 'German University in Cairo', nameAr: 'الجامعة الألمانية بالقاهرة',
    shortName: 'GUC', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'New Cairo', cityAr: 'القاهرة الجديدة',
    uniqueEn: 'GUC follows the German academic model: assignments are graded on precision, engineering rigor, and strict adherence to submission templates. Mi-Assignment is calibrated for GUC\'s Excellence-oriented grading, MET/IET report structures, and the heavy math and coding load in Media Engineering, Mechatronics, and Pharmacy programs.',
    uniqueAr: 'الجامعة الألمانية بتمشي على النظام الألماني: التصحيح بيركز على الدقة والالتزام الحرفي بقوالب التسليم. Mi-Assignment متظبط على أسلوب تصحيح الـ GUC وهيكل تقارير MET وIET وكثافة الرياضيات والبرمجة في هندسة الميديا والميكاترونكس والصيدلة.',
    standards: ['German engineering report structure', 'ECP 203 (Civil)', 'IEEE citation (Engineering)', 'MET/IET lab report format'],
    popularMajors: ['Media Engineering & Technology', 'Mechatronics', 'Pharmacy & Biotechnology', 'Management Technology', 'Architecture'],
    citationStyles: ['IEEE', 'APA 7th', 'Harvard'],
    faqs: [
      { qEn: 'Does Mi-Assignment know GUC\'s report format?', aEn: 'Yes. Select GUC in the Terminal and Mi applies German-style engineering report structure, IEEE citations, and GUC lab report conventions automatically.', qAr: 'هل Mi-Assignment يعرف فورمات تقارير الـ GUC؟', aAr: 'أيوة. اختار GUC في التيرمينال وMi هيطبق هيكل التقارير الهندسية الألماني وتوثيق IEEE وقواعد تقارير المعامل بتاعت الجامعة تلقائياً.' },
      { qEn: 'Can it solve Media Engineering (MET) assignments?', aEn: 'Yes — MET coding tasks (Java, Python, databases), signal processing math, and full project reports are among the most common GUC missions.', qAr: 'ينفع يحل واجبات هندسة الميديا MET؟', aAr: 'أيوة — واجبات البرمجة (Java وPython وقواعد البيانات) ورياضيات معالجة الإشارات والتقارير الكاملة من أكتر المهام اللي بتتحل للـ GUC.' },
      { qEn: 'Does it output in English?', aEn: 'GUC assignments are generated in academic English by default, matching the university\'s English-medium instruction.', qAr: 'بيطلع الحل بالإنجليزي؟', aAr: 'واجبات GUC بتتولد بإنجليزي أكاديمي افتراضياً لأن الدراسة في الجامعة بالإنجليزي.' },
    ],
    metaTitle: 'حل واجبات GUC — Mi-Assignment | GUC Assignment Help & Solver',
    metaDescription: 'حل واجبات الجامعة الألمانية بالقاهرة GUC بالذكاء الاصطناعي: MET، ميكاترونكس، صيدلة، عمارة. تقارير بالفورمات الألماني وتوثيق IEEE. جرب 3 مهام مجاناً.',
    keywords: 'GUC assignment help, حل واجبات GUC, الجامعة الألمانية واجبات, MET assignment solver, GUC report format, German University Cairo homework',
  },
  {
    slug: 'auc-assignment-help',
    nameEn: 'American University in Cairo', nameAr: 'الجامعة الأمريكية بالقاهرة',
    shortName: 'AUC', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'New Cairo', cityAr: 'القاهرة الجديدة',
    uniqueEn: 'AUC runs on the American liberal-arts model: thesis-driven essays, heavy citation requirements, and strict Turnitin-checked academic integrity standards. Mi-Assignment calibrates AUC missions for APA 7th and Chicago styles, rhetoric-focused writing courses (RHET), and case-based business assignments in the School of Business.',
    uniqueAr: 'الجامعة الأمريكية ماشية على النظام الأمريكي: مقالات مبنية على أطروحة واضحة، توثيق كثيف، ومعايير Turnitin صارمة. Mi-Assignment بيظبط مهام AUC على توثيق APA 7th وChicago ومقررات الكتابة RHET وواجبات كلية الأعمال المبنية على دراسات الحالة.',
    standards: ['APA 7th Edition', 'Chicago Manual of Style', 'RHET essay structure', 'Case study analysis format'],
    popularMajors: ['Business Administration', 'Computer Science', 'Political Science', 'Mass Communication', 'Engineering'],
    citationStyles: ['APA 7th', 'Chicago', 'MLA 9th'],
    faqs: [
      { qEn: 'Does Mi handle AUC RHET essays?', aEn: 'Yes — thesis statements, structured argumentation, counterarguments, and full APA/MLA reference lists are generated in AUC\'s expected academic register.', qAr: 'بيحل مقالات RHET بتاعت AUC؟', aAr: 'أيوة — جملة الأطروحة والحجج المنظمة والحجج المضادة وقائمة مراجع APA/MLA كاملة، وكله بالمستوى الأكاديمي المتوقع في AUC.' },
      { qEn: 'What about business case studies?', aEn: 'Mi generates full case analyses with PESTEL, SWOT, Porter\'s Five Forces, and NPV/DCF financial models — the standard AUC School of Business toolkit.', qAr: 'ودراسات الحالة في البيزنس؟', aAr: 'Mi بيولّد تحليل حالة كامل بـ PESTEL وSWOT وقوى بورتر الخمس ونماذج NPV/DCF المالية — العدة الأساسية في كلية الأعمال بالجامعة الأمريكية.' },
      { qEn: 'Is the output original?', aEn: 'Every mission is generated from scratch for your specific brief. Mi-Academy also gives you the reasoning so you can defend the work as your own.', qAr: 'الحل أصلي؟', aAr: 'كل مهمة بتتولد من الصفر لواجبك أنت تحديداً. وMi-Academy بيديك خطوات التفكير عشان تقدر تدافع عن الشغل قدام الدكتور.' },
    ],
    metaTitle: 'حل واجبات AUC — Mi-Assignment | AUC Assignment Help & Essay Solver',
    metaDescription: 'حل واجبات الجامعة الأمريكية بالقاهرة AUC: مقالات RHET، دراسات حالة بيزنس، توثيق APA 7th وChicago. حلول أصلية جاهزة للتسليم. جرب مجاناً.',
    keywords: 'AUC assignment help, حل واجبات AUC, الجامعة الأمريكية واجبات, RHET essay help, AUC case study, APA 7th Egypt',
  },
  {
    slug: 'cairo-university-assignment-help',
    nameEn: 'Cairo University', nameAr: 'جامعة القاهرة',
    shortName: 'Cairo Uni', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'Giza', cityAr: 'الجيزة',
    uniqueEn: 'As Egypt\'s largest public university, Cairo University assignments span Arabic-medium humanities and law alongside English-medium engineering and medicine. Mi-Assignment handles both languages natively: IRAC legal analysis under the Egyptian Civil Code for law students, ECP 203 for civil engineering, and full Arabic RTL documents for humanities faculties.',
    uniqueAr: 'جامعة القاهرة أكبر جامعة حكومية في مصر، وواجباتها بتتنوع بين كليات بتدرس بالعربي (حقوق وآداب) وكليات بالإنجليزي (هندسة وطب). Mi-Assignment بيشتغل باللغتين: تحليل IRAC القانوني على القانون المدني المصري لطلبة الحقوق، وكود ECP 203 للهندسة المدنية، ومستندات عربية كاملة RTL لكليات الآداب والإعلام.',
    standards: ['Egyptian Civil Code (Law)', 'ECP 203 (Civil Engineering)', 'Egyptian public university grading', 'Arabic academic writing (فصحى)'],
    popularMajors: ['Law (حقوق)', 'Engineering', 'Medicine', 'Commerce', 'Mass Communication'],
    citationStyles: ['APA 7th', 'Harvard', 'Egyptian legal citation'],
    faqs: [
      { qEn: 'Can Mi solve law assignments in Arabic?', aEn: 'Yes — full IRAC analyses referencing the Egyptian Civil Code, written in formal legal Arabic (فصحى), exported as Word for proper RTL rendering.', qAr: 'بيحل واجبات الحقوق بالعربي؟', aAr: 'أيوة — تحليل IRAC كامل بمواد القانون المدني المصري، مكتوب بعربي قانوني فصيح، وبيتصدّر Word عشان العربي يظهر مظبوط.' },
      { qEn: 'Does it know ECP 203?', aEn: 'Yes — Egyptian Code of Practice 203 for reinforced concrete is built into Mi\'s civil engineering calibration, including BBS tables and design checks.', qAr: 'يعرف الكود المصري ECP 203؟', aAr: 'أيوة — الكود المصري 203 للخرسانة المسلحة جزء من معايرة Mi للهندسة المدنية، بما فيها جداول التسليح وفحوصات التصميم.' },
      { qEn: 'Is it affordable for public university students?', aEn: 'Pro Quarterly is 1,000 EGP for a full semester (60 missions) — about 17 EGP per assignment, paid via InstaPay or Vodafone Cash.', qAr: 'السعر مناسب لطلبة الحكومي؟', aAr: 'الباقة الربع سنوية 1000 جنيه للترم كله (60 مهمة) — يعني حوالي 17 جنيه للواجب، والدفع إنستاباي أو فودافون كاش.' },
    ],
    metaTitle: 'حل واجبات جامعة القاهرة — Mi-Assignment | Cairo University Help',
    metaDescription: 'حل واجبات جامعة القاهرة بالذكاء الاصطناعي: حقوق بالعربي (IRAC + القانون المدني)، هندسة (ECP 203)، تجارة وإعلام. عربي وإنجليزي. 3 مهام مجاناً.',
    keywords: 'حل واجبات جامعة القاهرة, Cairo University assignment help, واجبات حقوق القاهرة, ECP 203 حل, واجبات جامعية مصر',
  },
  {
    slug: 'ain-shams-assignment-help',
    nameEn: 'Ain Shams University', nameAr: 'جامعة عين شمس',
    shortName: 'Ain Shams', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'Cairo', cityAr: 'القاهرة',
    uniqueEn: 'Ain Shams is known for its rigorous Faculty of Engineering credit-hour programs and one of Egypt\'s largest medical schools. Mi-Assignment calibrates for Ain Shams CHS engineering project reports, clinical case write-ups in SOAP format for medicine, and Al-Alsun language faculty translation and essay assignments.',
    uniqueAr: 'عين شمس مشهورة ببرامج الساعات المعتمدة في الهندسة وواحدة من أكبر كليات الطب في مصر. Mi-Assignment متظبط على تقارير مشاريع هندسة عين شمس CHS، وكتابة الحالات الإكلينيكية بنظام SOAP لطلبة الطب، وواجبات الترجمة والمقالات لكلية الألسن.',
    standards: ['CHS engineering report format', 'SOAP clinical notes', 'ECP 203', 'Translation assignment conventions (Al-Alsun)'],
    popularMajors: ['Engineering (CHS)', 'Medicine', 'Al-Alsun (Languages)', 'Commerce', 'Computer Science'],
    citationStyles: ['APA 7th', 'IEEE', 'Vancouver (Medicine)'],
    faqs: [
      { qEn: 'Does Mi handle medical case studies?', aEn: 'Yes — full SOAP notes, differential diagnoses, and drug interaction tables aligned with Egyptian MOH clinical guidelines.', qAr: 'بيحل الكيسات الطبية؟', aAr: 'أيوة — SOAP notes كاملة وتشخيص تفريقي وجداول تداخلات الأدوية متوافقة مع إرشادات وزارة الصحة المصرية.' },
      { qEn: 'What about CHS engineering projects?', aEn: 'Complete project reports with calculations, SVG diagrams, and code — formatted for Ain Shams credit-hour submission standards.', qAr: 'ومشاريع هندسة الساعات المعتمدة؟', aAr: 'تقارير مشاريع كاملة بالحسابات والرسومات SVG والكود — بفورمات تسليم برامج الساعات المعتمدة في عين شمس.' },
      { qEn: 'Can it do translation assignments?', aEn: 'Yes — Al-Alsun style translation with commentary on translation choices, in both directions between Arabic and English.', qAr: 'ينفع واجبات ترجمة؟', aAr: 'أيوة — ترجمة بأسلوب الألسن مع تعليق على اختيارات الترجمة، في الاتجاهين بين العربي والإنجليزي.' },
    ],
    metaTitle: 'حل واجبات جامعة عين شمس — Mi-Assignment | Ain Shams Help',
    metaDescription: 'حل واجبات عين شمس: هندسة ساعات معتمدة، طب (SOAP)، ألسن وترجمة، تجارة. حلول جاهزة للتسليم PDF وWord وPowerPoint. جرب 3 مهام مجاناً.',
    keywords: 'حل واجبات عين شمس, Ain Shams assignment help, واجبات هندسة عين شمس, حل كيس طب, واجبات الألسن',
  },
  {
    slug: 'alexandria-university-assignment-help',
    nameEn: 'Alexandria University', nameAr: 'جامعة الإسكندرية',
    shortName: 'Alex Uni', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'Alexandria', cityAr: 'الإسكندرية',
    uniqueEn: 'Alexandria University\'s strength in engineering, pharmacy, and maritime-adjacent programs shapes its assignment style: practical lab reports, dosage calculation problem sets, and design projects. Mi-Assignment generates IMRaD-structured lab reports, pharmaceutical calculations with full working, and ECP-compliant civil designs for Alex students.',
    uniqueAr: 'قوة جامعة الإسكندرية في الهندسة والصيدلة والبرامج البحرية بتشكّل طبيعة واجباتها: تقارير معامل عملية، ومسائل حسابات جرعات، ومشاريع تصميم. Mi-Assignment بيولّد تقارير معامل بهيكل IMRaD وحسابات صيدلانية بخطوات كاملة وتصميمات مدنية متوافقة مع الكود المصري.',
    standards: ['IMRaD lab report structure', 'ECP 203', 'Pharmaceutical calculation conventions', 'Egyptian public university grading'],
    popularMajors: ['Engineering', 'Pharmacy', 'Medicine', 'Science', 'Commerce'],
    citationStyles: ['APA 7th', 'Vancouver', 'IEEE'],
    faqs: [
      { qEn: 'Does Mi write full lab reports?', aEn: 'Yes — complete IMRaD structure (Introduction, Methods, Results, Discussion) with data tables and statistical analysis in the results section.', qAr: 'بيكتب تقارير معامل كاملة؟', aAr: 'أيوة — هيكل IMRaD كامل (مقدمة، طرق، نتائج، مناقشة) بجداول بيانات وتحليل إحصائي في النتائج.' },
      { qEn: 'Can it solve pharmacy problem sets?', aEn: 'Yes — dosage calculations, pharmacokinetics, and drug interaction matrices with every step shown.', qAr: 'بيحل مسائل الصيدلة؟', aAr: 'أيوة — حسابات الجرعات والحرائك الدوائية وجداول التداخلات الدوائية بكل خطوة موضحة.' },
      { qEn: 'How fast are results?', aEn: 'Most missions complete in 15–40 seconds with the full document package ready to download.', qAr: 'الحل بياخد وقت قد إيه؟', aAr: 'أغلب المهام بتخلص في 15–40 ثانية والباكدج كامل جاهز للتحميل.' },
    ],
    metaTitle: 'حل واجبات جامعة الإسكندرية — Mi-Assignment | Alexandria University',
    metaDescription: 'حل واجبات جامعة الإسكندرية: تقارير معامل IMRaD، مسائل صيدلة، هندسة ECP 203. حلول كاملة في ثوانٍ. ابدأ بـ 3 مهام مجانية.',
    keywords: 'حل واجبات جامعة الإسكندرية, Alexandria University assignment, تقرير معمل, واجبات صيدلة, lab report help Egypt',
  },
  {
    slug: 'mansoura-university-assignment-help',
    nameEn: 'Mansoura University', nameAr: 'جامعة المنصورة',
    shortName: 'Mansoura', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'Mansoura', cityAr: 'المنصورة',
    uniqueEn: 'Mansoura University\'s internationally ranked medical school drives a heavy clinical assignment load: case presentations, SOAP documentation, and evidence-based medicine reviews. Mi-Assignment also covers Mansoura\'s engineering and computer science faculties with full code solutions and database design assignments.',
    uniqueAr: 'كلية طب المنصورة المصنفة عالمياً بتخلق حمل واجبات إكلينيكي كبير: عرض حالات، وتوثيق SOAP، ومراجعات الطب المبني على الدليل. Mi-Assignment كمان بيغطي كليات الهندسة والحاسبات في المنصورة بحلول كود كاملة وواجبات تصميم قواعد بيانات.',
    standards: ['SOAP clinical documentation', 'Evidence-based medicine review structure', 'ECP 203', '3NF database normalization'],
    popularMajors: ['Medicine', 'Pharmacy', 'Engineering', 'Computer & Information Sciences', 'Nursing'],
    citationStyles: ['Vancouver', 'APA 7th', 'IEEE'],
    faqs: [
      { qEn: 'Does Mi handle clinical case presentations?', aEn: 'Yes — structured case presentations with history, examination findings, investigations, differential diagnosis, and management plan.', qAr: 'بيعمل عرض حالات إكلينيكية؟', aAr: 'أيوة — عرض حالة منظم بالتاريخ المرضي ونتائج الفحص والفحوصات والتشخيص التفريقي وخطة العلاج.' },
      { qEn: 'What about CS database assignments?', aEn: 'Full ER diagrams as SVG, complete SQL DDL with constraints, sample data, and all required queries with comments.', qAr: 'وواجبات قواعد البيانات في الحاسبات؟', aAr: 'رسومات ER كاملة SVG، وSQL DDL كامل بالقيود، وبيانات تجريبية، وكل الاستعلامات المطلوبة بالشرح.' },
      { qEn: 'Is nursing covered?', aEn: 'Yes — nursing care plans, patient education materials, and clinical reflection essays in the required academic format.', qAr: 'التمريض متغطي؟', aAr: 'أيوة — خطط رعاية تمريضية ومواد تثقيف المرضى ومقالات التأمل الإكلينيكي بالفورمات المطلوب.' },
    ],
    metaTitle: 'حل واجبات جامعة المنصورة — Mi-Assignment | Mansoura University',
    metaDescription: 'حل واجبات المنصورة: كيسات طب وعرض حالات، تمريض، هندسة، حاسبات وقواعد بيانات. حلول جاهزة للتسليم في ثوانٍ. 3 مهام مجاناً.',
    keywords: 'حل واجبات المنصورة, Mansoura University assignment, كيس طب المنصورة, واجبات حاسبات, nursing care plan Egypt',
  },
  {
    slug: 'bue-assignment-help',
    nameEn: 'British University in Egypt', nameAr: 'الجامعة البريطانية في مصر',
    shortName: 'BUE', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'El Sherouk', cityAr: 'الشروق',
    uniqueEn: 'BUE assignments follow the UK academic model validated by British partner universities: learning-outcome-mapped coursework, Harvard referencing, and analytical essay structures with clear marking rubrics. Mi-Assignment writes BUE missions in British academic English with Harvard citations and rubric-aligned structure.',
    uniqueAr: 'واجبات BUE ماشية على النظام البريطاني المعتمد من جامعات بريطانية شريكة: كورس وورك مربوط بمخرجات التعلم، وتوثيق Harvard، ومقالات تحليلية بمعايير تصحيح واضحة. Mi-Assignment بيكتب مهام BUE بإنجليزي أكاديمي بريطاني وتوثيق Harvard وهيكل متوافق مع الروبرك.',
    standards: ['Harvard referencing', 'UK learning-outcome coursework structure', 'British analytical essay format', 'BTEC-style practical reports'],
    popularMajors: ['Engineering', 'Business Administration', 'Informatics & Computer Science', 'Pharmacy', 'Law'],
    citationStyles: ['Harvard', 'OSCOLA (Law)', 'APA 7th'],
    faqs: [
      { qEn: 'Does Mi use Harvard referencing correctly?', aEn: 'Yes — full in-text citations and reference lists in Harvard style, the BUE default across most faculties.', qAr: 'بيستخدم توثيق Harvard صح؟', aAr: 'أيوة — توثيق داخل النص وقائمة مراجع كاملة بنظام Harvard، وهو الافتراضي في أغلب كليات BUE.' },
      { qEn: 'Can it map answers to learning outcomes?', aEn: 'Paste the module\'s learning outcomes with your brief and Mi structures the coursework so each outcome is explicitly addressed.', qAr: 'بيربط الإجابة بمخرجات التعلم؟', aAr: 'حط مخرجات التعلم مع الواجب وMi هيبني الكورس وورك بحيث كل مخرج يتغطى بشكل صريح.' },
      { qEn: 'What about UK-style law assignments?', aEn: 'Yes — problem questions and essays with OSCOLA citations, following the English-law method taught at BUE.', qAr: 'وواجبات القانون بالنظام البريطاني؟', aAr: 'أيوة — problem questions ومقالات بتوثيق OSCOLA وبمنهج القانون الإنجليزي اللي بيتدرس في BUE.' },
    ],
    metaTitle: 'حل واجبات BUE — Mi-Assignment | British University Egypt Help',
    metaDescription: 'حل واجبات الجامعة البريطانية BUE: كورس وورك بالنظام البريطاني، توثيق Harvard، هندسة وبيزنس وقانون. حلول أصلية جاهزة للتسليم. جرب مجاناً.',
    keywords: 'BUE assignment help, حل واجبات BUE, الجامعة البريطانية واجبات, Harvard referencing Egypt, UK coursework help',
  },
  {
    slug: 'msa-assignment-help',
    nameEn: 'MSA University', nameAr: 'جامعة أكتوبر للعلوم الحديثة والآداب',
    shortName: 'MSA', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: '6th of October', cityAr: 'السادس من أكتوبر',
    uniqueEn: 'MSA\'s UK-validated degrees (Greenwich, Bedfordshire) mean coursework briefs arrive with British marking criteria and word-count limits that are strictly enforced. Mi-Assignment respects exact word counts, applies Harvard referencing, and structures MSA coursework against the stated assessment criteria.',
    uniqueAr: 'شهادات MSA معتمدة من جامعات بريطانية (جرينتش وبيدفوردشير)، فالبريفات بتيجي بمعايير تصحيح بريطانية وحدود كلمات صارمة. Mi-Assignment بيلتزم بعدد الكلمات بالظبط، وبيطبق توثيق Harvard، وبيبني الكورس وورك على معايير التقييم المذكورة.',
    standards: ['Harvard referencing', 'UK validated coursework format', 'Strict word-count compliance', 'Greenwich/Bedfordshire assessment criteria'],
    popularMajors: ['Mass Communication', 'Business Administration', 'Computer Science', 'Pharmacy', 'Dentistry'],
    citationStyles: ['Harvard', 'APA 7th'],
    faqs: [
      { qEn: 'Does Mi respect word limits?', aEn: 'Yes — state your word count in the brief and the generated document stays within it, with the count shown in the output.', qAr: 'بيلتزم بعدد الكلمات؟', aAr: 'أيوة — اكتب الحد المطلوب في البريف والمستند هيطلع في حدوده وعدد الكلمات ظاهر في النتيجة.' },
      { qEn: 'Can it do Mass Comm projects?', aEn: 'Yes — media analyses, campaign plans, and research papers in MSA\'s UK-validated format, plus full PowerPoint decks for presentations.', qAr: 'بيحل مشاريع الإعلام؟', aAr: 'أيوة — تحليلات إعلامية وخطط حملات وأبحاث بالفورمات البريطاني المعتمد في MSA، وكمان عروض PowerPoint كاملة.' },
      { qEn: 'Are presentations included?', aEn: 'Every mission can generate an 8–12 slide deck with speaker notes — ready for MSA presentation assessments.', qAr: 'البرزنتيشن داخل في الحل؟', aAr: 'أي مهمة ممكن تطلع معاها عرض 8–12 سلايد بملاحظات المتحدث — جاهز لتقييمات البرزنتيشن في MSA.' },
    ],
    metaTitle: 'حل واجبات MSA — Mi-Assignment | MSA University Coursework Help',
    metaDescription: 'حل كورس وورك جامعة MSA بالمعايير البريطانية: إعلام، بيزنس، حاسبات، صيدلة. التزام بعدد الكلمات وتوثيق Harvard. 3 مهام مجاناً.',
    keywords: 'MSA assignment help, حل واجبات MSA, كورس وورك MSA, MSA coursework, واجبات إعلام',
  },
  {
    slug: 'miu-assignment-help',
    nameEn: 'Misr International University', nameAr: 'جامعة مصر الدولية',
    shortName: 'MIU', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'Cairo', cityAr: 'القاهرة',
    uniqueEn: 'MIU\'s credit-hour American system produces frequent quizzes, projects, and presentation-heavy courses across Alsun, Business, Engineering, and Dentistry. Mi-Assignment matches MIU\'s English-medium, internationally calibrated register and generates the full project package: document, slides, and spreadsheet in one mission.',
    uniqueAr: 'نظام الساعات المعتمدة الأمريكي في MIU معناه مشاريع وبرزنتيشن كتير في الألسن والبيزنس والهندسة وطب الأسنان. Mi-Assignment بيطابق المستوى الإنجليزي الدولي بتاع MIU وبيطلع باكدج المشروع كامل: مستند وسلايدات وشيت إكسل في مهمة واحدة.',
    standards: ['American credit-hour project format', 'APA 7th Edition', 'English-medium academic register', 'Full package deliverables (DOC + PPT + XLS)'],
    popularMajors: ['Business Administration', 'Engineering', 'Alsun & Mass Communication', 'Dentistry', 'Pharmacy'],
    citationStyles: ['APA 7th', 'Harvard'],
    faqs: [
      { qEn: 'Can Mi generate the whole project package?', aEn: 'Yes — one mission can produce the written report, a full slide deck with speaker notes, and supporting Excel sheets together.', qAr: 'بيطلع باكدج المشروع كله؟', aAr: 'أيوة — مهمة واحدة ممكن تطلع التقرير المكتوب وعرض سلايدات كامل بملاحظات المتحدث وشيتات إكسل مساندة مع بعض.' },
      { qEn: 'Does it match MIU\'s English level?', aEn: 'Yes — MIU is calibrated as English-medium and internationally oriented, so output reads at that standard.', qAr: 'بيطابق مستوى الإنجليزي في MIU؟', aAr: 'أيوة — MIU متعايرة كجامعة إنجليزية الوسط بمستوى دولي، فالحل بيطلع بنفس المستوى.' },
      { qEn: 'How do I pay from Egypt?', aEn: 'InstaPay or Vodafone Cash — no international card needed. Pro Quarterly covers a full semester.', qAr: 'أدفع إزاي من مصر؟', aAr: 'إنستاباي أو فودافون كاش — مش محتاج كارت دولي. الباقة الربع سنوية بتغطي الترم كله.' },
    ],
    metaTitle: 'حل واجبات MIU — Mi-Assignment | Misr International University',
    metaDescription: 'حل واجبات جامعة مصر الدولية MIU: مشاريع كاملة (تقرير + برزنتيشن + إكسل)، نظام ساعات معتمدة أمريكي. حلول في ثوانٍ. جرب مجاناً.',
    keywords: 'MIU assignment help, حل واجبات MIU, جامعة مصر الدولية واجبات, مشروع MIU, credit hours Egypt',
  },
  {
    slug: 'helwan-university-assignment-help',
    nameEn: 'Helwan University', nameAr: 'جامعة حلوان',
    shortName: 'Helwan', country: 'EG', countryEn: 'Egypt', countryAr: 'مصر',
    city: 'Helwan', cityAr: 'حلوان',
    uniqueEn: 'Helwan\'s distinctive mix — Fine Arts, Applied Arts, Music Education, Engineering, and Commerce — creates assignment types most tools ignore: design rationales, art history analyses, and technical engineering reports. Mi-Assignment covers this full spread in Arabic and English, including structured design project documentation.',
    uniqueAr: 'خلطة حلوان المميزة — فنون جميلة وتطبيقية وتربية موسيقية وهندسة وتجارة — بتخلق أنواع واجبات معظم الأدوات بتتجاهلها: مبررات تصميم، وتحليلات تاريخ فن، وتقارير هندسية. Mi-Assignment بيغطي المدى ده كله بالعربي والإنجليزي، بما فيه توثيق مشاريع التصميم المنظم.',
    standards: ['Design rationale documentation', 'Art & design history analysis', 'ECP 203', 'Egyptian public university grading'],
    popularMajors: ['Fine Arts', 'Applied Arts', 'Engineering', 'Commerce', 'Computer Science'],
    citationStyles: ['APA 7th', 'Chicago (Art History)', 'Harvard'],
    faqs: [
      { qEn: 'Can Mi write design project rationales?', aEn: 'Yes — concept development, design decisions, and process documentation structured the way Applied Arts juries expect.', qAr: 'بيكتب مبررات مشاريع التصميم؟', aAr: 'أيوة — تطوير الفكرة وقرارات التصميم وتوثيق العملية بالشكل اللي لجان الفنون التطبيقية متوقعاه.' },
      { qEn: 'Does it handle art history essays?', aEn: 'Yes — analytical essays with Chicago-style citations, in Arabic or English depending on your course.', qAr: 'ومقالات تاريخ الفن؟', aAr: 'أيوة — مقالات تحليلية بتوثيق Chicago، بالعربي أو الإنجليزي حسب مقررك.' },
      { qEn: 'And commerce assignments?', aEn: 'Full accounting problem sets, financial statement analyses, and business reports with Excel outputs.', qAr: 'وواجبات التجارة؟', aAr: 'مسائل محاسبة كاملة وتحليل قوائم مالية وتقارير بيزنس بمخرجات إكسل.' },
    ],
    metaTitle: 'حل واجبات جامعة حلوان — Mi-Assignment | Helwan University Help',
    metaDescription: 'حل واجبات حلوان: فنون جميلة وتطبيقية (مبررات تصميم)، هندسة، تجارة ومحاسبة. عربي وإنجليزي، جاهز للتسليم. 3 مهام مجاناً.',
    keywords: 'حل واجبات حلوان, Helwan University assignment, واجبات فنون تطبيقية, مبرر تصميم, واجبات تجارة',
  },

  // ═══ SAUDI ARABIA ═══
  {
    slug: 'ksu-assignment-help',
    nameEn: 'King Saud University', nameAr: 'جامعة الملك سعود',
    shortName: 'KSU', country: 'SA', countryEn: 'Saudi Arabia', countryAr: 'السعودية',
    city: 'Riyadh', cityAr: 'الرياض',
    uniqueEn: 'KSU, Saudi Arabia\'s flagship university, runs rigorous STEM programs where assignments demand full derivations, SBC-compliant engineering designs, and Vision 2030-framed business analyses. Mi-Assignment calibrates KSU missions for Saudi academic rigor, the Saudi Building Code, and bilingual Arabic/English submission requirements.',
    uniqueAr: 'جامعة الملك سعود، الجامعة الرائدة في المملكة، برامجها العلمية صارمة وواجباتها تتطلب اشتقاقات كاملة وتصاميم هندسية متوافقة مع كود البناء السعودي وتحليلات أعمال مؤطرة برؤية 2030. Mi-Assignment معاير على الصرامة الأكاديمية السعودية وكود البناء SBC ومتطلبات التسليم بالعربية والإنجليزية.',
    standards: ['Saudi Building Code (SBC)', 'Vision 2030 business framing', 'Full mathematical derivations', 'Saudi MOH clinical guidelines'],
    popularMajors: ['Engineering', 'Computer Science', 'Medicine', 'Business Administration', 'Pharmacy'],
    citationStyles: ['APA 7th', 'IEEE', 'Vancouver'],
    faqs: [
      { qEn: 'Does Mi know the Saudi Building Code?', aEn: 'Yes — SBC provisions are part of Mi\'s civil engineering calibration for Saudi universities, alongside full design calculations.', qAr: 'هل Mi يعرف كود البناء السعودي؟', aAr: 'نعم — اشتراطات SBC جزء من معايرة Mi للهندسة المدنية في الجامعات السعودية، مع حسابات التصميم الكاملة.' },
      { qEn: 'Can I pay from Saudi Arabia?', aEn: 'Yes — Mada, Visa, Mastercard, and Apple Pay are supported. Pro Quarterly is 99 SAR for a full semester.', qAr: 'أقدر أدفع من السعودية؟', aAr: 'نعم — مدى وفيزا وماستركارد وApple Pay مدعومة. الباقة الربع سنوية 99 ريال للفصل كامل.' },
      { qEn: 'Does it write in formal Arabic?', aEn: 'Yes — Modern Standard Arabic (فصحى) with proper RTL formatting, exported as Word for perfect Arabic rendering.', qAr: 'يكتب بالعربية الفصحى؟', aAr: 'نعم — عربية فصحى بتنسيق RTL صحيح، وتصدير Word لعرض عربي مثالي.' },
    ],
    metaTitle: 'حل واجبات جامعة الملك سعود — Mi-Assignment | KSU Assignment Help',
    metaDescription: 'حل واجبات KSU بالذكاء الاصطناعي: هندسة بكود البناء السعودي، طب، حاسب، إدارة أعمال برؤية 2030. عربي وإنجليزي. جرب 3 مهام مجاناً.',
    keywords: 'حل واجبات جامعة الملك سعود, KSU assignment help, واجبات جامعية السعودية, كود البناء السعودي, حل واجب الرياض',
  },
  {
    slug: 'kfupm-assignment-help',
    nameEn: 'King Fahd University of Petroleum & Minerals', nameAr: 'جامعة الملك فهد للبترول والمعادن',
    shortName: 'KFUPM', country: 'SA', countryEn: 'Saudi Arabia', countryAr: 'السعودية',
    city: 'Dhahran', cityAr: 'الظهران',
    uniqueEn: 'KFUPM is the toughest STEM environment in the Gulf: petroleum and process engineering problem sets, heavy MATLAB and Python assignments, and thermodynamics derivations where partial credit depends on showing every step. Mi-Assignment shows complete working on every KFUPM mission — boxed final answers, unit checks, and runnable code included.',
    uniqueAr: 'جامعة الملك فهد أصعب بيئة علمية في الخليج: مسائل هندسة بترول وعمليات، وواجبات MATLAB وPython كثيفة، واشتقاقات ثرموداينمكس الدرجات فيها على إظهار كل خطوة. Mi-Assignment يعرض الحل كامل في كل مهمة — إجابات نهائية محددة، وفحص وحدات، وكود قابل للتشغيل.',
    standards: ['Full step-by-step derivations with unit analysis', 'MATLAB/Python engineering code standards', 'IEEE citation', 'Boxed final answers (exam convention)'],
    popularMajors: ['Petroleum Engineering', 'Chemical Engineering', 'Computer Science', 'Electrical Engineering', 'Mechanical Engineering'],
    citationStyles: ['IEEE', 'APA 7th'],
    faqs: [
      { qEn: 'Can Mi solve petroleum engineering problems?', aEn: 'Yes — reservoir calculations, drilling hydraulics, and thermodynamics with every derivation step, unit check, and a boxed final answer.', qAr: 'يحل مسائل هندسة البترول؟', aAr: 'نعم — حسابات المكامن وهيدروليكا الحفر والثرموداينمكس بكل خطوة اشتقاق وفحص وحدات وإجابة نهائية محددة.' },
      { qEn: 'Does it write MATLAB code?', aEn: 'Yes — complete runnable MATLAB and Python files with descriptive variable names and sample input/output in comments.', qAr: 'يكتب كود MATLAB؟', aAr: 'نعم — ملفات MATLAB وPython كاملة قابلة للتشغيل بأسماء متغيرات واضحة وأمثلة إدخال/إخراج في التعليقات.' },
      { qEn: 'Is the math shown or just the answer?', aEn: 'Every step is shown in LaTeX-rendered math — KFUPM grading rewards working, and Mi is built for that.', qAr: 'يعرض الخطوات ولا الجواب بس؟', aAr: 'كل خطوة معروضة برياضيات LaTeX — تصحيح KFUPM يكافئ إظهار الحل، وMi مبني على هذا الأساس.' },
    ],
    metaTitle: 'حل واجبات جامعة الملك فهد — Mi-Assignment | KFUPM Help',
    metaDescription: 'حل واجبات KFUPM: هندسة بترول وكيميائية، MATLAB وPython، رياضيات بخطوات كاملة LaTeX. مبني للصرامة العلمية. جرب 3 مهام مجاناً.',
    keywords: 'KFUPM assignment help, حل واجبات الملك فهد, هندسة بترول واجبات, MATLAB حل, واجبات الظهران',
  },
  {
    slug: 'kau-assignment-help',
    nameEn: 'King Abdulaziz University', nameAr: 'جامعة الملك عبدالعزيز',
    shortName: 'KAU', country: 'SA', countryEn: 'Saudi Arabia', countryAr: 'السعودية',
    city: 'Jeddah', cityAr: 'جدة',
    uniqueEn: 'KAU\'s scale — one of the largest universities in the Gulf — means diverse assignment loads across engineering, medicine, business, and its well-known distance-learning programs. Mi-Assignment handles KAU\'s bilingual coursework, Blackboard-submitted essays, and SBC-compliant engineering projects with equal depth.',
    uniqueAr: 'حجم جامعة الملك عبدالعزيز — من أكبر جامعات الخليج — يعني تنوع واجبات كبير في الهندسة والطب والأعمال وبرامج الانتساب المعروفة. Mi-Assignment يتعامل مع المقررات ثنائية اللغة ومقالات البلاك بورد ومشاريع الهندسة المتوافقة مع الكود السعودي بنفس العمق.',
    standards: ['Saudi Building Code (SBC)', 'Blackboard essay submission format', 'Bilingual AR/EN coursework', 'Saudi MOH clinical guidelines'],
    popularMajors: ['Engineering', 'Business Administration', 'Medicine', 'Computing & IT', 'Law (أنظمة)'],
    citationStyles: ['APA 7th', 'IEEE', 'Saudi legal citation'],
    faqs: [
      { qEn: 'Does Mi support distance-learning (انتساب) students?', aEn: 'Yes — the workflow is fully online: paste your brief, download the finished package, submit through Blackboard.', qAr: 'يدعم طلاب الانتساب؟', aAr: 'نعم — كل شيء أونلاين: الصق الواجب، حمّل الملف الجاهز، وسلّمه عبر البلاك بورد.' },
      { qEn: 'Can it write Saudi law (أنظمة) assignments?', aEn: 'Yes — analyses referencing Saudi regulations and judicial practice, written in formal legal Arabic.', qAr: 'يحل واجبات الأنظمة؟', aAr: 'نعم — تحليلات تستند إلى الأنظمة السعودية والممارسة القضائية، بلغة قانونية فصحى.' },
      { qEn: 'What formats do I receive?', aEn: 'PDF, Word, PowerPoint, and Excel where relevant — Word is recommended for Arabic content.', qAr: 'ما الصيغ التي أستلمها؟', aAr: 'PDF وWord وPowerPoint وExcel حسب الحاجة — Word هو الأفضل للمحتوى العربي.' },
    ],
    metaTitle: 'حل واجبات جامعة الملك عبدالعزيز — Mi-Assignment | KAU Help',
    metaDescription: 'حل واجبات KAU جدة: هندسة، أعمال، أنظمة، انتساب. حلول عربية وإنجليزية جاهزة للتسليم عبر البلاك بورد. 3 مهام مجاناً.',
    keywords: 'حل واجبات الملك عبدالعزيز, KAU assignment help, واجبات انتساب, حل واجب جدة, بلاك بورد واجبات',
  },
  {
    slug: 'kaust-assignment-help',
    nameEn: 'King Abdullah University of Science & Technology', nameAr: 'جامعة الملك عبدالله للعلوم والتقنية',
    shortName: 'KAUST', country: 'SA', countryEn: 'Saudi Arabia', countryAr: 'السعودية',
    city: 'Thuwal', cityAr: 'ثول',
    uniqueEn: 'KAUST is a graduate research university, so "assignments" mean literature reviews, research proposals, reproducible code notebooks, and conference-style papers. Mi-Assignment generates KAUST-level academic writing: structured lit reviews with proper citations, methodology sections, and publication-quality LaTeX math.',
    uniqueAr: 'كاوست جامعة بحثية للدراسات العليا، فـ"الواجبات" تعني مراجعات أدبيات ومقترحات بحث ودفاتر كود قابلة لإعادة الإنتاج وأوراق بأسلوب المؤتمرات. Mi-Assignment يولّد كتابة أكاديمية بمستوى كاوست: مراجعات أدبيات منظمة بتوثيق صحيح وأقسام منهجية ورياضيات LaTeX بجودة النشر.',
    standards: ['Research paper structure (conference/journal style)', 'Literature review methodology', 'Reproducible code notebooks', 'Publication-quality LaTeX'],
    popularMajors: ['Computer Science', 'Applied Mathematics', 'Bioscience', 'Electrical & Computer Engineering', 'Earth Science'],
    citationStyles: ['IEEE', 'APA 7th', 'Nature style'],
    faqs: [
      { qEn: 'Can Mi write a literature review?', aEn: 'Yes — thematically organized reviews with synthesis (not just summary), gaps identified, and full reference lists.', qAr: 'يكتب مراجعة أدبيات؟', aAr: 'نعم — مراجعات منظمة موضوعياً بتحليل تركيبي (وليس تلخيصاً فقط)، مع تحديد الفجوات وقوائم مراجع كاملة.' },
      { qEn: 'Does it produce research-grade code?', aEn: 'Yes — clean, commented Python with clear structure, suitable as a starting notebook for research coursework.', qAr: 'يكتب كوداً بمستوى بحثي؟', aAr: 'نعم — Python نظيف وموثق بهيكل واضح، مناسب كنقطة بداية لمقررات البحث.' },
      { qEn: 'Is graduate-level math supported?', aEn: 'Yes — full LaTeX derivations including optimization, PDEs, and linear algebra at graduate depth.', qAr: 'يدعم رياضيات الدراسات العليا؟', aAr: 'نعم — اشتقاقات LaTeX كاملة تشمل التحسين والمعادلات التفاضلية الجزئية والجبر الخطي بعمق الدراسات العليا.' },
    ],
    metaTitle: 'حل واجبات كاوست — Mi-Assignment | KAUST Research Coursework',
    metaDescription: 'مساعد أكاديمي لطلاب كاوست: مراجعات أدبيات، مقترحات بحث، كود بحثي، رياضيات LaTeX بجودة النشر. جرب 3 مهام مجاناً.',
    keywords: 'KAUST assignment help, حل واجبات كاوست, literature review help, research proposal Saudi, دراسات عليا واجبات',
  },

  // ═══ UAE ═══
  {
    slug: 'uaeu-assignment-help',
    nameEn: 'United Arab Emirates University', nameAr: 'جامعة الإمارات العربية المتحدة',
    shortName: 'UAEU', country: 'AE', countryEn: 'UAE', countryAr: 'الإمارات',
    city: 'Al Ain', cityAr: 'العين',
    uniqueEn: 'UAEU, the Emirates\' national university, frames much of its coursework around UAE national priorities: sustainability, Vision-aligned business cases, and UAE-law-referenced legal assignments. Mi-Assignment applies UAE Building Code for engineering, UAE legal frameworks for law, and Gulf academic style throughout.',
    uniqueAr: 'جامعة الإمارات، الجامعة الوطنية للدولة، تؤطر كثيراً من مقرراتها حول الأولويات الوطنية: الاستدامة، ودراسات أعمال مرتبطة برؤية الإمارات، وواجبات قانونية تستند إلى التشريعات الإماراتية. Mi-Assignment يطبق كود البناء الإماراتي في الهندسة والأطر القانونية الإماراتية في القانون والأسلوب الأكاديمي الخليجي في كل شيء.',
    standards: ['UAE Building Code', 'UAE legal framework citations', 'Vision-aligned business framing', 'MOHAP clinical guidelines'],
    popularMajors: ['Engineering', 'Business & Economics', 'Law (شريعة وقانون)', 'Medicine & Health Sciences', 'IT'],
    citationStyles: ['APA 7th', 'IEEE', 'UAE legal citation'],
    faqs: [
      { qEn: 'Does Mi reference UAE law correctly?', aEn: 'Yes — legal missions cite UAE federal codes and can follow the Sharia-and-law dual structure taught at UAEU.', qAr: 'يستشهد بالقانون الإماراتي بشكل صحيح؟', aAr: 'نعم — المهام القانونية تستشهد بالقوانين الاتحادية الإماراتية ويمكنها اتباع منهج الشريعة والقانون المزدوج في جامعة الإمارات.' },
      { qEn: 'Can I pay in AED?', aEn: 'Yes — card payments via Paymob work from the UAE, and pricing displays in dirhams.', qAr: 'أقدر أدفع بالدرهم؟', aAr: 'نعم — الدفع بالبطاقة عبر Paymob يعمل من الإمارات والأسعار تظهر بالدرهم.' },
      { qEn: 'Does it handle sustainability-themed projects?', aEn: 'Yes — sustainability reports, ESG analyses, and UAE-context case studies are common UAEU missions.', qAr: 'يتعامل مع مشاريع الاستدامة؟', aAr: 'نعم — تقارير الاستدامة وتحليلات ESG ودراسات حالة بسياق إماراتي من المهام الشائعة لجامعة الإمارات.' },
    ],
    metaTitle: 'حل واجبات جامعة الإمارات — Mi-Assignment | UAEU Assignment Help',
    metaDescription: 'حل واجبات UAEU: هندسة بكود البناء الإماراتي، شريعة وقانون، أعمال واستدامة. عربي وإنجليزي بأسلوب خليجي. جرب 3 مهام مجاناً.',
    keywords: 'حل واجبات جامعة الإمارات, UAEU assignment help, واجبات جامعية الإمارات, حل واجب العين, UAE law assignment',
  },
  {
    slug: 'aus-assignment-help',
    nameEn: 'American University of Sharjah', nameAr: 'الجامعة الأمريكية في الشارقة',
    shortName: 'AUS', country: 'AE', countryEn: 'UAE', countryAr: 'الإمارات',
    city: 'Sharjah', cityAr: 'الشارقة',
    uniqueEn: 'AUS runs a demanding American-accredited curriculum where engineering design projects, WRI writing courses, and architecture studios dominate the workload. Mi-Assignment generates AUS missions at the internationally calibrated English level the university expects, with IEEE-cited engineering reports and full design documentation.',
    uniqueAr: 'AUS تدير منهجاً أمريكياً معتمداً وصارماً تهيمن فيه مشاريع التصميم الهندسي ومقررات الكتابة WRI واستوديوهات العمارة على عبء الدراسة. Mi-Assignment يولّد مهام AUS بالمستوى الإنجليزي الدولي الذي تتوقعه الجامعة، مع تقارير هندسية بتوثيق IEEE وتوثيق تصميم كامل.',
    standards: ['ABET-style engineering reports', 'IEEE citation', 'WRI academic essay structure', 'Architecture studio documentation'],
    popularMajors: ['Engineering', 'Architecture', 'Business Administration', 'Computer Science', 'Mass Communication'],
    citationStyles: ['IEEE', 'APA 7th', 'Chicago'],
    faqs: [
      { qEn: 'Does Mi handle engineering design projects?', aEn: 'Yes — full design reports with requirements, alternatives analysis, calculations, SVG diagrams, and IEEE references.', qAr: 'يتعامل مع مشاريع التصميم الهندسي؟', aAr: 'نعم — تقارير تصميم كاملة بالمتطلبات وتحليل البدائل والحسابات ورسومات SVG ومراجع IEEE.' },
      { qEn: 'What about WRI essays?', aEn: 'Thesis-driven academic essays with counterargument sections and APA or Chicago citations, matching AUS writing rubrics.', qAr: 'ومقالات WRI؟', aAr: 'مقالات أكاديمية مبنية على أطروحة مع أقسام الحجج المضادة وتوثيق APA أو Chicago، بما يطابق معايير الكتابة في AUS.' },
      { qEn: 'Is architecture supported?', aEn: 'Yes — concept statements, precedent analyses, and studio project documentation.', qAr: 'العمارة مدعومة؟', aAr: 'نعم — بيانات المفهوم وتحليلات السوابق المعمارية وتوثيق مشاريع الاستوديو.' },
    ],
    metaTitle: 'حل واجبات AUS — Mi-Assignment | American University Sharjah',
    metaDescription: 'حل واجبات الجامعة الأمريكية في الشارقة AUS: مشاريع هندسة، عمارة، مقالات WRI بتوثيق IEEE وAPA. مستوى دولي. 3 مهام مجاناً.',
    keywords: 'AUS assignment help, حل واجبات الشارقة, الجامعة الأمريكية الشارقة واجبات, engineering design report, WRI essay',
  },
  {
    slug: 'aud-assignment-help',
    nameEn: 'American University in Dubai', nameAr: 'الجامعة الأمريكية في دبي',
    shortName: 'AUD', country: 'AE', countryEn: 'UAE', countryAr: 'الإمارات',
    city: 'Dubai', cityAr: 'دبي',
    uniqueEn: 'AUD\'s business-and-media-heavy student body faces constant case study analyses, marketing plans, and media production briefs. Mi-Assignment produces AUD-ready deliverables: full marketing plans with Dubai-market data framing, media analyses, and business cases with financial models in Excel.',
    uniqueAr: 'طلاب AUD الذين يغلب عليهم البيزنس والإعلام يواجهون باستمرار تحليلات دراسات حالة وخطط تسويق وبريفات إنتاج إعلامي. Mi-Assignment ينتج مخرجات جاهزة لـ AUD: خطط تسويق كاملة بإطار بيانات سوق دبي، وتحليلات إعلامية، ودراسات أعمال بنماذج مالية في إكسل.',
    standards: ['American case study format', 'Marketing plan structure (SOSTAC/4Ps)', 'APA 7th Edition', 'Financial models in Excel'],
    popularMajors: ['Business Administration', 'Communication & Media', 'Engineering', 'Architecture', 'Interior Design'],
    citationStyles: ['APA 7th', 'Harvard'],
    faqs: [
      { qEn: 'Can Mi build a full marketing plan?', aEn: 'Yes — situation analysis, STP, 4Ps/7Ps, budget tables, and KPIs, delivered as document plus slides.', qAr: 'يبني خطة تسويق كاملة؟', aAr: 'نعم — تحليل الموقف وSTP و4Ps/7Ps وجداول الميزانية ومؤشرات الأداء، تُسلّم كمستند مع سلايدات.' },
      { qEn: 'Does it use Dubai/UAE market context?', aEn: 'Yes — cases are framed with realistic UAE market sizing and consumer context when your brief is UAE-based.', qAr: 'يستخدم سياق سوق دبي؟', aAr: 'نعم — الدراسات تؤطر بحجم سوق إماراتي واقعي وسياق مستهلك محلي عندما يكون واجبك عن الإمارات.' },
      { qEn: 'Are slide decks included?', aEn: 'Every mission can output an 8–12 slide PowerPoint with speaker notes — standard for AUD presentations.', qAr: 'السلايدات مشمولة؟', aAr: 'أي مهمة يمكن أن تخرج PowerPoint من 8–12 سلايد بملاحظات المتحدث — وهو المعتاد في عروض AUD.' },
    ],
    metaTitle: 'حل واجبات AUD — Mi-Assignment | American University Dubai Help',
    metaDescription: 'حل واجبات الجامعة الأمريكية في دبي: خطط تسويق، دراسات حالة، إعلام، نماذج مالية إكسل. مستند + برزنتيشن في مهمة واحدة. جرب مجاناً.',
    keywords: 'AUD assignment help, حل واجبات دبي, خطة تسويق واجب, case study help UAE, واجبات إعلام دبي',
  },
  {
    slug: 'khalifa-university-assignment-help',
    nameEn: 'Khalifa University', nameAr: 'جامعة خليفة',
    shortName: 'Khalifa', country: 'AE', countryEn: 'UAE', countryAr: 'الإمارات',
    city: 'Abu Dhabi', cityAr: 'أبوظبي',
    uniqueEn: 'Khalifa University is the Gulf\'s top-ranked STEM research university: aerospace, nuclear, and petroleum engineering problem sets arrive with research-paper expectations. Mi-Assignment matches that bar — rigorous derivations, simulation-ready code, and IEEE-formatted technical reports.',
    uniqueAr: 'جامعة خليفة أعلى جامعة بحثية علمية تصنيفاً في الخليج: مسائل هندسة الطيران والنووية والبترول تأتي بتوقعات مستوى الأوراق البحثية. Mi-Assignment يطابق هذا المستوى — اشتقاقات دقيقة وكود جاهز للمحاكاة وتقارير تقنية بتنسيق IEEE.',
    standards: ['IEEE technical report format', 'Research-grade derivations', 'Simulation code (Python/MATLAB)', 'ABET-style documentation'],
    popularMajors: ['Aerospace Engineering', 'Mechanical Engineering', 'Petroleum Engineering', 'Computer Science', 'Biomedical Engineering'],
    citationStyles: ['IEEE', 'APA 7th'],
    faqs: [
      { qEn: 'Can Mi solve aerospace problem sets?', aEn: 'Yes — aerodynamics, propulsion, and orbital mechanics with complete step-by-step LaTeX derivations.', qAr: 'يحل مسائل هندسة الطيران؟', aAr: 'نعم — الديناميكا الهوائية والدفع وميكانيكا المدارات باشتقاقات LaTeX كاملة خطوة بخطوة.' },
      { qEn: 'Does it produce simulation code?', aEn: 'Yes — runnable Python/MATLAB with numerical methods implemented and sample outputs in comments.', qAr: 'ينتج كود محاكاة؟', aAr: 'نعم — Python/MATLAB قابل للتشغيل بطرق عددية منفذة وأمثلة نتائج في التعليقات.' },
      { qEn: 'What report format is used?', aEn: 'IEEE-style technical reports by default for Khalifa engineering missions.', qAr: 'ما تنسيق التقارير؟', aAr: 'تقارير تقنية بأسلوب IEEE افتراضياً لمهام الهندسة في جامعة خليفة.' },
    ],
    metaTitle: 'حل واجبات جامعة خليفة — Mi-Assignment | Khalifa University Help',
    metaDescription: 'حل واجبات جامعة خليفة أبوظبي: طيران، ميكانيكا، بترول، حاسوب. اشتقاقات كاملة وكود محاكاة وتقارير IEEE. جرب 3 مهام مجاناً.',
    keywords: 'Khalifa University assignment help, حل واجبات جامعة خليفة, واجبات هندسة أبوظبي, aerospace homework, IEEE report help',
  },

  // ═══ LEBANON ═══
  {
    slug: 'aub-assignment-help',
    nameEn: 'American University of Beirut', nameAr: 'الجامعة الأمريكية في بيروت',
    shortName: 'AUB', country: 'LB', countryEn: 'Lebanon', countryAr: 'لبنان',
    city: 'Beirut', cityAr: 'بيروت',
    uniqueEn: 'AUB, the region\'s oldest American university, holds students to North American academic standards: thesis-driven essays, heavily cited research papers, and rigorous problem sets in engineering and medicine. Mi-Assignment writes AUB missions in the citation-heavy, analytically dense register AUB professors grade for.',
    uniqueAr: 'الجامعة الأمريكية في بيروت، أقدم جامعة أمريكية في المنطقة، تحاسب طلابها على معايير أكاديمية أمريكية شمالية: مقالات مبنية على أطروحة، وأبحاث كثيفة التوثيق، ومسائل صارمة في الهندسة والطب. Mi-Assignment يكتب مهام AUB بالأسلوب التحليلي الكثيف التوثيق الذي يصحح عليه أساتذة الجامعة.',
    standards: ['North American thesis-driven writing', 'APA 7th / Chicago citation', 'ABET engineering standards', 'Clinical case documentation'],
    popularMajors: ['Engineering', 'Medicine', 'Business (OSB)', 'Computer Science', 'Political Studies'],
    citationStyles: ['APA 7th', 'Chicago', 'IEEE', 'Vancouver'],
    faqs: [
      { qEn: 'Does Mi match AUB\'s writing standard?', aEn: 'Yes — AUB is calibrated as North American style: thesis-driven, citation-heavy, and analytically structured.', qAr: 'يطابق مستوى الكتابة في AUB؟', aAr: 'نعم — AUB معايرة على الأسلوب الأمريكي الشمالي: أطروحة واضحة وتوثيق كثيف وبنية تحليلية.' },
      { qEn: 'Can it handle OSB business cases?', aEn: 'Yes — full case analyses with frameworks, financials, and recommendation sections in business-school format.', qAr: 'يحل دراسات حالة كلية الأعمال OSB؟', aAr: 'نعم — تحليلات حالة كاملة بالأطر والنماذج المالية وأقسام التوصيات بتنسيق كليات الأعمال.' },
      { qEn: 'How do Lebanese students pay?', aEn: 'Card payments via Paymob are supported; contact support on WhatsApp for current Lebanon payment options.', qAr: 'كيف يدفع الطلاب في لبنان؟', aAr: 'الدفع بالبطاقة عبر Paymob مدعوم؛ تواصل مع الدعم على واتساب لخيارات الدفع الحالية في لبنان.' },
    ],
    metaTitle: 'حل واجبات AUB — Mi-Assignment | American University Beirut',
    metaDescription: 'حل واجبات الجامعة الأمريكية في بيروت: مقالات بمعايير أمريكية، أبحاث موثقة، هندسة وطب وبيزنس OSB. جرب 3 مهام مجاناً.',
    keywords: 'AUB assignment help, حل واجبات بيروت, الجامعة الأمريكية بيروت واجبات, research paper help Lebanon, OSB case study',
  },
  {
    slug: 'lau-assignment-help',
    nameEn: 'Lebanese American University', nameAr: 'الجامعة اللبنانية الأمريكية',
    shortName: 'LAU', country: 'LB', countryEn: 'Lebanon', countryAr: 'لبنان',
    city: 'Beirut & Byblos', cityAr: 'بيروت وجبيل',
    uniqueEn: 'LAU\'s American liberal-arts curriculum across two campuses produces a steady stream of essays, business projects, and engineering coursework graded on US-style rubrics. Mi-Assignment delivers LAU missions with APA citations, structured argumentation, and complete project packages including slides.',
    uniqueAr: 'منهج LAU الأمريكي الليبرالي عبر حرمين جامعيين ينتج تدفقاً مستمراً من المقالات ومشاريع الأعمال ومقررات الهندسة المصححة على معايير أمريكية. Mi-Assignment يسلّم مهام LAU بتوثيق APA وحجج منظمة وحزم مشاريع كاملة تشمل السلايدات.',
    standards: ['US-style grading rubrics', 'APA 7th Edition', 'Liberal-arts essay structure', 'Full project packages (DOC + PPT)'],
    popularMajors: ['Business', 'Engineering', 'Computer Science', 'Communication Arts', 'Pharmacy'],
    citationStyles: ['APA 7th', 'MLA 9th', 'Chicago'],
    faqs: [
      { qEn: 'Does Mi handle LAU liberal-arts essays?', aEn: 'Yes — structured essays with clear theses, evidence-based body paragraphs, and full APA or MLA reference lists.', qAr: 'يحل مقالات LAU؟', aAr: 'نعم — مقالات منظمة بأطروحات واضحة وفقرات مبنية على الأدلة وقوائم مراجع APA أو MLA كاملة.' },
      { qEn: 'Can it generate presentations?', aEn: 'Yes — 8–12 slide decks with speaker notes accompany any mission on request.', qAr: 'يولّد عروضاً تقديمية؟', aAr: 'نعم — عروض من 8–12 سلايد بملاحظات المتحدث ترافق أي مهمة عند الطلب.' },
      { qEn: 'Is it available in Lebanon?', aEn: 'Yes — Mi-Assignment is fully web-based and works anywhere; the interface is bilingual Arabic/English.', qAr: 'متاح في لبنان؟', aAr: 'نعم — Mi-Assignment يعمل عبر المتصفح من أي مكان والواجهة ثنائية اللغة عربي/إنجليزي.' },
    ],
    metaTitle: 'حل واجبات LAU — Mi-Assignment | Lebanese American University',
    metaDescription: 'حل واجبات الجامعة اللبنانية الأمريكية LAU: مقالات، مشاريع بيزنس، هندسة، برزنتيشن. معايير أمريكية وتوثيق APA. 3 مهام مجاناً.',
    keywords: 'LAU assignment help, حل واجبات LAU, واجبات جامعية لبنان, essay help Beirut, LAU projects',
  },
];

export function getUniversityBySlug(slug: string): UniversityPageData | undefined {
  return UNIVERSITY_PAGES.find(u => u.slug === slug);
}

export const COUNTRY_LABELS: Record<string, { en: string; ar: string; flag: string }> = {
  EG: { en: 'Egypt', ar: 'مصر', flag: '🇪🇬' },
  SA: { en: 'Saudi Arabia', ar: 'السعودية', flag: '🇸🇦' },
  AE: { en: 'UAE', ar: 'الإمارات', flag: '🇦🇪' },
  LB: { en: 'Lebanon', ar: 'لبنان', flag: '🇱🇧' },
};
