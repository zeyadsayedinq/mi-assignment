import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RotateCcw, Sparkles, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { UploadHandler } from '../components/UploadHandler';
import { ImageGenerator } from '../components/ImageGenerator';
import { processMission } from '../lib/mi';
import { supabase } from '../lib/supabase';
import { FloatingOrbs } from '../components/Scene3D';
import { useExplosion } from '../contexts/ExplosionContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Analytics } from '../lib/analytics';

const PROCESSING_EN = [
  'Parsing assignment payload...', 'Running neural analysis...',
  'Cross-referencing academic database...', 'Synthesizing expert solution...',
  'Applying citation protocols...', 'Building output packages...',
  'Quality assurance scan...', 'Packaging intelligence brief...',
];
const PROCESSING_AR = [
  'بقرأ الواجب...', 'بشغّل التحليل العصبي...',
  'بدور في قاعدة البيانات الأكاديمية...', 'بولّد الحل الاحترافي...',
  'بطبّق بروتوكولات التوثيق...', 'ببني الملفات النهائية...',
  'مسح جودة الحل...', 'تعبئة التقرير الاستخباراتي...',
];

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
  const [showImageLab, setShowImageLab] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [missionMeta, setMissionMeta] = useState<{ name: string; university: string; course: string } | null>(null);

  const PROCESSING = isAr ? PROCESSING_AR : PROCESSING_EN;

  useEffect(() => {
    if (missionState !== 'analyzing') return;
    setProcessingMsg(PROCESSING[0]);
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % PROCESSING.length;
      setProcessingMsg(PROCESSING[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [missionState, isAr]);

  const handleMissionLaunch = async (
    files: File[], prompt: string,
    university?: string, course?: string,
    system?: string, reference?: string, missionType?: string
  ) => {
    setMissionState('analyzing');
    setErrorMessage('');
    setLimitInfo(null);
    setRetryCount(0);
    Analytics.missionLaunched(missionType || 'unknown', university || 'unknown');
    setMissionMeta({
      name: files.length > 0 ? files[0].name : prompt.substring(0, 40),
      university: university || (isAr ? 'جامعة دولية' : 'Global Tier'),
      course: course || (isAr ? 'تخصص عام' : 'General'),
    });

    try {
      // Pass the raw prompt so mi.ts can detect language from content, not UI setting
      const result = await processMission(files, prompt, university, course, system, reference, missionType, undefined);
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
                  <UploadHandler onLaunch={handleMissionLaunch} />
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
                    {retryCount > 0 && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-orange-400/70 text-[10px] font-mono mt-1 uppercase tracking-widest">
                        {isAr ? `إعادة المحاولة ${retryCount}/3 — خدمة مزدحمة مؤقتاً...` : `Retrying ${retryCount}/3 — AI provider busy, please wait...`}
                      </motion.p>
                    )}
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
                        ? `استخدمت ${limitInfo?.missionsUsed || 0} من أصل ${limitInfo?.limit || 3} مهام هذه الفترة.`
                        : `You've used ${limitInfo?.missionsUsed || 0} of ${limitInfo?.limit || 3} missions this period.`}
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
