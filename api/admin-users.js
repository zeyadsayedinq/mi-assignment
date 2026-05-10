/**
 * /api/admin-users.mjs
 * GET /api/admin/users-by-email?email=...
 * POST /api/admin/users-by-email  { email, action: 'grant'|'revoke', plan, days }
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

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); return res.status(200).end(); }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  // Verify caller is an owner
  const callerEmail = (req.headers['x-caller-email'] || '').toLowerCase();
  if (!OWNER_EMAILS.includes(callerEmail)) {
    setCORS(res); return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    if (req.method === 'GET') {
      const email = new URLSearchParams(req.url.split("?")[1] || "").get('email');
      if (!email) setCORS(res); return res.status(400).json({ error: 'Missing email' });

      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) setCORS(res); return res.status(404).json({ error: 'User not found' });

      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();

      setCORS(res); return res.status(200).send(JSON.stringify({ userId: user.id, email: user.email, subscription: sub }),);
    }

    if (req.method === 'POST') {
      const { email, action, plan, days } = await parseBody(req);
      if (!email || !action) setCORS(res); return res.status(400).json({ error: 'Missing email or action' });

      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) setCORS(res); return res.status(404).json({ error: 'User not found' });

      if (action === 'grant') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (days || 90));
        const { error: upsertErr } = await supabase.from('subscriptions').upsert(
          { user_id: user.id, plan: plan || 'pro_quarterly', status: 'active', expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        if (upsertErr) throw upsertErr;
        setCORS(res); return res.status(200).json({ success: true, action: 'granted', plan, userId: user.id });
      }

      if (action === 'revoke') {
        await supabase.from('subscriptions').upsert(
          { user_id: user.id, plan: 'free', status: 'inactive', expires_at: null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        setCORS(res); return res.status(200).json({ success: true, action: 'revoked', userId: user.id });
      }

      setCORS(res); return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    setCORS(res); return res.status(500).json({ error: e.message });
  }
};
