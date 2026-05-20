import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RotateCcw, Sparkles, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { UploadHandler } from '../components/UploadHandler';
import { ImageGenerator } from '../components/ImageGenerator';
import { OnboardingModal } from '../components/OnboardingModal';
import { processMission } from '../lib/mi';
import { supabase } from '../lib/supabase';
import { FloatingOrbs } from '../components/Scene3D';
import { useExplosion } from '../contexts/ExplosionContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Analytics } from '../lib/analytics';
import { UsageBanner } from '../components/UsageBanner';

// Domain-aware loading messages
const DOMAIN_MESSAGES: Record<string, string[]> = {
  law: [
    'Reading the case facts...', 'Identifying legal issues...', 'Researching applicable statutes...',
    'Structuring IRAC argument...', 'Citing article numbers...', 'Drafting legal analysis...',
    'Reviewing fiduciary duties...', 'Building legal memo...',
  ],
  engineering: [
    'Reading structural parameters...', 'Applying design code standards...',
    'Running load calculations...', 'Computing safety factors...',
    'Generating cross-section diagram...', 'Verifying ECP 203 compliance...',
    'Building BBS table...', 'Finalizing engineering report...',
  ],
  medical: [
    'Reviewing patient presentation...', 'Structuring SOAP note...',
    'Checking drug interactions...', 'Applying clinical guidelines...',
    'Running differential diagnosis...', 'Writing management plan...',
    'Referencing MOH protocols...', 'Finalizing clinical report...',
  ],
  cs: [
    'Analyzing system requirements...', 'Designing database schema...',
    'Writing algorithm logic...', 'Generating ER diagram...',
    'Optimizing time complexity...', 'Documenting API endpoints...',
    'Building runnable code...', 'Packaging solution...',
  ],
  business: [
    'Scanning market data...', 'Running PESTEL analysis...',
    'Building SWOT matrix...', 'Modeling financial projections...',
    'Applying Porter\'s Five Forces...', 'Computing NPV & IRR...',
    'Writing executive summary...', 'Finalizing business report...',
  ],
  math: [
    'Reading the problem...', 'Identifying variables...',
    'Setting up equations...', 'Running step-by-step solution...',
    'Verifying with second derivative...', 'Formatting LaTeX output...',
    'Checking final answer...', 'Building solution breakdown...',
  ],
  presentation: [
    'Reading the brief...', 'Structuring slide narrative...',
    'Writing slide headings...', 'Building speaker notes...',
    'Selecting slide layouts...', 'Generating image prompts...',
    'Finalizing 10 slides...', 'Packaging PPTX...',
  ],
  general: [
    'Parsing assignment payload...', 'Running analysis...',
    'Cross-referencing academic sources...', 'Synthesizing expert solution...',
    'Applying citation protocols...', 'Building output packages...',
    'Quality assurance scan...', 'Packaging intelligence brief...',
  ],
};

