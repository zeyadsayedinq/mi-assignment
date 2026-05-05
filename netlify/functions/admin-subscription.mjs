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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const callerEmail = (event.headers['x-caller-email'] || '').toLowerCase();
  if (!OWNER_EMAILS.includes(callerEmail)) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  // Extract userId from path: /api/admin/users/{userId}/subscription
  const pathParts = event.path.split('/');
  const userId = pathParts[pathParts.indexOf('users') + 1];

  if (!userId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing userId' }) };

  try {
    if (event.httpMethod === 'GET') {
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ subscription: sub }) };
    }

    if (event.httpMethod === 'POST') {
      const { plan, action, days } = JSON.parse(event.body || '{}');

      if (action === 'revoke' || plan === 'free') {
        await supabase.from('subscriptions').upsert(
          { user_id: userId, plan: 'free', status: 'inactive', expires_at: null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, action: 'revoked' }) };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (days || 90));
      await supabase.from('subscriptions').upsert(
        { user_id: userId, plan: plan || 'pro_quarterly', status: 'active', expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, action: 'granted', plan }) };
    }

    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
