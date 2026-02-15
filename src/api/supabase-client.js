import { createClient } from '@supabase/supabase-js';

const runtime = typeof window !== 'undefined' ? window : {};

let VITE_SUPABASE_URL = '';
let VITE_SUPABASE_PUBLISHABLE_KEY = '';
let VITE_SUPABASE_ANON_KEY = '';

try {
  VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  VITE_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
} catch {
  // Running outside Vite (e.g. direct file://). Fall back to runtime window vars.
}

const SUPABASE_URL =
  VITE_SUPABASE_URL ||
  runtime.__SUPABASE_URL__ ||
  '';

const SUPABASE_PUBLISHABLE_KEY =
  VITE_SUPABASE_PUBLISHABLE_KEY ||
  VITE_SUPABASE_ANON_KEY ||
  runtime.__SUPABASE_PUBLISHABLE_KEY__ ||
  runtime.__SUPABASE_ANON_KEY__ ||
  '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase env vars: VITE_SUPABASE_URL and (VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY). '
      + 'If you just created/edited .env, restart the Vite dev server.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}
