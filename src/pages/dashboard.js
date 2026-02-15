import { getCurrentUserProfile, logoutUser } from '../services/auth-service.js';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/tasks-service.js';
import { fetchProjects } from '../services/projects-service.js';
import { uploadUserFile, listUserFiles, getUserFileDownloadUrl } from '../services/user-files-service.js';
import { formatDate, isOverdue } from '../utils/date-utils.js';
import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const alertBox = qs('#dashboard-alert');
const tasksTableBody = qs('#tasks-table-body');
const tasksCards = qs('#tasks-cards');
const tasksEmpty = qs('#tasks-empty');
const sortButton = qs('#sort-deadline');
const taskForm = qs('#task-form');
const projectSelect = qs('#task-project');
const summaryTotal = qs('#summary-total');
const summaryOpen = qs('#summary-open');
const summaryCompleted = qs('#summary-completed');
const summaryOverdue = qs('#summary-overdue');
const greeting = qs('#user-greeting');
const adminLink = qs('#admin-link');
const kanbanBoard = qs('#kanban-board');
const userFileForm = qs('#user-file-form');
const userFileInput = qs('#user-file-input');
const userFilesList = qs('#user-files-list');

const STATUS_LABELS = {
  not_started: 'To Do',
  in_progress: 'In Progress',
  done: 'Complete',
};

let tasks = [];
let projects = [];
let activeFilter = 'all';
let sortDirection = 'asc';
let currentUserId = null;
let selectedProjectId = null;

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 10 ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

async function renderUserFiles() {
  if (!userFilesList || !currentUserId) return;

  const files = await listUserFiles(currentUserId);
  userFilesList.innerHTML = '';

  if (!files.length) {
    userFilesList.innerHTML = '<div class="dmq-empty">No files uploaded yet.</div>';
    return;
  }

  files.forEach((file) => {
    const item = document.createElement('div');
    item.className = 'd-flex justify-content-between align-items-center border rounded-3 p-2 mb-2 gap-2';
    item.innerHTML = `
      <div class="text-truncate">
        <div class="fw-semibold text-truncate">${file.name}</div>
        <div class="small text-muted">${formatFileSize(file.size)} · ${formatDate(file.created_at)}</div>
      </div>
      <button class="btn btn-sm btn-outline-dark" data-file-download="${file.path}" data-file-name="${file.name}">
        Download
      </button>
    `;
    userFilesList.appendChild(item);
  });
}

function applyFilterSort(items) {
  const filtered = activeFilter === 'all'
    ? items
    : activeFilter === 'incomplete'
      ? items.filter((task) => task.status !== 'done')
      : items.filter((task) => task.status === activeFilter);

  return [...filtered].sort((a, b) => {
    const aDate = new Date(a.deadline || 0);
    const bDate = new Date(b.deadline || 0);
    return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
  });
}

function renderSummary() {
  const total = tasks.length;
  const open = tasks.filter((task) => task.status !== 'done').length;
  const completed = tasks.filter((task) => task.status === 'done').length;
  const overdue = tasks.filter((task) => isOverdue(task)).length;
  summaryTotal.textContent = total;
  summaryOpen.textContent = open;
  summaryCompleted.textContent = completed;
  summaryOverdue.textContent = overdue;
}

function statusBadgeClass(status) {
  if (status === 'done') return 'status-completed';
  if (status === 'in_progress') return 'status-open';
  return 'status-open';
}

function getToggleLabel(status) {
  return status === 'done' ? 'Reopen' : 'Complete';
}

function getToggledStatus(status) {
  return status === 'done' ? 'not_started' : 'done';
}

