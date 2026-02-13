import { getCurrentUserProfile } from '../services/auth-service.js';
import { fetchProjects, createProject, updateProject, deleteProject } from '../services/projects-service.js';
import { qs, setAlert, clearAlert, setLoading } from '../utils/dom-utils.js';

const alertBox = qs('#projects-alert');
const projectForm = qs('#project-form');
const projectsTable = qs('#projects-table-body');
const projectsEmpty = qs('#projects-empty');
const cancelEditButton = qs('#cancel-edit');

let currentUserId = null;
let editingId = null;

function resetForm() {
  projectForm.reset();
  editingId = null;
  cancelEditButton.classList.add('d-none');
  projectForm.querySelector('button[type="submit"]').textContent = 'Add project';
}

function renderProjects(projects) {
  projectsTable.innerHTML = '';

  if (!projects.length) {
    projectsEmpty.classList.remove('d-none');
    return;
  }

  projectsEmpty.classList.add('d-none');

  projects.forEach((project) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${project.name}</td>
      <td class="text-muted">${project.description || '-'}</td>
      <td>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-dark" data-action="edit" data-id="${project.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${project.id}">Delete</button>
        </div>
      </td>
    `;
    projectsTable.appendChild(row);
  });
}

async function refreshProjects() {
  const projects = await fetchProjects(currentUserId);
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
    const row = button.closest('tr');
    projectForm.name.value = row.children[0].textContent.trim();
    projectForm.description.value = row.children[1].textContent.trim() === '-' ? '' : row.children[1].textContent.trim();
    editingId = projectId;
    cancelEditButton.classList.remove('d-none');
    projectForm.querySelector('button[type="submit"]').textContent = 'Update project';
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

initProjects();
