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

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}


async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body; // already parsed
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); return res.status(200).end(); }
  if (req.method !== 'POST') { setCORS(res); return res.status(405).end('Method Not Allowed'); }

  try {
    const { userId, email, lang } = await parseBody(req);
    if (!userId) { setCORS(res); return res.status(401).json({ error: 'Unauthorized' }); }

    // Owner bypass — always unlimited
    const OWNER_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];
    if (email && OWNER_EMAILS.includes(email.toLowerCase())) {
      setCORS(res); return res.status(200).json({ allowed: true, plan: 'owner', limit: 999999 });
    }

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

    const { data: bonusRows } = await supabase
      .from('bonus_missions')
      .select('bonus')
      .eq('user_id', userId);
    const bonus = (bonusRows || []).reduce((s, r) => s + (r.bonus || 0), 0);
    const effectiveLimit = limit >= 999999 ? 999999 : limit + bonus;
    const missionsUsed = count || 0;
    const canUse = effectiveLimit >= 999999 || missionsUsed < effectiveLimit;

    if (!canUse) {
      setCORS(res); return res.status(402).send(JSON.stringify({
          error: 'LIMIT_REACHED',
          plan,
          missionsUsed,
          limit: effectiveLimit,
          message: lang === 'ar'
            ? `وصلت للحد (${effectiveLimit} مهمة لهذه الفترة). اشترك في Pro للمزيد.`
            : `Limit reached (${effectiveLimit} missions this period). Upgrade to Pro.`,
        }));
    }

    setCORS(res); return res.status(200).json({ allowed: true });
  } catch (e) {
    setCORS(res); return res.status(500).json({ error: e.message });
  }
};