const DOMAIN_MESSAGES_AR: Record<string, string[]> = {
  law: [
    'بقرأ وقائع القضية...', 'بحدد المسائل القانونية...',
    'ببحث في النصوص التشريعية...', 'بهيكل تحليل IRAC...',
    'بستشهد بأرقام المواد...', 'بكتب المذكرة القانونية...',
    'براجع الواجبات الائتمانية...', 'بجهز التقرير النهائي...',
  ],
  engineering: [
    'بقرأ البيانات الإنشائية...', 'بطبق معايير الكود...',
    'بحسب الأحمال...', 'بتحقق من عوامل الأمان...',
    'برسم القطاع العرضي...', 'براجع ECP 203...',
    'بعمل جدول BBS...', 'بجهز التقرير الهندسي...',
  ],
  medical: [
    'بقرأ حالة المريض...', 'بهيكل ملاحظة SOAP...',
    'بتحقق من تفاعلات الأدوية...', 'بطبق الإرشادات السريرية...',
    'بحدد التشخيص التفريقي...', 'بكتب خطة العلاج...',
    'براجع بروتوكولات وزارة الصحة...', 'بجهز التقرير الطبي...',
  ],
  cs: [
    'بقرأ المتطلبات...', 'بصمم قاعدة البيانات...',
    'بكتب الخوارزمية...', 'برسم مخطط ER...',
    'بحسن التعقيد الزمني...', 'بوثق الـ API...',
    'بكتب الكود...', 'بجهز الحل...',
  ],
  business: [
    'بفحص بيانات السوق...', 'بحلل PESTEL...',
    'ببني مصفوفة SWOT...', 'بعمل التوقعات المالية...',
    'بطبق قوى بورتر الخمس...', 'بحسب NPV وIRR...',
    'بكتب الملخص التنفيذي...', 'بجهز التقرير...',
  ],
  math: [
    'بقرأ المسألة...', 'بحدد المتغيرات...',
    'بعمل المعادلات...', 'بحل خطوة بخطوة...',
    'بتحقق بالمشتقة الثانية...', 'بكتب LaTeX...',
    'بتأكد من الإجابة...', 'بجهز الحل...',
  ],
  presentation: [
    'بقرأ الموضوع...', 'بهيكل السرد...',
    'بكتب عناوين الشرائح...', 'بعمل ملاحظات المقدم...',
    'بختار تصميم الشرائح...', 'بجهز الصور...',
    'بجهز ١٠ شرائح...', 'ببني PPTX...',
  ],
  general: [
    'بقرأ الواجب...', 'بشغّل التحليل...',
    'بدور في المصادر الأكاديمية...', 'بولّد الحل...',
    'بطبّق التوثيق...', 'ببني الملفات...',
    'مسح الجودة...', 'بجهز التقرير...',
  ],
};

const getProcessingMessages = (missionType?: string, prompt?: string, isAr = false): string[] => {
  const messages = isAr ? DOMAIN_MESSAGES_AR : DOMAIN_MESSAGES;
  const t = (missionType || '').toLowerCase();
  const p = (prompt || '').toLowerCase();

  if (t === 'presentation') return messages.presentation;
  if (t === 'law' || /contract|irac|liability|legal|قانون|مسئولية|عقد/.test(p)) return messages.law;
  if (t === 'engineering' || /beam|concrete|ecp|structural|هندسة|خرسانة/.test(p)) return messages.engineering;
  if (t === 'medical' || /patient|soap|nursing|diagnosis|مريض|تمريض/.test(p)) return messages.medical;
  if (t === 'cs' || /algorithm|database|sql|code|خوارزمية|برمجة/.test(p)) return messages.cs;
  if (t === 'business' || /pestel|swot|marketing|financial|استراتيجية/.test(p)) return messages.business;
  if (t === 'math' || /calculus|integral|statistics|optimize|إحصاء/.test(p)) return messages.math;
  return messages.general;
};


interface LimitReachedError {
  plan: string;
  limit: number;
  missionsUsed: number;
}

