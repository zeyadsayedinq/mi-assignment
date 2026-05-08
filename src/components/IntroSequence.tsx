import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { MILogo3D } from './MILogo3D';

// ─── Logo-only intro (2 steps, done in ~3s) ─────────────────────────────────
export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0); // 0=cube, 1=title flash, done
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSkip(true), 600);
    const t2 = setTimeout(() => setStep(1), 2000);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Subtle radial glow behind cube */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 70%)' }} />

      {/* Skip */}
      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onComplete}
            className="absolute bottom-10 right-10 flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#22D3EE]/40 hover:text-[#22D3EE] transition-colors"
          >
            SKIP <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Step 0 — spinning cube */}
        {step === 0 && (
          <motion.div
            key="cube"
            initial={{ opacity: 0, scale: 0.2, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 1.6, filter: 'blur(20px)' }}
            transition={{ duration: 0.9, type: 'spring', bounce: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            <MILogo3D size={120} autoSpin />
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-[#22D3EE]/50 font-mono text-[10px] tracking-[0.4em] uppercase"
            >
              Initializing...
            </motion.p>
          </motion.div>
        )}

        {/* Step 1 — Mi-Assignment flash title, then fades out */}
        {step === 1 && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(16px)' }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-5xl lg:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#22D3EE] via-white to-[#A855F7] uppercase text-center">
              Mi-Assignment
            </span>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent" />
            <span className="text-[#22D3EE]/60 font-mono text-[10px] tracking-[0.4em] uppercase">Assignment Intelligence</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
