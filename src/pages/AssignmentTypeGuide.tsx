import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, BookOpen, Code, Calculator, FileText, Image, ChevronRight, Zap, Star, CheckCircle2, Lightbulb, Database, FlaskConical, Briefcase, Presentation } from 'lucide-react';
import { cn } from '../lib/utils';

const CARDS_EN = [
  { id: 'essay', title: 'Essays & Reports', icon: FileText, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30', iconColor: 'text-blue-400', rating: 5,
    description: 'Full essays, case studies, literature reviews, lab reports. Any length, any citation style.',
    bestFor: ['Argumentative essays', 'Literature reviews', 'Case studies', 'Lab reports', 'Reflection papers'],
    tips: ['Specify word count', 'Include your thesis if you have one', 'State your citation style (APA, MLA, Harvard)', 'Upload lecture slides for context'],
    prompt: 'Write a 1500-word argumentative essay on the impact of social media on youth mental health. Use APA 7th edition. Include counter-arguments.' },
  { id: 'presentation', title: 'Presentations', icon: Presentation, color: 'from-[#A855F7]/20 to-[#A855F7]/5 border-[#A855F7]/30', iconColor: 'text-[#A855F7]', rating: 5,
    description: 'Mi-Assignment generates 8-12 slides with cinematic titles, full content, speaker notes, AND Mi-generated images per slide.',
    bestFor: ['Academic presentations', 'Business pitches', 'Conference talks', 'Class assignments'],
    tips: ['Specify slide count if needed', 'State your audience', 'Use Presentation Mode after generating', 'Download the PPTX to customize'],
    prompt: 'Create a 10-slide professional presentation on renewable energy solutions for a university audience. Include compelling visuals and full speaker notes.' },
  { id: 'math', title: 'Math & Physics', icon: Calculator, color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30', iconColor: 'text-orange-400', rating: 5,
    description: 'Step-by-step solutions for calculus, algebra, statistics, physics, thermodynamics. Every step shown, every formula explained.',
    bestFor: ['Calculus problems', 'Linear algebra', 'Statistics', 'Classical mechanics', 'Thermodynamics'],
    tips: ['Upload a photo of the problem sheet', 'Ask for every step shown', 'Request unit analysis', 'Number multiple problems clearly'],
    prompt: 'Solve these problems step by step showing all working and formula derivations: [paste or upload your problems]' },
  { id: 'engineering', title: 'Engineering & Calculations', icon: FlaskConical, color: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30', iconColor: 'text-yellow-400', rating: 5,
    description: 'Civil, mechanical, electrical, chemical engineering. Full calculations with assumptions, unit analysis, and design recommendations.',
    bestFor: ['Structural analysis', 'Circuit design', 'Thermodynamic cycles', 'Chemical process', 'Fluid mechanics'],
    tips: ['State the engineering system (civil, mech, elec, chem)', 'List all given values', 'Specify required output format', 'Upload any diagrams or specs'],
    prompt: 'Perform a complete structural analysis for a simply supported beam with a 5kN point load at midspan, span 6m. Show all calculations, shear force and bending moment diagrams.' },
  { id: 'code', title: 'Code & Programming', icon: Code, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', iconColor: 'text-emerald-400', rating: 5,
    description: 'Complete, production-quality code in any language. Full projects, bug fixes, algorithm implementation, documentation.',
    bestFor: ['Python / JavaScript / Java', 'Web apps', 'Algorithm implementation', 'Database design', 'Bug fixing'],
    tips: ['Paste your broken code directly', 'Specify the language explicitly', 'Describe expected vs actual behavior', 'Ask for comments in the code'],
    prompt: 'Build a complete Python Flask REST API with user authentication, CRUD operations for a todo app, SQLite database, and full error handling. Include all files and setup instructions.' },
  { id: 'sql_database', title: 'SQL & Databases', icon: Database, color: 'from-[#22D3EE]/20 to-[#22D3EE]/5 border-[#22D3EE]/30', iconColor: 'text-[#22D3EE]', rating: 5,
    description: 'Database design, SQL queries, ERD diagrams, data analysis. Full schema creation with INSERT statements and complex queries.',
    bestFor: ['Database design assignments', 'SQL query writing', 'Data normalization', 'Excel/CSV analysis', 'ER diagrams'],
    tips: ['Describe the domain (library, hospital, e-commerce)', 'Specify which DBMS (MySQL, PostgreSQL, SQLite)', 'Ask for both DDL and DML', 'Upload your CSV for analysis'],
    prompt: 'Design a complete hospital management database: ERD, SQL schema (CREATE TABLE), sample data (INSERT), and 5 complex queries covering patient records, appointments, billing.' },
  { id: 'research', title: 'Research & Analysis', icon: BookOpen, color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30', iconColor: 'text-indigo-400', rating: 5,
    description: 'Literature reviews, systematic analyses, bibliographies, dissertation chapters, journal-quality research synthesis.',
    bestFor: ['Literature reviews', 'Systematic reviews', 'Bibliographies', 'Dissertation chapters', 'Policy analysis'],
    tips: ['Specify the field and time period', 'Define scope (geographic, temporal)', 'Ask for gaps in literature', 'Request critical analysis not just description'],
    prompt: 'Write a comprehensive literature review on machine learning in healthcare diagnostics (2018–2024). Identify key themes, contradictions, research gaps, and future directions.' },
  { id: 'business_plan', title: 'Business & Finance', icon: Briefcase, color: 'from-teal-500/20 to-teal-500/5 border-teal-500/30', iconColor: 'text-teal-400', rating: 5,
    description: 'Business plans, financial models, market analysis, strategic reports. Full Excel-ready financial projections included.',
    bestFor: ['Business plans', 'Financial analysis', 'Market research', 'Strategy reports', 'Feasibility studies'],
    tips: ['State industry and market clearly', 'Specify currency and region', 'Ask for 3-year projections', 'Include assumptions explicitly'],
    prompt: 'Write a complete business plan for an ed-tech startup targeting MENA university students. Include executive summary, market analysis, financial projections (3 years, EGP), and go-to-market strategy.' },
  { id: 'design', title: 'Design & Visual', icon: Image, color: 'from-pink-500/20 to-pink-500/5 border-pink-500/30', iconColor: 'text-pink-400', rating: 4,
    description: 'Design briefs, brand identity concepts, UI/UX descriptions, visual moodboards, Mi-generated images for presentations.',
    bestFor: ['Brand identity', 'Design briefs', 'UI/UX wireframes', 'Moodboards', 'Visual concepts'],
    tips: ['Use Image Lab for standalone image generation', 'Describe aesthetic: style, colors, mood', 'For presentations, images auto-generate per slide', 'Specify dimensions or format needed'],
    prompt: 'Create a complete brand identity brief for an eco-friendly Egyptian food startup: logo concept, color palette (with hex codes), typography, tone of voice, and 3 visual moodboard image prompts.' },
];

