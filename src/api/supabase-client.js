import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const runtime = typeof window !== 'undefined' ? window : {};

const SUPABASE_URL =
  env.VITE_SUPABASE_URL ||
  runtime.__SUPABASE_URL__ ||
  'https://yyxgypweuknkxtbxzipp.supabase.co';

const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  runtime.__SUPABASE_ANON_KEY__ ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eGd5cHdldWtua3h0Ynh6aXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzc1MDIsImV4cCI6MjA4NTk1MzUwMn0.Uu4i13C-V3gZISyQIoxFcOkwNouTawX3pEvK8KuQyy4';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
