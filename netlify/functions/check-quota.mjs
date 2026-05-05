import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const PLAN_LIMITS = {
  free: 3,
  pro_monthly: 25,
  pro_quarterly: 60,
  pro_yearly: 999999,
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  try {
    const { userId, email, lang } = JSON.parse(event.body || '{}');
    if (!userId) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // 0. Owner bypass — always unlimited (email sent from frontend session)
    const OWNER_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];
    const userEmail = (email || '').toLowerCase();
    if (OWNER_EMAILS.includes(userEmail)) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ allowed: true, plan: 'owner', limit: 999999 }) };
    }

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

    // Add any bonus missions earned from referrals
    const { data: bonusRows } = await supabase
      .from('bonus_missions')
      .select('bonus')
      .eq('user_id', userId);
    const bonusMissions = (bonusRows || []).reduce((sum, r) => sum + (r.bonus || 0), 0);
    const effectiveLimit = limit >= 999999 ? 999999 : limit + bonusMissions;

    const missionsUsed = count || 0;
    const canUse = effectiveLimit >= 999999 || missionsUsed < effectiveLimit;

    if (!canUse) {
      // Fire limit-reached email (non-blocking, best-effort)
      if (email) {
        const baseUrl = process.env.URL || 'https://www.mi-assignment.com';
        fetch(`${baseUrl}/.netlify/functions/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'limit_reached',
            to: email,
            data: { isAr: lang === 'ar', plan, missionsUsed },
          }),
        }).catch(() => {});
      }
      return {
        statusCode: 402,
        headers: CORS,
        body: JSON.stringify({
          error: 'LIMIT_REACHED',
          plan,
          missionsUsed,
          limit: effectiveLimit,
          message: lang === 'ar'
            ? `وصلت للحد (${effectiveLimit} مهمة لهذه الفترة). اشترك في Pro للمزيد.`
            : `Limit reached (${effectiveLimit} missions this period). Upgrade to Pro.`,
        })
      };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ allowed: true }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
