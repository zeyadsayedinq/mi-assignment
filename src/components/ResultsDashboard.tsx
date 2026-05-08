import { TiltCard } from './MILogo3D';
import { useExplosion } from '../contexts/ExplosionContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Download, Copy, Check, MonitorPlay, Code2, Table2, FileText, Sparkles, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { SlideViewer } from './SlideViewer';
import { ImageGenerator } from './ImageGenerator';
import { downloadMissionPackage } from '../lib/exporter';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';

interface ResultsProps {
  data: any;
  onReset: () => void;
  missionMeta?: { name: string; university: string; course: string } | null;
}

/**
 * v2.5 Universal Render Engine
 * Handles Math, Chemistry, and Engineering notation with high-fidelity sanitization.
 */
function MiMarkdown({ content, className = "" }: { content: string, className?: string }) {
  // Normalize and sanitize content for v2.5 standards
  const cleanContent = React.useMemo(() => {
    if (!content) return "";
    
    return content
      .replace(/\\\[/g, '\n$$\n')
      .replace(/\\\]/g, '\n$$\n')
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$')
      .split('\n').map(line => {
        let l = line.trim();
        
        // Subject-Specific logic (Chemistry/Redox/Engineering)
        const isEquation = l.includes('\\rightarrow') || 
                          l.includes('->') || 
                          l.includes('\\longrightarow') || 
                          (l.includes('_') && l.includes('(') && l.includes(')')) ||
                          (l.includes('^') && (l.includes('+') || l.includes('-')) && l.includes('{'));

        if (isEquation) {
          l = l.replace(/\\longrightarow/g, '\\rightarrow')
               .replace(/\\longrightarrow/g, '\\rightarrow')
               .replace(/->/g, '\\rightarrow');
          
          // Auto-wrap loose equations into block math for clarity
          if (!l.startsWith('$$') && !l.startsWith('$') && !l.startsWith('#')) {
            return `\n$$ ${l} $$\n`;
          }
        }
        return line;
      }).join('\n')
      .replace(/([^\n])\$\$/g, '$1\n$$')
      .replace(/\$\$([^\n])/g, '$$\n$1');
  }, [content]);

  return (
    <div className={cn("markdown-body prose prose-invert max-w-none prose-sm overflow-visible", className)}>
      <Markdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[[rehypeKatex, { 
          throwOnError: false, 
          output: 'html',
          strict: false,
          trust: true,
          macros: {
            "\\longrightarow": "\\rightarrow",
            "\\longleftarow": "\\leftarrow",
            "\\CE": "\\text", // Fallback for chemistry
            "\\mol": "\\text{mol}"
          }
        }]]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-400 font-medium">{children}</p>,
          li: ({ children }) => <li className="text-gray-400 mb-1 leading-relaxed list-disc marker:text-[#22D3EE]">{children}</li>,
          h1: ({ children }) => <h1 className="text-white font-black text-xl mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-[#22D3EE] rounded-full" />
            {children}
          </h1>,
          h2: ({ children }) => <h2 className="text-white font-black text-lg mb-3 flex items-center gap-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-white font-bold text-base mb-2 border-l-2 border-[#22D3EE]/30 ps-3">{children}</h3>,
          code: ({ children, className }) => {
            const isMath = className === 'language-math' || (typeof children === 'string' && (children.includes('\\') || children.includes('_') || children.includes('^') || (children.includes('(') && children.includes(')'))));
            const isInline = !className?.includes('language-');
            
            if (isMath && typeof children === 'string') {
              return <KatexBlock math={children} inline={isInline} />;
            }
            
            return isInline 
              ? <code className="bg-[#22D3EE]/10 px-1.5 py-0.5 rounded text-[#22D3EE] font-mono text-xs font-bold">{children}</code>
              : <code className={cn("block bg-black/40 p-4 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400", className)}>{children}</code>;
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-gray-800 bg-black/20">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="bg-white/5 p-3 text-white font-black text-start uppercase tracking-tighter text-xs">{children}</th>,
          td: ({ children }) => <td className="p-3 text-gray-400 border-t border-gray-800/50">{children}</td>,
          strong: ({ children }) => <strong className="text-white font-black bg-white/5 border-b border-[#22D3EE]/40 px-1">{children}</strong>
        }}
      >
        {cleanContent}
      </Markdown>
    </div>
  );
}

