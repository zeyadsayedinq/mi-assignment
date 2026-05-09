import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../lib/i18n';
import { ChevronRight, Zap, Globe, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const COUNTRIES = [
  { code: 'EG', en: 'Egypt 🇪🇬', ar: 'مصر 🇪🇬' },
  { code: 'SA', en: 'Saudi Arabia 🇸🇦', ar: 'السعودية 🇸🇦' },
  { code: 'AE', en: 'UAE 🇦🇪', ar: 'الإمارات 🇦🇪' },
  { code: 'KW', en: 'Kuwait 🇰🇼', ar: 'الكويت 🇰🇼' },
  { code: 'BH', en: 'Bahrain 🇧🇭', ar: 'البحرين 🇧🇭' },
  { code: 'JO', en: 'Jordan 🇯🇴', ar: 'الأردن 🇯🇴' },
  { code: 'LB', en: 'Lebanon 🇱🇧', ar: 'لبنان 🇱🇧' },
  { code: 'INT', en: 'International 🌍', ar: 'دولي 🌍' },
];

const TOP_UNIS: Record<string, { en: string; ar: string }[]> = {
  EG: [
    { en: 'Cairo University', ar: 'جامعة القاهرة' }, { en: 'Ain Shams', ar: 'عين شمس' },
    { en: 'AUC', ar: 'AUC' }, { en: 'GUC', ar: 'GUC' }, { en: 'BUE', ar: 'BUE' },
    { en: 'MIU', ar: 'MIU' }, { en: 'MSA University', ar: 'MSA' },
    { en: 'Alexandria University', ar: 'الإسكندرية' }, { en: 'Mansoura University', ar: 'المنصورة' },
    { en: 'Helwan University', ar: 'حلوان' }, { en: 'Nile University', ar: 'جامعة النيل' },
    { en: 'AAST', ar: 'AAST' }, { en: 'Must University', ar: 'Must' },
  ],
  SA: [
    { en: 'King Saud University', ar: 'الملك سعود' }, { en: 'King Abdulaziz University', ar: 'الملك عبدالعزيز' },
    { en: 'KFUPM', ar: 'KFUPM' }, { en: 'KAUST', ar: 'KAUST' },
    { en: 'Imam Muhammad University', ar: 'الإمام محمد' }, { en: 'Alfaisal University', ar: 'الفيصل' },
  ],
  AE: [
    { en: 'UAEU', ar: 'UAEU' }, { en: 'AUS', ar: 'AUS' },
    { en: 'Zayed University', ar: 'زايد' }, { en: 'Khalifa University', ar: 'خليفة' },
    { en: 'University of Sharjah', ar: 'الشارقة' },
  ],
  KW: [
    { en: 'Kuwait University', ar: 'جامعة الكويت' }, { en: 'GUST', ar: 'GUST' }, { en: 'AUK', ar: 'AUK' },
  ],
  BH: [{ en: 'University of Bahrain', ar: 'جامعة البحرين' }, { en: 'AMA International University', ar: 'AMA' }],
  JO: [{ en: 'University of Jordan', ar: 'الجامعة الأردنية' }, { en: 'JUST', ar: 'JUST' }],
  LB: [{ en: 'AUB', ar: 'AUB' }, { en: 'LAU', ar: 'LAU' }],
  INT: [{ en: 'IGCSE', ar: 'IGCSE' }, { en: 'IB', ar: 'IB' }, { en: 'A-Level', ar: 'A-Level' }],
};

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState('');
  const [selectedUni, setSelectedUni] = useState('');
  const [customUni, setCustomUni] = useState('');

  const unis = country ? (TOP_UNIS[country] || []) : [];

  const finish = () => {
    const finalUni = selectedUni === '__custom__' ? customUni : selectedUni;
    if (finalUni) localStorage.setItem('mi_university', finalUni);
    if (country) localStorage.setItem('mi_country', country);
    localStorage.setItem('mi_onboarded', '1');
    onComplete();
    navigate('/terminal');
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-4"
      dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-8 bg-[#22D3EE]' : i < step ? 'w-4 bg-[#22D3EE]/50' : 'w-4 bg-gray-800')} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="lang" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <Globe className="w-10 h-10 text-[#22D3EE] mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white mb-2">اختار لغتك / Choose Language</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ code: 'ar', flag: '🇪🇬', label: 'العربية' }, { code: 'en', flag: '🌍', label: 'English' }].map(l => (
                  <button key={l.code} onClick={() => { setLanguage(l.code as 'ar'|'en'); setStep(1); }}
                    className="flex flex-col items-center gap-2 p-5 bg-[#0A0B0E] border border-gray-800 rounded-2xl hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/5 transition-all">
                    <span className="text-3xl">{l.flag}</span>
                    <span className="text-white font-bold">{l.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="uni" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-white mb-1">{isAr ? 'جامعتك إيه؟' : 'Your university?'}</h2>
                <p className="text-gray-600 text-sm">{isAr ? 'علشان الحل يبقى على مستوى جامعتك' : 'So we calibrate to your university standard'}</p>
              </div>

              {/* Country select */}
              <div className="relative mb-3">
                <select value={country} onChange={e => { setCountry(e.target.value); setSelectedUni(''); }}
                  className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-gray-600">
                  <option value="">{isAr ? 'اختار الدولة أولاً' : 'Select your country first'}</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{isAr ? c.ar : c.en}</option>)}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>

              {/* Universities grid */}
              {unis.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto mb-3">
                  {unis.map(u => (
                    <button key={u.en} onClick={() => setSelectedUni(u.en)}
                      className={cn('px-3 py-2 rounded-xl text-xs font-medium text-start transition-all border',
                        selectedUni === u.en ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40' : 'bg-[#0A0B0E] text-gray-400 border-gray-800 hover:border-gray-700')}>
                      {isAr ? u.ar : u.en}
                    </button>
                  ))}
                  <button onClick={() => setSelectedUni('__custom__')}
                    className={cn('px-3 py-2 rounded-xl text-xs font-medium text-start transition-all border',
                      selectedUni === '__custom__' ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40' : 'bg-[#0A0B0E] text-gray-600 border-gray-800 border-dashed hover:border-gray-700')}>
                    {isAr ? '➕ غير موجودة' : '➕ Not listed'}
                  </button>
                </div>
              )}

              {selectedUni === '__custom__' && (
                <input value={customUni} onChange={e => setCustomUni(e.target.value)}
                  placeholder={isAr ? 'اكتب اسم جامعتك' : 'Type your university name'}
                  className="w-full bg-[#0A0B0E] border border-[#22D3EE]/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none mb-3" />
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => { setStep(2); }} disabled={!selectedUni && !country}
                  className={cn('flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                    (selectedUni || country) ? 'bg-[#22D3EE] text-black' : 'bg-gray-900 text-gray-700 cursor-not-allowed')}>
                  {isAr ? 'التالي' : 'Next'} <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
                </button>
                <button onClick={finish} className="px-4 py-3 rounded-xl text-gray-600 text-sm hover:text-white transition-colors">
                  {isAr ? 'تخطي' : 'Skip'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="ready" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-[#22D3EE]" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3">{isAr ? 'جاهز! 🚀' : "You're set! 🚀"}</h2>
                <p className="text-gray-500 text-sm mb-2">{isAr ? 'Mi جاهز يحل أي واجب في ثوانٍ.' : 'Mi is ready to solve any assignment in seconds.'}</p>
                <div className="space-y-2 text-xs text-gray-600 mb-8 text-start bg-[#0A0B0E] rounded-xl p-4 border border-gray-800">
                  {[
                    isAr ? 'اختار نوع الواجب للدقة' : 'Select assignment type for accuracy',
                    isAr ? 'اختار الجامعة والمادة للدقة' : 'Select university + course for best accuracy',
                    isAr ? 'ارفع ملف الواجب أو الصق النص' : 'Upload or paste assignment text',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] text-[9px] flex items-center justify-center shrink-0">{i+1}</span>
                      {tip}
                    </div>
                  ))}
                </div>
                <button onClick={finish} className="w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-2xl hover:opacity-90 transition-all">
                  {isAr ? '🚀 ابدأ أول مهمة' : '🚀 Start First Mission'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
