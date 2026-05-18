import React, { useRef, useEffect } from 'react';

// ── Mi Logo — Solid rotating cube with "Mi" locked to front face ──────────────
export function MILogo3D({ size = 80, autoSpin = false, onClick }: {
  size?: number; autoSpin?: boolean; onClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const velRef = useRef(autoSpin ? 0.8 : 0);
  const isHovering = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = size * (window.devicePixelRatio || 1);
    canvas.width = S;
    canvas.height = S;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = S / 2, cy = S / 2;
    const hs = S * 0.32; // half-size of cube

    // Project 3D point → 2D with Y-axis rotation only
    const project = (x: number, y: number, z: number, angleY: number) => {
      const cosA = Math.cos(angleY), sinA = Math.sin(angleY);
      const rx = x * cosA - z * sinA;
      const rz = x * sinA + z * cosA;
      // Slight perspective
      const fov = S * 3.5;
      const scale = fov / (fov + rz * 0.3);
      return { x: cx + rx * scale, y: cy + y * scale, z: rz };
    };

    const draw = () => {
      if (autoSpin) velRef.current = 0.55;
      angleRef.current += velRef.current * 0.04;
      velRef.current *= 0.92;

      const a = angleRef.current;
      ctx.clearRect(0, 0, S, S);

      // 8 vertices
      const verts = [
        [-hs,-hs,-hs],[hs,-hs,-hs],[hs,hs,-hs],[-hs,hs,-hs], // back
        [-hs,-hs, hs],[hs,-hs, hs],[hs,hs, hs],[-hs,hs, hs], // front
      ].map(([x,y,z]) => project(x, y, z, a));

      // 6 faces: vertices + base color multiplier
      const faces = [
        { idx:[4,5,6,7], normal: [0,0,1],  base:'#22D3EE', label: true  }, // front — cyan
        { idx:[1,0,3,2], normal: [0,0,-1], base:'#0E7490', label: false }, // back
        { idx:[5,1,2,6], normal: [1,0,0],  base:'#7C3AED', label: false }, // right — purple
        { idx:[0,4,7,3], normal: [-1,0,0], base:'#5B21B6', label: false }, // left
        { idx:[0,1,5,4], normal: [0,-1,0], base:'#0EA5E9', label: false }, // top
        { idx:[3,2,6,7], normal: [0,1,0],  base:'#020617', label: false }, // bottom
      ];

      // Compute lighting for each face
      const light = [0.6, -0.8, 0.6]; // light direction
      const cosA = Math.cos(a), sinA = Math.sin(a);

      const litFaces = faces.map(face => {
        const [nx, ny, nz] = face.normal;
        // Rotate normal with Y rotation
        const rnx = nx * cosA - nz * sinA;
        const rnz = nx * sinA + nz * cosA;
        const dot = rnx * light[0] + ny * light[1] + rnz * light[2];
        const brightness = Math.max(0.15, Math.min(1, dot * 0.7 + 0.5));
        const pts = face.idx.map(i => verts[i]);
        // Avg Z for painter's algorithm
        const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        return { ...face, brightness, pts, avgZ };
      });

      // Sort back to front (painter's algorithm)
      litFaces.sort((a, b) => a.avgZ - b.avgZ);

      litFaces.forEach(face => {
        const { pts, base, brightness, label } = face;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();

        // Fill with color + brightness
        const hex2rgb = (h: string) => {
          const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
          return `rgb(${Math.round(r*brightness)},${Math.round(g*brightness)},${Math.round(b*brightness)})`;
        };
        ctx.fillStyle = hex2rgb(base);
        ctx.fill();

        // Edge glow on front face
        if (label) {
          ctx.strokeStyle = `rgba(34,211,238,${0.6 * brightness})`;
          ctx.lineWidth = S * 0.012;
        } else {
          ctx.strokeStyle = `rgba(14,116,144,${0.25 * brightness})`;
          ctx.lineWidth = S * 0.006;
        }
        ctx.stroke();

        // "Mi" text locked to front face center — only when front is visible
        if (label) {
          const fcx = pts.reduce((s, p) => s + p.x, 0) / 4;
          const fcy = pts.reduce((s, p) => s + p.y, 0) / 4;
          const frontNormal = face.normal;
          const rotatedNz = frontNormal[0] * sinA + frontNormal[2] * cosA;
          const visible = rotatedNz > 0.05;
          if (visible) {
            ctx.globalAlpha = Math.min(1, (rotatedNz - 0.05) * 3);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `900 ${S * 0.28}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Mi', fcx, fcy);
            ctx.globalAlpha = 1;
          }
        }
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onEnter = (e: MouseEvent) => { isHovering.current = true; lastXRef.current = e.clientX; };
    const onLeave = () => { isHovering.current = false; };
    const onMove = (e: MouseEvent) => {
      if (!isHovering.current) return;
      velRef.current += (e.clientX - lastXRef.current) * 0.5;
      lastXRef.current = e.clientX;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        velRef.current += 2.5;
      }
    };
    canvas.addEventListener('mouseenter', onEnter);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchstart', onTouch, { passive: true });

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener('mouseenter', onEnter);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchstart', onTouch);
    };
  }, [autoSpin, size]);

  return (
    <div style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'grab' }}
      onClick={onClick} className="select-none shrink-0">
      <canvas ref={canvasRef} />
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
  const onMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
    if (glowRef.current) glowRef.current.style.background = 'transparent';
  };
  return (
    <div ref={cardRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className={className}
      style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d', willChange: 'transform' }}>
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
    <button ref={btnRef} onClick={onClick} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className={className}
      style={{ transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', willChange: 'transform' }}>
      {children}
    </button>
  );
}
