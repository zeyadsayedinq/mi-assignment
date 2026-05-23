import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Download, Search, Clock, ChevronRight, Archive, X, Trash2, Star, FileText, Presentation, Code, Calculator, BookOpen, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { downloadMissionPackage } from '../lib/exporter';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { useAuth } from '../contexts/AuthContext';

interface MissionRecord {
  id: string; created_at: string; payload_name: string;
  university: string; course: string; assignment_type?: string;
  status: string; summary: string; solution_data?: any;
}

const TYPE_ICONS: Record<string, any> = { essay: FileText, report: FileText, presentation: Presentation, code: Code, math: Calculator, physics: Calculator, engineering: Calculator, research: BookOpen, design: Image, other: Archive };
const TYPE_COLORS: Record<string, string> = {
  essay: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  report: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  presentation: 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20',
  code: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  math: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  physics: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  engineering: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  research: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  design: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  other: 'text-gray-400 bg-gray-800 border-gray-700',
};
const ITEMS_PER_PAGE = 12;

export function TheVault() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const vaultKey = `mi_vault_${user?.id || 'anon'}`;
  const starredKey = `mi_starred_${user?.id || 'anon'}`;

  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MissionRecord | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // We need to initialize starred after we know the user.id, so we'll do it in a useEffect instead
  const [starred, setStarred] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { setStarred(new Set(JSON.parse(localStorage.getItem(starredKey) || '[]'))); } catch {}
  }, [starredKey]);

  const load = async () => {
    setIsLoading(true);
    const local: MissionRecord[] = JSON.parse(localStorage.getItem(vaultKey) || '[]');
    let localAnon: MissionRecord[] = [];
    if (user?.id) {
       localAnon = JSON.parse(localStorage.getItem('mi_vault_anon') || '[]');
    }
    let supa: MissionRecord[] = [];
    try { if (user?.id) { const { data } = await supabase.from('missions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (data) supa = data; } } catch {}
    const map = new Map<string, MissionRecord>();
    [...local, ...localAnon, ...supa].forEach(m => { if (!map.has(m.id)) map.set(m.id, m); });
    setMissions(Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [vaultKey]);

  const deleteMission = (id: string) => {
    const updated = missions.filter(m => m.id !== id);
    setMissions(updated);
    localStorage.setItem(vaultKey, JSON.stringify(updated));
    if (user?.id) supabase.from('missions').delete().eq('id', id).eq('user_id', user.id).then(() => {});
    setDeleteConfirm(null);
    if (selected?.id === id) setSelected(null);
  };

  const toggleStar = (id: string) => {
    setStarred(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); localStorage.setItem(starredKey, JSON.stringify([...n])); return n; });
  };

  const types = useMemo(() => ['all', ...Array.from(new Set(missions.map(m => m.assignment_type).filter(Boolean)))], [missions]);
  const filtered = useMemo(() => missions.filter(m => {
    const s = !searchTerm || [m.payload_name, m.university, m.course, m.summary].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));
    const tp = filterType === 'all' || m.assignment_type === filterType;
    return s && tp;
  }), [missions, searchTerm, filterType]);

  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const formatDate = (s: string) => {
    const diff = Date.now() - new Date(s).getTime();
    if (isAr) {
      if (diff < 60000) return 'الآن';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`;
      return new Date(s).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    }
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans p-5 lg:p-8', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">{isAr ? '🗄️ الخزينة' : '🗄️ Mi-Vault'}</h1>
            <p className="text-gray-500 text-sm">{isAr ? `${missions.length} واجب محفوظ` : `${missions.length} missions archived`}</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: isAr ? 'الكل' : 'Total', value: missions.length },
              { label: isAr ? 'الأسبوع' : 'This Week', value: missions.filter(m => Date.now() - new Date(m.created_at).getTime() < 604800000).length },
              { label: isAr ? 'مفضلة' : 'Starred', value: starred.size },
            ].map(s => (
              <div key={s.label} className="text-center bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-2.5">
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex-1 min-w-48 relative">
            <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600', isAr ? 'right-3' : 'left-3')} />
            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder={isAr ? 'دور في المهام...' : 'Search missions...'}
              className={cn('w-full bg-[#0A0B0E] border border-gray-800 rounded-xl py-2.5 text-sm text-white focus:outline-none focus:border-[#22D3EE] transition-all', isAr ? 'pr-10 pl-4' : 'pl-10 pr-4')} />
          </div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-400 focus:outline-none cursor-pointer">
            <option value="all">{isAr ? 'كل الأنواع' : 'All Types'}</option>
            {types.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-2 border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin" /></div>
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Archive className="w-14 h-14 text-gray-800 mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">{isAr ? 'الخزينة فاضية' : 'Vault is empty'}</h3>
            <p className="text-gray-700 text-sm">{isAr ? 'أكمل مهمتك الأولى في المحطة علشان تبدأ.' : 'Complete your first mission in the Terminal to start.'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnimatePresence>
                {paginated.map((mission, i) => {
                  const TypeIcon = TYPE_ICONS[mission.assignment_type || 'other'] || Archive;
                  const typeColor = TYPE_COLORS[mission.assignment_type || 'other'];
                  const isStarred = starred.has(mission.id);
                  return (
                    <motion.div key={mission.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="group bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#22D3EE]/30 transition-all relative">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase', typeColor)}>
                            <TypeIcon className="w-3 h-3" />{mission.assignment_type || 'other'}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleStar(mission.id)} className={cn('p-1 rounded hover:bg-white/5', isStarred ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-400')}>
                              <Star className="w-3.5 h-3.5" fill={isStarred ? 'currentColor' : 'none'} />
                            </button>
                            <button onClick={() => setDeleteConfirm(mission.id)} className="p-1 rounded text-gray-700 hover:text-red-400 hover:bg-white/5">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1 line-clamp-2 leading-snug">{mission.payload_name}</h3>
                        <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{mission.summary}</p>
                        <div className="flex gap-2 flex-wrap">
                          {mission.university && <span className="text-[10px] text-gray-600 bg-gray-900 px-2 py-0.5 rounded-full">{mission.university}</span>}
                          {mission.course && <span className="text-[10px] text-gray-600 bg-gray-900 px-2 py-0.5 rounded-full">{mission.course}</span>}
                        </div>
                      </div>
                      <div className="border-t border-gray-900 flex">
                        <div className="flex-1 px-3 py-2 flex items-center gap-1.5 text-gray-600 text-[10px] font-mono">
                          <Clock className="w-3 h-3" />{formatDate(mission.created_at)}
                        </div>
                        <button onClick={() => setSelected(mission)} className="px-3 py-2 text-[#22D3EE] text-[10px] font-bold flex items-center gap-1 hover:bg-[#22D3EE]/5 transition-colors border-l border-gray-900">
                          {isAr ? 'عرض' : 'View'} <ChevronRight className={cn('w-3 h-3', isAr && 'rotate-180')} />
                        </button>
                        {mission.solution_data && (
                          <button onClick={async () => { setDownloading(mission.id); await downloadMissionPackage(mission.solution_data, mission.payload_name).catch(() => {}); setDownloading(null); }}
                            className="px-3 py-2 text-gray-500 hover:text-white transition-colors border-l border-gray-900">
                            {downloading === mission.id ? <div className="w-3.5 h-3.5 border border-gray-500 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {deleteConfirm === mission.id && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0A0B0E]/95 backdrop-blur rounded-2xl flex flex-col items-center justify-center gap-3 p-5">
                            <Trash2 className="w-7 h-7 text-red-400" />
                            <p className="text-white text-sm font-bold">{isAr ? 'تحذف المهمة دي؟' : 'Delete this mission?'}</p>
                            <p className="text-gray-500 text-xs">{isAr ? 'مش هتقدر ترجع منها' : 'Cannot be undone'}</p>
                            <div className="flex gap-2">
                              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-1.5 text-xs text-gray-400 border border-gray-700 rounded-xl hover:text-white">{isAr ? 'إلغاء' : 'Cancel'}</button>
                              <button onClick={() => deleteMission(mission.id)} className="px-4 py-1.5 text-xs text-white bg-red-500 rounded-xl hover:bg-red-600">{isAr ? 'حذف' : 'Delete'}</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={cn('w-8 h-8 rounded-lg text-xs font-bold transition-all', p === page ? 'bg-[#22D3EE] text-black' : 'bg-[#0A0B0E] border border-gray-800 text-gray-500 hover:border-gray-600')}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mission detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-[#020617]/80 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-screen flex justify-end">
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-4xl bg-[#050608] border-l border-gray-800 overflow-y-auto">
                <div className="sticky top-0 z-10 bg-[#050608]/90 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-bold text-sm">{selected.payload_name}</h2>
                    <p className="text-gray-500 text-xs">{formatDate(selected.created_at)}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                  {selected.solution_data
                    ? <ResultsDashboard data={selected.solution_data} onReset={() => setSelected(null)} missionMeta={{ name: selected.payload_name, university: selected.university, course: selected.course }} />
                    : <div className="text-center py-16"><Archive className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-gray-500">{isAr ? 'مفيش بيانات تفصيلية' : 'No detailed data available'}</p></div>
                  }
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
