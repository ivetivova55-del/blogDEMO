import { isLoggedIn } from '../utils/helpers.js';
import { getCurrentUserWithProfile } from '../services/auth-service.js';

export function createHeader() {
  const isLogged = isLoggedIn();
  const userInitial = isLogged ? 'U' : 'G';

  return `
    <nav class="navbar">
      <div class="container-fluid">
        <div style="display: flex; align-items: center; width: 100%;">
          <a href="#/" class="navbar-brand">📰 BlogDemo</a>
          
          <div class="navbar-nav">
            <a href="#/" class="nav-link">Home</a>
            <a href="#/articles" class="nav-link">Articles</a>
            ${isLogged ? `<a href="#/create-article" class="nav-link">Write</a>` : ''}
          </div>

          <div class="user-menu">
            <div class="search-bar" style="margin-bottom: 0; gap: 0.5rem;">
              <input type="text" id="headerSearch" placeholder="Search articles..." style="flex: 1; padding: 0.5rem; border-radius: 0.375rem; border: 1px solid #dee2e6;">
              <button id="headerSearchBtn" style="background-color: rgba(255,255,255,0.2); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">🔍</button>
            </div>

            ${isLogged ? `
              <div class="user-menu-dropdown">
                <div class="user-menu-avatar" id="userMenuToggle">${userInitial}</div>
                <div class="dropdown-menu" id="userMenu" style="display: none; position: absolute; right: 0;">
                  <a href="#/profile" class="dropdown-item">👤 Profile</a>
                  <a href="#/my-articles" class="dropdown-item">📝 My Articles</a>
                  <hr style="margin: 0.5rem 0;">
                  <button id="logoutBtn" class="dropdown-item" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer; color: #333; padding: 0.75rem 1rem;">🚪 Logout</button>
                </div>
              </div>
            ` : `
              <div style="display: flex; gap: 0.5rem;">
                <a href="#/login" class="btn btn-light btn-sm" style="color: #0d6efd; margin-bottom: 0;">Login</a>
                <a href="#/register" class="btn btn-light btn-sm" style="margin-bottom: 0;">Register</a>
              </div>
            `}
          </div>
        </div>
      </div>
    </nav>
  `;
}

export function initHeader() {
  // User menu toggle
  const userMenuToggle = document.getElementById('userMenuToggle');
  const userMenu = document.getElementById('userMenu');
  if (userMenuToggle && userMenu) {
    userMenuToggle.addEventListener('click', () => {
      userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu-dropdown')) {
        userMenu.style.display = 'none';
      }
    });
  }

  // Search functionality
  const searchBtn = document.getElementById('headerSearchBtn');
  const searchInput = document.getElementById('headerSearch');
  if (searchBtn && searchInput) {
    const performSearch = () => {
      const query = searchInput.value.trim();
      if (query) {
        window.location.hash = `#/articles?search=${encodeURIComponent(query)}`;
      }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { logout } = await import('../services/auth-service.js');
      try {
        await logout();
        window.location.hash = '#/';
        location.reload();
      } catch (error) {
        alert('Logout failed: ' + error.message);
      }
    });
  }
}

export async function updateHeader() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const user = await getCurrentUserWithProfile();
  const isAdmin = user && user.role === 'admin';

  // Update nav links
  const navLinks = navbar.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (window.location.hash.startsWith(link.href.replace('#', ''))) {
      link.classList.add('active');
    }
  });

  // Add admin link if user is admin
  if (isAdmin) {
    const writeLink = navbar.querySelector('a[href="#/create-article"]');
    if (writeLink) {
      const adminLink = document.createElement('a');
      adminLink.href = '#/admin';
      adminLink.className = 'nav-link';
      adminLink.textContent = '⚙️ Admin';
      writeLink.parentElement.appendChild(adminLink);
    }
  }
}