export function TheTerminal() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { explode } = useExplosion();
  const { user } = useAuth();

  const [missionState, setMissionState] = useState<'idle' | 'analyzing' | 'error' | 'limit_reached' | 'accomplished'>('idle');
  const [solutionData, setSolutionData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [limitInfo, setLimitInfo] = useState<LimitReachedError | null>(null);
  const [processingMsg, setProcessingMsg] = useState('');
  const [processingMessages, setProcessingMessages] = useState<string[]>([]);
  const [showImageLab, setShowImageLab] = useState(false);
  const [missionMeta, setMissionMeta] = useState<{ name: string; university: string; course: string } | null>(null);

  // User profile — university + major pre-fill
  const [userProfile, setUserProfile] = useState<{ country: string; university: string; major: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile — check if onboarding needed
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // Check localStorage first — if dismissed once, never show again
        const localDone = localStorage.getItem(`mi_onboarding_${user.id}`);
        if (localDone === 'done') {
          // Still try to load profile for pre-fill, but don't show modal
          const { data } = await supabase
            .from('profiles')
            .select('country, university, major')
            .eq('id', user.id)
            .single();
          if (data?.university && data?.major) {
            setUserProfile({ country: data.country || '', university: data.university, major: data.major });
          }
          setShowOnboarding(false);
          setProfileLoaded(true);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('country, university, major, onboarding_complete')
          .eq('id', user.id)
          .single();

        if (data?.onboarding_complete && data.university && data.major) {
          // Profile complete — pre-fill silently
          setUserProfile({ country: data.country || '', university: data.university, major: data.major });
          setShowOnboarding(false);
          // Also set localStorage so future loads are instant
          try { localStorage.setItem(`mi_onboarding_${user.id}`, 'done'); } catch {}
        } else if (data?.onboarding_complete) {
          // Completed but cleared — respect that, no modal
          setShowOnboarding(false);
          try { localStorage.setItem(`mi_onboarding_${user.id}`, 'done'); } catch {}
        } else if (!data && error?.code === 'PGRST116') {
          // No row found — genuine new user, show onboarding once
          setShowOnboarding(true);
        } else if (error) {
          // RLS or table error — skip silently, never block the user
          console.warn('Mi: profiles fetch error:', error.code);
          setShowOnboarding(false);
        } else {
          // Row exists but onboarding not complete — show once
          setShowOnboarding(true);
        }
      } catch {
        setShowOnboarding(false);
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (missionState !== 'analyzing') return;
    const msgs = processingMessages.length > 0 ? processingMessages : getProcessingMessages(undefined, undefined, isAr);
    setProcessingMsg(msgs[0]);
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setProcessingMsg(msgs[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [missionState, isAr, processingMessages]);

  const handleMissionLaunch = async (
    files: File[], prompt: string,
    university?: string, course?: string,
    system?: string, reference?: string, missionType?: string,
    country?: string, major?: string
  ) => {
    setMissionState('analyzing');
    setErrorMessage('');
    setLimitInfo(null);
    // Set domain-aware loading messages immediately
    setProcessingMessages(getProcessingMessages(missionType, prompt, isAr));
    Analytics.missionLaunched(missionType || 'unknown', university || 'unknown');
    setMissionMeta({
      name: files.length > 0 ? files[0].name : prompt.substring(0, 40),
      university: university || '',
      course: course || '',
    });

    try {
      // Build enriched context with country + major for curriculum-aware solving
      const enrichedUniversity = [country, university].filter(Boolean).join(' – ');
      const enrichedCourse = [major, course].filter(Boolean).join(' / ');
      const result = await processMission(files, prompt, enrichedUniversity || university, enrichedCourse || course, system, reference, missionType);
      setSolutionData(result);
      setMissionState('accomplished');
      Analytics.missionCompleted(result.assignment_type || 'unknown', 0);

      // Save to vault
      try {
        const saved = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          created_at: new Date().toISOString(),
          payload_name: files.length > 0 ? files[0].name : prompt.substring(0, 60),
          university: university || '',
          course: course || '',
          assignment_type: result.assignment_type || 'other',
          status: 'SUCCESS',
          summary: result.solution_text?.substring(0, 500) || '',
          solution_data: result,
          user_id: user?.id || null,
          lang: isAr ? 'ar' : 'en',
        };
        const vaultKey = `mi_vault_${user?.id || 'anon'}`;
        const existing = JSON.parse(localStorage.getItem(vaultKey) || '[]');
        localStorage.setItem(vaultKey, JSON.stringify([saved, ...existing].slice(0, 200)));
        try { await supabase.from('missions').insert(saved); } catch {}
      } catch {}

    } catch (err: any) {
      // Handle structured LIMIT_REACHED error
      if (err.code === 'LIMIT_REACHED') {
        setLimitInfo({ plan: err.plan, limit: err.limit, missionsUsed: err.missionsUsed });
        setMissionState('limit_reached');
        return;
      }
      setErrorMessage(err.message || (isAr ? 'فشلت المهمة. حاول تاني.' : 'Mission failed. Please retry.'));
      setMissionState('error');
      Analytics.missionFailed(err.message || 'unknown');
    }
  };

  const handleReset = () => {
    setMissionState('idle');
    setSolutionData(null);
    setErrorMessage('');
    setLimitInfo(null);
    setMissionMeta(null);
  };

  return (
    <div className={cn('flex bg-[#050608] text-gray-300 font-sans w-full h-full relative', isAr && 'font-[Cairo]')}
      dir={isAr ? 'rtl' : 'ltr'}>

      {/* Onboarding modal — first time only */}
      {showOnboarding && user && (
        <OnboardingModal
          userId={user.id}
          onComplete={(profile) => {
            setUserProfile(profile);
            setShowOnboarding(false);
          }}
        />
      )}

      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <FloatingOrbs count={3} colors={['#22D3EE', '#A855F7']} />
      </div>

      <div className="flex-1 flex flex-col w-full overflow-hidden relative z-10">
        {/* Status bar */}
        <div className="shrink-0 border-b border-[#22D3EE]/10 bg-[#020617]/60 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-2 h-2 rounded-full',
              missionState === 'analyzing' ? 'bg-yellow-400 animate-pulse'
              : missionState === 'accomplished' ? 'bg-emerald-400'
              : missionState === 'error' ? 'bg-red-500'
              : missionState === 'limit_reached' ? 'bg-orange-400'
              : 'bg-[#22D3EE]')} />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
              {missionState === 'idle' ? (isAr ? 'جاهز للانطلاق' : 'Standing by')
               : missionState === 'analyzing' ? processingMsg
               : missionState === 'accomplished' ? (isAr ? 'تمت المهمة ✅' : 'Mission Accomplished')
               : missionState === 'limit_reached' ? (isAr ? 'وصلت للحد' : 'Limit reached')
               : (isAr ? 'خطأ — حاول تاني' : 'Error')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImageLab(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#A855F7]/30 text-[#A855F7] text-xs font-mono hover:bg-[#A855F7]/10 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'مختبر الصور' : 'Image Lab'}
            </button>
            {missionState !== 'idle' && (
              <button onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs font-mono hover:border-gray-500 hover:text-white transition-all">
                <RotateCcw className="w-3.5 h-3.5" />
                {isAr ? 'مهمة جديدة' : 'New Mission'}
              </button>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto p-6">
            <AnimatePresence mode="wait">

              {/* IDLE */}
              {missionState === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="pt-6">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] font-mono text-[10px] uppercase tracking-widest mb-4">
                      <Shield className="w-3 h-3" /> {isAr ? 'الشبكة العصبية جاهزة' : 'Neural Network Online'}
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_20px_rgba(34,211,238,0.25)] mb-3">
                      {isAr ? 'ابعتلي الواجب' : 'MI-ASSIGNMENT STANDING BY'}
                    </h2>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                      {isAr
                        ? 'ارفع الملف أو اكتب الواجب، وخليني أتكفل بالباقي. أي مادة، أي جامعة.'
                        : 'Upload your assignment files, fill in the context, and let Mi handle the rest.'}
                    </p>
                  </div>
                  <UsageBanner />
                  <UploadHandler onLaunch={handleMissionLaunch} userProfile={userProfile} />
                </motion.div>
              )}

              {/* ANALYZING */}
              {missionState === 'analyzing' && (
                <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border border-[#22D3EE]/20 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-2 border-[#22D3EE]/30 border-t-[#22D3EE] animate-spin flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border border-[#A855F7]/30 border-t-[#A855F7] animate-spin"
                          style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}>
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-[#22D3EE]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <motion.p key={processingMsg} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="text-[#22D3EE] font-mono text-sm tracking-widest uppercase mb-2">{processingMsg}</motion.p>
                    <p className="text-gray-600 text-xs">
                      {isAr ? 'Mi بيحل واجبك. الوقت المتوسط: ١٥–٤٠ ثانية.' : 'Mi is solving your assignment. Average: 15–40 seconds.'}
                    </p>
                    {missionMeta && (
                      <div className="mt-4 flex gap-2 justify-center flex-wrap">
                        {[missionMeta.name, missionMeta.university, missionMeta.course].filter(Boolean).map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-full text-[#22D3EE]/50 text-[10px] font-mono">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* LIMIT REACHED — dedicated upgrade modal */}
              {missionState === 'limit_reached' && (
                <motion.div key="limit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                  <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <Lock className="w-9 h-9 text-orange-400" />
                  </div>

                  <div className="max-w-md">
                    <h3 className="text-2xl font-black text-white mb-3">
                      {isAr ? 'وصلت للحد المجاني' : 'Free limit reached'}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-2">
                      {isAr
                        ? `استخدمت ${limitInfo?.missionsUsed || 0} من أصل ${limitInfo?.limit || 3} مهام مجانية هذا الشهر.`
                        : `You've used ${limitInfo?.missionsUsed || 0} of ${limitInfo?.limit || 3} free missions this period.`}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {isAr
                        ? 'اشترك في Pro علشان تكمل بدون حدود طول الترم.'
                        : 'Upgrade to Pro for unlimited missions all semester.'}
                    </p>
                  </div>

                  {/* Usage bar */}
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>{isAr ? 'المهام المستخدمة' : 'Missions used'}</span>
                      <span className="text-orange-400 font-bold">{limitInfo?.missionsUsed}/{limitInfo?.limit}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Plan comparison */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-sm">
                    <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4 text-center">
                      <p className="text-gray-500 text-xs mb-1">{isAr ? 'مجاني' : 'Free'}</p>
                      <p className="text-white font-black text-lg">3</p>
                      <p className="text-gray-600 text-[10px]">{isAr ? 'مهام / شهر' : 'missions/month'}</p>
                    </div>
                    <div className="bg-gradient-to-b from-[#22D3EE]/10 to-[#A855F7]/5 border border-[#22D3EE]/40 rounded-xl p-4 text-center relative overflow-hidden">
                      <div className="absolute top-1.5 right-1.5 bg-[#22D3EE] text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">PRO</div>
                      <p className="text-[#22D3EE] text-xs mb-1">{isAr ? 'برو' : 'Pro'}</p>
                      <p className="text-white font-black text-lg">60</p>
                      <p className="text-gray-400 text-[10px]">{isAr ? 'مهمة / ترم' : 'missions/quarter'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => { Analytics.upgradeClicked('limit_reached'); navigate('/pricing'); }}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black rounded-xl hover:opacity-90 transition-all text-sm">
                      <Zap className="w-4 h-4" />
                      {isAr ? 'اشترك في Pro' : 'Upgrade to Pro'}
                    </button>
                    <button onClick={handleReset}
                      className="flex items-center justify-center gap-2 px-6 py-4 border border-gray-700 text-gray-400 font-bold rounded-xl hover:border-gray-500 hover:text-white transition-all text-sm">
                      <RotateCcw className="w-4 h-4" />
                      {isAr ? 'رجوع' : 'Go back'}
                    </button>
                  </div>

                  <p className="text-gray-700 text-xs">
                    {isAr ? '١٠٠٠ ج.م بس — يكفي ترم كامل' : '1,000 EGP — covers a full semester'}
                  </p>
                </motion.div>
              )}

              {/* ERROR */}
              {missionState === 'error' && (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{isAr ? 'المهمة فشلت' : 'Mission Failed'}</h3>
                    <p className="text-red-400 text-sm max-w-lg font-mono bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">{errorMessage}</p>
                  </div>
                  <button onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-white transition-all">
                    <RotateCcw className="w-4 h-4" /> {isAr ? 'حاول تاني' : 'Try Again'}
                  </button>
                </motion.div>
              )}

              {/* ACCOMPLISHED */}
              {missionState === 'accomplished' && solutionData && (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <ResultsDashboard data={solutionData} onReset={handleReset} missionMeta={missionMeta} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Image Lab modal */}
      <AnimatePresence>
        {showImageLab && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#020617]/95 backdrop-blur-sm overflow-y-auto">
            <ImageGenerator onClose={() => setShowImageLab(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
