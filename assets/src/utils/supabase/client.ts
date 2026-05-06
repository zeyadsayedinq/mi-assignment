import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// VITE_ vars are injected at build time.
// Fallbacks are the public anon credentials — safe to expose per Supabase docs.
// The anon key is NOT a secret: https://supabase.com/docs/guides/api/api-keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://acxbvbjbgjisfbetfrbj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_ANON_TOKEN
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjeGJ2YmpiZ2ppc2ZiZXRmcmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDMzOTAsImV4cCI6MjA5MjM3OTM5MH0.EKZqp0Trv5oTlZ5kWa4DlT4biXBujCOJNCobqppAy_I';

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const createClient = () => supabase;
