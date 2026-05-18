import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const COUNTRIES = [
  { value: 'EG', en: '🇪🇬 Egypt', ar: '🇪🇬 مصر' },
  { value: 'SA', en: '🇸🇦 Saudi Arabia', ar: '🇸🇦 السعودية' },
  { value: 'AE', en: '🇦🇪 UAE', ar: '🇦🇪 الإمارات' },
  { value: 'KW', en: '🇰🇼 Kuwait', ar: '🇰🇼 الكويت' },
  { value: 'BH', en: '🇧🇭 Bahrain', ar: '🇧🇭 البحرين' },
  { value: 'JO', en: '🇯🇴 Jordan', ar: '🇯🇴 الأردن' },
  { value: 'LB', en: '🇱🇧 Lebanon', ar: '🇱🇧 لبنان' },
  { value: 'INT', en: '🌍 International', ar: '🌍 دولي' },
];

const UNIVERSITIES: Record<string, { en: string; ar: string }[]> = {
  EG: [
    { en: 'Cairo University', ar: 'جامعة القاهرة' },
    { en: 'Ain Shams', ar: 'عين شمس' },
    { en: 'Alexandria University', ar: 'جامعة الإسكندرية' },
    { en: 'Mansoura University', ar: 'جامعة المنصورة' },
    { en: 'Helwan University', ar: 'جامعة حلوان' },
    { en: 'Al-Azhar University', ar: 'جامعة الأزهر' },
    { en: 'AUC', ar: 'الجامعة الأمريكية بالقاهرة (AUC)' },
    { en: 'GUC', ar: 'الجامعة الألمانية بالقاهرة (GUC)' },
    { en: 'BUE', ar: 'الجامعة البريطانية (BUE)' },
    { en: 'MIU', ar: 'جامعة مصر الدولية (MIU)' },
    { en: 'MSA University', ar: 'جامعة MSA' },
    { en: 'Nile University', ar: 'جامعة النيل' },
    { en: 'Must University', ar: 'جامعة مصر للعلوم والتكنولوجيا' },
    { en: 'Ahram Canadian University', ar: 'جامعة الأهرام الكندية' },
    { en: 'Future University in Egypt', ar: 'جامعة المستقبل' },
    { en: 'October 6 University', ar: 'جامعة أكتوبر 6' },
    { en: 'AAST', ar: 'أكاديمية العلوم والتكنولوجيا (AAST)' },
  ],
  SA: [
    { en: 'King Saud University', ar: 'جامعة الملك سعود' },
    { en: 'King Abdulaziz University', ar: 'جامعة الملك عبدالعزيز' },
    { en: 'KFUPM', ar: 'جامعة الملك فهد للبترول (KFUPM)' },
    { en: 'KAUST', ar: 'جامعة الملك عبدالله للعلوم (KAUST)' },
    { en: 'Alfaisal University', ar: 'جامعة الفيصل' },
    { en: 'Prince Sultan University', ar: 'جامعة الأمير سلطان' },
    { en: 'Umm Al-Qura University', ar: 'جامعة أم القرى' },
    { en: 'Imam Muhammad University', ar: 'جامعة الإمام محمد بن سعود' },
  ],
  AE: [
    { en: 'UAEU', ar: 'جامعة الإمارات العربية (UAEU)' },
    { en: 'AUS', ar: 'الجامعة الأمريكية بالشارقة (AUS)' },
    { en: 'Khalifa University', ar: 'جامعة خليفة' },
    { en: 'Zayed University', ar: 'جامعة زايد' },
    { en: 'University of Sharjah', ar: 'جامعة الشارقة' },
    { en: 'Abu Dhabi University', ar: 'جامعة أبوظبي' },
  ],
  KW: [
    { en: 'Kuwait University', ar: 'جامعة الكويت' },
    { en: 'GUST', ar: 'جامعة الخليج للعلوم والتكنولوجيا (GUST)' },
    { en: 'AUK', ar: 'الجامعة الأمريكية بالكويت (AUK)' },
  ],
  BH: [
    { en: 'University of Bahrain', ar: 'جامعة البحرين' },
    { en: 'AMA International University', ar: 'جامعة AMA الدولية' },
    { en: 'RCSI Bahrain', ar: 'RCSI البحرين' },
  ],
  JO: [
    { en: 'University of Jordan', ar: 'الجامعة الأردنية' },
    { en: 'Yarmouk University', ar: 'جامعة اليرموك' },
    { en: 'JUST', ar: 'جامعة العلوم والتكنولوجيا الأردنية (JUST)' },
    { en: 'German-Jordanian University', ar: 'الجامعة الألمانية الأردنية' },
  ],
  LB: [
    { en: 'AUB', ar: 'الجامعة الأمريكية في بيروت (AUB)' },
    { en: 'LAU', ar: 'الجامعة اللبنانية الأمريكية (LAU)' },
    { en: 'Notre Dame University', ar: 'جامعة سيدة اللويزة (NDU)' },
    { en: 'Lebanese University', ar: 'الجامعة اللبنانية' },
  ],
  INT: [
    { en: 'UK University', ar: 'جامعة بريطانية' },
    { en: 'US University', ar: 'جامعة أمريكية' },
    { en: 'Australian University', ar: 'جامعة أسترالية' },
    { en: 'Canadian University', ar: 'جامعة كندية' },
    { en: 'European University', ar: 'جامعة أوروبية' },
  ],
};