const CARDS_AR = [
  { id: 'essay', title: 'مقالات وتقارير', icon: FileText, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30', iconColor: 'text-blue-400', rating: 5,
    description: 'مقالات كاملة، دراسات حالة، مراجعات أدبية، تقارير معمل. أي طول وأي أسلوب توثيق.',
    bestFor: ['مقالات برأي', 'مراجعات أدبية', 'دراسات حالة', 'تقارير معمل', 'أوراق انعكاسية'],
    tips: ['حدد عدد الكلمات المطلوب', 'اكتب الفرضية لو عندك واحدة', 'قول أسلوب التوثيق (APA، MLA، هارفارد)', 'ارفع شرائح المحاضرة للسياق'],
    prompt: 'اكتب مقال أكاديمي ١٥٠٠ كلمة عن تأثير وسائل التواصل الاجتماعي على الصحة النفسية للشباب. استخدم APA. تضمن حجج مضادة ورد عليها.' },
  { id: 'presentation', title: 'بروزنتيشن وشرائح', icon: FileText, color: 'from-[#A855F7]/20 to-[#A855F7]/5 border-[#A855F7]/30', iconColor: 'text-[#A855F7]', rating: 5,
    description: 'Mi-Assignment بيولّد ٨-١٢ شريحة مع عناوين سينمائية، محتوى كامل، نوتس للعرض، وصور Mi لكل شريحة.',
    bestFor: ['عروض أكاديمية', 'عروض أعمال', 'مؤتمرات', 'واجبات الفصل'],
    tips: ['حدد عدد الشرائح لو محتاج', 'وضّح جمهورك المستهدف', 'استخدم وضع العرض الكامل بعد التوليد', 'حمّل PPTX وخصصه في PowerPoint'],
    prompt: 'اعمل بروزنتيشن ١٠ شرائح عن مصادر الطاقة المتجددة لجمهور جامعي. تضمن صور، نوتس عرض كاملة، وعناوين جذابة.' },
  { id: 'math', title: 'رياضيات وفيزياء', icon: Calculator, color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30', iconColor: 'text-orange-400', rating: 5,
    description: 'حلول خطوة بخطوة للتفاضل والتكامل والجبر والإحصاء والفيزياء والديناميكا الحرارية. كل خطوة موضّحة مع الصيغ.',
    bestFor: ['مسائل التفاضل والتكامل', 'الجبر الخطي', 'الإحصاء', 'الميكانيكا', 'الديناميكا الحرارية'],
    tips: ['ارفع صورة ورقة المسائل', 'اطلب كل خطوة بالتفصيل', 'اطلب تحليل الوحدات', 'رقّم المسائل لو أكثر من واحدة'],
    prompt: 'احل المسائل دي خطوة بخطوة مع كل الخطوات والصيغ المستخدمة: [الصق المسائل أو ارفع الورقة]' },
  { id: 'engineering', title: 'هندسة وحسابات', icon: FlaskConical, color: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30', iconColor: 'text-yellow-400', rating: 5,
    description: 'هندسة مدنية، ميكانيكية، كهربائية، كيميائية. حسابات كاملة مع الافتراضات وتحليل الوحدات والتوصيات التصميمية.',
    bestFor: ['التحليل الإنشائي', 'تصميم الدوائر', 'الدورات الديناميكية', 'العمليات الكيميائية', 'ميكانيكا الموائع'],
    tips: ['حدد نوع الهندسة (مدني، ميكانيكي، كهربائي، كيميائي)', 'اكتب كل القيم المعطاة', 'حدد صيغة المخرجات المطلوبة', 'ارفع أي رسومات أو مواصفات'],
    prompt: 'قم بتحليل إنشائي كامل لعارضة مدعومة ببساطة بحمل نقطي 5kN عند منتصف البحر، بحر 6م. وريني كل الحسابات ورسوم القص والعزم.' },
  { id: 'code', title: 'كود وبرمجة', icon: Code, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', iconColor: 'text-emerald-400', rating: 5,
    description: 'كود كامل وجاهز للتشغيل بأي لغة. مشاريع كاملة، إصلاح أخطاء، تطبيق خوارزميات، توثيق.',
    bestFor: ['Python / JavaScript / Java', 'تطبيقات ويب', 'تطبيق الخوارزميات', 'تصميم قواعد البيانات', 'إصلاح الأخطاء'],
    tips: ['الصق الكود المكسور مباشرة', 'حدد اللغة البرمجية', 'وصف السلوك المتوقع مقابل الحالي', 'اطلب تعليقات داخل الكود'],
    prompt: 'ابني Flask API كامل بـ Python مع authentication للمستخدمين، CRUD لتطبيق todo، قاعدة بيانات SQLite، ومعالجة أخطاء. تضمن كل الملفات وتعليمات التشغيل.' },
  { id: 'sql_database', title: 'SQL وقواعد البيانات', icon: Database, color: 'from-[#22D3EE]/20 to-[#22D3EE]/5 border-[#22D3EE]/30', iconColor: 'text-[#22D3EE]', rating: 5,
    description: 'تصميم قواعد البيانات، استعلامات SQL، مخططات ERD، تحليل البيانات. إنشاء كامل للمخطط مع بيانات واستعلامات معقدة.',
    bestFor: ['واجبات تصميم قواعد البيانات', 'كتابة استعلامات SQL', 'تطبيع البيانات', 'تحليل Excel/CSV', 'مخططات ER'],
    tips: ['وصف المجال (مكتبة، مستشفى، تجارة إلكترونية)', 'حدد نظام إدارة قاعدة البيانات (MySQL، PostgreSQL)', 'اطلب DDL و DML', 'ارفع ملف CSV للتحليل'],
    prompt: 'صمم قاعدة بيانات كاملة لإدارة مستشفى: مخطط ERD، مخطط SQL (CREATE TABLE)، بيانات نموذجية (INSERT)، و٥ استعلامات معقدة.' },
  { id: 'research', title: 'بحث وتحليل', icon: BookOpen, color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30', iconColor: 'text-indigo-400', rating: 5,
    description: 'مراجعات أدبية، تحليلات منهجية، قوائم مراجع، فصول رسائل، تلخيص بحثي على مستوى المجلات.',
    bestFor: ['المراجعات الأدبية', 'المراجعات المنهجية', 'قوائم المراجع', 'فصول الرسائل', 'تحليل السياسات'],
    tips: ['حدد المجال والفترة الزمنية', 'حدد النطاق (جغرافي، زمني)', 'اطلب تحديد الفجوات البحثية', 'اطلب التحليل النقدي مش مجرد الوصف'],
    prompt: 'اكتب مراجعة أدبية شاملة عن تطبيقات الذكاء الاصطناعي في تشخيص الأمراض (٢٠١٨-٢٠٢٤). حدد الموضوعات الرئيسية والتناقضات والفجوات البحثية.' },
  { id: 'business_plan', title: 'أعمال ومالية', icon: Briefcase, color: 'from-teal-500/20 to-teal-500/5 border-teal-500/30', iconColor: 'text-teal-400', rating: 5,
    description: 'خطط أعمال، نماذج مالية، تحليل السوق، تقارير استراتيجية. توقعات مالية جاهزة لـ Excel.',
    bestFor: ['خطط الأعمال', 'التحليل المالي', 'بحوث السوق', 'تقارير الاستراتيجية', 'دراسات الجدوى'],
    tips: ['وضّح الصناعة والسوق', 'حدد العملة والمنطقة', 'اطلب توقعات ٣ سنوات', 'وضّح الافتراضات بوضوح'],
    prompt: 'اكتب خطة عمل كاملة لشركة تقنية تعليمية تستهدف طلاب الجامعات في مصر. تضمن ملخص تنفيذي، تحليل سوق، توقعات مالية (٣ سنوات بالجنيه المصري)، واستراتيجية دخول السوق.' },
  { id: 'design', title: 'تصميم وبصريات', icon: Image, color: 'from-pink-500/20 to-pink-500/5 border-pink-500/30', iconColor: 'text-pink-400', rating: 4,
    description: 'بريفات تصميم، هوية بصرية، UI/UX، موودبوردات، صور Mi للعروض التقديمية.',
    bestFor: ['هوية بصرية', 'بريفات التصميم', 'UI/UX', 'موودبوردات', 'مفاهيم بصرية'],
    tips: ['استخدم مختبر الصور لتوليد الصور', 'وصف الجماليات: الأسلوب والألوان والمزاج', 'في العروض، الصور تتولّد تلقائياً لكل شريحة', 'حدد الأبعاد أو الصيغة المطلوبة'],
    prompt: 'اعمل بريف هوية بصرية كامل لشركة ناشئة مصرية للأغذية الصديقة للبيئة: مفهوم الشعار، لوحة الألوان (مع أكواد hex)، الخطوط، لهجة التواصل، و٣ صور موودبورد.' },
];

