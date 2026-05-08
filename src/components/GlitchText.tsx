import React, { useState, useEffect, useRef } from 'react';

// ─── Glitch text effect on hover ──────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?/\\[]{}';

export function GlitchText({
  text,
  className = '',
  triggerOnHover = true,
  loop = false,
  speed = 40,
  tag: Tag = 'span',
}: {
  text: string;
  className?: string;
  triggerOnHover?: boolean;
  loop?: boolean;
  speed?: number;
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
}) {
  const [displayed, setDisplayed] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iterRef = useRef(0);

  const scramble = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    iterRef.current = 0;
    clearInterval(intervalRef.current!);

    intervalRef.current = setInterval(() => {
      setDisplayed(
        text.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (i < iterRef.current) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );
      iterRef.current += 0.5;
      if (iterRef.current >= text.length) {
        setDisplayed(text);
        setIsGlitching(false);
        clearInterval(intervalRef.current!);
        if (loop) setTimeout(scramble, 2000 + Math.random() * 2000);
      }
    }, speed);
  };

  useEffect(() => {
    if (loop) {
      const t = setTimeout(scramble, 500 + Math.random() * 1000);
      return () => clearTimeout(t);
    }
  }, [loop]);

  useEffect(() => () => clearInterval(intervalRef.current!), []);

  return (
    <Tag
      className={className}
      onMouseEnter={triggerOnHover ? scramble : undefined}
      style={{ cursor: triggerOnHover ? 'default' : undefined }}
    >
      {displayed}
    </Tag>
  );
}

// ─── Typewriter with cursor blink ──────────────────────────────────────────
export function TypewriterText({
  lines,
  className = '',
  speed = 60,
  onDone,
}: {
  lines: string[];
  className?: string;
  speed?: number;
  onDone?: () => void;
}) {
  const [output, setOutput] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lineIdx >= lines.length) { setDone(true); onDone?.(); return; }
    const line = lines[lineIdx];
    if (charIdx <= line.length) {
      const t = setTimeout(() => {
        setOutput(prev => prev + line[charIdx - 1 < 0 ? 0 : charIdx - 1]);
        setCharIdx(c => c + 1);
      }, charIdx === 0 ? 0 : speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setOutput(prev => prev + '\n');
        setLineIdx(l => l + 1);
        setCharIdx(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx]);

  return (
    <pre className={`font-mono whitespace-pre-wrap ${className}`}>
      {output}
      {!done && <span className="animate-pulse text-[#22D3EE]">█</span>}
    </pre>
  );
}

// ─── Counter animation ─────────────────────────────────────────────────────
export function AnimatedCounter({
  from = 0,
  to,
  duration = 1500,
  suffix = '',
  prefix = '',
  className = '',
}: {
  from?: number; to: number; duration?: number; suffix?: string; prefix?: string; className?: string;
}) {
  const [value, setValue] = useState(from);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [to]);

  return <span className={className}>{prefix}{value.toLocaleString()}{suffix}</span>;
}
