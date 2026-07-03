import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, ChevronRight } from 'lucide-react';
import { UNIVERSITY_PAGES, COUNTRY_LABELS } from '../data/universityPages';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const COUNTRY_ORDER: Array<'EG' | 'SA' | 'AE' | 'LB'> = ['EG', 'SA', 'AE', 'LB'];

export function UniversitiesIndex() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-[#020617] text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-5 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[#22D3EE] font-bold tracking-wide">
          <Sparkles className="w-5 h-5" /> Mi-Assignment
        </Link>
        <LanguageSwitcher />
      </div>

      <main className="max-w-4xl mx-auto px-5 pb-24">
        <motion.header
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mt-12"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            {isAr ? (
              <>حل الواجبات لكل <span className="text-[#22D3EE]">جامعة</span> بمعاييرها</>
            ) : (
              <>Assignment help calibrated to <span className="text-[#22D3EE]">your university</span></>
            )}
          </h1>
          <p className="mt-5 text-slate-300 text-lg leading-relaxed max-w-2xl">
            {isAr
              ? 'Mi-Assignment مش بيحل الواجب وخلاص — بيحله بمعايير جامعتك: الأكواد الهندسية، وأنظمة التوثيق، وأسلوب الكتابة اللي دكاترتك بيصححوا عليه. اختار جامعتك من تحت.'
              : 'Mi-Assignment doesn\'t just solve the assignment — it solves it to your university\'s standards: engineering codes, citation systems, and the writing register your professors grade for. Pick yours below.'}
          </p>
        </motion.header>

        {COUNTRY_ORDER.map(code => {
          const unis = UNIVERSITY_PAGES.filter(u => u.country === code);
          if (unis.length === 0) return null;
          const c = COUNTRY_LABELS[code];
          return (
            <section key={code} className="mt-12">
              <h2 className="text-xl font-bold text-slate-100">
                {c.flag} {isAr ? c.ar : c.en}
              </h2>
              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                {unis.map(u => (
                  <Link
                    key={u.slug}
                    to={`/universities/${u.slug}`}
                    className="group border border-slate-800 hover:border-[#22D3EE]/50 rounded-2xl p-5 bg-slate-900/40 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-white group-hover:text-[#22D3EE] transition">
                        {isAr ? u.nameAr : u.nameEn}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-[#22D3EE] shrink-0 rtl:rotate-180" />
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {isAr ? u.cityAr : u.city} · {u.shortName}
                    </p>
                    <p className="mt-2 text-sm text-slate-300 line-clamp-2">
                      {u.standards.slice(0, 2).join(' · ')}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-16 border border-[#22D3EE]/25 rounded-2xl p-8 text-center bg-gradient-to-b from-[#22D3EE]/10 to-transparent">
          <h2 className="text-2xl font-extrabold">
            {isAr ? 'جامعتك مش في القائمة؟' : 'Don\'t see your university?'}
          </h2>
          <p className="mt-2 text-slate-300">
            {isAr
              ? 'Mi-Assignment بيدعم 94 جامعة في المنطقة — القائمة الكاملة جوه التطبيق. جرب مجاناً.'
              : 'Mi-Assignment supports 94 universities across MENA — the full list is inside the app. Try it free.'}
          </p>
          <Link
            to="/auth?next=/app"
            className="mt-6 inline-flex items-center gap-2 bg-[#22D3EE] text-[#020617] font-bold px-8 py-3.5 rounded-xl hover:bg-[#22D3EE]/90 transition"
          >
            <Zap className="w-4 h-4" />
            {isAr ? 'ابدأ بـ 3 مهام مجانية' : 'Start with 3 free missions'}
          </Link>
        </section>
      </main>
    </div>
  );
}
