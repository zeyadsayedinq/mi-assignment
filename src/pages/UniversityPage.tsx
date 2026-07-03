import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Zap, CheckCircle2, BookOpen, GraduationCap, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { getUniversityBySlug, UNIVERSITY_PAGES, COUNTRY_LABELS } from '../data/universityPages';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// ─── Per-page JSON-LD injection (FAQPage + Service) ──────────────────────────
function useUniversityJsonLd(slug: string) {
  useEffect(() => {
    const uni = getUniversityBySlug(slug);
    if (!uni) return;

    const scriptId = 'uni-jsonld';
    document.getElementById(scriptId)?.remove();

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: uni.faqs.map(f => ({
          '@type': 'Question',
          name: f.qEn,
          acceptedAnswer: { '@type': 'Answer', text: f.aEn },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Mi-Assignment for ${uni.nameEn}`,
        serviceType: 'AI academic assignment assistance',
        provider: { '@id': 'https://www.mi-assignment.com/#organization' },
        areaServed: uni.countryEn,
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'student',
          audienceType: `${uni.nameEn} students`,
        },
        url: `https://www.mi-assignment.com/universities/${uni.slug}`,
      },
    ];

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => { document.getElementById(scriptId)?.remove(); };
  }, [slug]);
}

export function UniversityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const uni = slug ? getUniversityBySlug(slug) : undefined;

  useUniversityJsonLd(slug || '');

  if (!uni) return <Navigate to="/universities" replace />;

  const country = COUNTRY_LABELS[uni.country];
  const related = UNIVERSITY_PAGES.filter(u => u.country === uni.country && u.slug !== uni.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#020617] text-white" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div className="max-w-4xl mx-auto px-5 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[#22D3EE] font-bold tracking-wide">
          <Sparkles className="w-5 h-5" /> Mi-Assignment
        </Link>
        <LanguageSwitcher />
      </div>

      <main className="max-w-4xl mx-auto px-5 pb-24">
        {/* Breadcrumb — real internal-link structure for crawlers */}
        <nav className="mt-8 text-sm text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#22D3EE]">{isAr ? 'الرئيسية' : 'Home'}</Link>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <Link to="/universities" className="hover:text-[#22D3EE]">{isAr ? 'الجامعات' : 'Universities'}</Link>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-slate-200">{uni.shortName}</span>
        </nav>

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <p className="text-[#22D3EE] text-sm font-semibold tracking-widest uppercase">
            {country.flag} {isAr ? country.ar : country.en} · {isAr ? uni.cityAr : uni.city}
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">
            {isAr ? (
              <>حل واجبات <span className="text-[#22D3EE]">{uni.nameAr}</span> بالذكاء الاصطناعي</>
            ) : (
              <><span className="text-[#22D3EE]">{uni.nameEn}</span> Assignment Help, Built for Your Standards</>
            )}
          </h1>
          <p className="mt-5 text-slate-300 text-lg leading-relaxed">
            {isAr ? uni.uniqueAr : uni.uniqueEn}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth?next=/app"
              className="inline-flex items-center gap-2 bg-[#22D3EE] text-[#020617] font-bold px-6 py-3 rounded-xl hover:bg-[#22D3EE]/90 transition"
            >
              <Zap className="w-4 h-4" />
              {isAr ? 'ابدأ بـ 3 مهام مجانية' : 'Start with 3 free missions'}
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 border border-[#22D3EE]/30 text-[#22D3EE] font-semibold px-6 py-3 rounded-xl hover:bg-[#22D3EE]/10 transition"
            >
              {isAr ? 'الأسعار' : 'Pricing'}
            </Link>
          </div>
        </motion.header>

        {/* Bilingual dual-content block — the second language stays visible for
            crawlers and bilingual students, styled as secondary */}
        <section className="mt-10 border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
          <p className="text-slate-400 leading-relaxed" dir={isAr ? 'ltr' : 'rtl'} lang={isAr ? 'en' : 'ar'}>
            {isAr ? uni.uniqueEn : uni.uniqueAr}
          </p>
        </section>

        {/* Standards Mi applies */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#22D3EE]" />
            {isAr ? `المعايير الأكاديمية اللي Mi بيطبقها لـ ${uni.shortName}` : `Academic standards Mi applies for ${uni.shortName}`}
          </h2>
          <ul className="mt-5 grid sm:grid-cols-2 gap-3">
            {uni.standards.map(s => (
              <li key={s} className="flex items-start gap-2.5 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
                <span className="text-slate-200">{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Majors + citation styles */}
        <section className="mt-14 grid md:grid-cols-2 gap-6">
          <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#22D3EE]" />
              {isAr ? 'التخصصات الأكثر طلباً' : 'Most-solved majors'}
            </h2>
            <ul className="mt-4 space-y-2">
              {uni.popularMajors.map(m => (
                <li key={m} className="text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />{m}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#22D3EE]" />
              {isAr ? 'أنظمة التوثيق المدعومة' : 'Citation styles supported'}
            </h2>
            <ul className="mt-4 space-y-2">
              {uni.citationStyles.map(c => (
                <li key={c} className="text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />{c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works — consistent 3-step, keeps page substantive */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">
            {isAr ? `إزاي بتحل واجب ${uni.shortName} في 3 خطوات` : `How ${uni.shortName} students use Mi in 3 steps`}
          </h2>
          <ol className="mt-6 space-y-4">
            {(isAr
              ? [
                  ['الصق الواجب', `ارفع ملف الواجب أو الصق نصه، واختر ${uni.nameAr} من قائمة الجامعات عشان Mi يعاير الحل على معاييرها.`],
                  ['استلم الباكدج', 'خلال 15–40 ثانية بيطلعلك PDF وWord وPowerPoint (وإكسل لو محتاج) جاهزين للتسليم.'],
                  ['افهم وادافع', 'Mi-Academy بيشرحلك خطوات الحل وبيجهزلك 4 أسئلة دفاع بأسلوب الدكاترة — عشان الشغل يبقى فعلاً بتاعك.'],
                ]
              : [
                  ['Paste your brief', `Upload the assignment file or paste its text, and pick ${uni.nameEn} from the university list so Mi calibrates to its standards.`],
                  ['Get the package', 'In 15–40 seconds you receive submission-ready PDF, Word, and PowerPoint (plus Excel when needed).'],
                  ['Understand & defend', 'Mi-Academy explains every solution step and preps 4 professor-style defense questions — so the work is genuinely yours.'],
                ]
            ).map(([title, body], i) => (
              <li key={title} className="flex gap-4 border border-slate-800 rounded-2xl p-5 bg-slate-900/40">
                <span className="w-8 h-8 shrink-0 rounded-lg bg-[#22D3EE]/15 text-[#22D3EE] font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-slate-300 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ — visible text matching the injected FAQPage JSON-LD */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold">{isAr ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>
          <div className="mt-6 space-y-4">
            {uni.faqs.map(f => (
              <details key={f.qEn} className="border border-slate-800 rounded-2xl bg-slate-900/40 p-5 group">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between gap-3">
                  {isAr ? f.qAr : f.qEn}
                  <ChevronRight className="w-4 h-4 text-[#22D3EE] transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-slate-300 leading-relaxed">{isAr ? f.aAr : f.aEn}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links — related universities in same country */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold">
              {isAr ? `جامعات تانية في ${country.ar}` : `Other universities in ${country.en}`}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {related.map(r => (
                <Link
                  key={r.slug}
                  to={`/universities/${r.slug}`}
                  className="border border-slate-800 hover:border-[#22D3EE]/50 rounded-xl px-4 py-2.5 text-slate-200 hover:text-[#22D3EE] transition text-sm"
                >
                  {isAr ? r.nameAr : r.nameEn}
                </Link>
              ))}
              <Link to="/universities" className="rounded-xl px-4 py-2.5 text-[#22D3EE] text-sm underline underline-offset-4">
                {isAr ? 'كل الجامعات ←' : 'All universities →'}
              </Link>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="mt-16 border border-[#22D3EE]/25 rounded-2xl p-8 text-center bg-gradient-to-b from-[#22D3EE]/10 to-transparent">
          <h2 className="text-2xl font-extrabold">
            {isAr ? `واجب ${uni.shortName} الجاي عليك… خليه علينا` : `Your next ${uni.shortName} assignment, done right`}
          </h2>
          <p className="mt-2 text-slate-300">
            {isAr ? '3 مهام مجانية — من غير كارت بنكي.' : '3 free missions — no credit card required.'}
          </p>
          <Link
            to="/auth?next=/app"
            className="mt-6 inline-flex items-center gap-2 bg-[#22D3EE] text-[#020617] font-bold px-8 py-3.5 rounded-xl hover:bg-[#22D3EE]/90 transition"
          >
            <Zap className="w-4 h-4" />
            {isAr ? 'ابدأ الآن مجاناً' : 'Start free now'}
          </Link>
        </section>
      </main>
    </div>
  );
}
