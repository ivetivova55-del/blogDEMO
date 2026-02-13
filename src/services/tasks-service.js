import { supabase } from '../api/supabase-client.js';

function mapStatusFromDb(status) {
  if (!status) return 'open';

  const value = String(status).toLowerCase();
  if (value === 'done' || value === 'completed') return 'completed';
  return 'open';
}

function mapStatusToDb(status) {
  if (!status) return 'not_started';

  const value = String(status).toLowerCase();
  if (value === 'completed' || value === 'done') return 'done';
  if (value === 'in_progress') return 'in_progress';
  return 'not_started';
}

function normalizeTask(task) {
  if (!task) return task;
  return {
    ...task,
    status: mapStatusFromDb(task.status),
  };
}

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, project_id, user_id, title, description, deadline, status, priority, updated_at, created_at')
    .eq('user_id', userId)
    .order('deadline', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeTask);
}

export async function fetchTaskById(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, project_id, user_id, title, description, deadline, status, priority, updated_at, created_at')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return normalizeTask(data);
}

export async function createTask(task) {
  const payload = {
    ...task,
    status: mapStatusToDb(task.status),
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return normalizeTask(data);
}

export async function updateTask(taskId, updates) {
  const payload = {
    ...updates,
    status: updates.status ? mapStatusToDb(updates.status) : updates.status,
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return normalizeTask(data);
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  return true;
}
