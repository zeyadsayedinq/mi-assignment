import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const PLAN_LIMITS = {
  free: 3,
  pro_monthly: 15,
  pro_quarterly: 40,
  pro_yearly: 999999,
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  try {
    const { userId, lang } = JSON.parse(event.body || '{}');
    if (!userId) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // 1. Get Plan
    let plan = 'free';
    let limit = PLAN_LIMITS.free;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', userId)
      .single();

    if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = sub.plan || 'free';
      limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    }

    // 2. Count Usage
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
    const canUse = limit >= 999999 || missionsUsed < limit;

    if (!canUse) {
      return {
        statusCode: 402,
        headers: CORS,
        body: JSON.stringify({
          error: 'LIMIT_REACHED',
          plan,
          missionsUsed,
          limit,
          message: lang === 'ar'
            ? `وصلت للحد (${limit} مهمة لهذه الفترة). اشترك في Pro للمزيد.`
            : `Limit reached (${limit} missions this period). Upgrade to Pro.`,
        })
      };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ allowed: true }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
