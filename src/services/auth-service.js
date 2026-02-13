import { supabase, getCurrentUser, getUserProfile } from '../api/supabase-client.js';

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
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'user',
      }, { onConflict: 'id' });

    if (profileError) throw profileError;
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
  const profile = await getUserProfile(user.id);
  return { ...user, ...profile };
}
