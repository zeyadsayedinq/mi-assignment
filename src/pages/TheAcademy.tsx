import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen, ChevronDown, ChevronRight, Search,
  Presentation, HelpCircle, FileText, Layers,
  ArrowLeft, MessageSquare, GraduationCap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

type Tab = 'summary' | 'steps' | 'defend' | 'slides';

// ── Helper: build a display name from vault item ──────────────────────────────
function smartFileName(name: string, type?: string, createdAt?: string): string {
  if (!name) return 'Mission';
  if (
    name.startsWith('WhatsApp') ||
    name.startsWith('IMG_') ||
    name.startsWith('Screenshot') ||
    name.match(/^\d{4}-\d{2}-\d{2}/)
  ) {
    const label = type ? type.replace(/_/g, ' ') : 'Assignment';
    const date  = createdAt
      ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      : '';
    return `${label.charAt(0).toUpperCase() + label.slice(1)}${date ? ` — ${date}` : ''}`;
  }
  return name;
}

// ── Resolve slides from solution_data regardless of key variant ───────────────
function resolveSlides(sd: any): any[] {
  // Support both key names used across different Mi-CORE versions
  const candidates = [
    sd?.slides,
    sd?.presentation_slides,
    sd?.slide_deck,
    sd?.deck,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }
  return [];
}

