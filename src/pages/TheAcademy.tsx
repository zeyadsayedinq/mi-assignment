import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, ChevronDown, Clock, Trophy, Zap, Shield, BookOpen, Target, MessageSquare, AlertTriangle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const TYPE_COLORS: Record<string, string> = {
  essay: 'text-blue-400 bg-blue-500/10', report: 'text-blue-400 bg-blue-500/10',
  presentation: 'text-[#A855F7] bg-[#A855F7]/10', computer_science: 'text-emerald-400 bg-emerald-500/10',
  math: 'text-orange-400 bg-orange-500/10', physics: 'text-orange-400 bg-orange-500/10',
  engineering: 'text-yellow-400 bg-yellow-500/10', research_paper: 'text-[#22D3EE] bg-[#22D3EE]/10',
  law: 'text-red-400 bg-red-500/10', business_plan: 'text-purple-400 bg-purple-500/10',
  data_analysis: 'text-cyan-400 bg-cyan-500/10', other: 'text-gray-400 bg-gray-800',
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
  const [activeTab, setActiveTab] = useState<'steps' | 'defense' | 'concepts' | 'mistakes'>('steps');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const vault = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      let dbMissions: any[] = [];
      try {
        const { data } = await supabase.from('missions').select('*').eq('user_id', user?.id || '').order('created_at', { ascending: false });
        if (data) dbMissions = data;
      } catch {}
      const combined = [...vault, ...dbMissions];
      const unique = combined.filter((v, i, a) => a.findIndex((t: any) => t.id === v.id) === i);
      const mapped = unique.map((m: any) => ({
        id: m.id,
        payload_name: m.payload_name || (isAr ? 'مهمة' : 'Mission'),
        university: m.university || (isAr ? 'جامعة غير محددة' : 'Unspecified University'),
        course: m.course || (isAr ? 'تخصص عام' : 'General Course'),
        assignment_type: m.assignment_type || 'other',
        created_at: m.created_at,
        steps: m.solution_data?.steps || [],
        logic_breakdown: m.solution_data?.logic_breakdown || null,
        solution_text: m.solution_data?.solution_text || m.summary || '',
        domain: m.solution_data?.domain || '',
      }));
      setEntries(mapped);
      if (location.state?.missionId) {
        const found = mapped.find(e => e.id === location.state.missionId);
        if (found) setSelected(found);
      } else if (mapped.length > 0) {
        setSelected(mapped[0]);
      }
    };
    load();
  }, [user?.id]);

  const filtered = entries.filter(e =>
    (e.payload_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.assignment_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSteps = entries.reduce((s, e) => s + (e.steps?.length || 0), 0);
  const totalBreakdowns = entries.filter(e => e.logic_breakdown).length;
  const typeCount = entries.reduce((acc: any, e) => { acc[e.assignment_type] = (acc[e.assignment_type] || 0) + 1; return acc; }, {});

  const lb = selected?.logic_breakdown;
  const steps = selected?.steps || [];

  const tabHasContent = {
    steps: steps.length > 0,
    defense: lb?.defense_qa?.length > 0,
    concepts: lb?.key_concepts?.length > 0,
    mistakes: lb?.common_mistakes?.length > 0,
  };

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Left panel */}
      <div className="w-72 border-e border-white/[0.06] flex flex-col shrink-0">
        {/* Stats */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-white font-bold text-sm">{isAr ? 'الأكاديمية' : 'Mi-Academy'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: isAr ? 'مهام' : 'Missions', value: entries.length, color: '#22D3EE' },
              { label: isAr ? 'خطوات' : 'Steps', value: totalSteps, color: '#A855F7' },
              { label: isAr ? 'تحليلات' : 'Breakdowns', value: totalBreakdowns, color: '#10B981' },
              { label: isAr ? 'أنواع' : 'Types', value: Object.keys(typeCount).length, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="bg-[#0A0B0E] rounded-xl p-3 text-center">
                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-gray-600 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl ps-8 pe-3 py-2 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-gray-700"
            />
          </div>
        </div>

        {/* Mission list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Brain className="w-8 h-8 text-gray-800 mx-auto mb-3" />
              <p className="text-gray-700 text-xs">{isAr ? 'لا توجد مهام بعد' : 'No missions yet'}</p>
              <button onClick={() => navigate('/terminal')} className="mt-3 text-[#22D3EE] text-xs hover:underline">
                {isAr ? 'ابدأ مهمة ←' : 'Start a mission →'}
              </button>
            </div>
          ) : filtered.map(entry => (
            <button
              key={entry.id}
              onClick={() => { setSelected(entry); setActiveTab('steps'); setExpandedStep(null); }}
              className={cn('w-full text-start px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors', selected?.id === entry.id && 'bg-white/[0.04] border-s-2 border-s-[#22D3EE]')}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', TYPE_COLORS[entry.assignment_type] || TYPE_COLORS.other)}>
                  {entry.assignment_type}
                </span>
                {entry.logic_breakdown && <Shield className="w-3 h-3 text-emerald-500" title="Has breakdown" />}
              </div>
              <p className="text-white text-xs font-medium leading-snug line-clamp-2">{entry.payload_name}</p>
              <p className="text-gray-600 text-[10px] mt-1">{entry.university}</p>
            </button>
          ))}
        </div>

        {/* Type breakdown */}
        {Object.keys(typeCount).length > 0 && (
          <div className="p-4 border-t border-white/[0.06]">
            <p className="text-gray-700 text-[10px] uppercase tracking-widest mb-3">{isAr ? 'حسب النوع' : 'By Type'}</p>
            {Object.entries(typeCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([type, count]: any) => (
              <div key={type} className="flex items-center gap-2 mb-1.5">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', TYPE_COLORS[type] || TYPE_COLORS.other)}>{type}</span>
                <div className="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#22D3EE]/40 rounded-full" style={{ width: `${(count / entries.length) * 100}%` }} />
                </div>
                <span className="text-gray-600 text-[10px]">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <p className="text-gray-600">{isAr ? 'اختر مهمة للبدء' : 'Select a mission to begin'}</p>
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md', TYPE_COLORS[selected.assignment_type] || TYPE_COLORS.other)}>
                  {selected.assignment_type}
                </span>
                {selected.domain && (
                  <span className="text-[10px] text-gray-600 font-mono uppercase">{selected.domain}</span>
                )}
              </div>
              <h1 className="text-xl font-black text-white leading-tight mb-1">{selected.payload_name}</h1>
              <p className="text-gray-600 text-sm">{selected.university} · {selected.course}</p>
            </div>

            {/* Summary */}
            {selected.solution_text && (
              <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-5 mb-6">
                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                  {isAr ? 'ملخص المهمة' : 'Mission Summary'}
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">{selected.solution_text}</p>
              </div>
            )}

            {/* Tabs */}
            {(steps.length > 0 || lb) && (
              <>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {[
                    { key: 'steps', icon: BookOpen, label: isAr ? `خطوات (${steps.length})` : `Steps (${steps.length})`, show: steps.length > 0 },
                    { key: 'defense', icon: Shield, label: isAr ? 'الدفاع عن الإجابة' : 'Defend Your Work', show: !!lb?.defense_qa?.length },
                    { key: 'concepts', icon: Brain, label: isAr ? 'المفاهيم الأساسية' : 'Key Concepts', show: !!lb?.key_concepts?.length },
                    { key: 'mistakes', icon: AlertTriangle, label: isAr ? 'أخطاء شائعة' : 'Common Mistakes', show: !!lb?.common_mistakes?.length },
                  ].filter(t => t.show).map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                      className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all',
                        activeTab === t.key ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30' : 'bg-[#0A0B0E] text-gray-500 border border-gray-800 hover:text-white hover:border-gray-700')}>
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Steps tab */}
                {activeTab === 'steps' && steps.length > 0 && (
                  <div className="space-y-3">
                    {steps.map((step: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                        <button onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                          className="w-full flex items-center gap-4 p-4 text-start">
                          <div className="w-8 h-8 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#22D3EE] font-black text-xs">{i + 1}</span>
                          </div>
                          <span className="text-white font-medium text-sm flex-1">{step.title}</span>
                          {expandedStep === i
                            ? <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
                        </button>
                        <AnimatePresence>
                          {expandedStep === i && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                              className="overflow-hidden border-t border-gray-900">
                              <div className="p-4 ps-16">
                                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{step.content}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Logic breakdown summary */}
                {activeTab === 'steps' && lb?.summary && (
                  <div className="mt-6 bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-[#A855F7]" />
                      <span className="text-[#A855F7] text-xs font-bold uppercase tracking-widest">
                        {isAr ? 'كيف تشرح هذا العمل' : 'How to Explain This Work'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{lb.summary}</p>
                  </div>
                )}

                {/* Defense Q&A tab */}
                {activeTab === 'defense' && lb?.defense_qa?.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-xs mb-4">
                      {isAr ? 'أسئلة قد يسألها الدكتور — مع إجابات جاهزة.' : 'Questions your professor might ask — with ready answers.'}
                    </p>
                    {lb.defense_qa.map((qa: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="flex items-start gap-3 p-4 border-b border-gray-900">
                          <MessageSquare className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
                          <p className="text-white text-sm font-medium">{qa.q}</p>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-[#22D3EE]/3">
                          <Zap className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
                          <p className="text-gray-300 text-sm leading-relaxed">{qa.a}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Key concepts tab */}
                {activeTab === 'concepts' && lb?.key_concepts?.length > 0 && (
                  <div className="grid gap-3">
                    {lb.key_concepts.map((concept: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
                        <div className="w-6 h-6 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Brain className="w-3 h-3 text-[#A855F7]" />
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{concept}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Common mistakes tab */}
                {activeTab === 'mistakes' && lb?.common_mistakes?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-xs mb-4">
                      {isAr ? 'أخطاء شائعة يجب تجنبها في هذا النوع من الواجبات.' : 'Common mistakes students make with this type of assignment.'}
                    </p>
                    {lb.common_mistakes.map((mistake: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-sm leading-relaxed">{mistake}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {steps.length === 0 && !lb && (
              <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-8 text-center">
                <BookOpen className="w-8 h-8 text-gray-800 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">{isAr ? 'لا توجد خطوات تعليمية لهذه المهمة' : 'No learning steps for this mission'}</p>
                <p className="text-gray-700 text-xs mt-1">{isAr ? 'المهام الجديدة ستحتوي على تحليل كامل' : 'New missions will include full breakdown'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
