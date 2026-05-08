import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Terminal, Zap, BookOpen, Clock, Star, BarChart2, TrendingUp, Target, Image, Sparkles, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { FloatingOrbs } from '../components/Scene3D';
import { MILogo3D, TiltCard, MagneticButton } from '../components/MILogo3D';
import { GlitchText, AnimatedCounter } from '../components/GlitchText';
import { useExplosion } from '../contexts/ExplosionContext';
import { supabase } from '../lib/supabase';

const isSupabaseOk = () => { const u = import.meta.env.VITE_SUPABASE_URL || ''; return !!u && !u.includes('placeholder'); };

const QUICK_DEPLOY_EN = [
  { label: 'Essay', icon: BookOpen, color: 'border-blue-500/30 hover:border-blue-400 text-blue-400', glow: '0 0 20px rgba(59,130,246,0.25)', template: 'essay', missionType: 'essay' },
  { label: 'Slides', icon: Sparkles, color: 'border-[#A855F7]/30 hover:border-[#A855F7] text-[#A855F7]', glow: '0 0 20px rgba(168,85,247,0.25)', template: 'presentation', missionType: 'presentation' },
  { label: 'Code', icon: Terminal, color: 'border-emerald-500/30 hover:border-emerald-400 text-emerald-400', glow: '0 0 20px rgba(16,185,129,0.25)', template: 'code', missionType: 'code' },
  { label: 'Math', icon: Activity, color: 'border-orange-500/30 hover:border-orange-400 text-orange-400', glow: '0 0 20px rgba(245,158,11,0.25)', template: 'math', missionType: 'math' },
  { label: 'Research', icon: Target, color: 'border-[#22D3EE]/30 hover:border-[#22D3EE] text-[#22D3EE]', glow: '0 0 20px rgba(34,211,238,0.25)', template: 'research', missionType: 'research' },
  { label: 'Images', icon: Image, color: 'border-pink-500/30 hover:border-pink-400 text-pink-400', glow: '0 0 20px rgba(236,72,153,0.25)', template: 'imagegen', missionType: 'design' },
];

const QUICK_DEPLOY_AR = [
  { label: 'مقال', icon: BookOpen, color: 'border-blue-500/30 hover:border-blue-400 text-blue-400', glow: '0 0 20px rgba(59,130,246,0.25)', template: 'essay', missionType: 'essay' },
  { label: 'شرائح', icon: Sparkles, color: 'border-[#A855F7]/30 hover:border-[#A855F7] text-[#A855F7]', glow: '0 0 20px rgba(168,85,247,0.25)', template: 'presentation', missionType: 'presentation' },
  { label: 'كود', icon: Terminal, color: 'border-emerald-500/30 hover:border-emerald-400 text-emerald-400', glow: '0 0 20px rgba(16,185,129,0.25)', template: 'code', missionType: 'code' },
  { label: 'رياضيات', icon: Activity, color: 'border-orange-500/30 hover:border-orange-400 text-orange-400', glow: '0 0 20px rgba(245,158,11,0.25)', template: 'math', missionType: 'math' },
  { label: 'بحث', icon: Target, color: 'border-[#22D3EE]/30 hover:border-[#22D3EE] text-[#22D3EE]', glow: '0 0 20px rgba(34,211,238,0.25)', template: 'research', missionType: 'research' },
  { label: 'صور Mi', icon: Image, color: 'border-pink-500/30 hover:border-pink-400 text-pink-400', glow: '0 0 20px rgba(236,72,153,0.25)', template: 'imagegen', missionType: 'design' },
];

