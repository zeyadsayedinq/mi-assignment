import { supabase } from './supabase';

// Deterministic code from userId — always the same, no DB read needed
export function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const hex = userId.replace(/-/g, '');
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % chars.length];
  }
  return code;
}

export function getReferralLink(code: string): string {
  return `https://www.mi-assignment.com/ref/${code}`;
}

// Gets code instantly (no async needed) and tries to save to DB in background
export function getOrCreateReferralCode(userId: string): Promise<string> {
  const code = generateReferralCode(userId);
  // Fire-and-forget insert — don't await, don't block UI
  supabase.from('referrals').insert({
    referrer_id: userId,
    ref_code: code,
    status: 'pending',
  }).then(undefined, () => {}); // duplicate key = already exists, ignore
  return Promise.resolve(code);
}

export async function getReferralStats(userId: string) {
  try {
    const { data } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', userId)
      .not('referred_id', 'is', null);
    const converted = data?.filter(r => r.status === 'converted').length || 0;
    return { total: data?.length || 0, converted, bonusMissions: converted * 2 };
  } catch {
    return { total: 0, converted: 0, bonusMissions: 0 };
  }
}

export function storeReferralCode(code: string) {
  if (code?.length >= 5) localStorage.setItem('mi_ref_code', code.toUpperCase());
}

export async function shareReferralLink(code: string, isAr: boolean): Promise<'shared' | 'copied' | 'error'> {
  const link = getReferralLink(code);
  const text = isAr
    ? `جرّب Mi-Assignment — بيحل أي واجب في ثوانٍ! سجّل من هنا وهنفضل ٢ مهام مجانية زيادة 🎓`
    : `Try Mi-Assignment — solves any assignment in seconds! Sign up with my link, we both get 2 bonus missions 🎓`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Mi-Assignment', text, url: link }); return 'shared'; } catch {}
  }
  try { await navigator.clipboard.writeText(link); return 'copied'; } catch {}
  return 'error';
}
