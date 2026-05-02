// referral.ts — Referral system
// Each user gets a unique ref code. If someone signs up via /ref/CODE,
// both users get +2 bonus missions applied to their count.

import { supabase } from './supabase';

// Generate a short alphanumeric code from user ID
function generateCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = parseInt(userId.replace(/-/g, '').slice(i * 2, i * 2 + 2), 16) % chars.length;
    code += chars[idx];
  }
  return code;
}

// Get or create a referral code for the current user
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const code = generateCode(userId);

  // Try to insert — if already exists, ignore the error
  await supabase.from('referrals').insert({
    referrer_id: userId,
    ref_code: code,
    status: 'pending',
  }).catch(() => {});

  // Always return the deterministic code based on userId
  return code;
}

// Get referral link for sharing
export function getReferralLink(code: string): string {
  const base = import.meta.env.VITE_APP_URL || 'https://www.mi-assignment.com';
  return `${base}/ref/${code}`;
}

// Get referral stats for a user
export async function getReferralStats(userId: string): Promise<{ total: number; converted: number; bonusMissions: number }> {
  const { data } = await supabase
    .from('referrals')
    .select('status, bonus_granted')
    .eq('referrer_id', userId)
    .not('referred_id', 'is', null); // only rows where someone actually used the code

  const total = data?.length || 0;
  const converted = data?.filter(r => r.status === 'converted').length || 0;
  const bonusMissions = converted * 2; // 2 bonus missions per successful referral
  return { total, converted, bonusMissions };
}

// Store referral code from URL into localStorage for post-signup processing
export function storeReferralCode(code: string) {
  if (code && code.length === 6) {
    localStorage.setItem('mi_ref_code', code.toUpperCase());
  }
}

// Get stored referral code
export function getStoredReferralCode(): string | null {
  return localStorage.getItem('mi_ref_code');
}

// Process referral after signup — call this server-side via API
export async function processReferralSignup(newUserId: string, refCode: string): Promise<boolean> {
  try {
    const res = await fetch('/api/referral/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUserId, refCode }),
    });
    return res.ok;
  } catch { return false; }
}

// Share referral link via Web Share API or fallback to copy
export async function shareReferralLink(code: string, isAr: boolean): Promise<'shared' | 'copied' | 'error'> {
  const link = getReferralLink(code);
  const text = isAr
    ? `جرّب Mi-Assignment — بيحل أي واجب في ثوانٍ! سجّل من هنا وهنفضل ٢ مهام مجانية زيادة 🎓`
    : `Try Mi-Assignment — solves any assignment in seconds! Sign up with my link and we both get 2 bonus missions 🎓`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Mi-Assignment', text, url: link });
      return 'shared';
    } catch {}
  }

  try {
    await navigator.clipboard.writeText(link);
    return 'copied';
  } catch { return 'error'; }
}
