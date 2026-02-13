import { getCurrentUserProfile } from '../services/auth-service.js';
import { fetchTaskById, updateTask } from '../services/tasks-service.js';
import { fetchProjects } from '../services/projects-service.js';
import { uploadAttachment, listAttachments, getSignedUrl, deleteAttachment } from '../services/attachments-service.js';
import { formatDate, toInputDate } from '../utils/date-utils.js';
import { qs, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';

const alertBox = qs('#task-alert');
const taskTitle = qs('#task-title');
const taskMeta = qs('#task-meta');
const taskForm = qs('#task-form');
const attachmentsList = qs('#attachments-list');
const attachmentForm = qs('#attachment-form');
const projectSelect = qs('#task-project');

let currentUserId = null;
let taskId = null;

async function renderAttachments() {
  const attachments = await listAttachments(taskId);
  attachmentsList.innerHTML = '';

  if (!attachments.length) {
    attachmentsList.innerHTML = '<div class="dmq-empty">No attachments yet.</div>';
    return;
  }

  const signedUrls = await Promise.all(
    attachments.map(async (attachment) => {
      try {
        return await getSignedUrl(attachment.file_url);
      } catch (error) {
        return '';
      }
    })
  );

  attachments.forEach((attachment, index) => {
    const signedUrl = signedUrls[index];
    const item = document.createElement('div');
    item.className = 'd-flex justify-content-between align-items-center border rounded-3 p-3 mb-2';
    item.innerHTML = `
      <div>
        <div class="fw-semibold">${attachment.file_name}</div>
        <div class="text-muted small">Uploaded ${formatDate(attachment.uploaded_at)}</div>
      </div>
      <div class="d-flex gap-2">
        <a class="btn btn-sm btn-outline-dark" href="${signedUrl}" target="_blank" rel="noreferrer">Open</a>
        <a class="btn btn-sm btn-outline-secondary" href="${signedUrl}" download>Download</a>
        <button class="btn btn-sm btn-outline-danger" data-attachment-id="${attachment.id}" data-file-path="${attachment.file_url}">Remove</button>
      </div>
    `;
    attachmentsList.appendChild(item);
  });
}

async function loadTask() {
  const task = await fetchTaskById(taskId);
  taskTitle.textContent = task.title;
  taskMeta.textContent = `Last updated: ${formatDate(task.updated_at)}`;

  taskForm.title.value = task.title;
  taskForm.description.value = task.description || '';
  taskForm.deadline.value = toInputDate(task.deadline);
  taskForm.status.value = task.status;
  taskForm.priority.value = task.priority;
  taskForm.project.value = task.project_id || '';
}

async function loadProjects() {
  const projects = await fetchProjects(currentUserId);
  projectSelect.innerHTML = '<option value="">No project</option>';
  projects.forEach((project) => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    projectSelect.appendChild(option);
  });
}

async function initPage() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }
  currentUserId = user.id;

  const params = new URLSearchParams(window.location.search);
  taskId = params.get('id');
  if (!taskId) {
    setAlert(alertBox, 'Task id missing.');
    return;
  }

  try {
    await loadProjects();
    await loadTask();
    await renderAttachments();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to load task.');
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = taskForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Saving...');

  try {
    await updateTask(taskId, {
      title: taskForm.title.value.trim(),
      description: taskForm.description.value.trim(),
      deadline: taskForm.deadline.value,
      status: taskForm.status.value,
      priority: taskForm.priority.value,
      project_id: taskForm.project.value || null,
      user_id: currentUserId,
    });
    await loadTask();
    setAlert(alertBox, 'Task updated.', 'success');
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to update task.');
  } finally {
    setLoading(submitButton, false);
  }
});

attachmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = attachmentForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Uploading...');

  try {
    const fileInput = attachmentForm.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    if (!file) {
      setAlert(alertBox, 'Select a file to upload.');
      return;
    }
    await uploadAttachment(taskId, currentUserId, file);
    fileInput.value = '';
    await renderAttachments();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to upload file.');
  } finally {
    setLoading(submitButton, false);
  }
});

attachmentsList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-attachment-id]');
  if (!button) return;
  const attachmentId = button.dataset.attachmentId;
  const filePath = button.dataset.filePath;
  const confirmed = window.confirm('Remove this attachment record?');
  if (!confirmed) return;

  try {
    await deleteAttachment(attachmentId, filePath);
    await renderAttachments();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to remove attachment.');
  }
});

initPage();
