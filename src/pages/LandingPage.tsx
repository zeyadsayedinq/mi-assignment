import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Shield, Zap, Star, ChevronRight, Brain, Sparkles, Code, Calculator, BookOpen, FileText, Users, Share2, Copy, Check, CheckCircle2 } from 'lucide-react';
import { MILogo3D } from '../components/MILogo3D';
import { GlitchText } from '../components/GlitchText';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { storeReferralCode } from '../lib/referral';
import { ReferralWidget } from '../components/ReferralWidget';
import { supabase } from '../lib/supabase';

// ─── Live mission counter ────────────────────────────────────────────────────
function useMissionCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    supabase.from('missions').select('id', { count: 'exact', head: true })
      .then(({ count: c }) => { if (c != null) setCount(c); }, () => {});
  }, []);
  return count;
}

// ─── Animated counter ────────────────────────────────────────────────────────
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setVal(target); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let start = 0;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1400, 1);
        setVal(Math.floor(p * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.disconnect();
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const TYPES_EN = [
  { icon: Brain,       label: 'Case Studies',      color: 'text-blue-400',    border: 'border-blue-500/30' },
  { icon: FileText,    label: 'Essays & Reports',   color: 'text-[#22D3EE]',   border: 'border-[#22D3EE]/30' },
  { icon: Sparkles,    label: 'Presentations',      color: 'text-[#A855F7]',   border: 'border-[#A855F7]/30' },
  { icon: Code,        label: 'Code & SQL',         color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { icon: Calculator,  label: 'Math & Engineering', color: 'text-orange-400',  border: 'border-orange-500/30' },
  { icon: BookOpen,    label: 'Research Papers',    color: 'text-pink-400',    border: 'border-pink-500/30' },
];
const TYPES_AR = [
  { icon: Brain,       label: 'دراسات حالة',        color: 'text-blue-400',    border: 'border-blue-500/30' },
  { icon: FileText,    label: 'مقالات وتقارير',      color: 'text-[#22D3EE]',   border: 'border-[#22D3EE]/30' },
  { icon: Sparkles,    label: 'برزنتيشن',            color: 'text-[#A855F7]',   border: 'border-[#A855F7]/30' },
  { icon: Code,        label: 'كود وSQL',            color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { icon: Calculator,  label: 'رياضيات وهندسة',      color: 'text-orange-400',  border: 'border-orange-500/30' },
  { icon: BookOpen,    label: 'أبحاث علمية',         color: 'text-pink-400',    border: 'border-pink-500/30' },
];

const REVIEWS_EN = [
  { text: 'Got an A on my case study. The writing was exactly like a real student.', name: 'Nour A.', uni: 'AUC Cairo', stars: 5 },
  { text: 'Used it for 3 engineering assignments. Calculations were correct every time.', name: 'Khaled M.', uni: 'GUC', stars: 5 },
  { text: 'The presentation was better than what I would have made in 3 hours.', name: 'Sara F.', uni: 'AUS Dubai', stars: 5 },
  { text: 'The Arabic mode is incredible. Writes like a student, not a robot.', name: 'Abdullah R.', uni: 'KFUPM', stars: 5 },
];
const REVIEWS_AR = [
  { text: 'حصلت على A في دراسة الحالة. الكتابة بالظبط زي طالب حقيقي.', name: 'نور أ.', uni: 'AUC القاهرة', stars: 5 },
  { text: 'استخدمته في ٣ واجبات هندسة. الحسابات كانت صح كل مرة.', name: 'خالد م.', uni: 'GUC', stars: 5 },
  { text: 'البرزنتيشن كان أحسن مما كنت هعمله في ٣ ساعات.', name: 'سارة ف.', uni: 'AUS دبي', stars: 5 },
  { text: 'الوضع العربي مذهل. بيكتب زي طالب مش روبوت.', name: 'عبدالله ر.', uni: 'KFUPM', stars: 5 },
];

const FAQS_EN = [
  { q: 'Will professors know I used Mi?', a: 'Mi writes like a real student — authentic, calibrated to your university level. Reads like you wrote it yourself.' },
  { q: 'What types does it handle?', a: 'Essays, reports, presentations with smart visuals, code, math step-by-step, engineering, SQL, business plans, research, lab reports — 20+ types.' },
  { q: 'How fast?', a: 'Most assignments: 15-40 seconds. Complex engineering or long essays: up to 90 seconds.' },
  { q: 'Arabic support?', a: 'Yes — full Arabic interface RTL. Mi responds in Modern Standard Arabic (فصحى).' },
  { q: 'Is 1000 EGP worth it?', a: '1000 EGP = 90 days, 40 missions. A full semester. One solved assignment saves you hours — that alone covers the cost.' },
  { q: 'How does referral work?', a: 'Share your link. A friend signs up → you both get 2 bonus missions. No limit.' },
];
const FAQS_AR = [
  { q: 'الدكتور هيعرف؟', a: 'Mi بيكتب زي طالب حقيقي — طبيعي ومكيّف لمستوى جامعتك. بيبان إنك إنت اللي كتبته.' },
  { q: 'إيه الأنواع اللي بيحلها؟', a: 'مقالات، برزنتيشن مع صور احترافية، كود، رياضيات، هندسة، SQL، خطط أعمال، أبحاث، تقارير معمل — أكتر من ٢٠ نوع.' },
  { q: 'بيشتغل بسرعة؟', a: 'معظم الواجبات ١٥-٤٠ ثانية. المعقدة حتى ٩٠ ثانية.' },
  { q: 'بيشتغل بالعربي؟', a: 'أيوه — واجهة RTL كاملة. Mi بيرد بالعربية الفصحى.' },
  { q: '١٠٠٠ ج.م تستاهل؟', a: '١٠٠٠ ج.م = ٩٠ يوم، ٤٠ مهمة. ترم كامل. واجب واحد بيوفر ساعات — ده وحده بيغطي التكلفة.' },
  { q: 'نظام الإحالة بيشتغل إزاي؟', a: 'شارك رابطك. صديق يسجّل → انتوا الاتنين تاخدوا ٢ مهام زيادة. مفيش حد أقصى.' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { session } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const missionCount = useMissionCount();

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const ri = parts.indexOf('ref');
    if (ri !== -1 && parts[ri + 1]) storeReferralCode(parts[ri + 1]);
    const urlRef = new URLSearchParams(window.location.search).get('ref');
    if (urlRef) storeReferralCode(urlRef);
  }, []);

  const TYPES = isAr ? TYPES_AR : TYPES_EN;
  const REVIEWS = isAr ? REVIEWS_AR : REVIEWS_EN;
  const FAQS = isAr ? FAQS_AR : FAQS_EN;
  const go = () => navigate(session ? '/app' : '/auth');

  return (
    <div className={cn('min-h-screen bg-[#020617] text-white overflow-x-hidden', isAr ? 'font-[Cairo]' : 'font-sans')}
      dir={isAr ? 'rtl' : 'ltr'}>

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/90 backdrop-blur border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center">
              <span className="font-black text-black text-xs">Mi</span>
            </div>
            <span className="font-black text-sm">Mi-Assignment</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher compact />
            <Link to="/pricing" className="hidden sm:block text-gray-400 hover:text-white text-sm transition-colors px-3">
              {isAr ? 'الأسعار' : 'Pricing'}
            </Link>
            <button onClick={go} className="flex items-center gap-1.5 px-3 py-2 bg-[#22D3EE] text-black font-bold rounded-xl text-xs whitespace-nowrap hover:bg-white transition-all">
              {session ? (isAr ? 'داشبورد' : 'Dashboard') : (isAr ? 'ابدأ' : 'Start Free')}
              <ChevronRight className={cn('w-3.5 h-3.5', isAr && 'rotate-180')} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#22D3EE]/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#A855F7]/5 rounded-full blur-[140px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }} className="flex justify-center mb-8">
            <MILogo3D size={76} autoSpin={false} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-[11px] font-mono uppercase tracking-widest mb-7">
              <Shield className="w-3 h-3" />
              {isAr ? 'المساعد الأكاديمي للطلاب العرب' : 'Mi — Academic Engine for MENA Students'}
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-7">
              {isAr ? (
                <><GlitchText text="ابعتلنا" className="block text-white" />
                  <GlitchText text="الواجب." className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7]" /></>
              ) : (
                <><GlitchText text="SUBMIT ANY" className="block text-white" />
                  <GlitchText text="ASSIGNMENT." className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7]" /></>
              )}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-3">
              {isAr ? 'مقالات، برزنتيشن، كود، رياضيات — محلول في ١٥ ثانية، مكتوب زي طالب حقيقي.'
                : 'Essays, presentations, code, math, engineering — solved in 15 seconds, written like a real student.'}
            </p>
            <p className="text-gray-600 text-xs mb-10">
              {isAr ? 'كتابة طبيعية بمستوى طالب حقيقي · مكيّف لجامعتك' : 'Authentic student-level writing · calibrated to your university'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <button onClick={go}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-2xl hover:opacity-90 transition-all shadow-[0_0_40px_rgba(34,211,238,0.15)] text-sm">
                <Zap className="w-4 h-4" />
                {session ? (isAr ? 'الداشبورد' : 'Go to Dashboard') : (isAr ? 'ابدأ مجاناً — ٣ مهام' : 'Start Free — 3 Missions')}
              </button>
              <Link to="/intelligence-bureau"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.04] border border-white/10 text-white font-bold rounded-2xl hover:bg-white/[0.08] transition-all text-sm">
                {isAr ? 'شوف أنواع الواجبات' : 'See assignment types'}
                <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
              </Link>
            </div>
            <p className="text-gray-600 text-xs">{isAr ? 'بدون بطاقة · ٣ مهام مجانية' : 'No credit card · 3 free missions included'}</p>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10 border-y border-white/[0.04] bg-[#020617]/80">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { val: missionCount ?? 4000, suf: '+', label: isAr ? 'واجب تم حله' : 'assignments solved' },
            { val: 20, suf: '+', label: isAr ? 'نوع واجب' : 'assignment types' },
            { val: 15, suf: 's', label: isAr ? 'ثانية متوسط الحل' : 'avg solve time' },
            { val: 94, suf: '+', label: isAr ? 'جامعة معروفة' : 'universities supported' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl sm:text-4xl font-black text-white mb-1">
                <CountUp target={s.val} suffix={s.suf} />
              </p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ASSIGNMENT TYPES */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-3">{isAr ? 'بيحل أي نوع' : 'Handles every type'}</h2>
          <p className="text-gray-500 text-sm text-center mb-10">{isAr ? 'كل الأنواع، كل المتطلبات' : 'Every format, every requirement'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TYPES.map((t, i) => (
              <div key={i} className={cn('bg-[#0A0B0E] border rounded-2xl p-5 hover:bg-white/[0.02] transition-all group cursor-pointer', t.border)}>
                <t.icon className={cn('w-6 h-6 mb-3', t.color)} />
                <p className="text-white font-bold text-sm">{t.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/intelligence-bureau" className={cn('inline-flex items-center gap-2 text-[#22D3EE] text-sm font-bold hover:text-white transition-colors')}>
              {isAr ? 'شوف كل ٢٠+ نوع' : 'See all 20+ types'}
              <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-5 bg-[#050608]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">{isAr ? 'ازاي بيشتغل؟' : 'How it works'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(isAr ? [
              { n: '١', e: '📎', t: 'ارفع أو اكتب', b: 'ارفع ملف PDF أو صورة الواجب، أو الصق الأسئلة مباشرة.' },
              { n: '٢', e: '🧠', t: 'Mi يحل', b: 'في ١٥-٤٠ ثانية، Mi بيولّد حل كامل بأسلوب طالب حقيقي.' },
              { n: '٣', e: '📥', t: 'حمّل أو انسخ', b: 'احصل على PDF، PPTX، أو CSV. أو انسخ النص مباشرة.' },
            ] : [
              { n: '1', e: '📎', t: 'Upload or type', b: 'Upload a PDF or photo, or paste the questions directly.' },
              { n: '2', e: '🧠', t: 'Mi solves it', b: 'In 15-40 seconds, Mi generates a complete solution in authentic student voice.' },
              { n: '3', e: '📥', t: 'Download or copy', b: 'Get a PDF, PPTX, or CSV. Or copy text straight into your doc.' },
            ]).map(s => (
              <div key={s.n} className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-[#22D3EE]/20 transition-all">
                <div className="absolute top-4 end-4 text-3xl opacity-10 group-hover:opacity-30 transition-opacity">{s.e}</div>
                <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] font-black text-lg flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="text-white font-bold mb-2">{s.t}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL BANNER */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          {session ? (
            <ReferralWidget isAr={isAr} />
          ) : (
            <div className="bg-gradient-to-r from-[#22D3EE]/10 via-[#A855F7]/10 to-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#22D3EE]/20 border border-[#22D3EE]/30 flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-[#22D3EE]" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">
                {isAr ? '🎁 شارك وكسب مهام مجانية' : '🎁 Refer friends, earn free missions'}
              </h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {isAr ? 'سجّل حساب واحصل على رابطك الخاص. كل صديق يسجّل، انتوا الاتنين تاخدوا ٢ مهام مجانية زيادة.'
                  : 'Create an account to get your personal link. Every friend who joins — you both get 2 extra free missions.'}
              </p>
              <button onClick={go} className="px-6 py-3 bg-[#22D3EE] text-black font-black rounded-xl hover:bg-white transition-all text-sm inline-flex items-center gap-2">
                {isAr ? 'سجّل واحصل على رابطك' : 'Create account to get your link'}
                <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-16 px-5 bg-[#050608]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-2">{isAr ? 'طلاب بيثقوا في Mi' : 'Students trust Mi'}</h2>
          <div className="flex justify-center gap-0.5 mb-10">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />)}
            <span className="text-gray-500 text-xs ml-2 self-center">4.9/5</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                <div className="flex gap-0.5 mb-3">{[...Array(r.stars)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />)}</div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <p className="text-white font-bold text-xs">{r.name}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{r.uni}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING CALLOUT */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">{isAr ? 'سعر عادل لكل طالب' : 'Fair pricing for every student'}</h2>
          <p className="text-gray-500 mb-10 text-sm">{isAr ? '١٠٠٠ ج.م ربع سنوي — ترم كامل من ٤٠ مهمة' : '1,000 EGP per quarter — 60 missions · all domains · instant download'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {(isAr ? [
              { label: 'مجاني', price: '٠', period: '/شهر', features: ['٣ مهام / شهر', 'كل أنواع الواجبات', 'بدون بطاقة'], hi: false },
              { label: 'Pro', price: '١٠٠٠ ج.م', period: '/ترم', features: ['٦٠ مهمة / ترم', 'كل المجالات + Mi-Academy', 'PDF + Word + PPTX + Excel + ZIP'], hi: true },
            ] : [
              { label: 'Free', price: '0', period: '/month', features: ['3 missions/month', 'All types', 'No card needed'], hi: false },
              { label: 'Pro', price: '1,000 EGP', period: '/quarter', features: ['60 missions/quarter', 'All domains + Mi-Academy', 'PDF · Word · PPTX · Excel · ZIP'], hi: true },
            ]).map(p => (
              <div key={p.label} className={cn('rounded-2xl p-6 text-start', p.hi
                ? 'bg-gradient-to-b from-[#22D3EE]/10 to-[#A855F7]/5 border border-[#22D3EE]/30'
                : 'bg-[#0A0B0E] border border-gray-800')}>
                <p className={cn('text-sm font-bold mb-2', p.hi ? 'text-[#22D3EE]' : 'text-gray-400')}>{p.label}</p>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-black text-white">{p.price}</span>
                  <span className="text-gray-500 text-sm pb-1">{p.period}</span>
                </div>
                <ul className="space-y-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className={cn('w-4 h-4 shrink-0', p.hi ? 'text-[#22D3EE]' : 'text-gray-600')} />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-[#22D3EE] text-black font-black rounded-xl hover:bg-white transition-all text-sm">
            {isAr ? 'شوف كل الأسعار والعملات ←' : 'See all pricing & currencies →'}
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-5 bg-[#050608]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-10">{isAr ? 'أسئلة شائعة' : 'FAQ'}</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-white/[0.02] transition-colors">
                  <span className="text-white text-sm font-medium">{f.q}</span>
                  <ChevronRight className={cn('w-4 h-4 text-gray-500 shrink-0 transition-transform', openFaq === i && 'rotate-90', isAr && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-gray-900 pt-3">
                    <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL / REWARDS */}
      <section className="py-20 px-5 bg-gradient-to-b from-[#020617] to-[#050608]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#22D3EE]/10 via-transparent to-[#A855F7]/10 border border-white/10 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#22D3EE]/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#A855F7]/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] text-[10px] font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" />
              {isAr ? 'برنامج المكافآت' : 'Rewards Program'}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
              {isAr ? 'عاوز حل مجاني؟' : 'Want free credits?'}
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              {isAr ? 'شارك رابط الإحالة بتاعك مع صحابك. لما أي حد يسجّل، هتاخدوا أنتوا الاتنين ٢ مهام مجانية زيادة!'
                : 'Share your referral link with your classmates. When they sign up, you BOTH get 2 free missions immediately.'}
            </p>
            <button onClick={go} className="px-8 py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-2xl hover:opacity-90 transition-all text-sm inline-flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {session ? (isAr ? 'احصل على رابطك' : 'Get your link') : (isAr ? 'سجّل وابدأ' : 'Sign up & start')}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-5 border-t border-white/[0.06] bg-[#020617]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center">
              <span className="font-black text-black text-[10px]">Mi</span>
            </div>
            <span className="text-gray-500 text-xs">Mi-Assignment © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link to="/terms" className="hover:text-white transition-colors">{isAr ? 'الشروط' : 'Terms'}</Link>
            <Link to="/refund" className="hover:text-white transition-colors">{isAr ? 'الاسترداد' : 'Refund'}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{isAr ? 'التواصل' : 'Contact'}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
          </div>
          <p className="text-gray-700 text-[10px] text-center">
            {isAr ? 'Mi-Assignment أداة تعليمية. تأكد من الالتزام بسياسة النزاهة الأكاديمية لمؤسستك.'
              : "Mi-Assignment is an educational aid. Please ensure usage complies with your institution's academic integrity policy."}
          </p>
        </div>
      </footer>
    </div>
  );
}
