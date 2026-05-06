import React, { useRef, useEffect, useCallback } from 'react';

// ─── Shared 3D Canvas Utilities ────────────────────────────────────────────
export interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  size: number; opacity: number; color: string; life: number;
}

// Floating orbs background — used on HQ, Terminal idle state
export function FloatingOrbs({ count = 6, colors = ['#22D3EE', '#A855F7', '#10B981', '#F59E0B'] }: { count?: number; colors?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const orbsRef = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; r: number; color: string; phase: number }>>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Init orbs
    orbsRef.current = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 80 + Math.random() * 180,
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
    }));

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    };
    canvas.addEventListener('mousemove', onMouse);

    let t = 0;
    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      t += 0.005;

      orbsRef.current.forEach(orb => {
        // Mouse parallax
        const parallax = orb.z * 30;
        const px = orb.x + (mouseRef.current.x - 0.5) * parallax;
        const py = orb.y + (mouseRef.current.y - 0.5) * parallax;

        // Breathing pulse
        const pulse = 1 + 0.15 * Math.sin(t + orb.phase);
        const radius = orb.r * pulse;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0, orb.color + '22');
        grad.addColorStop(0.5, orb.color + '11');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Drift
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;
      });

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
    };
  }, [count]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }} />;
}

// Particle field — floats upward like a neural network firing
export function ParticleField({ density = 60 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#22D3EE', '#A855F7', '#10B981', '#ffffff'];
    const spawn = (): Particle => ({
      x: Math.random() * canvas.offsetWidth,
      y: canvas.offsetHeight + 10,
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.3 + Math.random() * 0.8),
      vz: (Math.random() - 0.5) * 0.2,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
    });

    particlesRef.current = Array.from({ length: density }, () => {
      const p = spawn();
      p.y = Math.random() * canvas.offsetHeight;
      return p;
    });

    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) particlesRef.current[i] = spawn();

        ctx.globalAlpha = p.opacity * p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, [density]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }} />;
}

// Neural network graph — animated connections between nodes
export function NeuralNet({ nodeCount = 12 }: { nodeCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('mousemove', onMouse);

    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 2 + Math.random() * 2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      t += 0.01;

      // Mouse node
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      // Draw connections
      const allNodes = [...nodes, { x: mx, y: my, r: 4, vx: 0, vy: 0, pulse: 0 }];
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const dx = allNodes[i].x - allNodes[j].x;
          const dy = allNodes[i].y - allNodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 160;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.4;
            const isMouseEdge = i === allNodes.length - 1 || j === allNodes.length - 1;
            ctx.strokeStyle = isMouseEdge ? `rgba(34,211,238,${alpha})` : `rgba(168,85,247,${alpha * 0.6})`;
            ctx.lineWidth = isMouseEdge ? 1.5 : 0.8;
            ctx.beginPath();
            ctx.moveTo(allNodes[i].x, allNodes[i].y);
            ctx.lineTo(allNodes[j].x, allNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const pulse = 1 + 0.3 * Math.sin(t + n.pulse);
        ctx.fillStyle = `rgba(168,85,247,0.8)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mouse node
      if (mx > 0 || my > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 20);
        grad.addColorStop(0, 'rgba(34,211,238,0.8)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); canvas.removeEventListener('mousemove', onMouse); };
  }, [nodeCount]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'crosshair' }} />;
}
