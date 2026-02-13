import { supabase } from '../api/supabase-client.js';

const BUCKET_NAME = 'task-attachments';

export async function uploadAttachment(taskId, userId, file) {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());
  const safeName = file.name.replace(/\s+/g, '-');
  const filePath = `${userId}/${taskId}/${suffix}-${safeName}`;

  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('attachments')
    .insert([{ task_id: taskId, file_url: filePath, file_name: file.name }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSignedUrl(filePath, expiresInSeconds = 3600) {
  const { data, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

export async function listAttachments(taskId) {
  const { data, error } = await supabase
    .from('attachments')
    .select('id, task_id, file_url, file_name, uploaded_at')
    .eq('task_id', taskId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteAttachment(attachmentId, filePath) {
  const { error: storageError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (storageError) throw storageError;

  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId);

  if (error) throw error;
  return true;
}
