import { createArticle, getCategories } from '../services/article-service.js';
import { uploadImage } from '../services/storage-service.js';
import { getCurrentUserWithProfile } from '../services/auth-service.js';
import { isLoggedIn, showNotification } from '../utils/helpers.js';
import { validateArticleForm } from '../utils/validators.js';

export async function initCreateArticle() {
  // Check if user is logged in
  if (!isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }
}

export async function renderCreateArticle() {
  const user = await getCurrentUserWithProfile();
  if (!user) {
    return '<div class="alert alert-danger">Please login first</div>';
  }

  const categories = await getCategories();

  return `
    <div class="container" style="max-width: 800px; padding: 2rem 0;">
      <h1 class="mb-4">✍️ Create Article</h1>

      <div class="card">
        <div class="card-body">
          <form id="articleForm">
            <div class="mb-3">
              <label for="title" class="form-label">Title</label>
              <input type="text" class="form-control" id="title" name="title" required>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="excerpt" class="form-label">Excerpt (Short Summary)</label>
              <textarea class="form-control" id="excerpt" name="excerpt" rows="2" maxlength="500"></textarea>
              <small class="form-text text-muted">Maximum 500 characters</small>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="content" class="form-label">Content</label>
              <textarea class="form-control" id="content" name="content" rows="8" required></textarea>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="category" class="form-label">Category</label>
              <select class="form-select" id="category" name="category_id" required>
                <option value="">Select a category...</option>
                ${categories.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join('')}
              </select>
              <div class="invalid-feedback"></div>
            </div>

            <div class="mb-3">
              <label for="coverImage" class="form-label">Cover Image</label>
              <input type="file" class="form-control" id="coverImage" name="coverImage" accept="image/*">
              <small class="form-text text-muted">Maximum 5MB</small>
              <div id="imagePreview" style="margin-top: 1rem;"></div>
            </div>

            <div class="mb-3 form-check">
              <input type="checkbox" class="form-check-input" id="publish" name="publish" checked>
              <label class="form-check-label" for="publish">Publish immediately</label>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary">📤 Publish Article</button>
              <a href="#/articles" class="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Initialize form
  setTimeout(() => {
    const form = document.getElementById('articleForm');
    if (form) {
      // Image preview
      const coverInput = document.getElementById('coverImage');
      if (coverInput) {
        coverInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              document.getElementById('imagePreview').innerHTML = `
                <img src="${ev.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 0.5rem;">
              `;
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // Form submission
      form.addEventListener('submit', handleCreateArticle);
    }
  }, 0);
}

async function handleCreateArticle(e) {
  e.preventDefault();

  const user = await getCurrentUserWithProfile();
  const title = document.getElementById('title').value;
  const excerpt = document.getElementById('excerpt').value;
  const content = document.getElementById('content').value;
  const categoryId = document.getElementById('category').value;
  const coverFile = document.getElementById('coverImage').files[0];
  const publish = document.getElementById('publish').checked;

  // Validate
  const errors = validateArticleForm({ title, content, category_id: categoryId, excerpt });
  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => {
      showNotification(message, 'danger');
    });
    return;
  }

  try {
    let coverImageUrl = null;
    if (coverFile) {
      showNotification('Uploading image...', 'info');
      coverImageUrl = await uploadImage(coverFile, 'articles');
    }

    const articleData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category_id: categoryId,
      cover_image_url: coverImageUrl,
      status: publish ? 'published' : 'draft',
    };

    await createArticle(articleData, user.id);
    showNotification('Article ' + (publish ? 'published' : 'saved as draft') + ' successfully!', 'success');
    setTimeout(() => {
      window.location.hash = '#/articles';
    }, 1500);
  } catch (error) {
    showNotification('Failed to create article: ' + error.message, 'danger');
  }
}