function MissionTimeline() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [missions, setMissions] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTimeline = async () => {
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const vault = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      let localAnon = [];
      if (user?.id) {
         localAnon = JSON.parse(localStorage.getItem('mi_vault_anon') || '[]');
      }
      
      let dbMissions: any[] = [];
      try {
        let dbData: any = null;
        if (isSupabaseOk() && user) {
           dbData = await supabase.from('missions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
        }
        if (dbData?.data) dbMissions = dbData.data;
      } catch {}

      const combined = [...vault, ...localAnon, ...dbMissions];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      const sorted = unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMissions(sorted.slice(0, 6));
    };
    loadTimeline();
  }, [user]);

  if (!missions.length) return null;

  const DOTS: Record<string, string> = {
    essay: 'bg-blue-500', presentation: 'bg-[#A855F7]', code: 'bg-emerald-500',
    math: 'bg-orange-500', research: 'bg-[#22D3EE]', design: 'bg-pink-500', other: 'bg-gray-600'
  };

  const ago = (s: string) => {
    const d = Date.now() - new Date(s).getTime();
    if (isAr) {
      if (d < 3600000) return `منذ ${Math.floor(d / 60000)} دقيقة`;
      if (d < 86400000) return `منذ ${Math.floor(d / 3600000)} ساعة`;
      return `منذ ${Math.floor(d / 86400000)} يوم`;
    }
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  };

  return (
    <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#22D3EE]" />
          <span className="text-white font-bold text-sm">{isAr ? 'آخر المهام' : 'Recent Missions'}</span>
        </div>
        <button onClick={() => navigate('/academy')} className="text-[10px] text-[#22D3EE] hover:underline font-bold uppercase tracking-wider">
          {isAr ? 'عرض الكل' : 'View Academy'}
        </button>
      </div>
      <div className="divide-y divide-gray-900">
        {missions.map((m, i) => (
          <motion.div key={m.id || i} initial={{ opacity: 0, x: isAr ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => navigate('/academy', { state: { missionId: m.id } })}
            className="flex items-center gap-3 px-5 py-3 hover:bg-[#22D3EE]/5 transition-all cursor-pointer group">
            <div className={cn('w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform', DOTS[m.assignment_type || 'other'])} />
            <div className="flex-1 min-w-0">
              <p className="text-gray-300 text-xs font-medium truncate group-hover:text-[#22D3EE] transition-colors">{m.payload_name}</p>
              <p className="text-gray-600 text-[10px]">{m.university}</p>
            </div>
            <span className="text-gray-700 text-[10px] font-mono shrink-0">{ago(m.created_at)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WeeklyActivity() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [days, setDays] = useState<number[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadStats = async () => {
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const vault = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      let localAnon = [];
      if (user?.id) {
         localAnon = JSON.parse(localStorage.getItem('mi_vault_anon') || '[]');
      }
      
      let dbMissions: any[] = [];
      try {
        let dbData: any = null;
        if (isSupabaseOk() && user) {
           dbData = await supabase.from('missions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        }
        if (dbData?.data) dbMissions = dbData.data;
      } catch {}

      const combined = [...vault, ...localAnon, ...dbMissions];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      const counts = Array(7).fill(0);
      unique.forEach((m: any) => {
        const d = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000);
        if (d < 7) counts[6 - d]++;
      });
      setDays(counts);
    };
    loadStats();
  }, [user]);


  const max = Math.max(...days, 1);
  const labelsEn = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const labelsAr = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'أ'];
  const labels = isAr ? labelsAr : labelsEn;

  return (
    <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-[#22D3EE]" />
        <span className="text-white font-bold text-sm">{isAr ? 'نشاط آخر ٧ أيام' : '7-Day Activity'}</span>
      </div>
      <div className="flex items-end gap-2 h-20">
        {days.map((count, i) => (
          <TiltCard key={i} className="flex-1 flex flex-col items-center gap-1" intensity={4}>
            <div className="w-full rounded-sm bg-[#22D3EE]/10 relative overflow-hidden" style={{ height: 56 }}>
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${(count / max) * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#22D3EE] to-[#A855F7] rounded-sm"
              />
            </div>
            <span className="text-[9px] text-gray-600 font-mono">{labels[i]}</span>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

export function TheHQ() {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { explode } = useExplosion();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [missionCount, setMissionCount] = useState(0);
  const [starredCount, setStarredCount] = useState(0);

  const QUICK_DEPLOY = isAr ? QUICK_DEPLOY_AR : QUICK_DEPLOY_EN;

  useEffect(() => {
    const loadHQStats = async () => {
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const starredKey = `mi_starred_${user?.id || 'anon'}`;
      const vault = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      let localAnon = [];
      if (user?.id) {
         localAnon = JSON.parse(localStorage.getItem('mi_vault_anon') || '[]');
      }
      
      let dbMissions: any[] = [];
      try {
        let dbCount: any = null;
        if (isSupabaseOk() && user) {
           dbCount = await supabase.from('missions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
        }
        if (dbCount?.count !== null && dbCount?.count !== undefined) setMissionCount(dbCount.count);
      } catch {}

      const combined = [...vault, ...localAnon];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setMissionCount(prev => Math.max(prev, unique.length));
      setStarredCount(JSON.parse(localStorage.getItem(starredKey) || '[]').length);
    };
    loadHQStats();
  }, [user]);

  const handleDeploy = (e: React.MouseEvent, template: string, missionType: string) => {
    explode(e.clientX, e.clientY, '#22D3EE');
    setTimeout(() => navigate('/terminal', { state: { template, missionType } }), 180);
  };

  const handleLaunch = (e: React.MouseEvent) => {
    explode(e.clientX, e.clientY, '#A855F7');
    setTimeout(() => navigate('/terminal'), 180);
  };

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden relative', isAr && 'font-[Cairo]')}
      dir={isAr ? 'rtl' : 'ltr'}>

      {/* Subtle floating orbs only — no particle field on HQ for performance */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FloatingOrbs count={4} colors={['#22D3EE', '#A855F7', '#10B981']} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.035]
        bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]
        bg-[size:4rem_4rem]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 py-10">

        {/* ─── HERO ─── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col items-center text-center">

          {/* 3D cube — smaller, no autoSpin */}
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', bounce: 0.45 }} className="mb-6">
            <MILogo3D size={64} autoSpin={false} />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.1em] lg:tracking-[0.25em] mb-5 max-w-[90vw]">
            <Shield className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {session
                ? (isAr ? `أهلاً، ${user?.email?.split('@')[0]}` : `OPERATIVE: ${user?.email?.split('@')[0]?.toUpperCase()}`)
                : (isAr ? 'مقر Mi-Assignment' : 'Mi-Assignment HQ')}
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white mb-4 leading-none">
            {isAr ? (
              <>
                <GlitchText text="ذكاء" className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400" />
                <GlitchText text="المهمة" className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7]" />
              </>
            ) : (
              <>
                <GlitchText text="MISSION" className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400" />
                <GlitchText text="INTELLIGENCE" className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#A855F7]" />
              </>
            )}
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'المساعد الأكاديمي اللي مش بس بيساعد — بيحل. مقالات، بروزنتيشن، كود، رياضيات — خلاص وجاهز.'
              : "The academic Mi that doesn't just help — it executes. Essays, presentations, code, math — fully solved."}
          </motion.p>
        </motion.div>

        {/* ─── STATS ─── */}
        {session && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: isAr ? 'المهام' : 'Missions', value: missionCount, icon: Target, color: 'text-[#22D3EE]' },
              { label: isAr ? 'المستوى' : 'Level', value: Math.max(1, missionCount * 2 + 1), icon: TrendingUp, color: 'text-[#A855F7]' },
              { label: isAr ? 'المفضلة' : 'Starred', value: starredCount, icon: Star, color: 'text-yellow-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <TiltCard key={label} intensity={6}
                className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 text-center relative overflow-hidden cursor-default">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />
                <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
                <AnimatedCounter to={value} className="text-3xl font-black text-white block" duration={900} />
                <p className="text-gray-500 text-xs mt-1">{label}</p>
              </TiltCard>
            ))}
          </motion.div>
        )}

        {/* ─── QUICK DEPLOY ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
          <div className={cn('flex items-center gap-2 mb-4', isAr && 'flex-row-reverse')}>
            <Zap className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">
              {isAr ? 'إطلاق سريع' : 'Quick Deploy'}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_DEPLOY.map(({ label, icon: Icon, color, template, missionType, glow }) => (
              <TiltCard key={label} intensity={10} className="relative">
                <button
                  onClick={e => handleDeploy(e, template, missionType)}
                  className={cn('w-full flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border bg-[#0A0B0E] transition-all group', color)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = glow; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-150" />
                  <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
                </button>
              </TiltCard>
            ))}
          </div>
        </motion.div>

        {/* ─── MAIN CTA ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="mb-12 text-center">
          <MagneticButton
            onClick={handleLaunch}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black text-base rounded-2xl uppercase tracking-wider shadow-[0_0_50px_rgba(34,211,238,0.18)] relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Terminal className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{isAr ? 'إطلاق المحطة' : 'Launch Terminal'}</span>
          </MagneticButton>
        </motion.div>

        {/* ─── TIMELINE + ACTIVITY ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MissionTimeline />
          <WeeklyActivity />
        </motion.div>

        {/* ─── SEO / BRANDING FOOTER ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-24 border-t border-gray-900 pt-12 pb-8 text-center px-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-300 mb-4">{isAr ? 'Mi-Assignment - مساعدك الأكاديمي' : 'Mi-Assignment: Your Online Assignment Helper'}</h2>
          <p className="text-gray-500 text-xs md:text-sm max-w-4xl mx-auto leading-relaxed mb-6">
            {isAr 
              ? 'أنا Mi-Student وصديقك المفضل. ارفع صور أو ملفات PDF لواجباتك وأنا هنا أساعدك كـ Mi-Friend لحلول الرياضيات والعلوم والمقالات. ادرس بذكاء ووفّر وقتك مع أفضل مساعد للواجبات Mi-Assignment.'
              : 'I am Mi-Student and your best Mi-Friend. Upload pictures or PDFs of your homework and get instant solutions via Mi-Assignment for math, essays, and more. Use our free Mi-Friend helper to get step-by-step solutions for any subject.'
            }
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['Mi-Assignment', 'Mi-Student', 'Mi-Friend', 'Math Solver Mi', 'Assignment Writer', 'OCR Technology', 'MENA Students', 'حل الواجبات', 'مساعد للطلاب'].map(tag => (
              <span key={tag} className="px-3 py-1 bg-[#0A0B0E] border border-gray-800 rounded-lg text-gray-600 text-[10px] font-mono tracking-wider">{tag}</span>
            ))}
          </div>
          
          <div className="max-w-2xl mx-auto text-[10px] md:text-xs text-gray-600 border border-gray-800/60 bg-[#050608]/50 rounded-xl p-4">
            <strong>{isAr ? 'تنويه: ' : 'Disclaimer: '}</strong> 
            {isAr 
              ? 'مُصمم Mi-Assignment كمساعد تعليمي لتسريع الدراسة والتعلم. يتحمل المستخدمون مسؤولية الالتزام بسياسات النزاهة الأكاديمية الخاصة بمؤسساتهم. قد يحتوي المحتوى المُولد أحياناً على أخطاء؛ يُرجى دائماً مراجعة المعلومات المهمة واستخدام الحلول بمسؤولية.'
              : 'Mi-Assignment is designed as an educational aid to accelerate studying and learning. Users are responsible for complying with their institution\'s academic integrity policies. Mi-generated output may occasionally contain errors or inaccuracies; always verify critical information and use the solutions responsibly.'}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
