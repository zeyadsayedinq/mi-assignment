import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function setCORS(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); return res.status(200).end(); }
  if (req.method !== 'POST') { setCORS(res); return res.status(405).end('Method Not Allowed'); }

  try {
    const { userId, result, files, prompt, university, course, missionType, lang } = req.body;
    if (!userId) setCORS(res); return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    const missionData = {
      user_id: userId,
      payload_name: files?.length > 0 ? files[0].name : (prompt?.substring(0, 80) || "Mission"),
      university: university || null,
      course: course || null,
      assignment_type: result?.assignment_type || missionType || "other",
      status: "SUCCESS",
      summary: result?.solution_text?.substring(0, 300) || "",
      solution_data: result,
      lang: lang || "en",
    };

    const { data, error } = await supabase.from("missions").insert(missionData).select().single();
    if (error) throw error;

    setCORS(res); return res.status(200).json({ success: true, missionId: data.id });
  } catch (e) {
    setCORS(res); return res.status(500).json({ error: e.message });
  }
};
