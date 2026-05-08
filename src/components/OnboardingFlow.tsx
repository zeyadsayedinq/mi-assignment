import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../lib/i18n';
import { ChevronRight, Zap, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

const UNIS = [
  'AUC', 'GUC', 'BUE', 'MIU', 'MSA', 'Ain Shams', 'Cairo University',
  'KFUPM', 'King Abdulaziz', 'King Saud', 'AUS', 'UAEU', 'Zayed University', 'Other',
];

const UNIS_AR = [
  'AUC', 'GUC', 'BUE', 'MIU', 'MSA', 'عين شمس', 'جامعة القاهرة',
  'KFUPM', 'جامعة الملك عبدالعزيز', 'جامعة الملك سعود', 'AUS', 'UAEU', 'جامعة زايد', 'أخرى',
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [step, setStep] = useState(0); // 0=lang, 1=uni, 2=ready
  const [selectedUni, setSelectedUni] = useState('');

  const unis = isAr ? UNIS_AR : UNIS;

  const finish = () => {
    if (selectedUni) localStorage.setItem('mi_university', selectedUni);
    localStorage.setItem('mi_onboarded', '1');
    onComplete();
    navigate('/terminal');
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-4"
      dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-8 bg-[#22D3EE]' : i < step ? 'w-4 bg-[#22D3EE]/50' : 'w-4 bg-gray-800')} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 0 — Language */}
          {step === 0 && (
            <motion.div key="lang" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-8 text-center">
              <Globe className="w-12 h-12 text-[#22D3EE] mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white mb-2">Welcome to Mi-Assignment</h2>
              <p className="text-gray-500 text-sm mb-8">Choose your language / اختار لغتك</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[{ code: 'en', label: '🇺🇸 English', sub: 'Full English interface' },
                  { code: 'ar', label: '🇸🇦 عربي', sub: 'واجهة عربية كاملة' }].map(lang => (
                  <button key={lang.code}
                    onClick={() => { setLanguage(lang.code as 'en' | 'ar'); setStep(1); }}
                    className="flex flex-col items-center gap-1 p-5 bg-[#050608] border border-gray-800 rounded-xl hover:border-[#22D3EE]/50 hover:bg-[#22D3EE]/5 transition-all group">
                    <span className="text-2xl">{lang.label.split(' ')[0]}</span>
                    <span className="text-white font-bold text-sm group-hover:text-[#22D3EE] transition-colors">{lang.label.split(' ').slice(1).join(' ')}</span>
                    <span className="text-gray-600 text-[10px]">{lang.sub}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1 — University */}
          {step === 1 && (
            <motion.div key="uni" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-black text-white mb-2 text-center">
                {isAr ? 'جامعتك إيه؟' : 'Your university?'}
              </h2>
              <p className="text-gray-500 text-sm mb-6 text-center">
                {isAr ? 'بيساعدنا نضبّط الأسلوب الأكاديمي' : 'Helps us calibrate to your academic level'}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-6">
                {unis.map(uni => (
                  <button key={uni} onClick={() => setSelectedUni(uni)}
                    className={cn('py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-center border',
                      selectedUni === uni
                        ? 'bg-[#22D3EE]/20 border-[#22D3EE]/50 text-[#22D3EE]'
                        : 'bg-[#050608] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white')}>
                    {uni}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)}
                  className="px-4 py-3 border border-gray-800 text-gray-500 rounded-xl text-sm hover:border-gray-600 hover:text-white transition-all">
                  {isAr ? 'رجوع' : 'Back'}
                </button>
                <button onClick={() => setStep(2)}
                  disabled={!selectedUni}
                  className="flex-1 py-3 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
                  {isAr ? 'التالي' : 'Continue'} <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Ready */}
          {step === 2 && (
            <motion.div key="ready" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-black text-white mb-3">
                {isAr ? 'جاهز!' : "You're all set!"}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {isAr
                  ? `أهلاً طالب ${selectedUni}! عندك ٣ مهام مجانية. ابعتلنا الواجب وخليني أتكفل بالباقي.`
                  : `Welcome, ${selectedUni} student! You have 3 free missions. Submit any assignment and Mi handles the rest.`}
              </p>

              {/* Quick tips */}
              <div className="space-y-2 text-left mb-6">
                {(isAr ? [
                  'ارفع ملف PDF أو صورة الواجب',
                  'أو الصق نص الأسئلة مباشرة',
                  'اختار الجامعة والمادة للدقة',
                ] : [
                  'Upload a PDF or photo of your assignment',
                  'Or paste the question text directly',
                  'Select university + course for best accuracy',
                ]).map((tip, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-gray-400 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] font-black text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>

              <button onClick={finish}
                className="w-full py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                {isAr ? 'ابدأ أول مهمة ←' : 'Start my first mission →'}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
