import { supabase } from '../api/supabase-client.js';

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchSystemTaskCount() {
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}
