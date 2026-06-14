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

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function limitReached(res, lang, effectiveLimit, missionsUsed, plan, reason) {
  setCORS(res);
  const msgEn = reason === 'device'
    ? `This device has already used the free tier. Please upgrade to Pro.`
    : reason === 'ip'
    ? `Too many free accounts from this network. Please upgrade to Pro.`
    : `Limit reached (${effectiveLimit} missions this period). Upgrade to Pro.`;
  const msgAr = reason === 'device'
    ? `هذا الجهاز استخدم الخطة المجانية من قبل. يرجى الترقية إلى Pro.`
    : reason === 'ip'
    ? `عدد كبير من الحسابات المجانية من هذه الشبكة. يرجى الترقية إلى Pro.`
    : `وصلت للحد (${effectiveLimit} مهمة لهذه الفترة). اشترك في Pro للمزيد.`;
  return res.status(402).json({
    error: 'LIMIT_REACHED',
    plan,
    missionsUsed,
    limit: effectiveLimit,
    message: lang === 'ar' ? msgAr : msgEn,
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); return res.status(200).end(); }
  if (req.method !== 'POST') { setCORS(res); return res.status(405).end('Method Not Allowed'); }

  try {
    const { userId, email, lang, fingerprint } = await parseBody(req);
    if (!userId) { setCORS(res); return res.status(401).json({ error: 'Unauthorized' }); }

    // ── Owner bypass — always unlimited ───────────────────────────────────────
    if (email && OWNER_EMAILS.includes(email.toLowerCase())) {
      setCORS(res);
      return res.status(200).json({ allowed: true, plan: 'owner', limit: 999999 });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    // ── 1. Get plan ────────────────────────────────────────────────────────────
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

    const isPro = limit >= 999999 || (plan !== 'free' && limit > 3);

    // ── 2. Count usage ─────────────────────────────────────────────────────────
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
    const effectiveLimit = limit >= 999999 ? 999999 : Math.max(0, limit + bonus);
    const missionsUsed = count || 0;

    // ── 3. Standard quota check ────────────────────────────────────────────────
    if (effectiveLimit < 999999 && missionsUsed >= effectiveLimit) {
      return limitReached(res, lang, effectiveLimit, missionsUsed, plan, 'quota');
    }

    // ── 4. Abuse checks — FREE users only, fail-open (never block Pro) ────────
    if (!isPro) {
      const clientIP = getClientIP(req);

      // ── 4a. Device fingerprint check ──────────────────────────────────────
      if (fingerprint && typeof fingerprint === 'string' && fingerprint.length >= 8) {
        try {
          const { data: fpRows } = await supabase
            .from('device_fingerprints')
            .select('user_id')
            .eq('fingerprint', fingerprint)
            .neq('user_id', userId)
            .limit(5);

          if (fpRows && fpRows.length > 0) {
            // Same device used by another account — check if any of those had missions
            const otherIds = fpRows.map(r => r.user_id);
            const { count: otherCount } = await supabase
              .from('missions')
              .select('id', { count: 'exact', head: true })
              .in('user_id', otherIds)
              .limit(1);

            if (otherCount && otherCount > 0) {
              console.warn(`[ABUSE] Device fingerprint reuse: userId=${userId}, sharedWith=${otherIds.join(',')}`);
              return limitReached(res, lang, 0, missionsUsed, plan, 'device');
            }
          }
        } catch (fpErr) {
          // Fingerprint check failed — fail open, don't block the user
          console.warn('[FINGERPRINT] check failed (non-fatal):', fpErr?.message);
        }
      }

      // ── 4b. IP check — max 3 distinct free accounts per IP ────────────────
      if (clientIP && clientIP !== 'unknown') {
        try {
          const { data: ipRows } = await supabase
            .from('device_fingerprints')
            .select('user_id')
            .eq('last_ip', clientIP)
            .neq('user_id', userId)
            .limit(10);

          if (ipRows && ipRows.length >= 3) {
            // More than 3 other free accounts from this IP
            const otherIds = ipRows.map(r => r.user_id);
            const { count: ipMissionCount } = await supabase
              .from('missions')
              .select('id', { count: 'exact', head: true })
              .in('user_id', otherIds);

            if (ipMissionCount && ipMissionCount >= 6) {
              console.warn(`[ABUSE] IP overuse: ip=${clientIP}, userId=${userId}, others=${otherIds.length}`);
              return limitReached(res, lang, 0, missionsUsed, plan, 'ip');
            }
          }

          // Store IP alongside fingerprint for future checks (fire and forget)
          if (fingerprint) {
            supabase
              .from('device_fingerprints')
              .upsert(
                { user_id: userId, fingerprint, last_ip: clientIP, last_seen: new Date().toISOString() },
                { onConflict: 'user_id' }
              )
              .then(() => {}, () => {});
          }
        } catch (ipErr) {
          // IP check failed — fail open
          console.warn('[IP_CHECK] failed (non-fatal):', ipErr?.message);
        }
      }
    }

    // ── 5. All checks passed ──────────────────────────────────────────────────
    setCORS(res);
    return res.status(200).json({ allowed: true });

  } catch (e) {
    console.error('check-quota FATAL:', e.message);
    setCORS(res);
    return res.status(500).json({ error: e.message });
  }
}
