import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { userId, result, files, prompt, university, course, missionType, lang, billingName, billingPhone, billingEmail } = await parseBody(req);

    // FIX: braces were missing — this was always returning 401
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const missionData = {
      user_id: userId,
      payload_name: files?.length > 0 ? files[0].name : (prompt?.substring(0, 80) || 'Mission'),
      university: university || null,
      course: course || null,
      assignment_type: result?.assignment_type || missionType || 'other',
      status: 'SUCCESS',
      summary: result?.solution_text?.substring(0, 300) || '',
      solution_data: result,
      lang: lang || 'en',
      created_at: new Date().toISOString(),
    };
    // Store billing info if provided (from checkout form)
    if (billingName || billingPhone) {
      missionData.billing_name = billingName || null;
      missionData.billing_phone = billingPhone || null;
      missionData.billing_email = billingEmail || null;
    }

    const { error } = await supabase.from('missions').insert(missionData);

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('record-mission error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
