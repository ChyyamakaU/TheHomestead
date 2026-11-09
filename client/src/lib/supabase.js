import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client — used only for Google OAuth on the frontend.
 *
 * Only the ANON key is used here — it is safe to expose in the browser.
 * The SERVICE ROLE KEY lives exclusively on the Express server and is
 * never referenced in any frontend file.
 */
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Google sign-in will not work until these are configured in client/.env'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '');
