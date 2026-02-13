import { getCurrentUserProfile, logoutUser } from '../services/auth-service.js';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/tasks-service.js';
import { fetchProjects } from '../services/projects-service.js';
import { formatDate, isOverdue } from '../utils/date-utils.js';
import { qs, qsa, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';

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

let tasks = [];
let projects = [];
let activeFilter = 'all';
let sortDirection = 'asc';
let currentUserId = null;

function applyFilterSort(items) {
  const filtered = activeFilter === 'all'
    ? items
    : items.filter((task) => task.status === activeFilter);

  return [...filtered].sort((a, b) => {
    const aDate = new Date(a.deadline || 0);
    const bDate = new Date(b.deadline || 0);
    return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
  });
}

function renderSummary() {
  const total = tasks.length;
  const open = tasks.filter((task) => task.status === 'open').length;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const overdue = tasks.filter((task) => isOverdue(task)).length;
  summaryTotal.textContent = total;
  summaryOpen.textContent = open;
  summaryCompleted.textContent = completed;
  summaryOverdue.textContent = overdue;
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
    const statusBadge = task.status === 'completed'
      ? 'status-completed'
      : 'status-open';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${task.title}</td>
      <td class="text-muted">${task.description || '-'}</td>
      <td class="${overdue ? 'status-overdue' : ''}">${formatDate(task.deadline)}</td>
      <td><span class="status-badge ${statusBadge}">${task.status}</span></td>
      <td>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-dark" data-action="view" data-id="${task.id}">View</button>
          <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${task.id}">
            ${task.status === 'open' ? 'Complete' : 'Reopen'}
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
      <div><span class="status-badge ${statusBadge}">${task.status}</span></div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm btn-outline-dark" data-action="view" data-id="${task.id}">View</button>
        <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${task.id}">
          ${task.status === 'open' ? 'Complete' : 'Reopen'}
        </button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    `;
    tasksCards.appendChild(card);
  });
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
  if (adminLink && user.role !== 'admin') {
    adminLink.classList.add('d-none');
  }

  try {
    projects = await fetchProjects(currentUserId);
    renderProjects();
    await refreshDashboard();
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
      const status = task.status === 'open' ? 'completed' : 'open';
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

initDashboard();
