import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, MessageSquare, Lightbulb, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface Slide {
  slide_number?: number;
  slide_type?: string;
  power_heading: string;
  content_bullets: string[];
  narrative?: string;
  speaker_notes?: string;
  image_prompt?: string;
  image_url?: string;
  image_layout?: 'left' | 'right' | 'background' | 'full';
  visual_directive?: string;
}

interface SlideViewerProps {
  slides: Slide[];
  title?: string;
  onClose: () => void;
}

const SLIDE_TYPE_COLORS: Record<string, string> = {
  hook: '#22D3EE',
  problem: '#EF4444',
  context: '#F59E0B',
  analysis: '#A855F7',
  solution: '#10B981',
  recommendation: '#3B82F6',
  conclusion: '#22D3EE',
};

export function SlideViewer({ slides, title, onClose }: SlideViewerProps) {
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<'present' | 'notes' | 'directive'>('present');

  const slide = slides[current];
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;
  const accentColor = SLIDE_TYPE_COLORS[slide?.slide_type || 'hook'] || '#22D3EE';

  const prev = useCallback(() => { if (!isFirst) setCurrent(c => c - 1); }, [isFirst]);
  const next = useCallback(() => { if (!isLast) setCurrent(c => c + 1); }, [isLast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') onClose();
      if (e.key === 'n') setMode(m => m === 'notes' ? 'present' : 'notes');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  const layout = slide?.image_layout || 'right';
  const hasImage = !!(slide?.image_url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#050810] flex flex-col"
    >
      {/* Top bar */}
      <div className="h-11 flex items-center justify-between px-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
          <span className="text-white/60 font-mono text-xs uppercase tracking-widest truncate max-w-xs">
            {title || 'Presentation'}
          </span>
          {slide?.slide_type && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}15` }}>
              {slide.slide_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mode toggles */}
          <button onClick={() => setMode(m => m === 'notes' ? 'present' : 'notes')}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
              mode === 'notes' ? "bg-[#A855F7]/20 text-[#A855F7]" : "text-white/40 hover:text-white hover:bg-white/5")}>
            <MessageSquare className="w-3.5 h-3.5" />
            Notes
          </button>
          {slide?.visual_directive && (
            <button onClick={() => setMode(m => m === 'directive' ? 'present' : 'directive')}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                mode === 'directive' ? "bg-[#22D3EE]/20 text-[#22D3EE]" : "text-white/40 hover:text-white hover:bg-white/5")}>
              <Lightbulb className="w-3.5 h-3.5" />
              Visual
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-px bg-white/[0.04] shrink-0">
        <motion.div className="h-full" style={{ background: accentColor }}
          animate={{ width: `${((current + 1) / slides.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
      </div>

      {/* Slide content */}
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex overflow-hidden"
          >
            {/* Background image */}
            {hasImage && (layout === 'background' || layout === 'full') && (
              <div className="absolute inset-0 z-0">
                <img src={slide.image_url} alt="" className="w-full h-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050810] via-[#050810]/85 to-[#050810]/40" />
              </div>
            )}

            {/* Left image */}
            {hasImage && layout === 'left' && (
              <div className="w-[42%] relative shrink-0 overflow-hidden">
                <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050810]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050810]/60 to-transparent" />
              </div>
            )}

            {/* Main text area */}
            <div className={cn("flex-1 flex flex-col justify-center px-12 py-10 relative z-10 overflow-y-auto",
              hasImage && layout === 'left' && "pl-8",
              hasImage && layout === 'right' && "pr-8"
            )}>

              {/* Slide number */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-[10px] tracking-widest" style={{ color: accentColor }}>
                  {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
                <div className="flex-1 h-px" style={{ background: `${accentColor}30` }} />
              </div>

              {/* Heading */}
              <h1 className="text-3xl font-black text-white leading-tight mb-8 tracking-tight">
                {slide.power_heading}
              </h1>

              {/* Content bullets */}
              {mode === 'present' && (
                <ul className="space-y-3">
                  {slide.content_bullets?.map((bullet, i) => (
                    <motion.li key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 text-white/80 text-sm leading-relaxed"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />
                      {bullet}
                    </motion.li>
                  ))}
                </ul>
              )}

              {/* Speaker notes */}
              {mode === 'notes' && slide.speaker_notes && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3.5 h-3.5 text-[#A855F7]" />
                    <span className="text-[#A855F7] text-xs font-bold uppercase tracking-widest">Speaker Notes</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{slide.speaker_notes}</p>
                </motion.div>
              )}

              {/* Visual directive */}
              {mode === 'directive' && slide.visual_directive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest">Visual to Insert</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{slide.visual_directive}</p>
                  {slide.image_prompt && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-white/30 text-xs italic">AI image prompt: {slide.image_prompt}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right image */}
            {hasImage && layout === 'right' && (
              <div className="w-[38%] relative shrink-0 overflow-hidden">
                <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050810]" />
              </div>
            )}

            {/* No image placeholder with visual directive hint */}
            {!hasImage && slide?.visual_directive && mode === 'present' && (
              <div className="w-[32%] shrink-0 flex items-center justify-center border-l border-white/[0.04] relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${accentColor}08 0%, transparent 70%)` }} />
                <div className="text-center px-6">
                  <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: accentColor }} />
                  <p className="text-white/20 text-xs leading-relaxed">{slide.visual_directive}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="h-14 flex items-center justify-between px-6 border-t border-white/[0.06] shrink-0">
        {/* Slide thumbnails strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs scrollbar-none">
          {slides.map((s, i) => {
            const c = SLIDE_TYPE_COLORS[s.slide_type || ''] || '#22D3EE';
            return (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn("h-1.5 rounded-full transition-all shrink-0",
                  i === current ? "w-6" : "w-1.5 opacity-30 hover:opacity-60")}
                style={{ background: i === current ? c : '#fff' }}
              />
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={prev} disabled={isFirst}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-20 transition-all text-xs font-medium">
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <button onClick={next} disabled={isLast}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-black text-xs font-bold transition-all disabled:opacity-20"
            style={{ background: isLast ? '#ffffff40' : accentColor }}>
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
