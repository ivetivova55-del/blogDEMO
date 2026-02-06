import { getCurrentUserWithProfile, updateUserProfile, logout } from '../services/auth-service.js';
import { getUserArticles } from '../services/article-service.js';
import { isLoggedIn, showNotification, formatDate } from '../utils/helpers.js';
import { createArticleCard } from '../components/article-card.js';

export async function initUserProfile() {
  if (!isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }
}

export async function renderUserProfile() {
  const user = await getCurrentUserWithProfile();
  if (!user) {
    return '<div class="alert alert-danger">User not found</div>';
  }

  return `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          <h1 class="mb-4">👤 My Profile</h1>

          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Profile Information</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Full Name</label>
                  <div class="form-control">${user.full_name || 'N/A'}</div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email</label>
                  <div class="form-control">${user.email}</div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Member Since</label>
                  <div class="form-control">${formatDate(user.created_at)}</div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Role</label>
                  <div class="form-control">${user.role === 'admin' ? '👑 Admin' : '👤 User'}</div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <button id="editProfileBtn" class="btn btn-primary">Edit Profile</button>
                <button id="logoutBtn" class="btn btn-danger">Logout</button>
              </div>
            </div>
          </div>

          <!-- My Articles Preview -->
          <h3 class="mb-3">📝 My Articles</h3>
          <div id="articlesContainer">
            <div class="text-center py-5">
              <div class="spinner-border" role="status"></div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="sidebar">
            <h5>📊 Stats</h5>
            <div class="sidebar-item">
              Account Type: ${user.role === 'admin' ? '👑 Admin' : '👤 User'}
            </div>
            <div class="sidebar-item">
              Member Since: ${formatDate(user.created_at)}
            </div>
          </div>

          <div class="sidebar">
            <h5>⚡ Quick Actions</h5>
            <div class="sidebar-item">
              <a href="#/create-article" style="text-decoration: none;">
                <strong>✍️ Write Article</strong>
              </a>
            </div>
            <div class="sidebar-item">
              <a href="#/articles" style="text-decoration: none;">
                <strong>📰 Browse Articles</strong>
              </a>
            </div>
            ${user.role === 'admin'
              ? `
            <div class="sidebar-item">
              <a href="#/admin" style="text-decoration: none;">
                <strong>⚙️ Admin Panel</strong>
              </a>
            </div>
          `
              : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Load user articles
  setTimeout(async () => {
    try {
      const { articles } = await getUserArticles(user.id, 1);
      const articlesHTML = articles.map(createArticleCard).join('');
      const container = document.getElementById('articlesContainer');
      if (container) {
        if (articles.length === 0) {
          container.innerHTML = `
            <div class="alert alert-info">
              You haven't written any articles yet. <a href="#/create-article">Write your first article</a>
            </div>
          `;
        } else {
          container.innerHTML = `<div class="articles-grid">${articlesHTML}</div>`;
        }
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  }, 0);

  // Setup event listeners
  setTimeout(() => {
    const editBtn = document.getElementById('editProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        showNotification('Profile editing coming soon!', 'info');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await logout();
          showNotification('Logged out successfully', 'success');
          setTimeout(() => {
            window.location.hash = '#/';
            location.reload();
          }, 1000);
        } catch (error) {
          showNotification('Logout failed: ' + error.message, 'danger');
        }
      });
    }
  }, 0);
}

export async function renderMyArticles() {
  const user = await getCurrentUserWithProfile();
  if (!user) {
    return '<div class="alert alert-danger">User not found</div>';
  }

  const { articles, total } = await getUserArticles(user.id, 1);
  const articlesHTML = articles
    .map(
      (article) => `
    <tr>
      <td><strong>${article.title}</strong></td>
      <td>${article.categories?.name || 'N/A'}</td>
      <td><span class="badge bg-${article.status === 'published' ? 'success' : 'warning'}">${article.status}</span></td>
      <td>${formatDate(article.created_at)}</td>
      <td>
        <a href="#/article/${article.id}" class="btn btn-sm btn-primary">View</a>
        <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article.id}')">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <div class="container-fluid">
      <h1 class="mb-4">📝 My Articles</h1>

      <div class="admin-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${articlesHTML}
          </tbody>
        </table>
      </div>

      ${articles.length === 0
        ? `
        <div class="alert alert-info mt-3 text-center">
          <p>You haven't published any articles yet.</p>
          <a href="#/create-article" class="btn btn-primary">Write Your First Article</a>
        </div>
      `
        : ''
      }
    </div>
  `;
}
