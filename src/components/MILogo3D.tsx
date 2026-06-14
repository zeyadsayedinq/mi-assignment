import React, { useRef, useEffect } from 'react';

export function MILogo3D({
  size = 80,
  autoSpin = false,
  onClick,
}: {
  size?: number;
  autoSpin?: boolean;
  onClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const stateRef = useRef({
    hover: false,
    glitchT: 0,
    glitching: false,
    idleT: 0,
    autoGlitchNext: 220 + Math.random() * 180,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const s = stateRef.current;

    function triggerGlitch() {
      s.glitching = true;
      s.glitchT = 0;
    }

    // pointer events
    const onEnter = () => { s.hover = true; triggerGlitch(); };
    const onLeave = () => { s.hover = false; };
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);

    // autoSpin = periodic auto-glitch (replaces old rotation)
    // we repurpose the prop to mean "glitch on a timer automatically"

    function drawM(
      offX = 0,
      strokeCol = '#22D3EE',
      dotCol = '#A855F7',
      alpha = 1,
      lineW?: number
    ) {
      const cx = size / 2 + offX;
      const cy = size / 2;
      const sc = size * 0.44;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = lineW ?? size * 0.094;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(cx - sc * 0.46, cy + sc * 0.38);
      ctx.lineTo(cx - sc * 0.46, cy - sc * 0.36);
      ctx.lineTo(cx,              cy + sc * 0.04);
      ctx.lineTo(cx + sc * 0.46, cy - sc * 0.36);
      ctx.lineTo(cx + sc * 0.46, cy + sc * 0.38);
      ctx.stroke();

      // i-dot
      ctx.beginPath();
      ctx.arc(cx + sc * 0.46, cy - sc * 0.62, size * 0.072, 0, Math.PI * 2);
      ctx.fillStyle = dotCol;
      ctx.fill();

      ctx.restore();
    }

    function drawBg() {
      const r = size * 0.22;
      const pad = size * 0.04;
      ctx.fillStyle = '#050d14';
      ctx.beginPath();
      ctx.roundRect(pad, pad, size - pad * 2, size - pad * 2, r);
      ctx.fill();
      // border
      ctx.strokeStyle = 'rgba(14,58,69,0.85)';
      ctx.lineWidth = size * 0.013;
      ctx.beginPath();
      ctx.roundRect(pad, pad, size - pad * 2, size - pad * 2, r);
      ctx.stroke();
    }

    function frame() {
      ctx.clearRect(0, 0, size, size);
      drawBg();

      s.idleT++;

      // auto-glitch timer (used when autoSpin=true OR just periodically)
      if (autoSpin || true) {
        if (s.idleT >= s.autoGlitchNext && !s.glitching) {
          triggerGlitch();
          s.idleT = 0;
          s.autoGlitchNext = 280 + Math.random() * 220;
        }
      }

      if (s.glitching) {
        s.glitchT++;
        const progress = s.glitchT / 28; // 0→1 over 28 frames

        if (progress <= 1) {
          // phase 1: chromatic split + scan line sweep
          const splitAmt = Math.sin(progress * Math.PI) * size * 0.055;

          // teal ghost left
          drawM(-splitAmt * 0.7, '#22D3EE', 'transparent', 0.75);
          // purple ghost right
          drawM(splitAmt * 0.5, '#A855F7', 'transparent', 0.45);

          // scan line
          const scanY = progress * size;
          ctx.save();
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = '#22D3EE';
          const pad = size * 0.04;
          const r = size * 0.22;
          ctx.beginPath();
          ctx.roundRect(pad, Math.max(pad, scanY - size * 0.1), size - pad * 2, size * 0.2, r);
          ctx.fill();
          ctx.restore();

          // horizontal noise slices (random)
          if (s.glitchT % 3 === 0) {
            const sliceY = pad + Math.random() * (size - pad * 2);
            const sliceH = size * 0.025;
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#A855F7';
            ctx.fillRect(pad, sliceY, (size - pad * 2) * (0.3 + Math.random() * 0.5), sliceH);
            ctx.restore();
          }

          // clean M on top with slight alpha
          drawM(0, '#22D3EE', '#A855F7', 0.6);

        } else {
          // phase 2: snap back clean
          drawM(0, '#22D3EE', '#A855F7', 1);
          s.glitching = false;
        }
      } else {
        // idle — perfectly static
        drawM(0, '#22D3EE', '#A855F7', 1);

        // very subtle idle indicator: dot breathes opacity slightly
        const breath = 0.82 + Math.sin(s.idleT * 0.035) * 0.18;
        const cx = size / 2;
        const cy = size / 2;
        const sc = size * 0.44;
        const dotX = cx + sc * 0.46;
        const dotY = cy - sc * 0.62;
        const dotR = size * 0.072;
        // glow ring — only the ring breathes, not the dot itself
        ctx.save();
        ctx.globalAlpha = breath * 0.22;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR * 1.9, 0, Math.PI * 2);
        ctx.fillStyle = '#A855F7';
        ctx.fill();
        ctx.restore();
      }

      raf.current = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      cancelAnimationFrame(raf.current);
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, [size, autoSpin]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}
      onClick={onClick}
      className="select-none"
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
      />
    </div>
  );
}

// TiltCard — unchanged, kept here so imports don't break
export function TiltCard({
  children,
  className = '',
  intensity = 15,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale(1.02)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transition: 'transform 0.15s ease-out', willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
