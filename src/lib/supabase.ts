import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[Supabase] URL ou clé manquante — Supabase désactivé');
}

export const supabase = (url && key)
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
      global: {
        fetch: (...args: Parameters<typeof fetch>) =>
          Promise.race([
            fetch(...args),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Supabase timeout')), 8000),
            ),
          ]),
      },
    })
  : null;
