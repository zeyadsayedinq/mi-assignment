import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, ChevronDown, Clock, Trophy, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const TYPE_COLORS: Record<string, string> = {
  essay: 'text-blue-400 bg-blue-500/10', report: 'text-blue-400 bg-blue-500/10',
  presentation: 'text-[#A855F7] bg-[#A855F7]/10', code: 'text-emerald-400 bg-emerald-500/10',
  math: 'text-orange-400 bg-orange-500/10', physics: 'text-orange-400 bg-orange-500/10',
  engineering: 'text-yellow-400 bg-yellow-500/10', research: 'text-[#22D3EE] bg-[#22D3EE]/10',
  design: 'text-pink-400 bg-pink-500/10', other: 'text-gray-400 bg-gray-800',
};

export function TheAcademy() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadAcademy = async () => {
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const vault = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      let localAnon = [];
      if (user?.id) {
         localAnon = JSON.parse(localStorage.getItem('mi_vault_anon') || '[]');
      }
      
      let dbMissions: any[] = [];
      try {
        const { data } = await supabase.from('missions').select('*').eq('user_id', user?.id || '').order('created_at', { ascending: false });
        if (data) dbMissions = data;
      } catch (err) {
        console.error("Academy DB fetch failed:", err);
      }

      const combined = [...vault, ...localAnon, ...dbMissions];
      const unique = combined.filter((v, i, a) => a.findIndex((t: any) => t.id === v.id) === i);
      const mapped = unique.map((m: any) => ({
          id: m.id, 
          payload_name: m.payload_name || (isAr ? 'مهمة مجهولة' : 'Unknown Mission'), 
          university: m.university || (isAr ? 'جامعة غير محددة' : 'Unspecified University'),
          course: m.course || (isAr ? 'تخصص عام' : 'General Course'), 
          assignment_type: m.assignment_type || 'other',
          created_at: m.created_at, 
          steps: m.solution_data?.steps || [],
          solution_text: m.solution_data?.solution_text || m.summary || '',
        }));
      setEntries(mapped);

      if (location.state?.missionId) {
        const found = mapped.find((m: any) => m.id === location.state.missionId);
        if (found) setSelected(found);
      }
    };
    loadAcademy();
  }, [user, location.state]);

  const filtered = entries.filter(e => !search || [e.payload_name, e.university, e.course].some(s => s?.toLowerCase().includes(search.toLowerCase())));
  const typeStats = entries.reduce((acc, e) => { acc[e.assignment_type] = (acc[e.assignment_type] || 0) + 1; return acc; }, {} as Record<string, number>);

  const ago = (s: string) => {
    const d = Date.now() - new Date(s).getTime();
    if (isAr) { return d < 86400000 ? 'اليوم' : `${Math.floor(d / 86400000)} أيام`; }
    return d < 86400000 ? 'Today' : `${Math.floor(d / 86400000)}d ago`;
  };

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans p-5 lg:p-8', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">🧠 {isAr ? 'Mi-Academy' : 'Mi-Academy'}</h1>
          <p className="text-gray-500 text-sm max-w-lg">
            {isAr ? 'افهم المنطق ورا كل حل. مش بس تنسخ — اتعلم.' : "Understand the logic behind every solution. Don't just copy — learn."}
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Brain className="w-14 h-14 text-gray-800 mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">{isAr ? 'الأكاديمية فاضية' : 'Academy is empty'}</h3>
            <p className="text-gray-700 text-sm mb-6">{isAr ? 'أكمل مهام في المحطة علشان تبني أرشيف التعلم.' : 'Complete missions in the Terminal to build your learning archive.'}</p>
            <button onClick={() => navigate('/terminal')} className="flex items-center gap-2 px-5 py-3 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-white transition-all">
              {isAr ? 'ابدأ مهمة' : 'Start a Mission'} <ChevronRight className={cn('w-4 h-4', isAr && 'rotate-180')} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left panel */}
            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold text-sm">{isAr ? 'إحصائياتك' : 'Your Stats'}</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">{isAr ? 'إجمالي الشروحات' : 'Total Breakdowns'}</span><span className="text-white font-bold">{entries.length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">{isAr ? 'خطوات تعلّمتها' : 'Steps Learned'}</span><span className="text-white font-bold">{entries.reduce((s, e) => s + (e.steps?.length || 0), 0)}</span></div>
                  <div className="h-px bg-gray-900 my-2" />
                  {Object.entries(typeStats).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', TYPE_COLORS[type] || TYPE_COLORS.other)}>{type}</span>
                      <div className="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-[#22D3EE] rounded-full" style={{ width: `${((count as number) / entries.length) * 100}%` }} />
                      </div>
                      <span className="text-gray-500 text-xs">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search */}
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? 'دور...' : 'Search...'}
                className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#A855F7] transition-all" />

              {/* List */}
              <div className="space-y-2">
                {filtered.map(entry => (
                  <button key={entry.id} onClick={() => { setSelected(entry); setExpandedStep(null); }}
                    className={cn('w-full text-left bg-[#0A0B0E] border rounded-xl px-4 py-3 transition-all', selected?.id === entry.id ? 'border-[#A855F7]/50 bg-[#A855F7]/5' : 'border-gray-800 hover:border-gray-600')}>
                    <p className="text-white text-xs font-medium line-clamp-2 mb-1">{entry.payload_name}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', TYPE_COLORS[entry.assignment_type] || TYPE_COLORS.other)}>{entry.assignment_type}</span>
                      <span className="text-gray-600 text-[10px] flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{ago(entry.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2">
              {!selected ? (
                <div className="h-full min-h-64 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-10">
                  <Brain className="w-10 h-10 text-gray-800 mb-3" />
                  <p className="text-gray-600 text-sm">{isAr ? 'اختار مهمة علشان تشوف الشرح' : 'Select a mission to see its breakdown'}</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full mr-2', TYPE_COLORS[selected.assignment_type] || TYPE_COLORS.other)}>{selected.assignment_type}</span>
                    <h2 className="text-white font-bold text-base mt-2">{selected.payload_name}</h2>
                    <p className="text-gray-500 text-xs mt-1">{selected.university} · {selected.course}</p>
                  </div>
                  <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                    {selected.solution_text && (
                      <div className="bg-[#050608] border border-gray-900 rounded-xl p-4">
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{isAr ? 'الملخص' : 'Summary'}</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{selected.solution_text}</p>
                      </div>
                    )}
                    {selected.steps?.length > 0 ? (
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{selected.steps.length} {isAr ? 'خطوات' : 'Learning Steps'}</p>
                        {selected.steps.map((step: any, i: number) => (
                          <div key={i} className="border border-gray-800 rounded-xl overflow-hidden">
                            <button onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <span className="text-white text-sm font-medium text-start">{step.title}</span>
                              </div>
                              {expandedStep === i ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className={cn('w-4 h-4 text-gray-500 shrink-0', isAr && 'rotate-180')} />}
                            </button>
                            <AnimatePresence>
                              {expandedStep === i && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                  <div className="px-5 pb-4 pt-3 border-t border-gray-900">
                                    <p className="text-gray-300 text-sm leading-relaxed">{step.content}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Zap className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">{isAr ? 'مفيش شرح تفصيلي للمهمة دي.' : 'No step-by-step breakdown for this mission.'}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
