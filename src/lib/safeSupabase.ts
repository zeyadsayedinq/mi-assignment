// safeSupabase.ts — wraps supabase calls with a check so placeholder URL never throws
import { supabase } from './supabase';

const isConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return !!url && !url.includes('placeholder');
};

// Safe wrapper — returns null data silently when Supabase is not configured
export const safeSupabase = {
  from: (table: string) => {
    if (!isConfigured()) {
      // Return a fake chainable that resolves to empty data
      const noop: any = new Proxy({}, {
        get: () => (..._args: any[]) => {
          if (['select','insert','update','upsert','delete','eq','gte','lte','in','is','not','limit','single','order','range'].includes(noop.__method)) return noop;
          return Promise.resolve({ data: null, error: null, count: 0 });
        }
      });
      return noop;
    }
    return supabase.from(table);
  },
  get auth() {
    return supabase.auth;
  }
};
