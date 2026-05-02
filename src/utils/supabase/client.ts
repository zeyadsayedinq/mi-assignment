import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

const isMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
if (isMissing) {
  console.warn('[Mi-Assignment] Supabase env vars not set. Auth and vault disabled. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Netlify environment variables.');
}

// Safe client — never throws on missing URL, just silently fails auth calls
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: !isMissing, autoRefreshToken: !isMissing },
});

export const createClient = () => supabase;
