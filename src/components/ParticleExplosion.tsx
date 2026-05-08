import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface ExplosionHandle {
  explode: (x: number, y: number, color?: string) => void;
}

interface Spark {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string;
}

// Global canvas overlay that handles all particle explosions site-wide
export const ParticleExplosion = forwardRef<ExplosionHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const frameRef = useRef(0);
  const running = useRef(false);

  const startLoop = () => {
    if (running.current) return;
    running.current = true;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter(s => s.life > 0);

      sparksRef.current.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12; // gravity
        s.vx *= 0.98;
        s.life--;

        const alpha = s.life / s.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (sparksRef.current.length > 0) {
        frameRef.current = requestAnimationFrame(loop);
      } else {
        running.current = false;
      }
    };
    loop();
  };

  useImperativeHandle(ref, () => ({
    explode(x: number, y: number, color = '#22D3EE') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const COLORS = [color, '#A855F7', '#ffffff', '#10B981'];
      const count = 40 + Math.floor(Math.random() * 20);

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 6;
        sparksRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 40 + Math.floor(Math.random() * 30),
          maxLife: 70,
          size: 2 + Math.random() * 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      startLoop();
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
});

ParticleExplosion.displayName = 'ParticleExplosion';
