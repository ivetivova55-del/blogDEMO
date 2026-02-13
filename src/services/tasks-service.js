import { supabase } from '../api/supabase-client.js';

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, project_id, user_id, title, description, deadline, status, priority, updated_at, created_at')
    .eq('user_id', userId)
    .order('deadline', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchTaskById(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, project_id, user_id, title, description, deadline, status, priority, updated_at, created_at')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  return true;
}
