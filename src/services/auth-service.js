import { supabase, getCurrentUser, getUserProfile } from './supabase-client.js';

export async function register(email, password, fullName) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) throw authError;

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert([
      {
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    if (profileError) throw profileError;

    return authData.user;
  } catch (error) {
    console.error('Registration error:', error.message);
    throw error;
  }
}

export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store token
    if (data.session) {
      localStorage.setItem('supabase_auth_token', data.session.access_token);
    }

    return data.user;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('supabase_auth_token');
    return true;
  } catch (error) {
    console.error('Logout error:', error.message);
    throw error;
  }
}

export async function getCurrentUserWithProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const profile = await getUserProfile(user.id);
    return { ...user, ...profile };
  } catch (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
}

export async function isAdmin() {
  try {
    const user = await getCurrentUserWithProfile();
    return user && user.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error.message);
    return false;
  }
}

export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating profile:', error.message);
    throw error;
  }
}
