import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { MILogo3D } from '../components/MILogo3D';
import { GlitchText } from '../components/GlitchText';
import { supabase } from '../lib/supabase';
import { Zap, ChevronRight, Shield, Star, CheckCircle2, Users } from 'lucide-react';
import { ReferralWidget } from '../components/ReferralWidget';
import { cn } from '../lib/utils';

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setVal(to); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let start = 0; const dur = 1400;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setVal(Math.floor(p * to));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.disconnect();
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const REVIEWS = [
  { stars: 5, text: 'حلّ واجب الكيمياء بتاعي في ٢٠ ثانية — وكأن زميلي المتفوق كتبه.', name: 'فريدة ح.', uni: 'جامعة القاهرة' },
  { stars: 5, text: 'The engineering report was better than what I would have written in 3 hours.', name: 'Karim A.', uni: 'GUC Cairo' },
  { stars: 5, text: 'الـ PPTX طلع احترافي جداً، الدكتور مدحه أمام الكل.', name: 'سارة م.', uni: 'جامعة عين شمس' },
  { stars: 5, text: 'Used it for a law case study — cited correctly, IRAC format, instant.', name: 'Nour T.', uni: 'AUC' },
];

const DOMAIN_CARDS_AR = [
  { icon: '🧠', label: 'دراسات حالة' },
  { icon: '📚', label: 'أبحاث عملية' },
  { icon: '🔢', label: 'رياضيات ومنظمة' },
  { icon: '💻', label: 'كود وبيانات' },
  { icon: '✨', label: 'برزنتيشن' },
  { icon: '📊', label: 'ملفات وتقارير' },
];

const DOMAIN_CARDS_EN = [
  { icon: '🧠', label: 'Case Studies' },
  { icon: '📚', label: 'Research Papers' },
  { icon: '🔢', label: 'Math & Calculations' },
  { icon: '💻', label: 'Code & Data' },
  { icon: '✨', label: 'Presentations' },
  { icon: '📊', label: 'Reports & Essays' },
];

