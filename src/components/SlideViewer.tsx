import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, MessageSquare, Image, Maximize2, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface Slide {
  power_heading: string;
  content_bullets: string[];
  narrative?: string;
  speaker_notes?: string;
  image_prompt?: string;
  image_url?: string;
  image_layout?: 'left' | 'right' | 'background' | 'full';
}

interface SlideViewerProps {
  slides: Slide[];
  title?: string;
  onClose: () => void;
}

export function SlideViewer({ slides, title, onClose }: SlideViewerProps) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  const slide = slides[current];
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

  const prev = useCallback(() => { if (!isFirst) setCurrent(c => c - 1); }, [isFirst]);
  const next = useCallback(() => { if (!isLast) setCurrent(c => c + 1); }, [isLast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') onClose();
      if (e.key === 'n') setShowNotes(s => !s);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  const layout = slide?.image_layout || 'right';
  const hasImage = !!(slide?.image_url);

  const downloadSlide = () => {
    if (!slide?.image_url) return;
    const a = document.createElement('a');
    a.href = slide.image_url;
    a.download = `slide_${current + 1}.jpg`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#020617] flex flex-col"
    >
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#22D3EE] font-mono text-xs uppercase tracking-widest">{title || 'Slide Deck'}</span>
          <span className="text-gray-600 text-xs font-mono">{current + 1} / {slides.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasImage && (
            <button onClick={downloadSlide} className="p-2 text-gray-500 hover:text-[#22D3EE] transition-colors rounded-lg hover:bg-white/5">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowNotes(s => !s)} className={cn("p-2 rounded-lg transition-colors text-xs font-mono flex items-center gap-1.5", showNotes ? "bg-[#A855F7]/20 text-[#A855F7]" : "text-gray-500 hover:text-white hover:bg-white/5")}>
            <MessageSquare className="w-4 h-4" /> Notes
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-900 shrink-0">
        <motion.div
          className="h-full bg-[#22D3EE]"
          animate={{ width: `${((current + 1) / slides.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>

      {/* Main slide area */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            {/* Background image for 'background' or 'full' layout */}
            {hasImage && (layout === 'background' || layout === 'full') && (
              <div className="absolute inset-0 z-0">
                <img
                  src={slide.image_url}
                  alt=""
                  className="w-full h-full object-cover opacity-20"
                  onLoad={() => setImgLoaded(p => ({ ...p, [current]: true }))}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent" />
              </div>
            )}

            {/* Left image layout */}
            {hasImage && layout === 'left' && (
              <div className="w-2/5 relative shrink-0 overflow-hidden border-r border-white/5">
                <img
                  src={slide.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onLoad={() => setImgLoaded(p => ({ ...p, [current]: true }))}
                />
                {!imgLoaded[current] && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}

            {/* Content area */}
            <div className={cn(
              "flex flex-col justify-center p-10 lg:p-16 relative z-10",
              hasImage && layout === 'left' ? "flex-1" :
              hasImage && layout === 'right' ? "w-3/5" : "flex-1"
            )}>
              {/* Slide number chip */}
              <div className="text-[10px] font-mono text-[#22D3EE]/40 uppercase tracking-[0.4em] mb-6">
                SLIDE {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </div>

              <h1 className="text-4xl lg:text-6xl font-black text-white leading-none tracking-tighter mb-8 uppercase">
                {slide?.power_heading}
              </h1>

              {slide?.narrative && (
                <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-2xl">
                  {slide.narrative}
                </p>
              )}

              {slide?.content_bullets && slide.content_bullets.length > 0 && (
                <ul className="space-y-3">
                  {slide.content_bullets.map((bullet, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 text-gray-300"
                    >
                      <span className="w-5 h-5 rounded bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-base leading-relaxed">{bullet}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right image layout */}
            {hasImage && layout === 'right' && (
              <div className="w-2/5 relative shrink-0 overflow-hidden border-l border-white/5">
                <img
                  src={slide.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onLoad={() => setImgLoaded(p => ({ ...p, [current]: true }))}
                />
                {!imgLoaded[current] && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Speaker notes panel */}
      <AnimatePresence>
        {showNotes && slide?.speaker_notes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#A855F7]/20 bg-[#A855F7]/5 overflow-hidden shrink-0"
          >
            <div className="px-6 py-4 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-mono text-[#A855F7]/60 uppercase tracking-widest mb-2">Speaker Notes</p>
              <p className="text-gray-300 text-sm leading-relaxed">{slide.speaker_notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <div className="h-20 border-t border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#0A0B0E]">
        <button
          onClick={prev}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-mono"
        >
          <ChevronLeft className="w-4 h-4" /> PREV
        </button>

        {/* Thumbnail strip */}
        <div className="flex gap-1.5 overflow-x-auto max-w-xs lg:max-w-xl px-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full shrink-0 transition-all",
                i === current ? "bg-[#22D3EE] w-6" : "bg-gray-700 hover:bg-gray-500"
              )}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={isLast}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22D3EE] text-black font-bold hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-mono"
        >
          NEXT <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 text-[10px] text-gray-700 font-mono pointer-events-none">
        <span>← → Navigate</span>
        <span>N Notes</span>
        <span>ESC Close</span>
      </div>
    </motion.div>
  );
}
