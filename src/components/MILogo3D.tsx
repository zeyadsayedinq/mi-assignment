import React, { useRef, useEffect } from 'react';

export function MILogo3D({ size = 80, autoSpin = false, onClick }: {
  size?: number; autoSpin?: boolean; onClick?: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const velRef = useRef(0);
  const isHovering = useRef(false);
  const lastXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onEnter = (e: MouseEvent) => { isHovering.current = true; lastXRef.current = e.clientX; };
    const onLeave = () => { isHovering.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!isHovering.current) return;
      velRef.current += (e.clientX - lastXRef.current) * 0.6;
      lastXRef.current = e.clientX;
    };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove);

    const animate = () => {
      if (autoSpin || !isHovering.current) velRef.current += 0.5;
      angleRef.current += velRef.current * 0.05;
      velRef.current *= 0.92;

      const svg = svgRef.current;
      if (!svg) { frameRef.current = requestAnimationFrame(animate); return; }

      const a = angleRef.current * Math.PI / 180;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const cx = size / 2, cy = size / 2;
      const w = size * 0.3, h = size * 0.38, d = size * 0.15;

      // Project 3D point to 2D (orthographic + slight perspective tilt)
      const p = (x: number, y: number, z: number) => ({
        x: cx + x * cos - z * sin,
        y: cy + y + (x * sin + z * cos) * 0.25,
      });

      const v = {
        tfl: p(-w,-h, d), tfr: p( w,-h, d),
        bfl: p(-w, h, d), bfr: p( w, h, d),
        tbl: p(-w,-h,-d), tbr: p( w,-h,-d),
        bbl: p(-w, h,-d), bbr: p( w, h,-d),
      };

      const pt = (v: {x:number,y:number}) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`;
      const fv = cos > 0; // front visible
      const rv = sin < 0; // right visible

      const polys = svg.querySelectorAll('polygon[data-f]');
      const data: Record<string,{pts:string,op:number}> = {
        top:   { pts: `${pt(v.tfl)} ${pt(v.tfr)} ${pt(v.tbr)} ${pt(v.tbl)}`, op: 1 },
        front: { pts: `${pt(v.tfl)} ${pt(v.tfr)} ${pt(v.bfr)} ${pt(v.bfl)}`, op: fv ? 1 : 0 },
        back:  { pts: `${pt(v.tbl)} ${pt(v.tbr)} ${pt(v.bbr)} ${pt(v.bbl)}`, op: fv ? 0 : 0.5 },
        right: { pts: `${pt(v.tfr)} ${pt(v.tbr)} ${pt(v.bbr)} ${pt(v.bfr)}`, op: rv ? 0.8 : 0 },
        left:  { pts: `${pt(v.tfl)} ${pt(v.tbl)} ${pt(v.bbl)} ${pt(v.bfl)}`, op: rv ? 0 : 0.7 },
        bot:   { pts: `${pt(v.bfl)} ${pt(v.bfr)} ${pt(v.bbr)} ${pt(v.bbl)}`, op: 0.1 },
      };

      polys.forEach(poly => {
        const f = poly.getAttribute('data-f') || '';
        if (data[f]) {
          poly.setAttribute('points', data[f].pts);
          (poly as SVGElement).style.opacity = String(data[f].op);
        }
      });

      // Mi text on front face center
      const txt = svg.querySelector('text[data-label]') as SVGTextElement;
      if (txt) {
        const fc = p(0, 0, d + 0.5);
        txt.setAttribute('x', fc.x.toFixed(1));
        txt.setAttribute('y', (fc.y + size * 0.06).toFixed(1));
        txt.style.opacity = fv ? '1' : '0';
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

  const s = size;
  return (
    <div ref={containerRef} style={{ width: s, height: s, cursor: onClick ? 'pointer' : 'grab' }} onClick={onClick} className="select-none shrink-0">
      <svg ref={svgRef} width={s} height={s} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gt_${s}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id={`gf_${s}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#020617" stopOpacity="1"/>
          </linearGradient>
          <linearGradient id={`gr_${s}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#1E1040" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        <polygon data-f="bot"   points="" fill="#020617" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5"/>
        <polygon data-f="back"  points="" fill="#050B18" stroke="rgba(34,211,238,0.08)" strokeWidth="0.5"/>
        <polygon data-f="left"  points="" fill={`url(#gr_${s})`} stroke="rgba(124,58,237,0.25)" strokeWidth="0.5"/>
        <polygon data-f="right" points="" fill={`url(#gr_${s})`} stroke="rgba(124,58,237,0.35)" strokeWidth="0.5"/>
        <polygon data-f="front" points="" fill={`url(#gf_${s})`} stroke="rgba(34,211,238,0.55)" strokeWidth="1"/>
        <polygon data-f="top"   points="" fill={`url(#gt_${s})`} stroke="rgba(34,211,238,0.7)" strokeWidth="1"/>
        <text data-label="true" x="0" y="0"
          textAnchor="middle" dominantBaseline="middle"
          fill="white" fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
          fontWeight="900" fontSize={s * 0.22} letterSpacing="-0.04em"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>Mi</text>
      </svg>
    </div>
  );
}

export function TiltCard({ children, className = '', intensity = 15 }: { children: React.ReactNode; className?: string; intensity?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current; if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width/2)) / (rect.width/2);
    const dy = (e.clientY - (rect.top + rect.height/2)) / (rect.height/2);
    card.style.transform = `perspective(800px) rotateY(${dx*intensity}deg) rotateX(${-dy*intensity}deg) scale(1.03)`;
    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(circle at ${((e.clientX-rect.left)/rect.width)*100}% ${((e.clientY-rect.top)/rect.height)*100}%, rgba(34,211,238,0.12) 0%, transparent 60%)`;
    }
  };
  const onMouseLeave = () => { if (cardRef.current) cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'; if (glowRef.current) glowRef.current.style.background = 'transparent'; };
  return (
    <div ref={cardRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className={className} style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d', willChange: 'transform' }}>
      <div ref={glowRef} className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 transition-all duration-200" />
      {children}
    </div>
  );
}

export function MagneticButton({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current; if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX-(rect.left+rect.width/2))*0.35}px,${(e.clientY-(rect.top+rect.height/2))*0.35}px) scale(1.06)`;
  };
  const onMouseLeave = () => { if (btnRef.current) btnRef.current.style.transform = 'translate(0,0) scale(1)'; };
  return (
    <button ref={btnRef} onClick={onClick} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className={className} style={{ transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', willChange: 'transform' }}>
      {children}
    </button>
  );
}