// ─── Nebula canvas background ─────────────────────────────────────────────────
function NebulaCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { try { c.width = window.innerWidth; c.height = window.innerHeight; } catch(e) {} };
    resize();
    window.addEventListener('resize', resize);
    const N = 120;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      hue: Math.random() > 0.5 ? 190 : 280,
    }));
    let t = 0;
    function draw() {
      t += 0.004;
      ctx.clearRect(0, 0, c.width, c.height);
      const blobs = [
        { x: c.width * 0.2, y: c.height * 0.3, r: 380, h: 190 },
        { x: c.width * 0.8, y: c.height * 0.6, r: 320, h: 280 },
        { x: c.width * 0.5, y: c.height * 0.8, r: 260, h: 235 },
      ];
      blobs.forEach(b => {
        const pulse = 1 + Math.sin(t + b.h) * 0.06;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse);
        g.addColorStop(0, `hsla(${b.h},80%,55%,0.055)`);
        g.addColorStop(0.5, `hsla(${b.h},70%,45%,0.025)`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2); ctx.fill();
      });
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,75%,${0.25 + Math.sin(t * 2 + p.x) * 0.15})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LandingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isAr, setIsAr] = useState(() => localStorage.getItem('mi_lang') === 'ar');
  const [missionCount, setMissionCount] = useState(4312);

  const go = () => navigate(session ? '/dashboard' : '/auth');
  const toggleLang = () => {
    const next = !isAr;
    setIsAr(next);
    localStorage.setItem('mi_lang', next ? 'ar' : 'en');
  };

  useEffect(() => {
    supabase.from('missions').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setMissionCount(count); });
  }, []);

  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-[#060812] text-white overflow-x-hidden" dir={dir}>
      <NebulaCanvas />

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] bg-[#060812]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <MILogo3D size={32} />
          <span className="font-black text-white tracking-tight text-sm">Mi-Assignment</span>
          <span className="text-[10px] text-gray-600 font-mono">v2.1</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/intelligence-bureau" className="hidden sm:block text-gray-400 hover:text-white text-xs px-3 py-1.5 transition-colors">
            {isAr ? 'أنواع الواجبات' : 'Assignment types'}
          </Link>
          <Link to="/pricing" className="hidden sm:block text-gray-400 hover:text-white text-xs px-3 py-1.5 transition-colors">
            {isAr ? 'الأسعار' : 'Pricing'}
          </Link>
          <button onClick={toggleLang} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all font-mono">
            {isAr ? 'EN' : 'ع'}
          </button>
          <button onClick={go} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl text-xs whitespace-nowrap hover:opacity-90 transition-all">
            {session ? (isAr ? 'داشبورد' : 'Dashboard') : (isAr ? 'ابدأ' : 'Start Free')}
            <ChevronRight className={cn('w-3.5 h-3.5', isAr && 'rotate-180')} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 px-5 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-[11px] font-mono uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              {isAr ? 'المساعد الأكاديمي للطلاب العرب' : 'Academic Engine for MENA Students'}
            </div>
          </motion.div>

          {/* logo */}
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.45, delay: 0.05 }}
            className="flex justify-center mb-8">
            <MILogo3D size={90} autoSpin={false} />
          </motion.div>

          {/* headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            {isAr ? (
              <h1 className="text-6xl sm:text-8xl font-black leading-[1.0] tracking-tight mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <span className="block text-white mb-1">ابعتلنا</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-l from-[#22D3EE] to-[#A855F7]">الواجب.</span>
              </h1>
            ) : (
              <h1 className="text-6xl sm:text-8xl font-black leading-[0.9] tracking-tighter mb-6">
                <GlitchText text="SUBMIT ANY" className="block text-white" />
                <GlitchText text="ASSIGNMENT." className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7]" />
              </h1>
            )}

            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-2">
              {isAr
                ? 'مقالات، برزنتيشن، كود، رياضيات — محلول في ١٥ ثانية، مكتوب زي طالب حقيقي.'
                : 'Essays, presentations, code, math — solved in 15 seconds, written like a real student.'}
            </p>
            <p className="text-gray-600 text-xs mb-10">
              {isAr ? 'كتابة طبيعية بمستوى طالب حقيقي' : 'Authentic student-level writing, calibrated to your university'}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button onClick={go}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-2xl hover:opacity-90 transition-all shadow-[0_0_50px_rgba(34,211,238,0.18)] text-sm">
                <Zap className="w-5 h-5" />
                {session ? (isAr ? 'الداشبورد' : 'Go to Dashboard') : (isAr ? 'ابدأ مجاناً — ٣ مهام' : 'Start Free — 3 Missions')}
              </button>
              <Link to="/intelligence-bureau"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.04] border border-white/10 text-white font-bold rounded-2xl hover:bg-white/[0.08] transition-all text-sm backdrop-blur-sm">
                {isAr ? 'شوف أنواع الواجبات' : 'See assignment types'}
                <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
              </Link>
            </div>
            <p className="text-gray-600 text-xs">{isAr ? 'بدون بطاقة · ٣ مهام مجانية' : 'No credit card · 3 free missions included'}</p>
          </motion.div>
        </div>
      </section>

      {/* ── LIVE STATS ── */}
      <section className="relative z-10 py-12 border-y border-white/[0.04] bg-[#060812]/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { to: missionCount, suffix: '+', label: isAr ? 'واجب تم حله' : 'assignments solved' },
            { to: 20, suffix: '+', label: isAr ? 'نوع واجب' : 'assignment types' },
            { to: 15, suffix: 's', label: isAr ? 'ثانية متوسط الحل' : 'avg solve time' },
            { to: 4, suffix: 'M+', label: isAr ? 'طالب في MENA' : 'MENA students' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl sm:text-4xl font-black text-white mb-1 tabular-nums">
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DOMAIN CARDS ── */}
      <section className="relative z-10 py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {isAr ? 'بيحل أي حاجة' : 'Handles everything'}
            </h2>
            <p className="text-gray-500 text-sm">{isAr ? 'كل الإنتاجات، كل المتطلبات' : 'Every output, every requirement'}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(isAr ? DOMAIN_CARDS_AR : DOMAIN_CARDS_EN).map((d, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-[#22D3EE]/30 hover:bg-[#22D3EE]/[0.03] transition-all cursor-pointer overflow-hidden">
                {/* hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE]/0 to-[#A855F7]/0 group-hover:from-[#22D3EE]/5 group-hover:to-[#A855F7]/5 transition-all" />
                <div className="text-3xl mb-3">{d.icon}</div>
                <p className="text-white font-bold text-sm">{d.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/intelligence-bureau" className="inline-flex items-center gap-2 text-[#22D3EE] text-sm font-bold hover:text-white transition-colors">
              {isAr ? 'شوف كل الأنواع' : 'See all types'}
              <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 py-20 px-5 bg-white/[0.015] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-white text-center mb-14">
            {isAr ? 'إزاي بيشتغل؟' : 'How it works'}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(isAr ? [
              { n: '١', icon: '📎', t: 'ارفع أو اكتب', b: 'ارفع ملف PDF أو صورة الواجب، أو الصق الأسئلة مباشرة في المربع.' },
              { n: '٢', icon: '🧠', t: 'Mi يحل', b: 'في ١٥–٤٠ ثانية، Mi بيولّد حل كامل بأسلوب طالب حقيقي متكيّف مع جامعتك.' },
              { n: '٣', icon: '📥', t: 'حمّل أو انسخ', b: 'احصل على PDF، PPTX، Word، أو Excel. أو انسخ النص مباشرة في ملفك.' },
            ] : [
              { n: '1', icon: '📎', t: 'Upload or type', b: 'Upload a PDF or photo, or paste the questions directly into the box.' },
              { n: '2', icon: '🧠', t: 'Mi solves it', b: 'In 15–40 seconds, Mi generates a complete solution in authentic student voice, calibrated to your university.' },
              { n: '3', icon: '📥', t: 'Download or copy', b: 'Get a PDF, PPTX, Word, or Excel. Or copy text straight into your document.' },
            ]).map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 overflow-hidden group hover:border-[#22D3EE]/25 transition-all">
                <div className="absolute top-3 end-4 text-4xl opacity-[0.07] group-hover:opacity-[0.14] transition-opacity">{s.icon}</div>
                {/* step number badge */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#A855F7]/20 border border-[#22D3EE]/25 text-[#22D3EE] font-black text-lg flex items-center justify-center mb-5">
                  {s.n}
                </div>
                <h3 className="text-white font-bold mb-2 text-base">{s.t}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mi-ACADEMY PREVIEW ── */}
      <section className="relative z-10 py-20 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: isAr ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] text-[11px] font-mono uppercase tracking-widest mb-5">
              Mi-Academy
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              {isAr ? 'مش بس حل —\nافهم وادافع عنه' : 'Not just solved —\nyou understand it'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {isAr
                ? 'Mi-Academy بتوضح كل خطوة في الحل، وبتجهّزك لأسئلة الدكتور في الفايفا. الشرح موجود جنب الإجابة دايماً.'
                : 'Mi-Academy explains every step and prepares you for your professor\'s viva questions. The breakdown lives right next to the answer.'}
            </p>
            <button onClick={go} className="flex items-center gap-2 px-6 py-3 bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] font-bold rounded-xl hover:bg-[#A855F7]/25 transition-all text-sm">
              {isAr ? 'جرّب Mi-Academy' : 'Try Mi-Academy'}
              <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
            </button>
          </motion.div>

          {/* mock card */}
          <motion.div initial={{ opacity: 0, x: isAr ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="bg-[#0a0d18] px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse" />
              <span className="text-gray-400 text-xs font-mono">Mi-Academy · Chemistry</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[#22D3EE] text-xs font-bold uppercase tracking-wider mb-2">{isAr ? 'ملخص ما تم حله' : 'What we solved'}</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {isAr
                    ? 'تم موازنة معادلات الأكسدة والاختزال باستخدام طريقة تغيير رقم الأكسدة، مع التحقق من حفظ الشحنة والكتلة.'
                    : 'Three redox equations balanced using oxidation number change method, with charge and mass conservation verified.'}
                </p>
              </div>
              <div>
                <p className="text-[#A855F7] text-xs font-bold uppercase tracking-wider mb-2">{isAr ? 'سؤال الفايفا' : 'Defense Q&A'}</p>
                <p className="text-gray-500 text-xs mb-1">{isAr ? 'س: لماذا نستخدم المضاعف المشترك الأصغر؟' : 'Q: Why use the lowest common multiple?'}</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {isAr
                    ? 'ج: لأن الكترونات المكتسبة يجب أن تساوي تماماً الكترونات المفقودة...'
                    : 'A: Because electrons gained must exactly equal electrons lost to satisfy conservation...'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="relative z-10 py-20 px-5 bg-white/[0.015] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">{isAr ? 'طلاب بيثقوا في Mi' : 'Students trust Mi'}</h2>
            <div className="flex justify-center gap-0.5 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />)}
              <span className="text-gray-500 text-xs ms-2 self-center">4.9/5</span>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REVIEWS.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
                <div className="flex gap-0.5 mb-3">{[...Array(r.stars)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />)}</div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <p className="text-white font-bold text-xs">{r.name}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">{r.uni}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CALLOUT ── */}
      <section className="relative z-10 py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-black text-white mb-2">{isAr ? 'سعر عادل لكل طالب' : 'Fair pricing for every student'}</h2>
            <p className="text-gray-500 mb-10 text-sm">{isAr ? '١٠٠٠ ج.م ربع سنوي — ترم كامل من ٦٠ مهمة' : '1,000 EGP per quarter — 60 missions · all domains · instant download'}</p>
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
                  : 'bg-white/[0.03] border border-white/[0.07]')}>
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
          </motion.div>
        </div>
      </section>

      {/* ── REFERRAL ── */}
      <section className="relative z-10 py-16 px-5">
        <div className="max-w-3xl mx-auto">
          {session ? (
            <div className="bg-gradient-to-r from-[#22D3EE]/8 via-[#A855F7]/8 to-[#22D3EE]/8 border border-[#22D3EE]/20 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-black text-white mb-4">{isAr ? '🎁 رابط الإحالة بتاعك' : '🎁 Your referral link'}</h2>
              <ReferralWidget isAr={isAr} />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#22D3EE]/8 via-[#A855F7]/8 to-[#22D3EE]/8 border border-[#22D3EE]/20 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/25 flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-[#22D3EE]" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">{isAr ? '🎁 شارك وكسب مهام مجانية' : '🎁 Refer friends, earn free missions'}</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {isAr
                  ? 'سجّل حساب واحصل على رابطك الخاص. كل صديق يسجّل، انتوا الاتنين تاخدوا ٢ مهام مجانية زيادة.'
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

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-12 px-5 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MILogo3D size={28} />
            <span className="text-gray-500 text-xs">Mi-Assignment © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <Link to="/terms" className="hover:text-white transition-colors">{isAr ? 'الشروط' : 'Terms'}</Link>
            <Link to="/refund" className="hover:text-white transition-colors">{isAr ? 'الاسترداد' : 'Refund'}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{isAr ? 'التواصل' : 'Contact'}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
          </div>
          <p className="text-gray-700 text-[10px] text-center">
            {isAr ? 'Mi-Assignment أداة تعليمية. تأكد من الالتزام بسياسة النزاهة الأكاديمية لمؤسستك.'
              : 'Mi-Assignment is an educational aid. Please ensure usage complies with your institution\'s academic integrity policy.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
