import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Wand2, Download, X, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const STORAGE_KEY = 'mi_onboarding_done';

export function shouldShowOnboarding(): boolean {
  try { return !localStorage.getItem(STORAGE_KEY); } catch { return false; }
}

/**
 * One-time 3-step intro shown on a user's first visit to the Terminal.
 * Self-contained: gated by localStorage, no external state, no network.
 */
export function OnboardingOverlay({ onDone }: { onDone: () => void }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Upload,
      title_en: 'Add your assignment', title_ar: 'ضيف واجبك',
      body_en: 'Pick your country, university and major, then paste your assignment or upload a photo, PDF, or Word file.',
      body_ar: 'اختار دولتك وجامعتك وتخصصك، بعدين الصق الواجب أو ارفع صورة أو PDF أو ملف Word.',
      color: '#22D3EE',
    },
    {
      icon: Wand2,
      title_en: 'Choose your language', title_ar: 'اختار لغتك',
      body_en: 'Set the submission language — Arabic or English — and Mi writes the whole solution the way your university expects.',
      body_ar: 'حدد لغة التسليم — عربي أو إنجليزي — وMi هيكتب الحل كله بالطريقة اللي جامعتك عايزاها.',
      color: '#A855F7',
    },
    {
      icon: Download,
      title_en: 'Download your package', title_ar: 'نزّل حزمتك',
      body_en: 'In under a minute you get a complete package: PDF, Word, slides, and a step-by-step breakdown to help you understand it.',
      body_ar: 'في أقل من دقيقة بتاخد حزمة كاملة: PDF و Word وبريزنتيشن وشرح خطوة بخطوة يساعدك تفهم.',
      color: '#22D3EE',
    },
  ];

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    onDone();
  };

  const s = steps[step];
  const Icon = s.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[250] bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center p-4"
      dir={isAr ? 'rtl' : 'ltr'}>
      <div className={cn('bg-[#0A0B0E] border border-gray-800 rounded-2xl max-w-md w-full p-8 relative', isAr && 'font-[Cairo]')}>
        <button onClick={finish} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors" aria-label="Skip">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: `${s.color}1a`, border: `1px solid ${s.color}40` }}>
          <Icon className="w-7 h-7" style={{ color: s.color }} />
        </div>

        <p className={cn('text-gray-600 text-xs mb-2', isAr ? 'font-[Cairo]' : 'font-mono uppercase tracking-widest')}>
          {isAr ? `خطوة ${step + 1} من ${steps.length}` : `Step ${step + 1} of ${steps.length}`}
        </p>
        <h2 className="text-2xl font-black text-white mb-3">{isAr ? s.title_ar : s.title_en}</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">{isAr ? s.body_ar : s.body_en}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-[#22D3EE]' : 'w-1.5 bg-gray-700')} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isLast && (
              <button onClick={finish} className="text-gray-500 hover:text-gray-300 text-sm px-3 py-2 transition-colors">
                {isAr ? 'تخطي' : 'Skip'}
              </button>
            )}
            <button
              onClick={() => isLast ? finish() : setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-white transition-all text-sm">
              {isLast ? (isAr ? 'يلا نبدأ' : 'Get started') : (isAr ? 'التالي' : 'Next')}
              {!isLast && <ArrowRight className={cn('w-4 h-4', isAr && 'rotate-180')} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
