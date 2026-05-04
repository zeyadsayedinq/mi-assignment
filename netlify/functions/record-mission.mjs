import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  try {
    const { userId, result, files, prompt, university, course, missionType, lang } = JSON.parse(event.body || '{}');
    if (!userId) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

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

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, missionId: data.id }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
