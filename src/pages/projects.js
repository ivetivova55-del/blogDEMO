import { getCurrentUserProfile } from '../services/auth-service.js';
import { fetchProjects, createProject, updateProject, deleteProject } from '../services/projects-service.js';
import { fetchTasks } from '../services/tasks-service.js';
import { qs, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const alertBox = qs('#projects-alert');
const projectForm = qs('#project-form');
const projectsTable = qs('#projects-table-body');
const projectsEmpty = qs('#projects-empty');
const cancelEditButton = qs('#cancel-edit');
const projectsSearchInput = qs('#projects-search');
const projectsSortSelect = qs('#projects-sort');
const projectsRefreshButton = qs('#projects-refresh');
const projectsSummaryCount = qs('#projects-summary-count');

let currentUserId = null;
let editingId = null;
let currentProjects = [];
let currentTasks = [];
let searchTerm = '';
let sortMode = 'created_desc';

function resetForm() {
  projectForm.reset();
  editingId = null;
  cancelEditButton.classList.add('d-none');
  projectForm.querySelector('button[type="submit"]').textContent = 'Add project';
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('en-GB');
  } catch {
    return '-';
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getProjectProgress(projectId) {
  const projectTasks = currentTasks.filter((task) => task.project_id === projectId);
  const total = projectTasks.length;
  const completed = projectTasks.filter((task) => task.status === 'done').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

function applySearchSort(projects) {
  const term = String(searchTerm || '').trim().toLowerCase();
  const filtered = term
    ? (projects || []).filter((project) => {
        const name = String(project.name || '').toLowerCase();
        const description = String(project.description || '').toLowerCase();
        return name.includes(term) || description.includes(term);
      })
    : (projects || []);

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sortMode === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''));
    if (sortMode === 'name_desc') return String(b.name || '').localeCompare(String(a.name || ''));
    if (sortMode === 'created_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortMode === 'progress_desc') return getProjectProgress(b.id).percent - getProjectProgress(a.id).percent;
    if (sortMode === 'progress_asc') return getProjectProgress(a.id).percent - getProjectProgress(b.id).percent;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return sorted;
}

function startEdit(project) {
  editingId = project.id;
  projectForm.name.value = project.name || '';
  projectForm.description.value = project.description || '';
  cancelEditButton.classList.remove('d-none');
  projectForm.querySelector('button[type="submit"]').textContent = 'Save changes';
}

function renderProjects(projects) {
  projectsTable.innerHTML = '';

  const viewProjects = applySearchSort(projects);
  if (projectsSummaryCount) {
    projectsSummaryCount.textContent = String(viewProjects.length);
  }

  if (!viewProjects.length) {
    projectsEmpty.classList.remove('d-none');
    return;
  }

  projectsEmpty.classList.add('d-none');

  viewProjects.forEach((project) => {
    const safeName = escapeHtml(project.name);
    const safeDesc = escapeHtml(project.description || '-');
    const createdLabel = formatDate(project.created_at);
    const { total, completed, percent } = getProjectProgress(project.id);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${safeName}</td>
      <td class="text-muted">${safeDesc}</td>
      <td class="text-muted">${createdLabel}</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="progress" style="height: 6px; width: 140px;">
            <div class="progress-bar" style="width: ${percent}%;"></div>
          </div>
          <span class="small text-muted">${percent}% · ${completed}/${total}</span>
        </div>
      </td>
      <td>
        <div class="d-flex gap-2 flex-wrap justify-content-end">
          <button class="btn btn-sm btn-outline-dark" data-action="open" data-id="${project.id}">Open</button>
          <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${project.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${project.id}">Delete</button>
        </div>
      </td>
    `;
    projectsTable.appendChild(row);
  });
}

async function refreshProjects() {
  const [projects, tasks] = await Promise.all([
    fetchProjects(currentUserId),
    fetchTasks(currentUserId),
  ]);
  currentProjects = projects;
  currentTasks = tasks;
  renderProjects(projects);
}

async function initProjects() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }
  currentUserId = user.id;
  await refreshProjects();
}

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert(alertBox);
  const submitButton = projectForm.querySelector('button[type="submit"]');
  setLoading(submitButton, true, 'Saving...');

  try {
    const payload = {
      user_id: currentUserId,
      name: projectForm.name.value.trim(),
      description: projectForm.description.value.trim(),
    };

    if (editingId) {
      await updateProject(editingId, payload);
    } else {
      await createProject(payload);
    }

    resetForm();
    await refreshProjects();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to save project.');
  } finally {
    setLoading(submitButton, false);
  }
});

projectsTable.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const projectId = button.dataset.id;
  if (!projectId) return;

  if (button.dataset.action === 'edit') {
    const project = currentProjects.find((item) => item.id === projectId);
    if (project) {
      startEdit(project);
    }
    return;
  }

  if (button.dataset.action === 'open') {
    window.location.href = `./dashboard.html?project=${encodeURIComponent(projectId)}`;
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm('Delete this project?');
    if (!confirmed) return;
    try {
      await deleteProject(projectId);
      await refreshProjects();
    } catch (error) {
      setAlert(alertBox, error.message || 'Unable to delete project.');
    }
  }
});

cancelEditButton.addEventListener('click', () => {
  resetForm();
});

if (projectsSearchInput) {
  projectsSearchInput.addEventListener('input', () => {
    searchTerm = projectsSearchInput.value;
    renderProjects(currentProjects);
  });
}

if (projectsSortSelect) {
  projectsSortSelect.addEventListener('change', () => {
    sortMode = projectsSortSelect.value;
    renderProjects(currentProjects);
  });
}

if (projectsRefreshButton) {
  projectsRefreshButton.addEventListener('click', async () => {
    try {
      await refreshProjects();
    } catch (error) {
      setAlert(alertBox, error.message || 'Unable to refresh projects.');
    }
  });
}

initProjects();
applyTimeTheme();