function renderKanban() {
  const columns = qsa('[data-board-list]', kanbanBoard);
  columns.forEach((column) => {
    column.innerHTML = '';
  });

  const sorted = [...tasks].sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));

  sorted.forEach((task) => {
    const status = STATUS_LABELS[task.status] ? task.status : 'not_started';
    const column = qs(`[data-board-status="${status}"]`, kanbanBoard);
    if (!column) return;

    const card = document.createElement('div');
    card.className = 'task-card mb-2';
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-meta">${formatDate(task.deadline)}</div>
      <div><span class="status-badge ${statusBadgeClass(task.status)}">${STATUS_LABELS[status]}</span></div>
    `;
    column.appendChild(card);
  });
}

function renderTasks() {
  const viewTasks = applyFilterSort(tasks);
  tasksTableBody.innerHTML = '';
  tasksCards.innerHTML = '';

  if (!viewTasks.length) {
    tasksEmpty.classList.remove('d-none');
    return;
  }

  tasksEmpty.classList.add('d-none');

  viewTasks.forEach((task) => {
    const overdue = isOverdue(task);
    const statusBadge = statusBadgeClass(task.status);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.title}</td>
      <td class="text-muted">${task.description || '-'}</td>
      <td class="${overdue ? 'status-overdue' : ''}">${formatDate(task.deadline)}</td>
      <td><span class="status-badge ${statusBadge}">${STATUS_LABELS[task.status] || STATUS_LABELS.not_started}</span></td>
      <td>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-dark" data-action="view" data-id="${task.id}">View</button>
          <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${task.id}">
            ${getToggleLabel(task.status)}
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </td>
    `;
    tasksTableBody.appendChild(row);

    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="task-meta">${task.description || '-'}</div>
      <div class="task-meta ${overdue ? 'status-overdue' : ''}">Deadline: ${formatDate(task.deadline)}</div>
      <div><span class="status-badge ${statusBadge}">${STATUS_LABELS[task.status] || STATUS_LABELS.not_started}</span></div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm btn-outline-dark" data-action="view" data-id="${task.id}">View</button>
        <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${task.id}">
          ${getToggleLabel(task.status)}
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    `;
    tasksCards.appendChild(card);
  });

  renderKanban();
}

function renderProjects() {
  projectSelect.innerHTML = '<option value="">No project</option>';
  projects.forEach((project) => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    projectSelect.appendChild(option);
  });
}

async function refreshDashboard() {
  clearAlert(alertBox);
  tasks = await fetchTasks(currentUserId);
  renderSummary();
  renderTasks();
}

async function initDashboard() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }
  currentUserId = user.id;
  greeting.textContent = `Welcome, ${user.full_name || user.email}`;
  if (adminLink) {
    adminLink.classList.toggle('d-none', user.role !== 'admin');
  }

  try {
    projects = await fetchProjects(currentUserId);
    renderProjects();

    const params = new URLSearchParams(window.location.search);
    const queryProject = params.get('project');
    if (queryProject && projects.some((project) => project.id === queryProject)) {
      selectedProjectId = queryProject;
      projectSelect.value = selectedProjectId;
      setAlert(alertBox, 'Project selected. Create or manage tasks for this project.', 'info');
    }

    await refreshDashboard();
    await renderUserFiles();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to load dashboard data.');
  }
}

qsa('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    qsa('[data-filter]').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderTasks();
  });
});

kanbanBoard.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', card.dataset.taskId);
});

qsa('[data-board-status]', kanbanBoard).forEach((column) => {
  column.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    column.classList.add('kanban-drop-active');
  });

  column.addEventListener('dragleave', () => {
    column.classList.remove('kanban-drop-active');
  });

  column.addEventListener('drop', async (event) => {
    event.preventDefault();
    column.classList.remove('kanban-drop-active');

    const taskId = event.dataTransfer.getData('text/plain');
    const nextStatus = column.dataset.boardStatus;
    if (!taskId || !nextStatus) return;

    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === nextStatus) return;

    try {
      await updateTask(taskId, { status: nextStatus });
      await refreshDashboard();
    } catch (error) {
      setAlert(alertBox, error.message || 'Unable to move task on board.');
    }
  });
});

sortButton.addEventListener('click', () => {
  sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  sortButton.textContent = `Sort: ${sortDirection.toUpperCase()}`;
  renderTasks();
});

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = taskForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Saving...');

  try {
    const formData = new FormData(taskForm);
    await createTask({
      user_id: currentUserId,
      project_id: formData.get('project') || null,
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      deadline: formData.get('deadline'),
      status: formData.get('status'),
      priority: formData.get('priority'),
    });
    taskForm.reset();
    await refreshDashboard();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to create task.');
  } finally {
    setLoading(submitButton, false);
  }
});

qs('#tasks-panel').addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const taskId = target.dataset.id;
  if (!taskId) return;

  try {
    if (target.dataset.action === 'view') {
      window.location.href = `./task-details.html?id=${taskId}`;
      return;
    }

    if (target.dataset.action === 'toggle') {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      const status = getToggledStatus(task.status);
      await updateTask(taskId, { status });
      await refreshDashboard();
      return;
    }

    if (target.dataset.action === 'delete') {
      const confirmed = window.confirm('Delete this task?');
      if (!confirmed) return;
      await deleteTask(taskId);
      await refreshDashboard();
    }
  } catch (error) {
    setAlert(alertBox, error.message || 'Action failed.');
  }
});

qs('#logout-button').addEventListener('click', async () => {
  await logoutUser();
  window.location.href = './index.html';
});

if (userFileForm && userFileInput && userFilesList) {
  userFileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(alertBox);

    const file = userFileInput.files?.[0];
    if (!file) {
      setAlert(alertBox, 'Select a file first.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAlert(alertBox, 'Max file size is 10MB.');
      return;
    }

    const submitButton = userFileForm.querySelector('button[type="submit"]');
    setLoading(submitButton, true, 'Uploading...');

    try {
      await uploadUserFile(currentUserId, file);
      userFileInput.value = '';
      await renderUserFiles();
      setAlert(alertBox, 'File uploaded successfully.', 'success');
    } catch (error) {
      setAlert(alertBox, error.message || 'Unable to upload file.');
    } finally {
      setLoading(submitButton, false);
    }
  });

  userFilesList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-file-download]');
    if (!button) return;

    const filePath = button.dataset.fileDownload;
    const fileName = button.dataset.fileName || 'download';
    if (!filePath) return;

    button.disabled = true;
    try {
      const url = await getUserFileDownloadUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    } catch (error) {
      setAlert(alertBox, error.message || 'Unable to download file.');
    } finally {
      button.disabled = false;
    }
  });
}

initDashboard();
applyTimeTheme();
