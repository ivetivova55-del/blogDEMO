import { getCurrentUserProfile } from '../services/auth-service.js';
import { fetchAllUsers, fetchSystemTaskCount } from '../services/admin-service.js';
import { qs, setAlert } from '../utils/dom-utils.js';

const alertBox = qs('#admin-alert');
const usersTable = qs('#users-table-body');
const systemTaskCount = qs('#system-task-count');

async function initAdmin() {
  const user = await getCurrentUserProfile();
  if (!user) {
    window.location.href = './index.html';
    return;
  }

  if (user.role !== 'admin') {
    setAlert(alertBox, 'Admin access required.');
    return;
  }

  try {
    const [users, taskCount] = await Promise.all([
      fetchAllUsers(),
      fetchSystemTaskCount(),
    ]);

    systemTaskCount.textContent = taskCount;
    usersTable.innerHTML = '';

    users.forEach((profile) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${profile.full_name || '-'}</td>
        <td>${profile.email}</td>
        <td>${profile.role}</td>
        <td>${new Date(profile.created_at).toLocaleDateString()}</td>
      `;
      usersTable.appendChild(row);
    });
  } catch (error) {
    setAlert(alertBox, error.message || 'Unable to load admin data.');
  }
}

initAdmin();
