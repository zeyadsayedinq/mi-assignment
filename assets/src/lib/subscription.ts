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

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 3,
  pro_monthly: 25,
  pro_quarterly: 60,
  pro_yearly: 999999,
};

const OWNER_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];

export async function getSubscriptionStatus(userId: string, email?: string): Promise<SubscriptionStatus> {
  // Owner always unlimited
  if (OWNER_EMAILS.map(e=>e.toLowerCase()).includes(email?.toLowerCase() || '')) {
    return {
      plan: 'pro_yearly', role: 'owner',
      missionsUsed: 0, missionsLimit: 999999, missionsLeft: 999999,
      isActive: true, expiresAt: '2099-12-31', canUseMission: true,
    };
  }

  try {
    // Get subscription from Supabase directly
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', userId)
      .single();

    let plan: Plan = 'free';
    if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = (sub.plan || 'free') as Plan;
    }

    const limit = PLAN_LIMITS[plan] || 3;

    // Count missions this period
    const periodStart = new Date();
    if (plan === 'pro_quarterly') periodStart.setDate(periodStart.getDate() - 90);
    else if (plan === 'pro_yearly') periodStart.setFullYear(periodStart.getFullYear() - 1);
    else { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); }

    const { count } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());

    const missionsUsed = count || 0;
    const missionsLeft = limit >= 999999 ? 999999 : Math.max(0, limit - missionsUsed);

    return {
      plan, role: 'user', missionsUsed,
      missionsLimit: limit, missionsLeft,
      isActive: plan !== 'free',
      expiresAt: sub?.expires_at || null,
      canUseMission: limit >= 999999 || missionsUsed < limit,
    };
  } catch {
    // Fallback to local count
    const used = getLocalMissionCount(userId);
    return {
      plan: 'free', role: 'user', missionsUsed: used,
      missionsLimit: 3, missionsLeft: Math.max(0, 3 - used),
      isActive: false, expiresAt: null,
      canUseMission: used < 3,
    };
  }
}

// Real Tap payment - needs backend, skip for now
export async function createTapCharge(params: any): Promise<{ chargeUrl: string; chargeId: string }> {
  const res = await fetch('/api/create-charge', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Payment failed'); }
  return res.json();
}

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
