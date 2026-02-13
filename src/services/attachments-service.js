import { supabase } from '../api/supabase-client.js';

const BUCKET_NAME = 'task-attachments';

export async function uploadAttachment(taskId, file) {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());
  const safeName = file.name.replace(/\s+/g, '-');
  const filePath = `${taskId}/${suffix}-${safeName}`;

  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('attachments')
    .insert([{ task_id: taskId, file_url: publicUrl.publicUrl, file_name: file.name }])
    .select()
    .single();

  if (error) throw error;
  return data;
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

export async function deleteAttachmentRecord(attachmentId) {
  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId);

  if (error) throw error;
  return true;
}
