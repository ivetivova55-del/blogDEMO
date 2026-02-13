import { getCurrentUserProfile } from '../services/auth-service.js';
import {
  fetchAllUsers,
  fetchSystemTaskCount,
  fetchSystemProjectCount,
  updateUserRole,
} from '../services/admin-service.js';
import { qs, setAlert, clearAlert } from '../utils/dom-utils.js';
import { applyTimeTheme } from '../utils/time-theme.js';

const alertBox = qs('#admin-alert');
const usersTable = qs('#users-table-body');
const systemTaskCount = qs('#system-task-count');
const systemProjectCount = qs('#system-project-count');
const usersEmpty = qs('#users-empty');

let currentAdmin = null;

function renderUsers(users) {
  usersTable.innerHTML = '';

  if (!users.length) {
    usersEmpty.classList.remove('d-none');
    return;
  }

  usersEmpty.classList.add('d-none');

  users.forEach((profile) => {
    const role = profile.role || 'user';
    const nextRole = role === 'admin' ? 'user' : 'admin';
    const actionLabel = role === 'admin' ? 'Demote to user' : 'Promote to admin';
    const disableRoleChange = profile.id === currentAdmin?.id;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${profile.full_name || '-'}</td>
      <td>${profile.email}</td>
      <td><span class="badge text-bg-light border">${role}</span></td>
      <td>${profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</td>
      <td>
        <button
          class="btn btn-sm btn-outline-dark"
          data-action="toggle-role"
          data-id="${profile.id}"
          data-next-role="${nextRole}"
          ${disableRoleChange ? 'disabled' : ''}
        >
          ${disableRoleChange ? 'Current admin' : actionLabel}
        </button>
      </td>
    `;
    usersTable.appendChild(row);
  });
}

async function loadAdminData() {
  const [users, taskCount, projectCount] = await Promise.all([
    fetchAllUsers(),
    fetchSystemTaskCount(),
    fetchSystemProjectCount(),
  ]);

  systemTaskCount.textContent = taskCount;
  systemProjectCount.textContent = projectCount;
  renderUsers(users);
}

async function initAdmin() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }

  if (user.role !== 'admin') {
    window.location.href = './dashboard.html';
    return;
  }

  currentAdmin = user;
  clearAlert(alertBox);

  try {
    await loadAdminData();
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to load admin data.');
  }
}

usersTable.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action="toggle-role"]');
  if (!button) return;

  const userId = button.dataset.id;
  const nextRole = button.dataset.nextRole;
  if (!userId || !nextRole) return;

  const confirmed = window.confirm(`Change user role to ${nextRole}?`);
  if (!confirmed) return;

  button.disabled = true;
  clearAlert(alertBox);

  try {
    await updateUserRole(userId, nextRole);
    await loadAdminData();
    setAlert(alertBox, 'User role updated successfully.', 'success');
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to update user role.');
  } finally {
    button.disabled = false;
  }
});

initAdmin();
applyTimeTheme();
