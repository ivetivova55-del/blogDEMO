import { supabase } from '../api/supabase-client.js';

function isMissingTableError(error) {
  const message = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
}

async function queryUsersFromProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return data || [];
}

async function queryUsersFromUsersTable() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAllUsers() {
  const profilesData = await queryUsersFromProfiles();
  if (profilesData) return profilesData;
  return queryUsersFromUsersTable();
}

export async function fetchSystemTaskCount() {
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export async function fetchSystemProjectCount() {
  const { count, error } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export async function updateUserRole(userId, role) {
  const payload = { role };

  const { error: profileError } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (profileError && !isMissingTableError(profileError)) {
    throw profileError;
  }

  const { error: usersError } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId);

  if (usersError && !isMissingTableError(usersError)) {
    throw usersError;
  }

  return true;
}