export function AssignmentTypeGuide() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const CARDS = isAr ? CARDS_AR : CARDS_EN;
  const [selected, setSelected] = useState(CARDS[0]);
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => { navigator.clipboard.writeText(selected.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans p-5 lg:p-8', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">{isAr ? 'دليل أنواع الواجبات' : 'Assignment Type Guide'}</h1>
          <p className="text-gray-500 text-sm">{isAr ? 'تعرّف على أفضل طريقة تستخدم Mi-Assignment لكل نوع واجب.' : 'Learn how to get the best results from Mi-Assignment for every assignment type.'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Type selector */}
          <div className="space-y-2">
            {CARDS.map(card => (
              <button key={card.id} onClick={() => setSelected(card as any)}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-start transition-all',
                  selected.id === card.id ? `bg-gradient-to-r ${card.color}` : 'bg-[#0A0B0E] border-gray-800 hover:border-gray-600')}>
                <card.icon className={cn('w-4 h-4 shrink-0', selected.id === card.id ? card.iconColor : 'text-gray-500')} />
                <span className={cn('text-sm font-medium flex-1', selected.id === card.id ? 'text-white' : 'text-gray-400')}>{card.title}</span>
                <div className="flex shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-2.5 h-2.5', i < card.rating ? 'text-yellow-400' : 'text-gray-700')} fill={i < card.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className={cn('bg-gradient-to-br p-5 rounded-2xl border', selected.color)}>
                  <div className="flex items-center gap-3 mb-3">
                    <selected.icon className={cn('w-7 h-7', selected.iconColor)} />
                    <h2 className="text-white font-bold text-lg">{selected.title}</h2>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><h3 className="text-white font-bold text-sm">{isAr ? 'مناسب لـ' : 'Best For'}</h3></div>
                    <ul className="space-y-1.5">
                      {selected.bestFor.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-400 text-xs"><span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-yellow-400" /><h3 className="text-white font-bold text-sm">{isAr ? 'نصايح' : 'Pro Tips'}</h3></div>
                    <ul className="space-y-1.5">
                      {selected.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-400 text-xs"><span className="text-yellow-400 shrink-0 mt-0.5">→</span>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#22D3EE]" /><h3 className="text-white font-bold text-sm">{isAr ? 'مثال على البرومبت' : 'Sample Prompt'}</h3></div>
                    <button onClick={copyPrompt} className={cn('text-xs font-mono px-2 py-1 rounded border transition-all', copied ? 'border-emerald-500/50 text-emerald-400' : 'border-gray-700 text-gray-500 hover:text-white')}>
                      {copied ? (isAr ? 'تم ✓' : 'Copied ✓') : (isAr ? 'نسخ' : 'Copy')}
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed italic bg-[#050608] rounded-lg px-4 py-3 border border-gray-900">"{selected.prompt}"</p>
                </div>

                <button
                  onClick={() => navigate('/terminal', { state: { template: selected.id, missionType: selected.id, prefillPrompt: selected.prompt } })}
                  className="w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                  <Zap className="w-4 h-4" /> {isAr ? 'إطلاق هذا النوع' : 'Launch This Type'}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
