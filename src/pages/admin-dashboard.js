import { getCurrentUserWithProfile, isAdmin } from '../services/auth-service.js';
import { getAllUsers, getUserStats } from '../services/user-service.js';
import { fetchArticles } from '../services/article-service.js';
import { isLoggedIn, formatDate, showNotification } from '../utils/helpers.js';

export async function initAdminDashboard() {
  if (!isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }

  const admin = await isAdmin();
  if (!admin) {
    window.location.hash = '#/';
    return;
  }
}

export async function renderAdminDashboard() {
  const user = await getCurrentUserWithProfile();
  if (!user || user.role !== 'admin') {
    return '<div class="alert alert-danger">Access denied. Admin only.</div>';
  }

  const stats = await getUserStats();
  const { articles } = await fetchArticles(1, {});
  const users = await getAllUsers();

  const usersHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u.email}</td>
      <td>${u.full_name || 'N/A'}</td>
      <td><span class="badge bg-${u.role === 'admin' ? 'danger' : 'info'}">${u.role}</span></td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="updateUserRole('${u.id}', '${u.role === 'admin' ? 'user' : 'admin'}')">
          Toggle Role
        </button>
      </td>
    </tr>
  `
    )
    .join('');

  const articlesHTML = articles
    .slice(0, 10)
    .map(
      (article) => `
    <tr>
      <td>${article.title}</td>
      <td>${article.users?.full_name || 'N/A'}</td>
      <td><span class="badge bg-${article.status === 'published' ? 'success' : 'warning'}">${article.status}</span></td>
      <td>${formatDate(article.created_at)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <div class="container-fluid">
      <h1 class="mb-4">⚙️ Admin Dashboard</h1>

      <!-- Statistics -->
      <div class="admin-stats">
        <div class="stat-card" style="border-left-color: #0dcaf0;">
          <h3>👥 Total Users</h3>
          <div class="stat-value">${stats.totalUsers}</div>
        </div>
        <div class="stat-card" style="border-left-color: #198754;">
          <h3>📝 Published Articles</h3>
          <div class="stat-value">${stats.totalArticles}</div>
        </div>
      </div>

      <div class="row mt-5">
        <!-- Users Management -->
        <div class="col-lg-6 mb-4">
          <h3 class="mb-3">👥 User Management</h3>
          <div class="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${usersHTML}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Articles -->
        <div class="col-lg-6 mb-4">
          <h3 class="mb-3">📰 Recent Articles</h3>
          <div class="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${articlesHTML}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Admin Tools -->
      <div class="row mt-5">
        <div class="col-12">
          <h3 class="mb-3">🔧 Admin Tools</h3>
          <div class="card">
            <div class="card-body">
              <p>Additional admin features and tools can be added here:</p>
              <ul>
                <li>Content moderation</li>
                <li>System settings</li>
                <li>User analytics</li>
                <li>Backup and export</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Setup event listeners
  setTimeout(() => {
    // Event listeners for admin actions
  }, 0);
}

// Global admin functions
window.updateUserRole = async function (userId, newRole) {
  try {
    const { updateUserRole } = await import('../services/user-service.js');
    await updateUserRole(userId, newRole);
    showNotification('User role updated successfully', 'success');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showNotification('Failed to update user role: ' + error.message, 'danger');
  }
};

window.deleteArticle = async function (articleId) {
  if (!confirm('Delete this article?')) return;
  try {
    const { deleteArticle } = await import('../services/article-service.js');
    await deleteArticle(articleId);
    showNotification('Article deleted successfully', 'success');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showNotification('Failed to delete article: ' + error.message, 'danger');
  }
};
