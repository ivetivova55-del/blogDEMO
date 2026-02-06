import { formatDate, truncateText } from '../utils/helpers.js';

export function createArticleCard(article) {
  const imageUrl = article.cover_image_url || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(article.title);
  const category = article.categories?.name || 'Uncategorized';
  const author = article.users?.full_name || 'Anonymous';
  const date = formatDate(article.created_at);
  const excerpt = truncateText(article.excerpt || article.content, 150);

  return `
    <div class="article-card">
      <img src="${imageUrl}" alt="${article.title}" loading="lazy">
      <div class="article-card-body">
        <h3 class="article-card-title">
          <a href="#/article/${article.id}">${article.title}</a>
        </h3>
        <div class="article-card-meta">
          <span class="article-card-category">${category}</span>
          <span>${date}</span>
        </div>
        <p class="article-card-excerpt">${excerpt}</p>
        <div class="article-card-footer">
          <span class="article-card-views">👁️ ${article.views || 0} views</span>
          <a href="#/article/${article.id}" class="article-card-link">Read More →</a>
        </div>
      </div>
    </div>
  `;
}
