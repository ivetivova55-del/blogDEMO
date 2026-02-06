import { supabase } from './supabase-client.js';

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error.message);
    throw error;
  }
}

export async function getUserStats() {
  try {
    const { count: userCount } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const { count: articleCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact' })
      .eq('status', 'published');

    return {
      totalUsers: userCount || 0,
      totalArticles: articleCount || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    throw error;
  }
}

export async function updateUserRole(userId, role) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date() })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating user role:', error.message);
    throw error;
  }
}

export async function deleteUser(userId) {
  try {
    // Delete user articles first
    await supabase
      .from('articles')
      .delete()
      .eq('author_id', userId);

    // Delete user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
}
