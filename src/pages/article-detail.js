import { getArticleById, addComment, deleteComment, updateArticle } from '../services/article-service.js';
import { getCurrentUserWithProfile } from '../services/auth-service.js';
import { formatDate, showNotification } from '../utils/helpers.js';
import { isLoggedIn } from '../utils/helpers.js';

export async function initArticleDetail(articleId) {
  // Load article data
}

export async function renderArticleDetail(articleId) {
  const article = await getArticleById(articleId);
  const currentUser = isLoggedIn() ? await getCurrentUserWithProfile() : null;
  const isAuthor = currentUser && (currentUser.id === article.author_id || currentUser.role === 'admin');

  if (!article) {
    return '<div class="alert alert-danger">Article not found</div>';
  }

  const comments = article.comments || [];
  const imageUrl = article.cover_image_url || 'https://via.placeholder.com/800x400?text=' + encodeURIComponent(article.title);

  const commentsHTML = comments
    .map(
      (comment) => `
    <div class="comment-item">
      <div class="comment-author">${comment.author || 'Anonymous'}</div>
      <div class="comment-date">${formatDate(comment.created_at)}</div>
      <div class="comment-text">${escapeHtml(comment.content)}</div>
      ${isAuthor || (currentUser && currentUser.id === comment.author_id)
        ? `<button class="btn btn-sm btn-danger mt-2" onclick="deleteArticleComment('${comment.id}')">Delete</button>`
        : ''
      }
    </div>
  `
    )
    .join('');

  return `
    <div class="container-fluid">
      <article>
        <!-- Article Header -->
        <div class="article-header">
          <h1>${article.title}</h1>
          <div class="article-meta">
            <div class="article-meta-item">👤 ${article.users?.full_name || 'Anonymous'}</div>
            <div class="article-meta-item">📅 ${formatDate(article.created_at)}</div>
            <div class="article-meta-item">🏷️ ${article.categories?.name || 'Uncategorized'}</div>
            <div class="article-meta-item">👁️ ${article.views || 0} views</div>
          </div>
          ${isAuthor
            ? `
            <div class="mt-3">
              <a href="#/article/${article.id}/edit" class="btn btn-sm btn-warning me-2">Edit</a>
              <button class="btn btn-sm btn-danger" onclick="deleteArticleHandler('${article.id}')">Delete</button>
            </div>
          `
            : ''
          }
        </div>

        <!-- Cover Image -->
        ${article.cover_image_url ? `<img src="${imageUrl}" alt="${article.title}" class="article-cover">` : ''}

        <!-- Article Content -->
        <div class="article-content">
          ${article.content.split('\n\n').map((p) => `<p>${p}</p>`).join('')}
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h3>💬 Comments (${comments.length})</h3>

          ${isLoggedIn()
            ? `
            <div class="comment-form">
              <h5>Leave a Comment</h5>
              <form id="commentForm">
                <div class="mb-3">
                  <textarea class="form-control" id="commentText" rows="4" placeholder="Share your thoughts..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Post Comment</button>
              </form>
            </div>
          `
            : `
            <div class="alert alert-info">
              <a href="#/login">Login</a> to leave a comment.
            </div>
          `
          }

          <div class="mt-4">
            ${comments.length > 0
              ? commentsHTML
              : '<p class="text-muted">No comments yet. Be the first to comment!</p>'
            }
          </div>
        </div>
      </article>

      <!-- Related Articles -->
      <div class="related-articles">
        <h3>📚 Related Articles</h3>
        <div class="related-articles-list">
          <!-- Load related articles here -->
          <p class="text-muted">More articles coming soon...</p>
        </div>
      </div>
    </div>
  `;

  // Initialize comment form
  setTimeout(() => {
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('commentText').value;
        try {
          await addComment(articleId, currentUser.id, text);
          showNotification('Comment posted successfully!', 'success');
          setTimeout(() => location.reload(), 1000);
        } catch (error) {
          showNotification('Failed to post comment: ' + error.message, 'danger');
        }
      });
    }
  }, 0);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Global functions for inline handlers
window.deleteArticleComment = async function (commentId) {
  if (!confirm('Delete this comment?')) return;
  try {
    await deleteComment(commentId);
    showNotification('Comment deleted successfully!', 'success');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    showNotification('Failed to delete comment: ' + error.message, 'danger');
  }
};

window.deleteArticleHandler = async function (articleId) {
  if (!confirm('Delete this article? This action cannot be undone.')) return;
  try {
    const { deleteArticle } = await import('../services/article-service.js');
    await deleteArticle(articleId);
    showNotification('Article deleted successfully!', 'success');
    setTimeout(() => {
      window.location.hash = '#/articles';
    }, 1000);
  } catch (error) {
    showNotification('Failed to delete article: ' + error.message, 'danger');
  }
};
