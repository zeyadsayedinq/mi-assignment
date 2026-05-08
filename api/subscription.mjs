import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
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
  
  const pathParts = req.url.split("?")[0].split('/');
  const userId = pathParts[pathParts.length - 1];

  if (!userId) setCORS(res); return res.status(400).json({ error: 'Missing userId' });

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

    setCORS(res); return res.status(200).json({ 
        userId, 
        isPro, 
        plan: isPro ? sub.plan : 'free' 
      });
  } catch (e) {
    setCORS(res); return res.status(500).json({ error: e.message });
  }
};
