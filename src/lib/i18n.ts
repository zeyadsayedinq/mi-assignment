import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load translations inline to avoid fetch issues in dev
import en from '../../public/locales/en.json';
import ar from '../../public/locales/ar.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('mi_lang') || 'en' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);
  localStorage.setItem('mi_lang', lang);
  const html = document.documentElement;
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  html.setAttribute('lang', lang);
  // Add Arabic font when RTL
  if (lang === 'ar') {
    if (!document.getElementById('arabic-font')) {
      const link = document.createElement('link');
      link.id = 'arabic-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = "'Cairo', sans-serif";
  } else {
    document.body.style.fontFamily = '';
  }
}

// Apply on load
if (typeof window !== 'undefined') {
  const lang = localStorage.getItem('mi_lang') || 'en';
  if (lang === 'ar') setLanguage('ar');
}

export default i18n;
