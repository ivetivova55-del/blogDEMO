import { isLoggedIn } from '../utils/helpers.js';
import { fetchArticles, getCategories } from '../services/article-service.js';
import { createArticleCard } from '../components/article-card.js';

export async function initHome() {
  // Load featured articles
}

export async function renderHome() {
  const isLogged = isLoggedIn();
  const { articles } = await fetchArticles(1, { limit: 10 });
  const categories = await getCategories();

  // Display 4-5 educational IT news articles with images
  const featuredArticles = articles.slice(0, 5);
  const articlesHTML = featuredArticles
    .map(createArticleCard)
    .join('');

  return `
    <div class="container-fluid">
      <!-- Hero Section -->
      <section class="featured-article mb-5">
        <div class="row">
          <div class="col-lg-8">
            <h1>🚀 Welcome to BlogDemo</h1>
            <p class="lead">Discover the latest insights in IT and Marketing news, trends, and expert analysis. Learn from educational articles and industry insights.</p>
            <div class="mt-4">
              <a href="#/articles" class="btn btn-light btn-lg me-3">Browse All Articles</a>
              ${isLogged ? `<a href="#/create-article" class="btn btn-outline-light btn-lg">✍️ Write Article</a>` : `<a href="#/register" class="btn btn-outline-light btn-lg">🎓 Join Our Community</a>`}
            </div>
          </div>
        </div>
      </section>

      <div class="row">
        <!-- Featured Articles -->
        <div class="col-lg-8 mb-5">
          <h2 class="mb-4">📚 Featured IT Educational Articles</h2>
          <p style="color: #666; margin-bottom: 30px;">Stay updated with the latest technology trends and educational insights</p>
          <div class="articles-grid">
            ${articlesHTML}
          </div>
          <div class="text-center">
            <a href="#/articles" class="btn btn-primary btn-lg">View All Articles →</a>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Categories -->
          <div class="sidebar">
            <h5>📂 Categories</h5>
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
              <i class="fas fa-newspaper" style="color: #2563eb; margin-right: 10px;"></i>
              <strong>${articles.length}</strong> articles
            </div>
            <div class="sidebar-item">
              <i class="fas fa-tags" style="color: #7c3aed; margin-right: 10px;"></i>
              <strong>${categories.length}</strong> categories
            </div>
            <div class="sidebar-item">
              <i class="fas fa-eye" style="color: #10b981; margin-right: 10px;"></i>
              <strong>${articles.reduce((sum, a) => sum + (a.views || 0), 0)}</strong> total views
            </div>
          </div>

          <!-- Featured Topic -->
          <div class="sidebar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
            <h5 style="color: white; border-bottom: 2px solid rgba(255,255,255,0.3); margin-bottom: 15px;">📚 Educational Content</h5>
            <p style="font-size: 0.95rem; margin-bottom: 15px;">Our blog provides in-depth tutorials, case studies, and industry analysis to help you stay ahead in the tech world.</p>
            <div style="font-size: 0.9rem; line-height: 1.8;">
              <div style="margin-bottom: 10px;">✓ Latest IT Trends</div>
              <div style="margin-bottom: 10px;">✓ Technical Tutorials</div>
              <div style="margin-bottom: 10px;">✓ Expert Analysis</div>
              <div>✓ Best Practices</div>
            </div>
          </div>

          <!-- CTA -->
          ${!isLogged
            ? `
            <div class="sidebar" style="background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%); color: white; border: none;">
              <h5 style="color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">🎯 Get Started</h5>
              <p>Join our community and start publishing your own articles today.</p>
              <a href="#/register" class="btn btn-light btn-sm">Register Now</a>
            </div>
          `
            : `
            <div class="sidebar" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none;">
              <h5 style="color: white; border-bottom: 2px solid rgba(255,255,255,0.3);">✨ Member Benefits</h5>
              <p>Create and publish your own articles to share your knowledge with the community.</p>
              <a href="#/create-article" class="btn btn-light btn-sm">Create Article</a>
            </div>
          `
          }
        </div>
      </div>
    </div>
  `;
}
