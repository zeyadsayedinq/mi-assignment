import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Home, CreditCard, Zap, HelpCircle, BookOpen, Terminal, Vault, Settings, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// ─── Navigation quick-links ───────────────────────────────────────────────────
const NAV_LINKS_EN = [
  { label: 'Home',       icon: Home,       path: '/' },
  { label: 'Terminal',   icon: Terminal,   path: '/app' },
  { label: 'Pricing',    icon: CreditCard, path: '/pricing' },
  { label: 'Vault',      icon: Vault,      path: '/vault' },
  { label: 'Academy',    icon: BookOpen,   path: '/academy' },
  { label: 'Settings',   icon: Settings,   path: '/settings' },
];

const NAV_LINKS_AR = [
  { label: 'الرئيسية',  icon: Home,       path: '/' },
  { label: 'المحطة',    icon: Terminal,   path: '/app' },
  { label: 'الأسعار',   icon: CreditCard, path: '/pricing' },
  { label: 'الخزينة',   icon: Vault,      path: '/vault' },
  { label: 'الأكاديمية', icon: BookOpen,  path: '/academy' },
  { label: 'الإعدادات', icon: Settings,   path: '/settings' },
];

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQS_EN = [
  {
    category: '🚀 Getting Started',
    items: [
      { q: 'How do I submit my first assignment?', a: 'Go to Terminal → choose your assignment type → upload your file or paste your assignment text → fill in your university and course → hit Launch Mission. Results appear in 15–40 seconds.' },
      { q: 'What file types can I upload?', a: 'PDF, DOCX, DOC, PNG, JPG, JPEG, WEBP, TXT, MD, CSV. You can also paste your assignment text directly — no file needed.' },
      { q: 'Can I submit without a file?', a: 'Yes! Just type your assignment directly in the prompt box. Many students paste the assignment question text directly. Mi handles both.' },
      { q: 'How do I get better results?', a: 'Fill in all 4 context fields: university, course, academic system (APA/Harvard/etc.), and assignment type. The more context you provide, the better the calibration.' },
      { q: 'Is there a demo I can try before signing up?', a: 'You get 3 free missions on signup — no credit card required. Sign up at the top of the home page and start immediately.' },
    ],
  },
  {
    category: '⚡ Errors & Troubleshooting',
    items: [
      { q: 'I\'m getting a "503 / high demand" error — what do I do?', a: 'This is a temporary spike on the AI provider side, not a Mi issue. Wait 30–60 seconds and click "Launch Mission" again. If it persists, refresh the page and retry. These spikes usually resolve within 1–2 minutes.' },
      { q: 'The Terminal shows "LIMIT REACHED" but I have Pro.', a: 'Sign out and sign back in to refresh your session — your subscription status updates on next login. If the issue persists, tap the chat icon in the app and send us your email, we\'ll fix it instantly.' },
      { q: 'My result is loading but nothing appears.', a: 'This usually means a slow network. Stay on the page — Mi is still working. If the spinner runs for over 90 seconds, refresh and resubmit. Your mission count is only deducted on a successful result.' },
      { q: 'The app is blank or shows a white screen.', a: 'Hard-refresh: press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac). If on mobile, clear your browser cache from Settings. If the problem continues, email support@mi-assignment.com with a screenshot.' },
      { q: 'My download / export failed.', a: 'Ensure you\'re on a stable connection. Try the download again after 10 seconds. If specific formats (PPTX/DOCX) fail, try downloading the ZIP package which includes all formats.' },
    ],
  },
  {
    category: '📚 Assignment Types',
    items: [
      { q: 'What assignment types does Mi support?', a: 'Essays, reports, case studies, lab reports, presentations (with AI images), research papers, literature reviews, math, physics, engineering calculations, code/programming in any language, SQL databases, business plans, financial models, design briefs, and more — 20+ types total.' },
      { q: 'How does math/engineering work?', a: 'Upload a photo of your problem sheet or paste the questions. Mi solves every step with full working — formulas, unit analysis, LaTeX notation, and clear final answers.' },
      { q: 'Can it write code in any language?', a: 'Yes — Python, JavaScript, TypeScript, Java, C++, C, R, MATLAB, SQL, HTML/CSS, and more. Paste existing code for debugging, or describe what you need built from scratch.' },
      { q: 'Does it handle Arabic language assignments?', a: 'Yes. Switch to Arabic in the sidebar language toggle. Mi responds in Modern Standard Arabic (فصحى) for all content, properly formatted right-to-left.' },
    ],
  },
  {
    category: '🎞️ Presentations',
    items: [
      { q: 'How do I get a full slide deck?', a: 'Select "Presentation" as the assignment type. Mi generates 8–12 slides with cinematic titles, full content per slide, speaker notes, and AI-generated images for each slide.' },
      { q: 'How do I view the presentation?', a: 'After generation, click "Present" to open full-screen Presentation Mode. Arrow keys to navigate slides, N to toggle speaker notes, ESC to exit.' },
      { q: 'Can I download the PowerPoint file?', a: 'Yes — click "Download All" to get a .zip containing a fully formatted .pptx file, ready to open in PowerPoint or Google Slides.' },
    ],
  },
  {
    category: '🗄️ Mi-Vault & Academy',
    items: [
      { q: 'Where are my missions saved?', a: 'Automatically in Mi-Vault. Every completed mission is archived with its full solution. When signed in, it syncs to the cloud — your history is safe across all your devices.' },
      { q: 'What is Mi-Academy?', a: 'Mi-Academy shows the step-by-step reasoning behind every solution. It\'s how you understand what Mi solved, not just copy it. Great for exam prep.' },
      { q: 'Can I delete missions from the Vault?', a: 'Yes — hover any mission card and click the trash icon. You can also star missions to mark favorites and filter by starred.' },
    ],
  },
  {
    category: '💳 Pricing & Plans',
    items: [
      { q: 'How many free missions do I get?', a: '3 free missions when you sign up. They\'re a one-time trial — not monthly resets. Upgrade to Pro for a full mission allowance.' },
      { q: 'What does Pro Quarterly include?', a: '60 missions across 3 months — more than enough for a full university semester. Includes all assignment types, all export formats, priority processing, and direct support.' },
      { q: 'What\'s the cheapest way to use Mi?', a: 'The Quarterly plan at 1,000 EGP / 99 SAR covers a full semester. That\'s about 17 EGP per mission — far cheaper than a tutor session.' },
      { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, Mada, Meeza, Apple Pay, KNET, and Fawry — via Tap Payments, available in Egypt, KSA, UAE, Kuwait, Bahrain, and Jordan.' },
      { q: 'Can I get extra missions for free?', a: 'Yes — share your referral link. When a friend signs up using your link, you both get +2 bonus missions. No limit on how many you can earn.' },
      { q: 'Is there a refund policy?', a: 'If Mi completely fails to produce a usable result for a submitted mission, contact support within 24 hours and we\'ll refund that mission or issue bonus missions. We stand by the quality.' },
    ],
  },
  {
    category: '🔐 Account & Privacy',
    items: [
      { q: 'Is my assignment data private?', a: 'Yes. Your assignment content is processed to generate your result and is not stored beyond what\'s in your Mi-Vault. We do not share or sell user data.' },
      { q: 'How do I change my email or password?', a: 'Go to Settings → Account. You can update your email address and change your password there. You\'ll receive a confirmation email for email changes.' },
      { q: 'Can I use Mi on mobile?', a: 'Yes. The app is fully responsive and works on all mobile browsers. You can also install it as a PWA — tap "Add to Home Screen" in your browser menu for an app-like experience.' },
    ],
  },
];

const FAQS_AR = [
  {
    category: '🚀 البداية',
    items: [
      { q: 'ازاي أبعت أول واجب؟', a: 'روح المحطة ← اختار نوع الواجب ← ارفع ملفك أو الصق نص الواجب ← ادخل اسم الجامعة والمادة ← اضغط "ابدأ المهمة". النتايج بتظهر في ١٥–٤٠ ثانية.' },
      { q: 'أنهي أنواع الملفات ممكن أرفعها؟', a: 'PDF، DOCX، DOC، PNG، JPG، JPEG، WEBP، TXT، MD، CSV. بتقدر كمان تكتب الواجب مباشرة في الخانة من غير ما ترفع أي ملف.' },
      { q: 'أقدر أبعت من غير ملف؟', a: 'أيوه! بس اكتب الواجب في خانة الوصف. كتير من الطلاب بيلصقوا نص سؤال الواجب مباشرة. Mi بيشتغل مع الحالتين.' },
      { q: 'ازاي أجيب نتايج أحسن؟', a: 'ادخل الأربع حقول كلها: الجامعة، المادة، النظام الأكاديمي (APA/Harvard/إلخ)، ونوع الواجب. أكتر سياق تدي، أحسن النتايج.' },
      { q: 'في تجربة مجانية قبل ما أشترك؟', a: 'أيوه — عندك ٣ مهام مجانية لما تسجل حساب. مفيش كارت ائتمان مطلوب. سجّل من الصفحة الرئيسية وابدأ فوراً.' },
    ],
  },
  {
    category: '⚡ مشاكل وحلول',
    items: [
      { q: 'بييجيلي خطأ "503 / الطلب كتير" — أعمل إيه؟', a: 'ده ضغط مؤقت على جانب مزود الذكاء الاصطناعي وموش مشكلة في Mi. استنى ٣٠–٦٠ ثانية واضغط "ابدأ المهمة" تاني. لو استمرت، حدّث الصفحة وجرب. عادةً بتتحل في دقيقة أو اتنين.' },
      { q: 'بيقولي "وصلت للحد" وعندي Pro.', a: 'اخرج من حسابك وارجع ادخل تاني عشان تحدّث جلستك — بيانات الاشتراك بتتحدث عند الدخول. لو المشكلة فضلت، ابعتلنا إيميلك في الشات وهنصلحها فوراً.' },
      { q: 'النتيجة بتلود ومش بتظهر.', a: 'غالباً ده شبكة بطيئة. ابقى في الصفحة — Mi لسه شغال. لو الدوارة فضلت أكتر من ٩٠ ثانية، حدّث وبعت تاني. عداد المهام مش بيتحسب غير لو النتيجة نجحت.' },
      { q: 'التطبيق فاضي أو بيظهر شاشة بيضاء.', a: 'اعمل Hard-refresh: Ctrl+Shift+R (ويندوز) أو Cmd+Shift+R (ماك). على الموبايل، امسح كاش المتصفح من الإعدادات. لو استمر، ابعتلنا سكرين شوت على support@mi-assignment.com' },
      { q: 'التحميل أو التصدير فشل.', a: 'تأكد إن الإنترنت مستقر. حاول تاني بعد ١٠ ثواني. لو فورمات معين (PPTX/DOCX) مش شغال، حمّل الـ ZIP الشامل اللي فيه كل الفورمات.' },
    ],
  },
  {
    category: '📚 أنواع الواجبات',
    items: [
      { q: 'إيه اللي Mi يقدر يحله؟', a: 'كل حاجة: مقالات، تقارير، دراسات حالة، تقارير معمل، بروزنتيشن مع صور AI، أبحاث علمية، مراجعات أدبية، رياضيات، فيزياء، حسابات هندسية، كود وبرمجة بأي لغة، SQL، خطط أعمال، نماذج مالية، تصميم، وأكتر — ٢٠+ نوع.' },
      { q: 'ازاي الرياضيات والهندسة بتشتغل؟', a: 'ارفع صورة ورقة المسائل أو الصق الأسئلة. Mi بيحل كل خطوة بالتفصيل مع الصيغ وتحليل الوحدات وnotation LaTeX والإجابات النهائية الواضحة.' },
      { q: 'يقدر يكتب كود بأي لغة؟', a: 'أيوه — Python، JavaScript، TypeScript، Java، C++، C، R، MATLAB، SQL، HTML/CSS، وأكتر. الصق الكود الموجود للتصحيح أو وصف اللي محتاجه من الصفر.' },
      { q: 'بيشتغل بالعربي؟', a: 'أيوه! اختار العربي من زرار اللغة في الشريط الجانبي. Mi بيجاوب بالعربية الفصحى لكل المحتوى، مع تنسيق RTL صح.' },
    ],
  },
  {
    category: '🎞️ البروزنتيشن',
    items: [
      { q: 'ازاي أعمل بروزنتيشن كامل؟', a: 'اختار "بروزنتيشن" كنوع الواجب. Mi بيولّد ٨–١٢ شريحة مع عناوين جذابة، محتوى كامل لكل شريحة، نوتس للعرض، وصور AI لكل شريحة.' },
      { q: 'ازاي أعرض البروزنتيشن؟', a: 'بعد التوليد، اضغط "عرض الشرائح" لتفتح وضع العرض الكامل. أسهم لوحة المفاتيح للتنقل، N للنوتس، ESC للخروج.' },
      { q: 'أقدر أحمّل ملف PowerPoint؟', a: 'أيوه — اضغط "تحميل الكل" وهتاخد .zip فيه ملف .pptx كامل جاهز تفتحه في PowerPoint أو Google Slides.' },
    ],
  },
  {
    category: '🗄️ الخزينة والأكاديمية',
    items: [
      { q: 'فين بتتحفظ المهام؟', a: 'تلقائياً في Mi-Vault. كل مهمة كاملة بتتأرشف مع الحل الكامل. لو مسجّل دخول، بتتزامن على السحابة وتكون معاك على أي جهاز.' },
      { q: 'إيه هي Mi-Academy؟', a: 'Mi-Academy بتوضحلك التفكير المنطقي ورا كل حل خطوة بخطوة. دي الطريقة تتعلم من اللي حلّه الذكاء الاصطناعي لا مجرد تنسخه. مفيد جداً للمذاكرة.' },
      { q: 'أقدر أمسح مهام من الخزينة؟', a: 'أيوه — مرّر على أي كارت مهمة واضغط أيقونة الحذف. تقدر كمان تضيف نجمة للمهام المفضلة وتصفيها.' },
    ],
  },
  {
    category: '💳 الأسعار والاشتراك',
    items: [
      { q: 'قد إيه المهام المجانية؟', a: '٣ مهام مجانية عند التسجيل. دي تجربة لمرة واحدة — مش بتتجدد كل شهر. اشترك في Pro للحصول على حصة مهام كاملة.' },
      { q: 'إيه اللي بيشمله Pro ربع السنوي؟', a: '٦٠ مهمة على ٣ شهور — أكتر من كافي لترم جامعي كامل. بيشمل كل أنواع الواجبات، كل فورمات التصدير، معالجة أسرع، ودعم مباشر.' },
      { q: 'أرخص طريقة أستخدم Mi؟', a: 'الخطة ربع السنوية بـ ١٠٠٠ ج.م تغطي ترم كامل. ده تقريباً ١٧ ج.م للمهمة — أوفر بكتير من حصة خصوصية.' },
      { q: 'إيه وسائل الدفع المقبولة؟', a: 'فيزا، ماستركارد، مدى، ميزة، Apple Pay، KNET، وفوري — عبر Tap Payments المتاح في مصر والسعودية والإمارات والكويت والبحرين والأردن.' },
      { q: 'أقدر أكسب مهام مجانية؟', a: 'أيوه — شارك رابط الإحالة بتاعك. لما حد يسجّل باستخدام رابطك، انتو الاتنين هتاخدوا +٢ مهام بونص. ومفيش حد أقصى لكام مرة تكسب.' },
      { q: 'في سياسة استرداد؟', a: 'لو Mi فشل تماماً في توليد نتيجة قابلة للاستخدام لمهمة معينة، تواصل معانا خلال ٢٤ ساعة وهنسترد المهمة أو نديك مهام بونص. بنقف ورا الجودة.' },
    ],
  },
  {
    category: '🔐 الحساب والخصوصية',
    items: [
      { q: 'بياناتي ومحتوى واجباتي خاصة؟', a: 'أيوه. محتوى واجبك بيتشتغل عليه لتوليد نتيجتك وما بيتشارش مع أي طرف تالت. بنحافظ على خصوصيتك.' },
      { q: 'ازاي أغير إيميلي أو كلمة المرور؟', a: 'روح الإعدادات ← الحساب. تقدر تعدّل إيميلك وتغير كلمة المرور هناك. هيوصلك إيميل تأكيد لأي تغيير.' },
      { q: 'أقدر أستخدم Mi على الموبايل؟', a: 'أيوه. التطبيق شغال على كل متصفحات الموبايل. بتقدر كمان تثبّته كـ PWA — اضغط "إضافة للشاشة الرئيسية" في قايمة المتصفح للحصول على تجربة تطبيق حقيقية.' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function SOPs() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const FAQS = isAr ? FAQS_AR : FAQS_EN;
  const NAV = isAr ? NAV_LINKS_AR : NAV_LINKS_EN;
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Filter FAQs by search
  const filtered = search.trim().length < 2 ? FAQS : FAQS.map(section => ({
    ...section,
    items: section.items.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.items.length > 0);

  return (
    <div
      className={cn('w-full min-h-screen bg-[#020617] text-white font-sans', isAr && 'font-[Cairo]')}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Top nav bar ── */}
      <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} />
            {isAr ? 'رجوع' : 'Back'}
          </button>

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5">
            <span className="text-[#22D3EE] font-black text-lg leading-none">Mi</span>
            <span className="text-white font-black text-lg leading-none">-Assignment</span>
          </button>

          {/* Help label */}
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'مركز المساعدة' : 'Help Center'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 pb-16">

        {/* ── Quick navigation ── */}
        <div className="pt-8 pb-6">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
            {isAr ? 'تنقل سريع' : 'Quick navigation'}
          </p>
          <div className="flex flex-wrap gap-2">
            {NAV.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0B0E] border border-gray-800 rounded-xl text-sm font-medium text-gray-300 hover:border-[#22D3EE]/40 hover:text-[#22D3EE] transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white mb-1">
            {isAr ? '❓ الأسئلة الشائعة والمساعدة' : '❓ FAQ & Help Guide'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAr ? 'كل اللي محتاج تعرفه عن Mi-Assignment' : 'Everything you need to know about Mi-Assignment'}
          </p>
        </div>

        {/* ── Search ── */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث في الأسئلة...' : 'Search questions...'}
            className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22D3EE]/40 transition-colors"
          />
        </div>

        {/* ── 503 error callout (always visible) ── */}
        <div className="mb-6 bg-orange-500/5 border border-orange-500/20 rounded-xl px-5 py-4 flex gap-3 items-start">
          <Zap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 text-sm font-bold mb-1">
              {isAr ? 'بييجيلك خطأ 503؟' : 'Seeing a 503 error?'}
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {isAr
                ? 'ده ضغط مؤقت على مزود الذكاء الاصطناعي — مش مشكلة في Mi. استنى ٣٠ ثانية واضغط "ابدأ المهمة" تاني. بتتحل في دقيقة.'
                : 'This is a temporary AI provider spike — not a Mi issue. Wait 30 seconds and press Launch Mission again. Resolves within a minute.'}
            </p>
          </div>
        </div>

        {/* ── FAQ sections ── */}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">
              {isAr ? 'مفيش نتايج. جرب كلمة تانية.' : 'No results found. Try a different search term.'}
            </div>
          ) : filtered.map(section => (
            <div key={section.category}>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {section.category}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, i) => {
                  const key = `${section.category}-${i}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className="bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
                    >
                      <button
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-white text-sm font-medium leading-snug">{item.q}</span>
                        {isOpen
                          ? <ChevronDown className="w-4 h-4 text-[#22D3EE] shrink-0 ms-3" />
                          : <ChevronRight className={cn('w-4 h-4 text-gray-600 shrink-0 ms-3', isAr && 'rotate-180')} />
                        }
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 border-t border-gray-900 pt-3">
                              <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Contact CTA ── */}
        <div className="mt-10 bg-gradient-to-r from-[#22D3EE]/10 to-[#A855F7]/5 border border-[#22D3EE]/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold mb-2">
            {isAr ? 'محتاج مساعدة أكتر؟' : 'Still need help?'}
          </h3>
          <p className="text-gray-500 text-sm mb-5">
            {isAr
              ? 'تواصل معانا على الإيميل — بنرد في أقل من ساعتين.'
              : 'Reach us by email — we reply within 2 hours.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@mi-assignment.com"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#22D3EE] text-black font-bold rounded-xl text-sm hover:bg-white transition-all"
            >
              📧 support@mi-assignment.com
            </a>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              {isAr ? 'شوف الأسعار' : 'View Pricing'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition-all"
            >
              <Home className="w-4 h-4" />
              {isAr ? 'الرئيسية' : 'Home'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