export function TheAcademy() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { i18n }   = useTranslation();
  const isAr        = i18n.language === 'ar';
  const { user }   = useAuth();

  const [entries,      setEntries]      = useState<any[]>([]);
  const [selected,     setSelected]     = useState<any | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedQA,   setExpandedQA]   = useState<number | null>(null);
  const [activeTab,    setActiveTab]    = useState<Tab>('summary');
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [noteOpen,     setNoteOpen]     = useState<number | null>(null);

  // ── Load missions ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const vaultKey = `mi_vault_${user?.id || 'anon'}`;
      const vault: any[] = JSON.parse(localStorage.getItem(vaultKey) || '[]');

      let dbMissions: any[] = [];
      try {
        const { data } = await supabase
          .from('missions')
          .select('*')
          .eq('user_id', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(50);
        if (data) dbMissions = data;
      } catch { /* non-fatal */ }

      const combined = [...dbMissions, ...vault];
      const unique   = combined.filter(
        (v, i, a) => a.findIndex((t: any) => t.id === v.id) === i,
      );

      const mapped = unique.map((m: any) => {
        const sd = m.solution_data || {};
        return {
          id:              m.id,
          payload_name:    m.payload_name || 'Mission',
          university:      m.university   || 'University',
          course:          m.course       || '',
          assignment_type: m.assignment_type || sd.assignment_type || 'other',
          domain:          sd.domain      || '',
          created_at:      m.created_at,
          lang:            m.lang         || 'en',
          solution_text:   sd.solution_text || m.summary || '',
          steps:           sd.steps       || [],
          defense_qa:      sd.defense_qa  || [],
          // ↓ resolveSlides checks all key variants
          slides:          resolveSlides(sd),
          blocks:          sd.reconstructed_doc?.blocks || [],
        };
      });

      setEntries(mapped);

      // Auto-select if navigated with a missionId
      if (location.state?.missionId) {
        const found = mapped.find(e => e.id === location.state.missionId);
        if (found) { setSelected(found); setActiveTab('summary'); }
      }

      setLoading(false);
    };
    load();
  }, [user?.id, location.state?.missionId]);

  const filtered = entries.filter(e =>
    (e.payload_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.university   || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.course       || '').toLowerCase().includes(search.toLowerCase()),
  );

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'summary', label: isAr ? 'الملخص'    : 'Summary', icon: FileText },
    { key: 'steps',   label: isAr ? 'الخطوات'   : 'Steps',   icon: Layers,         count: selected?.steps?.length   || 0 },
    { key: 'defend',  label: isAr ? 'الدفاع'    : 'Defend',  icon: MessageSquare,  count: selected?.defense_qa?.length || 0 },
    { key: 'slides',  label: isAr ? 'الشرائح'   : 'Slides',  icon: Presentation,   count: selected?.slides?.length  || 0 },
  ];

  // ── No entry selected: show list ────────────────────────────────────────────
  if (!selected) {
    return (
      <div className={cn('flex flex-col h-full bg-[#050608] text-white', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div className="p-6 border-b border-gray-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#A855F7]/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#A855F7]" />
            </div>
            <div>
              <h1 className="text-lg font-black">{isAr ? 'Mi-Academy' : 'Mi-Academy'}</h1>
              <p className="text-gray-500 text-xs">{isAr ? 'تفهم كيف حُل الواجب خطوة بخطوة' : 'Understand how each assignment was solved'}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث في المهام…' : 'Search missions…'}
              className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#A855F7]/50"
            />
          </div>
        </div>

        {/* Mission list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#0A0B0E] border border-gray-900 rounded-xl animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                {isAr ? 'أكمل مهمة أولاً لتظهر هنا.' : 'Complete a mission to see it here.'}
              </p>
            </div>
          ) : (
            filtered.map(entry => {
              const slideCount = entry.slides?.length || 0;
              const stepCount  = entry.steps?.length  || 0;
              return (
                <button
                  key={entry.id}
                  onClick={() => { setSelected(entry); setActiveTab('summary'); setNoteOpen(null); }}
                  className="w-full text-left bg-[#0A0B0E] border border-gray-900 hover:border-[#A855F7]/30 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate group-hover:text-[#A855F7] transition-colors">
                        {smartFileName(entry.payload_name, entry.assignment_type, entry.created_at)}
                      </p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{entry.university}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {stepCount  > 0 && <span className="text-[10px] bg-[#22D3EE]/10 text-[#22D3EE] px-1.5 py-0.5 rounded-md font-bold">{stepCount} steps</span>}
                      {slideCount > 0 && <span className="text-[10px] bg-[#A855F7]/10 text-[#A855F7] px-1.5 py-0.5 rounded-md font-bold">{slideCount} slides</span>}
                    </div>
                  </div>
                  {entry.created_at && (
                    <p className="text-gray-700 text-[10px] mt-2">
                      {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Entry selected: show detail view ────────────────────────────────────────
  return (
    <div className={cn('flex flex-col h-full bg-[#050608] text-white', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-900">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isAr ? 'رجوع' : 'Back'}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">
            {smartFileName(selected.payload_name, selected.assignment_type, selected.created_at)}
          </p>
          <p className="text-gray-600 text-xs">{selected.university}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-900 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setNoteOpen(null); }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
              activeTab === t.key
                ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30'
                : 'text-gray-500 hover:text-white',
            )}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn(
                'text-[9px] px-1 rounded-full font-black',
                activeTab === t.key ? 'bg-[#A855F7]/30 text-[#A855F7]' : 'bg-gray-800 text-gray-500',
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── SUMMARY ── */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-[#0A0B0E] border border-gray-900 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#22D3EE]" />
                <h3 className="text-white font-bold text-sm">{isAr ? 'ملخص الحل' : 'Solution Summary'}</h3>
              </div>
              <p
                className="text-gray-300 text-sm leading-relaxed"
                dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                style={{ unicodeBidi: 'plaintext' }}
              >
                {selected.solution_text || (isAr ? 'لا يوجد ملخص.' : 'No summary available.')}
              </p>
            </div>
            {selected.blocks?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{isAr ? 'محتوى الوثيقة' : 'Document Content'}</h4>
                {selected.blocks.map((block: any, i: number) => (
                  <div key={i} className="bg-[#0A0B0E] border border-gray-900 rounded-xl p-4">
                    {block.type === 'heading' && (
                      <p className="text-white font-bold text-sm" dir={selected.lang === 'ar' ? 'rtl' : 'ltr'} style={{ unicodeBidi: 'plaintext' }}>{block.content}</p>
                    )}
                    {block.type === 'paragraph' && (
                      <p className="text-gray-300 text-sm leading-relaxed" dir={selected.lang === 'ar' ? 'rtl' : 'ltr'} style={{ unicodeBidi: 'plaintext' }}>{block.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEPS ── */}
        {activeTab === 'steps' && (
          <div className="space-y-2">
            {selected.steps.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">{isAr ? 'لا توجد خطوات لهذه المهمة.' : 'No steps for this mission.'}</p>
              </div>
            ) : selected.steps.map((step: any, i: number) => {
              const text    = step.explanation || step.content || step.text || '';
              const isLong  = text.length > 300;
              const isOpen  = expandedStep === i;
              return (
                <div key={i} className="bg-[#0A0B0E] border border-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedStep(isOpen ? null : i)}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] text-[10px] font-black flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{step.title || step.heading || `Step ${i + 1}`}</p>
                      {!isOpen && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2"
                          dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                          style={{ unicodeBidi: 'plaintext' }}
                        >
                          {text}
                        </p>
                      )}
                    </div>
                    {isLong && (
                      <span className="shrink-0 text-gray-600">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    )}
                  </button>
                  {isOpen && text && (
                    <div className="px-4 pb-4 pt-0">
                      <p
                        className="text-gray-300 text-sm leading-relaxed"
                        dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                        style={{ unicodeBidi: 'plaintext' }}
                      >
                        {text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DEFEND ── */}
        {activeTab === 'defend' && (
          <div className="space-y-2">
            {selected.defense_qa.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">{isAr ? 'لا توجد أسئلة دفاعية.' : 'No defense Q&A for this mission.'}</p>
              </div>
            ) : selected.defense_qa.map((qa: any, i: number) => (
              <div key={i} className="bg-[#0A0B0E] border border-gray-900 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedQA(expandedQA === i ? null : i)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#A855F7]/10 text-[#A855F7] text-[10px] font-black flex items-center justify-center mt-0.5">Q</span>
                  <p
                    className="flex-1 text-white text-sm font-semibold"
                    dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                    style={{ unicodeBidi: 'plaintext' }}
                  >
                    {qa.question || qa.q || `Question ${i + 1}`}
                  </p>
                  {expandedQA === i ? <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
                </button>
                {expandedQA === i && (
                  <div className="px-4 pb-4 flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black flex items-center justify-center mt-0.5">A</span>
                    <p
                      className="text-gray-300 text-sm leading-relaxed"
                      dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                      style={{ unicodeBidi: 'plaintext' }}
                    >
                      {qa.answer || qa.a || '—'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SLIDES ── */}
        {activeTab === 'slides' && (
          <div className="space-y-3">
            {selected.slides.length === 0 ? (
              <div className="text-center py-12">
                <Presentation className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  {isAr
                    ? 'لا توجد شرائح — هذه المهمة لم تكن عرض تقديمي.'
                    : 'No slides — this mission was not a presentation.'}
                </p>
                <p className="text-gray-700 text-xs mt-2">
                  {isAr
                    ? 'اختر "عرض تقديمي" كنوع المهمة لإنشاء شرائح.'
                    : 'Select "Presentation" as assignment type to generate slides.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                  {selected.slides.length} {isAr ? 'شريحة' : 'slides'}
                </p>
                {selected.slides.map((slide: any, i: number) => {
                  const bullets: string[] = slide.content_bullets || slide.bullets || slide.points || [];
                  const notes: string     = slide.speaker_notes   || slide.notes   || '';
                  const isNoteOpen        = noteOpen === i;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'bg-[#0A0B0E] border rounded-xl overflow-hidden transition-all',
                        i === 0 ? 'border-[#22D3EE]/30' : 'border-gray-900',
                      )}
                    >
                      {/* Slide header */}
                      <div className={cn('px-4 py-3 flex items-center gap-3', i === 0 && 'bg-[#22D3EE]/5')}>
                        <span className={cn(
                          'shrink-0 w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center',
                          i === 0 ? 'bg-[#22D3EE]/20 text-[#22D3EE]' : 'bg-gray-800 text-gray-500',
                        )}>
                          {i + 1}
                        </span>
                        <p
                          className={cn('font-bold text-sm', i === 0 ? 'text-[#22D3EE]' : 'text-white')}
                          dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                          style={{ unicodeBidi: 'plaintext' }}
                        >
                          {slide.title || slide.heading || slide.power_heading || `Slide ${i + 1}`}
                        </p>
                      </div>

                      {/* Bullets */}
                      {bullets.length > 0 && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {bullets.map((b: string, bi: number) => (
                            <div key={bi} className="flex items-start gap-2">
                              <span className="text-[#A855F7] mt-1 text-xs shrink-0">▸</span>
                              <p
                                className="text-gray-300 text-xs leading-relaxed"
                                dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                                style={{ unicodeBidi: 'plaintext' }}
                              >
                                {b}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Speaker notes toggle */}
                      {notes && (
                        <div className="border-t border-gray-900">
                          <button
                            onClick={() => setNoteOpen(isNoteOpen ? null : i)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-400 transition-colors text-xs"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {isNoteOpen
                              ? (isAr ? 'إخفاء ملاحظات المتحدث' : 'Hide speaker notes')
                              : (isAr ? 'عرض ملاحظات المتحدث' : 'Show speaker notes')}
                            {isNoteOpen ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
                          </button>
                          {isNoteOpen && (
                            <div className="px-4 pb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                {isAr ? 'ماذا تقول' : 'What to say'}
                              </p>
                              <p
                                className="text-gray-400 text-xs leading-relaxed"
                                dir={selected.lang === 'ar' ? 'rtl' : 'ltr'}
                                style={{ unicodeBidi: 'plaintext' }}
                              >
                                {notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
