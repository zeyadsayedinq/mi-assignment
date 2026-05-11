import React, { useRef, useEffect } from 'react';

// ─── Mi Minimal 3D Logo — floating geometric prism ─────────────────────────
export function MILogo3D({ size = 80, autoSpin = false, onClick }: {
  size?: number; autoSpin?: boolean; onClick?: () => void;
}) {
  const groupRef = useRef<SVGGElement>(null);
  const rotRef = useRef({ y: 20 });
  const velRef = useRef({ y: 0 });
  const isHovering = useRef(false);
  const frameRef = useRef(0);
  const lastMouseRef = useRef({ x: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      if (!isHovering.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      velRef.current.y += dx * 0.8;
      lastMouseRef.current = { x: e.clientX };
    };
    const onEnter = (e: MouseEvent) => { isHovering.current = true; lastMouseRef.current = { x: e.clientX }; };
    const onLeave = () => { isHovering.current = false; };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove);

    const animate = () => {
      if (autoSpin || !isHovering.current) velRef.current.y += 0.4;
      rotRef.current.y += velRef.current.y * 0.06;
      velRef.current.y *= 0.94;

      const ry = rotRef.current.y * Math.PI / 180;
      const cos = Math.cos(ry);
      const sin = Math.sin(ry);

      // Isometric-ish 3D prism — 3 visible faces
      const g = groupRef.current;
      if (!g) { frameRef.current = requestAnimationFrame(animate); return; }

      const s = size;
      const cx = s / 2;
      const cy = s / 2;
      const W = s * 0.38;  // half-width of prism
      const H = s * 0.42;  // half-height
      const D = s * 0.18;  // depth offset (isometric)

      // 8 corners of the box in 3D (simple orthographic projection)
      // Front face: z=+D, Back face: z=-D
      const proj = (x: number, y: number, z: number) => ({
        x: cx + x * cos - z * sin,
        y: cy + y + (x * sin + z * cos) * 0.3,
      });

      // Define vertices
      const tfl = proj(-W, -H, D);  // top-front-left
      const tfr = proj(W, -H, D);   // top-front-right
      const bfl = proj(-W, H, D);   // bottom-front-left
      const bfr = proj(W, H, D);    // bottom-front-right
      const tbl = proj(-W, -H, -D); // top-back-left
      const tbr = proj(W, -H, -D);  // top-back-right
      const bbl = proj(-W, H, -D);  // bottom-back-left
      const bbr = proj(W, H, -D);   // bottom-back-right

      const pt = (p: {x:number,y:number}) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

      // Determine which faces are visible
      const frontVisible = cos > 0;
      const rightVisible = sin < 0;
      const topVisible = true; // always show top

      // Build face polygons
      const faces = g.querySelectorAll('[data-face]');
      const faceData: Record<string, string> = {
        front: `${pt(tfl)} ${pt(tfr)} ${pt(bfr)} ${pt(bfl)}`,
        back:  `${pt(tbl)} ${pt(tbr)} ${pt(bbr)} ${pt(bbl)}`,
        right: `${pt(tfr)} ${pt(tbr)} ${pt(bbr)} ${pt(bfr)}`,
        left:  `${pt(tfl)} ${pt(tbl)} ${pt(bbl)} ${pt(bfl)}`,
        top:   `${pt(tfl)} ${pt(tfr)} ${pt(tbr)} ${pt(tbl)}`,
        bot:   `${pt(bfl)} ${pt(bfr)} ${pt(bbr)} ${pt(bbl)}`,
      };

      // Visibility & opacity per face
      const vis: Record<string, number> = {
        front: frontVisible ? 1 : 0,
        back:  frontVisible ? 0 : 0.6,
        right: rightVisible ? 1 : 0,
        left:  rightVisible ? 0 : 0.6,
        top:   0.9,
        bot:   0.15,
      };

      faces.forEach(face => {
        const name = (face as Element).getAttribute('data-face') || '';
        if (faceData[name]) {
          (face as Element).setAttribute('points', faceData[name]);
          (face as SVGElement).style.opacity = String(vis[name] ?? 0);
        }
      });

      // Center text (Mi) — projected to front face center
      const textEl = g.querySelector('[data-label]') as SVGTextElement;
      if (textEl) {
        const fc = proj(0, 0, D + 1);
        textEl.setAttribute('x', fc.x.toFixed(1));
        textEl.setAttribute('y', (fc.y + s * 0.07).toFixed(1));
        textEl.style.opacity = frontVisible ? '1' : '0';
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, [autoSpin, size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'grab' }}
      onClick={onClick}
      className="select-none shrink-0"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="mgTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="mgFront" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="mgRight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g ref={groupRef}>
          {/* Bottom */}
          <polygon data-face="bot" points="" fill="#020617" stroke="rgba(34,211,238,0.15)" strokeWidth="0.5" />
          {/* Back */}
          <polygon data-face="back" points="" fill="rgba(15,23,42,0.9)" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
          {/* Left */}
          <polygon data-face="left" points="" fill="url(#mgRight)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
          {/* Right */}
          <polygon data-face="right" points="" fill="url(#mgRight)" stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />
          {/* Front */}
          <polygon data-face="front" points="" fill="url(#mgFront)" stroke="rgba(34,211,238,0.5)" strokeWidth="0.8" />
          {/* Top */}
          <polygon data-face="top" points="" fill="url(#mgTop)" stroke="rgba(34,211,238,0.6)" strokeWidth="0.8" />
          {/* Mi label */}
          <text
            data-label="true"
            x="0" y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize={size * 0.24}
            letterSpacing="-0.03em"
            style={{ pointerEvents: 'none' }}
          >
            Mi
          </text>
        </g>
      </svg>
    </div>
  );
}

// ─── TiltCard — 3D mouse-follow tilt ────────────────────────────────────────
export function TiltCard({ children, className = '', intensity = 15 }: {
  children: React.ReactNode; className?: string; intensity?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
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

// ─── MagneticButton — snaps toward cursor ────────────────────────────────────
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
