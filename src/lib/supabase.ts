import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isConfigured) {
  console.warn('Supabase not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing). Supabase features will be disabled.');
}

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        fetch: (...args) => {
          return Promise.race([
            fetch(...args),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), 30000)
            ),
          ]);
        },
      },
    })
  : null;

export const isSupabaseEnabled = isConfigured;
