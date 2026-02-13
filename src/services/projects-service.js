import { supabase } from '../api/supabase-client.js';

const DEFAULT_PROJECT_STAGES = [
  { name: 'Not Started', position: 1 },
  { name: 'In Progress', position: 2 },
  { name: 'Done', position: 3 },
];

function isMissingTableError(error) {
  const message = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  );
}

async function createDefaultStages(projectId) {
  const payload = DEFAULT_PROJECT_STAGES.map((stage) => ({
    project_id: projectId,
    name: stage.name,
    position: stage.position,
  }));

  const { error } = await supabase
    .from('project_stages')
    .upsert(payload, { onConflict: 'project_id,name' });

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

export async function fetchProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, name, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProject(project) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) throw error;

  await createDefaultStages(data.id);
  return data;
}

export async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
  return true;
}
