import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, ChevronRight, ChevronDown, BookOpen, Shield, AlertTriangle,
  Search, Zap, MessageSquare, Target, GraduationCap, Lightbulb,
  Clock, BarChart2, FileText, Star, CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const TYPE_COLORS: Record<string, string> = {
  essay: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  report: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  presentation: 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20',
  computer_science: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  math: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  engineering: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  law: 'text-red-400 bg-red-500/10 border-red-500/20',
  business_plan: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  medical: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  research_paper: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  other: 'text-gray-400 bg-gray-800 border-gray-700',
};

const DOMAIN_ICONS: Record<string, string> = {
  ENGINEERING: '⚙️', MEDICAL: '🏥', LAW: '⚖️', CS: '💻',
  BUSINESS: '📊', HUMANITIES: '📚', MATH_STATS: '🔢', GENERAL: '🎓',
};

type Tab = 'steps' | 'defense' | 'summary' | 'slides';

export function TheAcademy() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedQA, setExpandedQA] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const vault = JSON.parse(localStorage.getItem(vaultKey) || '[]');
      let dbMissions: any[] = [];
      try {
        const { data } = await supabase
          .from('missions')
          .select('id,payload_name,university,course,assignment_type,created_at,summary,solution_data,lang')
          .eq('user_id', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(100);
        if (data) dbMissions = data;
      } catch {}
      const combined = [...dbMissions, ...vault];
      const unique = combined.filter((v, i, a) => a.findIndex((t: any) => t.id === v.id) === i);
      const mapped = unique.map((m: any) => {
        const sd = m.solution_data || {};
        return {
          id: m.id,
          payload_name: m.payload_name || 'Mission',
          university: m.university || 'University',
          course: m.course || '',
          assignment_type: m.assignment_type || sd.assignment_type || 'other',
          domain: sd.domain || '',
          created_at: m.created_at,
          lang: m.lang || 'en',
          solution_text: sd.solution_text || m.summary || '',
          steps: sd.steps || [],
          defense_qa: sd.defense_qa || [],
          slides: sd.slides || [],
          blocks: sd.reconstructed_doc?.blocks || [],
        };
      });
      setEntries(mapped);
      if (location.state?.missionId) {
        const found = mapped.find(e => e.id === location.state.missionId);
        if (found) { setSelected(found); setActiveTab('summary'); }
      } else if (mapped.length > 0) {
        setSelected(mapped[0]); setActiveTab('summary');
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const filtered = entries.filter(e =>
    !search ||
    (e.payload_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.assignment_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.university || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSteps = entries.reduce((s, e) => s + (e.steps?.length || 0), 0);
  const withQA = entries.filter(e => e.defense_qa?.length > 0).length;
  const domains = [...new Set(entries.map(e => e.domain).filter(Boolean))];

  const sel = selected;
  const steps = sel?.steps || [];
  const qa = sel?.defense_qa || [];
  const slides = sel?.slides || [];
  const keyParas = (sel?.blocks || []).filter((b: any) => b.type === 'paragraph' && b.content?.length > 100).slice(0, 3);

  const tabs = [
    { key: 'summary' as Tab, icon: FileText, label: isAr ? 'الملخص' : 'Summary', count: 1 },
    { key: 'steps' as Tab, icon: BookOpen, label: isAr ? `خطوات (${steps.length})` : `Steps (${steps.length})`, count: steps.length },
    { key: 'defense' as Tab, icon: Shield, label: isAr ? `دفاع (${qa.length})` : `Defend (${qa.length})`, count: qa.length },
    { key: 'slides' as Tab, icon: BarChart2, label: isAr ? `شرائح (${slides.length})` : `Slides (${slides.length})`, count: slides.length },
  ].filter(t => t.count > 0);

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* LEFT PANEL */}
      <div className="w-72 border-e border-white/[0.06] flex flex-col shrink-0 bg-[#030508]">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-white font-black text-sm">Mi-Academy</span>
          </div>
          <p className="text-gray-600 text-[10px]">{isAr ? 'مرجعك الشخصي لكل مهمة' : 'Your personal study reference'}</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { v: entries.length, l: isAr ? 'مهام' : 'Missions', c: '#22D3EE' },
              { v: totalSteps, l: isAr ? 'خطوات' : 'Steps', c: '#A855F7' },
              { v: withQA, l: isAr ? 'دفاع' : 'Defense', c: '#10B981' },
            ].map(s => (
              <div key={s.l} className="bg-[#0A0B0E] border border-white/[0.04] rounded-xl p-2.5 text-center">
                <div className="text-lg font-black" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-3 h-3 absolute start-3 top-1/2 -translate-y-1/2 text-gray-700" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search missions...'}
              className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl ps-8 pe-3 py-2 text-white text-xs placeholder-gray-700 focus:outline-none focus:border-[#22D3EE]/40 transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#0A0B0E] rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Brain className="w-10 h-10 text-gray-800 mx-auto mb-3" />
              <p className="text-gray-600 text-xs font-medium mb-1">{isAr ? 'لا توجد مهام بعد' : 'No missions yet'}</p>
              <p className="text-gray-700 text-[10px] mb-4">{isAr ? 'كل مهمة تنتهيها تظهر هنا' : 'Every completed mission appears here'}</p>
              <button onClick={() => navigate('/terminal')} className="px-4 py-2 bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-xs rounded-xl hover:bg-[#22D3EE]/20 transition-all">
                {isAr ? 'ابدأ أول مهمة ←' : 'Start first mission →'}
              </button>
            </div>
          ) : filtered.map(entry => (
            <button key={entry.id}
              onClick={() => { setSelected(entry); setActiveTab('summary'); setExpandedStep(null); setExpandedQA(null); }}
              className={cn('w-full text-start px-4 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all', sel?.id === entry.id && 'bg-[#22D3EE]/5 border-s-2 border-s-[#22D3EE]')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border', TYPE_COLORS[entry.assignment_type] || TYPE_COLORS.other)}>{entry.assignment_type}</span>
                {entry.domain && <span className="text-[10px]">{DOMAIN_ICONS[entry.domain] || '📝'}</span>}
                {entry.steps?.length > 0 && <span className="text-[9px] text-emerald-500 ms-auto flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />{entry.steps.length}</span>}
              </div>
              <p className="text-white text-xs font-semibold leading-snug line-clamp-2 mb-1">{entry.payload_name}</p>
              <p className="text-gray-700 text-[10px] truncate">{entry.university}</p>
            </button>
          ))}
        </div>
        {domains.length > 0 && (
          <div className="p-4 border-t border-white/[0.06]">
            <p className="text-gray-700 text-[10px] uppercase tracking-widest mb-2">{isAr ? 'تخصصاتك' : 'Your domains'}</p>
            <div className="flex flex-wrap gap-1.5">
              {domains.slice(0, 6).map(d => (
                <span key={d} className="text-[9px] bg-[#0A0B0E] border border-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{DOMAIN_ICONS[d] || ''} {d}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto">
        {!sel ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <GraduationCap className="w-14 h-14 text-gray-800 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-bold mb-1">{isAr ? 'اختر مهمة للبدء' : 'Select a mission to study'}</p>
              <p className="text-gray-700 text-sm">{isAr ? 'الأكاديمية تحفظ كل خطوات الحل' : 'Academy saves every step of your solution'}</p>
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', TYPE_COLORS[sel.assignment_type] || TYPE_COLORS.other)}>{sel.assignment_type}</span>
                {sel.domain && <span className="text-[10px] bg-[#0A0B0E] border border-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">{DOMAIN_ICONS[sel.domain]} {sel.domain}</span>}
                <span className="text-[10px] text-gray-600 ms-auto flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(sel.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight mb-1">{sel.payload_name}</h1>
              <p className="text-gray-500 text-sm">{sel.university}{sel.course ? ` · ${sel.course}` : ''}</p>
            </div>

            {/* Educational Banner */}
            <div className="bg-gradient-to-r from-[#22D3EE]/10 to-[#A855F7]/10 border border-[#22D3EE]/20 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold text-sm mb-1">{isAr ? 'كيف تستفيد من هذه المهمة؟' : 'How to get the most from this mission'}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {isAr
                      ? 'Mi حل الواجب — لكن الأهم أنك تفهم كيف وصلنا للحل. اقرأ الخطوات، احفظ أسئلة الدفاع، وراجع المفاهيم قبل الامتحان أو المناقشة مع الدكتور.'
                      : 'Mi solved the assignment — understanding HOW is what gets you through the exam and viva. Study the steps, memorize the defense Q&A, and review before any discussion with your professor.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border',
                    activeTab === t.key ? 'bg-[#22D3EE] text-black border-[#22D3EE]' : 'bg-[#0A0B0E] text-gray-500 border-gray-800 hover:text-white hover:border-gray-700')}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>

            {/* SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-5">
                {sel.solution_text && (
                  <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-[#22D3EE]" /><span className="text-white font-bold text-sm">{isAr ? 'ماذا فعلنا؟' : 'What we solved'}</span></div>
                    <p className="text-gray-300 text-sm leading-relaxed">{sel.solution_text}</p>
                  </div>
                )}
                {keyParas.length > 0 && (
                  <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4 text-[#A855F7]" /><span className="text-white font-bold text-sm">{isAr ? 'أبرز محتوى الحل' : 'Key content'}</span></div>
                    <div className="space-y-4">
                      {keyParas.map((b: any, i: number) => (
                        <div key={i} className="border-s-2 border-[#22D3EE]/30 ps-4">
                          <p className="text-gray-400 text-sm leading-relaxed">{b.content?.slice(0, 400)}{b.content?.length > 400 ? '...' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: isAr ? 'خطوات الحل' : 'Solution steps', value: steps.length, icon: BookOpen, color: '#22D3EE', tab: 'steps' as Tab },
                    { label: isAr ? 'أسئلة الدفاع' : 'Defense Q&A', value: qa.length, icon: Shield, color: '#A855F7', tab: 'defense' as Tab },
                    { label: isAr ? 'شرائح العرض' : 'Slides', value: slides.length, icon: BarChart2, color: '#10B981', tab: 'slides' as Tab },
                  ].map(s => (
                    <button key={s.label} onClick={() => s.value > 0 && setActiveTab(s.tab)}
                      className={cn('bg-[#0A0B0E] border border-gray-800 rounded-2xl p-4 text-center transition-all', s.value > 0 ? 'hover:border-gray-700 cursor-pointer' : 'opacity-40 cursor-default')}>
                      <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                      <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-gray-600 text-[10px] mt-1">{s.label}</div>
                    </button>
                  ))}
                </div>
                {!sel.solution_text && steps.length === 0 && qa.length === 0 && (
                  <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-8 text-center">
                    <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium mb-1">{isAr ? 'هذه مهمة قديمة' : 'This is an older mission'}</p>
                    <p className="text-gray-700 text-xs">{isAr ? 'المهام الجديدة تحفظ كل الخطوات تلقائياً' : 'New missions automatically save all steps and Q&A'}</p>
                  </div>
                )}
              </div>
            )}

            {/* STEPS */}
            {activeTab === 'steps' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-5 bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-xl px-4 py-3">
                  <GraduationCap className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <p className="text-[#22D3EE] text-xs">{isAr ? 'هذه الخطوات تشرح منطق الحل — اقرأها كأنك بتشرح للدكتور' : 'These steps explain the logic — read them as if explaining to your professor'}</p>
                </div>
                {steps.length === 0 ? (
                  <div className="text-center py-12 text-gray-600"><BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-sm">{isAr ? 'لا خطوات' : 'No steps'}</p></div>
                ) : steps.map((step: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors">
                    <button onClick={() => setExpandedStep(expandedStep === i ? null : i)} className="w-full flex items-center gap-4 p-4 text-start">
                      <div className="w-9 h-9 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center shrink-0">
                        <span className="text-[#22D3EE] font-black text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-semibold text-sm">{step.title}</span>
                        {expandedStep !== i && step.content && <p className="text-gray-600 text-[11px] mt-0.5 truncate">{step.content?.slice(0, 80)}...</p>}
                      </div>
                      {expandedStep === i ? <ChevronDown className="w-4 h-4 text-[#22D3EE] shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
                    </button>
                    <AnimatePresence>
                      {expandedStep === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-900">
                          <div className="p-5 ps-16"><p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{step.content}</p></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {/* DEFENSE */}
            {activeTab === 'defense' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5 bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl px-4 py-3">
                  <Shield className="w-4 h-4 text-[#A855F7] shrink-0" />
                  <p className="text-[#A855F7] text-xs">{isAr ? 'دي الأسئلة اللي الدكتور غالباً هيسألها — احفظ الإجابات' : 'Questions your professor will likely ask — memorize the answers'}</p>
                </div>
                {qa.length === 0 ? (
                  <div className="text-center py-12 text-gray-600"><Shield className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-sm">{isAr ? 'لا أسئلة دفاع' : 'No defense Q&A'}</p></div>
                ) : qa.map((item: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedQA(expandedQA === i ? null : i)} className="w-full flex items-start gap-3 p-4 text-start hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#A855F7] font-black text-xs">Q</span>
                      </div>
                      <p className="text-white text-sm font-semibold flex-1 leading-snug">{item.question || item.q}</p>
                      {expandedQA === i ? <ChevronDown className="w-4 h-4 text-[#A855F7] shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mt-1" />}
                    </button>
                    <AnimatePresence>
                      {expandedQA === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="flex items-start gap-3 p-4 bg-[#A855F7]/5 border-t border-[#A855F7]/10">
                            <div className="w-7 h-7 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center shrink-0 mt-0.5"><Zap className="w-3 h-3 text-[#22D3EE]" /></div>
                            <p className="text-gray-300 text-sm leading-relaxed">{item.answer || item.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                {qa.length > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Star className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-emerald-400 text-xs">{isAr ? 'نصيحة: افتح السؤال وحاول تجاوب من غير ما تشوف الإجابة — كده بتحفظ فعلاً' : 'Pro tip: try answering before revealing — that is how you actually memorize'}</p>
                  </div>
                )}
              </div>
            )}

            {/* SLIDES */}
            {activeTab === 'slides' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <BarChart2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-emerald-400 text-xs">{isAr ? 'استخدم هذا لمراجعة نقاط البريزنتيشن قبل ما تقدم' : 'Review your presentation talking points before presenting'}</p>
                </div>
                {slides.length === 0 ? (
                  <div className="text-center py-12 text-gray-600"><BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-sm">{isAr ? 'لا شرائح' : 'No slides'}</p></div>
                ) : slides.map((slide: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0">
                        <span className="text-[#22D3EE] font-black text-xs">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{slide.power_heading}</p>
                        {slide.slide_type && <span className="text-[9px] text-gray-600 uppercase tracking-wider">{slide.slide_type}</span>}
                      </div>
                    </div>
                    {slide.content_bullets?.length > 0 && (
                      <div className="space-y-1.5 mb-3 ms-11">
                        {slide.content_bullets.map((b: string, j: number) => (
                          <div key={j} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] mt-1.5 shrink-0" />
                            <p className="text-gray-400 text-xs leading-relaxed">{b}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.speaker_notes && (
                      <div className="ms-11 bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl p-3">
                        <p className="text-[9px] text-[#A855F7] font-bold uppercase tracking-wider mb-1.5">{isAr ? 'ماذا تقول' : 'What to say'}</p>
                        <p className="text-gray-400 text-xs leading-relaxed">{slide.speaker_notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
