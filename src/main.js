import { createHeader, initHeader, updateHeader } from './components/header.js';
import { createFooter } from './components/footer.js';
import { initHome } from './pages/home.js';
import { initLogin } from './pages/login.js';
import { initRegister } from './pages/register.js';
import { initArticlesList } from './pages/articles-list.js';
import { initArticleDetail } from './pages/article-detail.js';
import { initCreateArticle } from './pages/create-article.js';
import { initUserProfile } from './pages/user-profile.js';
import { initAdminDashboard } from './pages/admin-dashboard.js';

// Page modules
const pages = {
  home: () => import('./pages/home.js').then(m => m.renderHome()),
  login: () => import('./pages/login.js').then(m => m.renderLogin()),
  register: () => import('./pages/register.js').then(m => m.renderRegister()),
  'articles': () => import('./pages/articles-list.js').then(m => m.renderArticlesList()),
  'article': (id) => import('./pages/article-detail.js').then(m => m.renderArticleDetail(id)),
  'create-article': () => import('./pages/create-article.js').then(m => m.renderCreateArticle()),
  'profile': () => import('./pages/user-profile.js').then(m => m.renderUserProfile()),
  'my-articles': () => import('./pages/user-profile.js').then(m => m.renderMyArticles()),
  'admin': () => import('./pages/admin-dashboard.js').then(m => m.renderAdminDashboard()),
};

// Router
async function router() {
  const hash = window.location.hash.substring(1).split('?')[0] || '/';
  const [path, ...params] = hash.split('/').filter(Boolean);
  const queryParams = new URLSearchParams(window.location.hash.split('?')[1]);

  const appContainer = document.getElementById('app');
  appContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"></div></div>';

  try {
    let content;

    switch (path) {
      case '':
      case 'home':
        await initHome();
        content = await pages.home();
        break;
      case 'login':
        await initLogin();
        content = await pages.login();
        break;
      case 'register':
        await initRegister();
        content = await pages.register();
        break;
      case 'articles':
        await initArticlesList(queryParams);
        content = await pages.articles();
        break;
      case 'article':
        if (params[0]) {
          await initArticleDetail(params[0]);
          content = await pages.article(params[0]);
        } else {
          content = '<div class="alert alert-danger">Article not found</div>';
        }
        break;
      case 'create-article':
        await initCreateArticle();
        content = await pages['create-article']();
        break;
      case 'profile':
        await initUserProfile();
        content = await pages.profile();
        break;
      case 'my-articles':
        await initUserProfile();
        content = await pages['my-articles']();
        break;
      case 'admin':
        await initAdminDashboard();
        content = await pages.admin();
        break;
      default:
        content = '<div class="alert alert-warning">Page not found</div>';
    }

    appContainer.innerHTML = content;
    window.scrollTo(0, 0);

    // Re-initialize header for navigation updates
    await updateHeader();
  } catch (error) {
    console.error('Routing error:', error);
    appContainer.innerHTML = `<div class="alert alert-danger">Error loading page: ${error.message}</div>`;
  }
}

// Initialize app
function initApp() {
  // Render header and footer
  document.getElementById('header').innerHTML = createHeader();
  document.getElementById('footer').innerHTML = createFooter();
  initHeader();

  // Handle routing
  window.addEventListener('hashchange', router);
  router();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
