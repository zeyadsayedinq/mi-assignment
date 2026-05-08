import React, { useRef, useEffect } from 'react';

// ─── The iconic MI cube that rotates in 3D on hover ────────────────────────
export function MILogo3D({ size = 80, autoSpin = false, onClick }: { size?: number; autoSpin?: boolean; onClick?: () => void }) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: -20, y: 30 });
  const velRef = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);
  const frameRef = useRef(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = cubeRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (!isHovering.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      velRef.current.x += dy * 0.5;
      velRef.current.y += dx * 0.5;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onEnter = (e: MouseEvent) => {
      isHovering.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => { isHovering.current = false; };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove);

    const animate = () => {
      if (autoSpin || !isHovering.current) {
        velRef.current.y += 0.3;
      }
      rotRef.current.x += velRef.current.x * 0.08;
      rotRef.current.y += velRef.current.y * 0.08;
      velRef.current.x *= 0.92;
      velRef.current.y *= 0.92;
      el.style.transform = `rotateX(${rotRef.current.x}deg) rotateY(${rotRef.current.y}deg)`;
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, [autoSpin]);

  const s = size;
  const half = s / 2;
  const face = {
    position: 'absolute' as const,
    width: s, height: s,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(34,211,238,0.4)',
    backfaceVisibility: 'hidden' as const,
    fontSize: s * 0.35,
    fontWeight: 900,
    letterSpacing: '-0.05em',
  };

  const faces = [
    { label: 'Mi', transform: `translateZ(${half}px)`, bg: 'rgba(34,211,238,0.15)', color: '#22D3EE' },
    { label: 'Mi', transform: `rotateY(180deg) translateZ(${half}px)`, bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
    { label: 'Mi', transform: `rotateY(90deg) translateZ(${half}px)`, bg: 'rgba(34,211,238,0.08)', color: 'rgba(34,211,238,0.6)' },
    { label: 'Mi', transform: `rotateY(-90deg) translateZ(${half}px)`, bg: 'rgba(168,85,247,0.08)', color: 'rgba(168,85,247,0.6)' },
    { label: '✦', transform: `rotateX(90deg) translateZ(${half}px)`, bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' },
    { label: '✦', transform: `rotateX(-90deg) translateZ(${half}px)`, bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' },
  ];

  return (
    <div
      style={{ width: s, height: s, perspective: s * 4, cursor: onClick ? 'pointer' : 'grab' }}
      onClick={onClick}
      className="select-none shrink-0"
    >
      <div ref={cubeRef} style={{ width: s, height: s, transformStyle: 'preserve-3d', position: 'relative' }}>
        {faces.map((f, i) => (
          <div key={i} style={{ ...face, transform: f.transform, background: f.bg, color: f.color }}>
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tilt card — wraps any children with 3D mouse-follow tilt ──────────────
export function TiltCard({ children, className = '', intensity = 15 }: {
  children: React.ReactNode; className?: string; intensity?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(800px) rotateY(${dx * intensity}deg) rotateX(${-dy * intensity}deg) scale(1.03)`;
    if (glowRef.current) {
      const gx = ((e.clientX - rect.left) / rect.width) * 100;
      const gy = ((e.clientY - rect.top) / rect.height) * 100;
      glowRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(34,211,238,0.12) 0%, transparent 60%)`;
    }
  };

  const onMouseLeave = () => {
    const card = cardRef.current;
    if (card) card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
    if (glowRef.current) glowRef.current.style.background = 'transparent';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      <div ref={glowRef} className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 transition-all duration-200" />
      {children}
    </div>
  );
}

// ─── Magnetic button — snaps toward cursor ─────────────────────────────────
export function MagneticButton({ children, className = '', onClick }: {
  children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.35;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.35;
    btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
  };

  const onMouseLeave = () => {
    if (btnRef.current) btnRef.current.style.transform = 'translate(0, 0) scale(1)';
  };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', willChange: 'transform' }}
    >
      {children}
    </button>
  );
}
