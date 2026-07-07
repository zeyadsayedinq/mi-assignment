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

const OWNER_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

/**
 * Read-only quota snapshot for the UI's persistent indicator and account page.
 * Unlike check-quota, this NEVER writes fingerprint/IP rows and NEVER blocks —
 * it only reports the current plan, usage, and remaining count.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); return res.status(200).end(); }
  if (req.method !== 'POST') { setCORS(res); return res.status(405).end('Method Not Allowed'); }

  try {
    const { userId } = await parseBody(req);
    if (!userId) { setCORS(res); return res.status(401).json({ error: 'Unauthorized' }); }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // Owner bypass
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      const verifiedEmail = authUser?.email?.toLowerCase();
      if (verifiedEmail && OWNER_EMAILS.includes(verifiedEmail)) {
        setCORS(res);
        return res.status(200).json({
          plan: 'owner', limit: 999999, missionsUsed: 0, remaining: 999999,
          unlimited: true, expiresAt: null,
        });
      }
    } catch { /* non-fatal */ }

    // Plan
    let plan = 'free';
    let limit = PLAN_LIMITS.free;
    let expiresAt = null;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', userId)
      .single();

    if (sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = sub.plan || 'free';
      limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
      expiresAt = sub.expires_at || null;
    }

    // Period window (mirror check-quota exactly)
    const periodStart = new Date();
    if (plan === 'pro_monthly') periodStart.setDate(periodStart.getDate() - 30);
    else if (plan === 'pro_quarterly') periodStart.setDate(periodStart.getDate() - 90);
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

    const effectiveLimit = limit >= 999999 ? 999999 : Math.max(0, limit + bonus);
    const missionsUsed = count || 0;
    const remaining = effectiveLimit >= 999999 ? 999999 : Math.max(0, effectiveLimit - missionsUsed);

    setCORS(res);
    return res.status(200).json({
      plan,
      limit: effectiveLimit,
      missionsUsed,
      remaining,
      bonus,
      unlimited: effectiveLimit >= 999999,
      expiresAt,
    });

  } catch (e) {
    console.error('quota-status error:', e.message);
    setCORS(res);
    // Fail soft — return a neutral free snapshot so the UI never breaks
    return res.status(200).json({ plan: 'free', limit: 3, missionsUsed: 0, remaining: 3, bonus: 0, unlimited: false, expiresAt: null });
  }
}
