// src/lib/fingerprint.ts
// Generates a stable device fingerprint from browser signals.
// No external library. Never blocks the UI — always resolves.

async function sha256(str: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: simple hash if SubtleCrypto unavailable (HTTP / old browser)
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }
}

function canvasFingerprint(): string {
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 40;
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#22D3EE';
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillStyle = '#A855F7';
    ctx.fillText('Mi-Assignment 🎓', 2, 2);
    ctx.strokeStyle = '#050d14';
    ctx.beginPath();
    ctx.arc(100, 20, 10, 0, Math.PI * 2);
    ctx.stroke();
    return c.toDataURL();
  } catch {
    return '';
  }
}

function getBrowserSignals(): string {
  const nav = navigator;
  const signals = [
    nav.language || '',
    nav.languages?.join(',') || '',
    String(nav.hardwareConcurrency || 0),
    String((nav as any).deviceMemory || 0),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    String(new Date().getTimezoneOffset()),
    nav.platform || '',
    // feature detection signals
    String(typeof IndexedDB !== 'undefined'),
    String(typeof localStorage !== 'undefined'),
    String(typeof WebGLRenderingContext !== 'undefined'),
  ].join('|');
  return signals;
}

function getWebGLSignal(): string {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return '';
    const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbgInfo) return '';
    const vendor   = gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL)   || '';
    const renderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}|${renderer}`;
  } catch {
    return '';
  }
}

let _cached: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  // Return cached value within the same session
  if (_cached) return _cached;

  // Check sessionStorage first (survives page reloads within a tab)
  try {
    const stored = sessionStorage.getItem('mi_dfp');
    if (stored && stored.length >= 8) { _cached = stored; return stored; }
  } catch {}

  try {
    const raw = [
      canvasFingerprint(),
      getBrowserSignals(),
      getWebGLSignal(),
    ].join('::');

    const hash = await sha256(raw);
    _cached = hash;

    try { sessionStorage.setItem('mi_dfp', hash); } catch {}
    return hash;
  } catch {
    // If everything fails return empty string — caller treats it as "no fingerprint"
    return '';
  }
}

// Send fingerprint to backend — fire and forget, never throws
export function sendFingerprint(userId: string): void {
  getDeviceFingerprint().then(fp => {
    if (!fp || !userId) return;
    fetch('/api/fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fingerprint: fp }),
    }).catch(() => {});
  }).catch(() => {});
}
