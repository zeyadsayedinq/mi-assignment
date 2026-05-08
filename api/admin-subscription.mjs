/**
 * /netlify/functions/admin-subscription.mjs
 * GET/POST /api/admin/users/:userId/subscription
 * Only accessible by owner emails.
 */

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const OWNER_EMAILS = ['zeyadsayedinq@gmail.com', 'ranafaraj30@gmail.com'];


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

  const callerEmail = (req.headers['x-caller-email'] || '').toLowerCase();
  if (!OWNER_EMAILS.includes(callerEmail)) {
    setCORS(res); return res.status(403).json({ error: 'Forbidden' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  // Extract userId from path: /api/admin/users/{userId}/subscription
  const pathParts = req.url.split("?")[0].split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];

  if (!userId) setCORS(res); return res.status(400).json({ error: 'Missing userId' });

  try {
    if (req.method === 'GET') {
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();
      setCORS(res); return res.status(200).json({ subscription: sub });
    }

    if (req.method === 'POST') {
      const { plan, action, days } = await parseBody(req);

      if (action === 'revoke' || plan === 'free') {
        await supabase.from('subscriptions').upsert(
          { user_id: userId, plan: 'free', status: 'inactive', expires_at: null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        setCORS(res); return res.status(200).json({ success: true, action: 'revoked' });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (days || 90));
      await supabase.from('subscriptions').upsert(
        { user_id: userId, plan: plan || 'pro_quarterly', status: 'active', expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      setCORS(res); return res.status(200).json({ success: true, action: 'granted', plan });
    }

    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    setCORS(res); return res.status(500).json({ error: e.message });
  }
};
