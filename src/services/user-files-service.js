import { supabase } from '../api/supabase-client.js';

const BUCKET_NAME = 'task-attachments';
const USER_FILES_FOLDER = 'user-files';

function getSafeName(fileName) {
  return fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
}

function getFolderPath(userId) {
  return `${userId}/${USER_FILES_FOLDER}`;
}

function getFilePath(userId, fileName) {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());
  return `${getFolderPath(userId)}/${suffix}-${getSafeName(fileName)}`;
}

export async function uploadUserFile(userId, file) {
  const path = getFilePath(userId, file.name);

  const { error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  return {
    name: file.name,
    path,
    size: file.size,
    created_at: new Date().toISOString(),
  };
}

export async function listUserFiles(userId) {
  const folder = getFolderPath(userId);

  const { data, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) throw error;

  return (data || [])
    .filter((entry) => entry.name && !entry.id?.endsWith('/'))
    .map((entry) => ({
      name: entry.name,
      path: `${folder}/${entry.name}`,
      size: entry.metadata?.size || 0,
      created_at: entry.created_at,
    }));
}

export async function getUserFileDownloadUrl(filePath, expiresInSeconds = 3600) {
  const { data, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresInSeconds, {
      download: true,
    });

  if (error) throw error;
  return data.signedUrl;
}

export async function getUserFileViewUrl(filePath, expiresInSeconds = 3600) {
  const { data, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteUserFile(filePath) {
  const { error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
  return true;
}
