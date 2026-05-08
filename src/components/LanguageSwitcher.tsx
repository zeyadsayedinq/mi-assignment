import React from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../lib/i18n';
import { Globe } from 'lucide-react';
import { Analytics } from '../lib/analytics';
import { cn } from '../lib/utils';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => {
    const next = isAr ? 'en' : 'ar';
    setLanguage(next);
    Analytics.languageChanged(next);
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 transition-all text-xs font-mono"
        title={isAr ? 'Switch to English' : 'التبديل للعربية'}
      >
        <Globe className="w-3.5 h-3.5" />
        {isAr ? 'EN' : 'ع'}
      </button>
    );
  }

  return (
    <div className="flex items-center bg-[#0A0B0E] border border-gray-800 rounded-xl p-1 w-full">
      {(['en', 'ar'] as const).map(lang => (
        <button
          key={lang}
          onClick={() => { setLanguage(lang); Analytics.languageChanged(lang); }}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center',
            i18n.language === lang
              ? 'bg-[#22D3EE] text-black'
              : 'text-gray-500 hover:text-white'
          )}
        >
          {lang === 'en' ? '🇺🇸 EN' : '🇸🇦 عربي'}
        </button>
      ))}
    </div>
  );
}
