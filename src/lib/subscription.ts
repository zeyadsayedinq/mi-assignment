import { supabase } from './supabase';

export type Plan = 'free' | 'pro_monthly' | 'pro_quarterly' | 'pro_yearly';

export interface SubscriptionStatus {
  plan: Plan;
  role: 'owner' | 'user';
  missionsUsed: number;
  missionsLimit: number;
  missionsLeft: number;
  isActive: boolean;
  expiresAt: string | null;
  canUseMission: boolean;
}

// Must match server-side PLAN_LIMITS exactly
export const PLAN_LIMITS: Record<Plan, number> = {
  free:          3,
  pro_monthly:   15,
  pro_quarterly: 40,
  pro_yearly:    999999,
};

// Only the real owner — no fake email lists, no localStorage bypass
const OWNER_EMAILS = ['zeyadsayedinq@gmail.com'];

export async function getSubscriptionStatus(userId: string, email?: string): Promise<SubscriptionStatus> {
  const normalizedEmail = email?.trim().toLowerCase();

  // Owner bypass — always unlimited
  if (normalizedEmail && OWNER_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
    return {
      plan: 'pro_yearly', role: 'owner',
      missionsUsed: 0, missionsLimit: 999999, missionsLeft: 999999,
      isActive: true, expiresAt: '2099-12-31T23:59:59Z', canUseMission: true,
    };
  }

  // Try server-side endpoint first (most accurate — avoids RLS issues)
  try {
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
    const resp = await fetch(`${backendUrl}/api/subscription/${userId}`);
    if (resp.ok) {
      const data = await resp.json();
      const plan = (data.plan || 'free') as Plan;
      const limit = data.limit >= 999999 ? 999999 : (data.limit || PLAN_LIMITS.free);
      const used = data.missionsUsed || 0;
      return {
        plan, role: 'user',
        missionsUsed: used,
        missionsLimit: limit,
        missionsLeft: limit >= 999999 ? 999999 : Math.max(0, limit - used),
        isActive: data.isPro || false,
        expiresAt: null,
        canUseMission: data.canUse !== false,
      };
    }
  } catch {}

  // Fallback: query Supabase directly
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', userId)
      .single();

    let plan: Plan = 'free';
    if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = (sub.plan || 'free') as Plan;
    }

    const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    const periodStart = new Date();
    if (plan === 'pro_quarterly') periodStart.setDate(periodStart.getDate() - 90);
    else if (plan === 'pro_yearly') periodStart.setFullYear(periodStart.getFullYear() - 1);
    else { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); }

    const { count } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());

    const used = count || 0;
    const left = limit >= 999999 ? 999999 : Math.max(0, limit - used);

    return {
      plan, role: 'user',
      missionsUsed: used,
      missionsLimit: limit,
      missionsLeft: left,
      isActive: plan !== 'free',
      expiresAt: sub?.expires_at || null,
      canUseMission: limit >= 999999 || used < limit,
    };
  } catch {}

  // Last resort: local counter
  const used = getLocalMissionCount(userId);
  return {
    plan: 'free', role: 'user',
    missionsUsed: used,
    missionsLimit: PLAN_LIMITS.free,
    missionsLeft: Math.max(0, PLAN_LIMITS.free - used),
    isActive: false, expiresAt: null,
    canUseMission: used < PLAN_LIMITS.free,
  };
}

// Real Tap Payments charge — calls backend proxy
export async function createTapCharge(params: {
  amount: number;
  currency: 'USD' | 'SAR' | 'AED' | 'KWD' | 'BHD' | 'JOD' | 'EGP';
  userId: string;
  email: string;
  firstName: string;
  plan: 'pro_monthly' | 'pro_yearly' | 'pro_quarterly';
  redirectUrl: string;
}): Promise<{ chargeUrl: string; chargeId: string }> {
  const res = await fetch('/api/payments/tap/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Payment initialization failed. Please try again.');
  }
  return res.json();
}

// Local mission counter — scoped to user + month, used only as last fallback
export function getLocalMissionCount(userId?: string): number {
  const now = new Date();
  const key = `mi_missions_${now.getFullYear()}_${now.getMonth()}_${userId || 'anon'}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

export function incrementLocalMissionCount(userId?: string): void {
  const now = new Date();
  const key = `mi_missions_${now.getFullYear()}_${now.getMonth()}_${userId || 'anon'}`;
  localStorage.setItem(key, String(getLocalMissionCount(userId) + 1));
}
