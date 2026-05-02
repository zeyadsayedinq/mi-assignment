import type { Context } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const PLAN_LIMITS: Record<string, number> = {
  free: 3, pro_monthly: 15, pro_quarterly: 40, pro_yearly: 999999,
};

export default async (req: Request, context: Context) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  const url = new URL(req.url);
  const userId = url.pathname.split('/').pop();
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400, headers });

  try {
    const sa = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
      { auth: { persistSession: false } }
    );

    let plan = 'free';
    let limit = PLAN_LIMITS.free;

    const { data: sub } = await sa.from('subscriptions').select('plan,status,expires_at').eq('user_id', userId).single();
    if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = sub.plan || 'free';
      limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    }

    const periodStart = new Date();
    if (plan === 'pro_quarterly') periodStart.setDate(periodStart.getDate() - 90);
    else if (plan === 'pro_yearly') periodStart.setFullYear(periodStart.getFullYear() - 1);
    else { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); }

    const { count } = await sa.from('missions').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', periodStart.toISOString());

    const missionsUsed = count || 0;
    const canUse = limit >= 999999 || missionsUsed < limit;

    return Response.json({ plan, limit, missionsUsed, isPro: plan !== 'free', canUse }, { headers });
  } catch (e: any) {
    return Response.json({ plan: 'free', limit: 3, missionsUsed: 0, isPro: false, canUse: true }, { headers });
  }
};

export const config = { path: '/api/subscription/:userId' };