const MAJORS_EN: Record<string, string[]> = {
  '⚙️ Engineering & Tech': ['Civil Engineering', 'Architecture', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering', 'Computer Science (CS)', 'Information Technology (IT)', 'Software Engineering', 'Cybersecurity', 'Artificial Intelligence', 'Information Systems (IS)', 'Petroleum Engineering', 'Industrial Engineering'],
  '🏥 Medical & Health': ['Medicine (MBBS)', 'Dentistry', 'Pharmacy', 'Nursing', 'Physiotherapy', 'Nutrition & Food Sciences', 'Medical Lab Sciences', 'Hospital Administration', 'Biomedical Sciences'],
  '💼 Business & Admin': ['Business Administration (MBA)', 'Marketing', 'Accounting', 'Economics', 'Finance & Banking', 'Human Resources (HR)', 'Supply Chain Management', 'Management Information Systems (MIS)', 'Entrepreneurship'],
  '⚖️ Law & Politics': ['Private Law', 'Public Law', 'Commercial Law', 'Political Science', 'International Relations', 'Sharia & Law'],
  '📺 Media & Arts': ['Journalism & Mass Communication', 'Public Relations', 'Graphic Design', 'Digital Media', 'Advertising'],
  '📖 Humanities': ['English Literature', 'Arabic Literature', 'Translation & Linguistics', 'Psychology', 'Sociology', 'Education & Teaching'],
  '🔬 Pure Sciences': ['Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology', 'Geology'],
};

const MAJORS_AR: Record<string, string[]> = {
  '⚙️ هندسة وتقنية': ['هندسة مدنية', 'هندسة معمارية', 'هندسة كهربائية', 'هندسة ميكانيكية', 'هندسة كيميائية', 'علوم حاسب (CS)', 'تقنية معلومات (IT)', 'هندسة برمجيات', 'أمن المعلومات', 'ذكاء اصطناعي', 'نظم معلومات', 'هندسة بترول', 'هندسة صناعية'],
  '🏥 طب وصحة': ['طب بشري', 'طب أسنان', 'صيدلة', 'تمريض', 'علاج طبيعي', 'تغذية وعلوم غذائية', 'مختبرات طبية', 'إدارة مستشفيات', 'علوم طبية حيوية'],
  '💼 أعمال وإدارة': ['إدارة أعمال (MBA)', 'تسويق', 'محاسبة', 'اقتصاد', 'مالية وبنوك', 'موارد بشرية', 'سلاسل إمداد', 'نظم معلومات إدارية (MIS)', 'ريادة أعمال'],
  '⚖️ قانون وسياسة': ['قانون خاص', 'قانون عام', 'قانون تجاري', 'علوم سياسية', 'علاقات دولية', 'شريعة وقانون'],
  '📺 إعلام وفنون': ['إعلام وصحافة', 'علاقات عامة', 'تصميم جرافيك', 'إعلام رقمي', 'إعلان وتسويق'],
  '📖 إنسانيات': ['أدب إنجليزي', 'أدب عربي', 'ترجمة ولغويات', 'علم نفس', 'علم اجتماع', 'تربية وتعليم'],
  '🔬 علوم بحتة': ['رياضيات', 'إحصاء', 'فيزياء', 'كيمياء', 'أحياء', 'جيولوجيا'],
};

interface OnboardingModalProps {
  userId: string;
  onComplete: (profile: { country: string; university: string; major: string }) => void;
}

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [step, setStep] = useState<1 | 2>(1);
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [customUni, setCustomUni] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [major, setMajor] = useState('');
  const [saving, setSaving] = useState(false);

  const MAJORS = isAr ? MAJORS_AR : MAJORS_EN;
  const unis = country ? (UNIVERSITIES[country] || []) : [];

  // Mark onboarding done in localStorage immediately — Supabase is secondary
  const markDone = () => {
    try { localStorage.setItem(`mi_onboarding_${userId}`, 'done'); } catch {}
  };

  const handleSkip = async () => {
    markDone();
    // Still upsert to Supabase so Settings page knows onboarding was shown
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      });
    } catch {}
    onComplete({ country: '', university: '', major: '' });
  };

  const handleSave = async () => {
    const finalUni = showCustom ? customUni : university;
    if (!finalUni || !major) return;
    setSaving(true);
    markDone();
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        country,
        university: finalUni,
        major,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      });
    } catch {}
    setSaving(false);
    onComplete({ country, university: finalUni, major });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn('w-full max-w-md bg-[#0A0B0E] border border-[#22D3EE]/20 rounded-2xl overflow-hidden', isAr && 'font-[Cairo]')}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-black text-lg">
                {isAr ? 'أهلاً بيك في Mi 👋' : 'Welcome to Mi 👋'}
              </h2>
              <p className="text-gray-500 text-xs">
                {isAr ? 'عشان نحل واجباتك صح من أول مرة' : 'So we can solve your assignments right, first time'}
              </p>
            </div>
            {/* Skip — one time only, always visible */}
            <button
              onClick={handleSkip}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 shrink-0"
            >
              {isAr ? 'تخطي' : 'Skip'}
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1.5 mt-4">
            {[1, 2].map(s => (
              <div key={s} className={cn('h-1 rounded-full flex-1 transition-all',
                s <= step ? 'bg-[#22D3EE]' : 'bg-white/10')} />
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Country */}
                <div className="mb-4">
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                    {isAr ? 'دولتك' : 'Your Country'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => { setCountry(c.value); setUniversity(''); setShowCustom(false); }}
                        className={cn('px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border',
                          country === c.value
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE]/50 text-[#22D3EE]'
                            : 'bg-[#050608] border-gray-800 text-gray-400 hover:border-gray-600')}
                      >
                        {isAr ? c.ar : c.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* University */}
                {country && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 block">
                      {isAr ? 'جامعتك' : 'Your University'}
                    </label>
                    {!showCustom ? (
                      <select
                        value={university}
                        onChange={e => {
                          if (e.target.value === '__custom__') { setShowCustom(true); setUniversity(''); }
                          else setUniversity(e.target.value);
                        }}
                        className="w-full bg-[#050608] border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE] transition-all"
                      >
                        <option value="">{isAr ? '— اختار جامعتك —' : '— Select your university —'}</option>
                        {unis.map(u => (
                          <option key={u.en} value={u.en}>{isAr ? u.ar : u.en}</option>
                        ))}
                        <option value="__custom__">{isAr ? '➕ جامعتي مش في القائمة' : '➕ My university is not listed'}</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={customUni}
                          onChange={e => setCustomUni(e.target.value)}
                          placeholder={isAr ? 'اكتب اسم جامعتك' : 'Type your university name'}
                          className="flex-1 bg-[#050608] border border-[#22D3EE]/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]"
                          autoFocus
                        />
                        <button onClick={() => { setShowCustom(false); setCustomUni(''); }}
                          className="px-3 py-2 text-gray-500 hover:text-white text-xs border border-gray-800 rounded-xl">
                          ✕
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!country}
                  className="w-full mt-5 py-3 bg-[#22D3EE] text-black font-black rounded-xl hover:bg-white transition-all text-sm disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {isAr ? 'التالي' : 'Next'}
                  <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  {isAr ? 'تخصصك / مجالك الدراسي' : 'Your Major / Field of Study'}
                </label>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(MAJORS).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-semibold">{category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(m => (
                          <button
                            key={m}
                            onClick={() => setMajor(m)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                              major === m
                                ? 'bg-[#A855F7]/15 border-[#A855F7]/50 text-[#A855F7]'
                                : 'bg-[#050608] border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300')}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-3 border border-gray-800 text-gray-400 rounded-xl text-sm hover:border-gray-600 transition-all"
                  >
                    {isAr ? 'رجوع' : 'Back'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!major || saving}
                    className="flex-1 py-3 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isAr ? 'جاهز! ابدأ 🚀' : "Let's go! 🚀"}
                  </button>
                </div>

                <p className="text-center text-gray-700 text-[10px] mt-3">
                  {isAr ? 'تقدر تغير ده في أي وقت من الإعدادات' : 'You can change this anytime in Settings'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
