import { supabase, getCurrentUser, getUserProfile } from '../api/supabase-client.js';

function normalizeRole(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'admin' ? 'admin' : 'user';
}

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

async function upsertUserProfile(userId, email, fullName) {
  const payload = {
    id: userId,
    email,
    full_name: fullName,
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (!profileError) return;
  if (!isMissingTableError(profileError)) throw profileError;

  const { error: usersError } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'id' });

  if (usersError && !isMissingTableError(usersError)) {
    throw usersError;
  }
}

async function resolveCurrentUserProfile(userId) {
  try {
    return await getUserProfile(userId);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  return data || null;
}

export async function registerUser({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  if (data?.user) {
    await upsertUserProfile(data.user.id, email, fullName);
  }

  return data;
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await resolveCurrentUserProfile(user.id);
  if (!profile) {
    return {
      ...user,
      full_name: user.user_metadata?.full_name || null,
      role: 'user',
    };
  }

  return { ...user, ...profile, role: normalizeRole(profile.role) };
}
