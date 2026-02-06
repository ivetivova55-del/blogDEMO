import { fetchArticles, getCategories } from '../services/article-service.js';
import { createArticleCard } from '../components/article-card.js';

export async function initArticlesList(params) {
  // Load articles with filters
}

export async function renderArticlesList() {
  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  const page = parseInt(params.get('page')) || 1;
  const search = params.get('search') || '';
  const category = params.get('category') || '';

  const filters = {};
  if (search) filters.search = search;
  if (category) filters.category = category;

  const { articles, total, limit } = await fetchArticles(page, filters);
  const categories = await getCategories();
  const totalPages = Math.ceil(total / limit);

  const articlesHTML = articles.map(createArticleCard).join('');
  const paginationHTML = generatePagination(page, totalPages);

  return `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          <h1 class="mb-4">📰 Articles</h1>

          <!-- Search and Filters -->
          <div class="filters">
            <div class="filter-group">
              <div>
                <label>Search</label>
                <input type="text" id="searchInput" placeholder="Search articles..." value="${search}" class="form-control">
              </div>
              <div>
                <label>Category</label>
                <select id="categoryFilter" class="form-control">
                  <option value="">All Categories</option>
                  ${categories.map((cat) => `<option value="${cat.id}" ${category === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
                </select>
              </div>
              <div style="display: flex; align-items: flex-end;">
                <button id="filterBtn" class="btn btn-primary">Apply Filters</button>
              </div>
            </div>
          </div>

          <!-- Articles Grid -->
          <div class="articles-grid">
            ${articlesHTML}
          </div>

          <!-- Pagination -->
          ${totalPages > 1 ? `<div class="pagination">${paginationHTML}</div>` : ''}

          ${articles.length === 0
            ? `
            <div class="alert alert-info text-center py-5">
              <h4>No articles found</h4>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          `
            : ''
          }
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <div class="sidebar">
            <h5>📊 Statistics</h5>
            <div class="sidebar-item">
              <strong>${total}</strong> articles found
            </div>
            <div class="sidebar-item">
              Page <strong>${page}</strong> of <strong>${totalPages}</strong>
            </div>
          </div>

          <div class="sidebar">
            <h5>🏷️ Categories</h5>
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
        </div>
      </div>
    </div>
  `;

  // Initialize filters after rendering
  setTimeout(() => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const filterBtn = document.getElementById('filterBtn');

    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        const search = searchInput?.value || '';
        const category = categoryFilter?.value || '';
        let url = '#/articles';
        if (search || category) {
          url += '?';
          if (search) url += `search=${encodeURIComponent(search)}&`;
          if (category) url += `category=${category}`;
        }
        window.location.hash = url.replace(/&$/, '');
      });
    }

    // Enter key in search
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          filterBtn?.click();
        }
      });
    }
  }, 0);
}

function generatePagination(currentPage, totalPages) {
  let html = '';

  // Previous button
  if (currentPage > 1) {
    html += `<a href="#/articles?page=${currentPage - 1}" class="pagination-item">← Previous</a>`;
  } else {
    html += `<span class="pagination-item disabled">← Previous</span>`;
  }

  // Page numbers
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    if (i === currentPage) {
      html += `<span class="pagination-item active">${i}</span>`;
    } else {
      html += `<a href="#/articles?page=${i}" class="pagination-item">${i}</a>`;
    }
  }

  // Next button
  if (currentPage < totalPages) {
    html += `<a href="#/articles?page=${currentPage + 1}" class="pagination-item">Next →</a>`;
  } else {
    html += `<span class="pagination-item disabled">Next →</span>`;
  }

  return html;
}