function KatexBlock({ math, inline = false }: { math: string, inline?: boolean }) {
  try {
    // Strip common AI delimiters and markdown blocks if they leaked into the children string
    const clean = math.trim()
      .replace(/^```(math|latex|katex)?\s*\n?/, '')
      .replace(/\n?\s*```$/, '')
      .replace(/^(\$\$?|\\\[|\\\()/, '')
      .replace(/(\$\$?|\\\]|\\\))$/, '')
      .trim();

    // Specific fix for chemistry arrows that might be encoded as simple arrows
    const chemistryFix = clean
      .replace(/->/g, '\\rightarrow ')
      .replace(/\\longrightarrow/g, '\\rightarrow ')
      .replace(/\\longrightarow/g, '\\rightarrow '); // Handle common AI typos

    const html = katex.renderToString(chemistryFix, {
      throwOnError: false,
      displayMode: !inline,
      trust: true,
      macros: {
        "\\longrightarrow": "\\rightarrow",
        "\\longrightarow": "\\rightarrow",
        "\\longleftarow": "\\leftarrow",
        "\\ce": "\\text" // Fallback for chemical equations if mhchem is missing
      }
    });
    return (
      <div 
        className={cn(
          "katex-rendered py-1 overflow-x-auto my-2 rounded bg-white/5 border border-white/5 px-3 min-w-[100px]", 
          inline ? "inline-block align-middle" : "block text-center flex justify-center"
        )} 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  } catch (e) {
    console.error("Katex rendering error for:", math, e);
    return <code className="text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-1 rounded font-mono text-[10px] break-all">{math}</code>;
  }
}

export function ResultsDashboard({ data, onReset, missionMeta }: ResultsProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { explode } = useExplosion();

  const [activeTab, setActiveTab] = useState('solution');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showSlideViewer, setShowSlideViewer] = useState(false);

  const slides = data?.presentation_slides || [];
  const codeSnippets = data?.code_snippets || [];
  const steps = data?.steps || [];
  const dataSheet = data?.data_sheet;
  const doc = data?.reconstructed_doc;

  const TABS = [
    { id: 'solution', label: isAr ? 'الحل' : 'Solution', icon: FileText, show: true },
    { id: 'slides', label: isAr ? 'الشرائح' : 'Slides', icon: MonitorPlay, show: slides.length > 0 },
    { id: 'code', label: isAr ? 'الكود' : 'Code', icon: Code2, show: codeSnippets.length > 0 },
    { id: 'data', label: isAr ? 'البيانات' : 'Data', icon: Table2, show: dataSheet?.rows?.length > 0 },
    { id: 'academy', label: 'Academy', icon: Brain, show: steps.length > 0 },
    { id: 'imagegen', label: isAr ? 'صور Mi' : 'Image Lab', icon: Sparkles, show: true },
  ].filter(t => t.show);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Detect pro status from real subscription (server-sourced via getSubscriptionStatus)
  const [isPro, setIsPro] = React.useState(false);
  React.useEffect(() => {
    const sbKey = Object.keys(localStorage).find(k => k.endsWith('-auth-token') && k.startsWith('sb-'));
    if (!sbKey) return;
    try {
      const userId = JSON.parse(localStorage.getItem(sbKey) || '{}')?.user?.id;
      if (!userId) return;
      fetch(`/api/subscription/${userId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.isPro) setIsPro(true); })
        .catch(() => {});
    } catch {}
  }, []);

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) explode(e.clientX, e.clientY, '#22D3EE');
    setIsPackaging(true);
    try { await downloadMissionPackage(data, doc?.title || missionMeta?.name || 'Mission', isPro); }
    catch (err: any) { alert(`Export error: ${err.message}`); }
    finally { setIsPackaging(false); }
  };

  const wrapMath = (content: string) => {
    if (!content) return "";
    let trimmed = content.trim();
    // Remove any existing delimiters to ensure consistent clean wrapping
    // This prevents $$$$ or other invalid combinations
    const clean = trimmed
      .replace(/^(\$\$?|\\\[|\\\()/, '')
      .replace(/(\$\$?|\\\]|\\\))$/, '')
      .trim();
    
    return `$$${clean}$$`;
  };

  return (
    <div className={cn('flex flex-col gap-5 pb-16', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>

      {/* Success header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-[#22D3EE]/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-black tracking-wide text-base">{isAr ? '✅ تمت المهمة' : 'Mission Accomplished'}</h3>
            <p className="text-[10px] text-emerald-400/60 font-mono uppercase tracking-wider">
              {data.assignment_type?.toUpperCase()} · {missionMeta?.university} · {missionMeta?.course}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {slides.length > 0 && (
            <button onClick={() => setShowSlideViewer(true)} className="flex items-center gap-2 px-3 py-2 bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#A855F7] text-xs font-bold rounded-xl hover:bg-[#A855F7]/30 transition-all">
              <MonitorPlay className="w-3.5 h-3.5" /> {isAr ? 'عرض' : 'Present'}
            </button>
          )}
          <button onClick={(e) => handleDownload(e)} disabled={isPackaging}
            className="flex items-center gap-2 px-3 py-2 bg-[#22D3EE] text-black text-xs font-black rounded-xl hover:bg-white transition-all disabled:opacity-50">
            {isPackaging ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isAr ? 'تحميل الكل' : 'Download All'}
          </button>
        </div>
      </div>

      {/* Summary */}
      {data.solution_text && (
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-xl px-5 py-4">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{isAr ? 'الملخص' : 'Executive Summary'}</p>
          <MiMarkdown content={data.solution_text} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <TiltCard key={tab.id} intensity={5}>
            <button
              onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                activeTab === tab.id ? 'bg-[#22D3EE] text-black border-[#22D3EE]' : 'bg-[#0A0B0E] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white')}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'slides' && slides.length > 0 && <span className="bg-black/20 px-1 rounded text-[9px]">{slides.length}</span>}
            </button>
          </TiltCard>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>

          {/* SOLUTION */}
          {activeTab === 'solution' && doc && (
            <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-bold text-base">{doc.title}</h2>
                <button 
                  onClick={() => {
                    const fullText = doc.blocks?.map((b: any) => b.content).join('\n\n') || '';
                    handleCopy(fullText, 999);
                  }} 
                  className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors"
                >
                  {copiedIdx === 999 ? (
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAr ? 'تم' : 'Copied'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ الكل' : 'Copy All'}</span>
                    </div>
                  )}
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {doc.blocks?.map((block: any, i: number) => (
                  <div key={i}>
                    {block.type === 'heading' && <h3 className="text-white font-bold text-lg mt-5 first:mt-0 border-s-4 border-[#22D3EE] ps-4">{block.content}</h3>}
                    {block.type === 'paragraph' && <MiMarkdown content={block.content} />}
                    {block.type === 'list' && (
                      <div className="space-y-1.5 pl-4">
                        <MiMarkdown content={(Array.isArray(block.content) ? block.content.map((it: string) => `- ${it}`).join('\n') : block.content)} />
                      </div>
                    )}
                    {block.type === 'math' && (
                      <div className="bg-[#050608] border border-[#22D3EE]/20 rounded-xl p-5 text-[#22D3EE] text-base overflow-x-auto">
                        <KatexBlock math={block.content} />
                        {block.solution_steps?.map((s: string, j: number) => (
                          <div key={j} className="text-gray-400 text-xs mt-4 border-t border-gray-900 pt-3 italic flex gap-3">
                            <span className="font-bold text-[#22D3EE] shrink-0">Step {j + 1}:</span>
                            <MiMarkdown content={s} className="inline-block" />
                          </div>
                        ))}
                      </div>
                    )}
                    {block.type === 'code' && (
                      <div className="bg-[#050608] border border-gray-800 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                          <span className="text-gray-600 text-xs font-mono">code</span>
                          <button onClick={() => handleCopy(block.content, i)} className="text-gray-500 hover:text-white text-xs">
                            {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="p-4 text-sm text-gray-300 overflow-x-auto"><code>{block.content}</code></pre>
                      </div>
                    )}
                    {block.type === 'table' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
                          <tbody>{String(block.content).split('\n').filter(Boolean).map((row: string, j: number) => (
                            <tr key={j} className={j % 2 === 0 ? 'bg-[#050608]' : ''}>
                              {row.split('|').filter(Boolean).map((cell: string, k: number) => (
                                <td key={k} className={cn('px-3 py-2 text-gray-300 border-b border-gray-900', j === 0 && 'font-bold text-white')}>{cell.trim()}</td>
                              ))}
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                    {block.type === 'svg' && (
                      <div className="my-4 relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const blob = new Blob([block.content], { type: 'image/svg+xml' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'diagram.svg';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="bg-[#22D3EE] text-black text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white transition-colors shadow-lg"
                          >
                            <Download className="w-3.5 h-3.5" /> Download SVG
                          </button>
                        </div>
                        <div className="bg-[#050608] border border-[#22D3EE]/20 rounded-xl overflow-hidden p-6 flex justify-center items-center overflow-x-auto transition-transform hover:border-[#22D3EE] duration-300 relative"
                             dangerouslySetInnerHTML={{ __html: block.content.includes('xmlns') ? block.content : block.content.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"') }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDES */}
          {activeTab === 'slides' && slides.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">{slides.length} {isAr ? 'شريحة مع صور Mi' : 'slides with Mi imagery'}</p>
                <button onClick={() => setShowSlideViewer(true)} className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] text-white text-xs font-bold rounded-xl hover:bg-[#A855F7]/80 transition-all">
                  <MonitorPlay className="w-4 h-4" /> {isAr ? 'وضع العرض الكامل' : 'Full Presentation Mode'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slides.map((slide: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setShowSlideViewer(true)} className="group bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden cursor-pointer hover:border-[#A855F7]/40 transition-all">
                    {slide.image_url
                      ? <div className="h-28 overflow-hidden relative"><img src={slide.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><span className="absolute top-2 start-2 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">{String(i + 1).padStart(2, '0')}</span></div>
                      : <div className="h-28 bg-gradient-to-br from-[#A855F7]/10 to-[#22D3EE]/5 flex items-center justify-center"><span className="text-4xl font-black text-white/10">{String(i + 1).padStart(2, '0')}</span></div>}
                    <div className="p-3">
                      <p className="text-white text-xs font-bold line-clamp-2 leading-snug">{slide.power_heading}</p>
                      {slide.narrative && <p className="text-gray-500 text-[11px] mt-1 line-clamp-2">{slide.narrative}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* CODE */}
          {activeTab === 'code' && codeSnippets.length > 0 && (
            <div className="space-y-4">
              {codeSnippets.map((s: any, i: number) => (
                <div key={i} className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-[10px] font-mono uppercase rounded">{s.language}</span>
                      <span className="text-gray-400 text-sm font-mono">{s.filename || `file_${i + 1}`}</span>
                    </div>
                    <button onClick={() => handleCopy(s.code, i)} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors">
                      {copiedIdx === i ? <><Check className="w-3.5 h-3.5 text-emerald-400" />{isAr ? 'تم' : 'Copied'}</> : <><Copy className="w-3.5 h-3.5" />{isAr ? 'نسخ' : 'Copy'}</>}
                    </button>
                  </div>
                  {s.explanation && <div className="px-5 py-2.5 bg-[#050608] border-b border-gray-900"><p className="text-gray-400 text-xs leading-relaxed">{s.explanation}</p></div>}
                  <pre className="p-5 overflow-x-auto max-h-96 text-sm text-gray-300 leading-relaxed"><code>{s.code}</code></pre>
                </div>
              ))}
            </div>
          )}

          {/* DATA */}
          {activeTab === 'data' && dataSheet && (
            <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-white font-bold">{dataSheet.sheet_name || (isAr ? 'جدول البيانات' : 'Data Sheet')}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{(dataSheet.rows || []).length} {isAr ? 'صف' : 'rows'} · {(dataSheet.headers || []).length} {isAr ? 'عمود' : 'columns'}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#0A0B0E] border-b border-gray-800">
                    <tr>{(dataSheet.headers || []).map((h: string, i: number) => <th key={i} className="px-4 py-3 text-start text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(dataSheet.rows || []).map((row: string[], i: number) => (
                      <tr key={i} className={cn('border-b border-gray-900', i % 2 === 0 ? 'bg-[#050608]/50' : '')}>
                        {row.map((cell: string, j: number) => <td key={j} className="px-4 py-2.5 text-gray-300 text-xs whitespace-nowrap">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACADEMY */}
          {activeTab === 'academy' && steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center"><Brain className="w-4 h-4 text-[#A855F7]" /></div>
                <div>
                  <p className="text-white font-bold text-sm">{isAr ? 'شرح Mi-Academy' : 'Mi-Academy Breakdown'}</p>
                  <p className="text-gray-500 text-xs">{isAr ? 'افهم المنطق ورا كل خطوة في الحل' : 'Understand the reasoning behind every step'}</p>
                </div>
              </div>
              {steps.map((step: any, i: number) => (
                <div key={i} className="bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedStep(expandedStep === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] font-bold text-[10px] flex items-center justify-center">{i + 1}</span>
                      <span className="text-white font-medium text-sm text-start">{step.title}</span>
                    </div>
                    {expandedStep === i ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className={cn('w-4 h-4 text-gray-500 shrink-0', isAr && 'rotate-180')} />}
                  </button>
                  <AnimatePresence>
                    {expandedStep === i && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 pt-3 border-t border-gray-900">
                          <MiMarkdown content={step.content} className="text-sm" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* IMAGE LAB */}
          {activeTab === 'imagegen' && <ImageGenerator embedded />}

        </motion.div>
      </AnimatePresence>

      {/* Slide viewer */}
      <AnimatePresence>
        {showSlideViewer && slides.length > 0 && (
          <SlideViewer slides={slides} title={doc?.title || missionMeta?.name} onClose={() => setShowSlideViewer(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
