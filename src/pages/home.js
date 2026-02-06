import { isLoggedIn } from '../utils/helpers.js';
import { fetchArticles, getCategories } from '../services/article-service.js';
import { createArticleCard } from '../components/article-card.js';

export async function initHome() {
  // Load featured articles
}

export async function renderHome() {
  const isLogged = isLoggedIn();
  const { articles } = await fetchArticles(1, { limit: 6 });
  const categories = await getCategories();

  const articlesHTML = articles
    .slice(0, 3)
    .map(createArticleCard)
    .join('');

  return `
    <div class="container-fluid">
      <!-- Hero Section -->
      <section class="featured-article mb-5">
        <div class="row">
          <div class="col-lg-8">
            <h1>Welcome to BlogDemo</h1>
            <p class="lead">Discover the latest insights in IT and Marketing news, trends, and expert analysis.</p>
            <div class="mt-4">
              <a href="#/articles" class="btn btn-light btn-lg me-3">Browse Articles</a>
              ${isLogged ? `<a href="#/create-article" class="btn btn-outline-light btn-lg">Write Article</a>` : `<a href="#/register" class="btn btn-outline-light btn-lg">Join Us</a>`}
            </div>
          </div>
        </div>
      </section>

      <div class="row">
        <!-- Featured Articles -->
        <div class="col-lg-8 mb-5">
          <h2 class="mb-4">📰 Latest Articles</h2>
          <div class="articles-grid">
            ${articlesHTML}
          </div>
          <div class="text-center">
            <a href="#/articles" class="btn btn-primary">View All Articles</a>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Categories -->
          <div class="sidebar">
            <h5>Categories</h5>
            ${categories
              .map(
                (cat) => `
              <div class="sidebar-item">
                <a href="#/articles?category=${cat.id}">
                  <span>${cat.name}</span>
                  <span>→</span>
                </a>
              </div>
            `
              )
              .join('')}
          </div>

          <!-- Stats -->
          <div class="sidebar">
            <h5>📊 Quick Stats</h5>
            <div class="sidebar-item">
              <strong>${articles.length}</strong> articles published
            </div>
            <div class="sidebar-item">
              <strong>${categories.length}</strong> categories
            </div>
          </div>

          <!-- CTA -->
          ${!isLogged
            ? `
            <div class="sidebar" style="background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%); color: white; border: none;">
              <h5 style="color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">Get Started</h5>
              <p>Join our community and start publishing today.</p>
              <a href="#/register" class="btn btn-light btn-sm">Register Now</a>
            </div>
          `
            : ''
          }
        </div>
      </div>
    </div>
  `;
}
