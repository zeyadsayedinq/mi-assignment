import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  
  const pathParts = event.path.split('/');
  const userId = pathParts[pathParts.length - 1];

  if (!userId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing userId' }) };

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', userId)
      .single();

    const isPro = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date());

    return { 
      statusCode: 200, 
      headers: CORS, 
      body: JSON.stringify({ 
        userId, 
        isPro, 
        plan: isPro ? sub.plan : 'free' 
      }) 
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
