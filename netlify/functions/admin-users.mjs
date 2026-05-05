/**
 * /netlify/functions/admin-users.mjs
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  // Verify caller is an owner
  const callerEmail = (event.headers['x-caller-email'] || '').toLowerCase();
  if (!OWNER_EMAILS.includes(callerEmail)) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const email = new URLSearchParams(event.rawQuery).get('email');
      if (!email) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing email' }) };

      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'User not found' }) };

      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ userId: user.id, email: user.email, subscription: sub }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { email, action, plan, days } = JSON.parse(event.body || '{}');
      if (!email || !action) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing email or action' }) };

      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'User not found' }) };

      if (action === 'grant') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (days || 90));
        const { error: upsertErr } = await supabase.from('subscriptions').upsert(
          { user_id: user.id, plan: plan || 'pro_quarterly', status: 'active', expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        if (upsertErr) throw upsertErr;
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, action: 'granted', plan, userId: user.id }) };
      }

      if (action === 'revoke') {
        await supabase.from('subscriptions').upsert(
          { user_id: user.id, plan: 'free', status: 'inactive', expires_at: null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, action: 'revoked', userId: user.id }) };
      }

      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) };
    }

    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
