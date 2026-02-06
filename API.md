# API & Service Documentation

## Supabase Client

Located in: `src/services/supabase-client.js`

```javascript
import { supabase, getCurrentUser, getUserProfile } from './supabase-client.js';

// Singleton instance
const supabase; // Initialized with URL and anon key

// Get current authenticated user
const user = await getCurrentUser();

// Get user profile with role info
const profile = await getUserProfile(userId);
```

## Authentication Service

Located in: `src/services/auth-service.js`

### User Registration
```javascript
import { register } from './services/auth-service.js';

await register(email, password, fullName);
// Creates auth user + profile record
// Returns: User object
// Throws: Error if email exists
```

### User Login
```javascript
import { login } from './services/auth-service.js';

const user = await login(email, password);
// Authenticates with Supabase
// Stores JWT in localStorage
// Returns: User object
```

### Get Current User
```javascript
const user = await getCurrentUserWithProfile();
// Returns full user with role info
// Returns null if not logged in
```

### Check Admin Status
```javascript
const isAdmin = await isAdmin();
// Returns boolean
// Useful for conditional rendering
```

### Logout
```javascript
await logout();
// Clears auth session
// Removes localStorage token
```

### Update Profile
```javascript
await updateUserProfile(userId, {
  full_name: 'New Name',
  avatar_url: 'https://...'
});
// Updates user_profiles table
// Returns: Updated profile object
```

## Article Service

Located in: `src/services/article-service.js`

### Fetch Articles
```javascript
const { articles, total, page, limit } = await fetchArticles(
  page = 1,
  filters = {}
);

// Filters object:
// {
//   search: 'keyword',      // Search title/content
//   category: 'uuid',       // Filter by category
//   status: 'published'     // 'draft' or 'published'
// }

// Returns paginated articles with author/category info
```

### Get Single Article
```javascript
const article = await getArticleById(id);
// Includes author info and comments
// Increments view counter
// Returns: Article object
```

### Create Article
```javascript
const article = await createArticle({
  title: 'Article Title',
  content: 'Article body text...',
  excerpt: 'Short summary (optional)',
  category_id: 'uuid',
  cover_image_url: 'https://...',
  status: 'published' // or 'draft'
}, userId);

// Returns: Created article object
```

### Update Article
```javascript
await updateArticle(id, {
  title: 'New Title',
  status: 'published'
  // Update any fields
});
// Returns: Updated article
```

### Delete Article
```javascript
await deleteArticle(id);
// Deletes article and associated comments
// Returns: true
```

### Get Categories
```javascript
const categories = await getCategories();
// Returns: Array of category objects
// [{ id, name, slug, description }]
```

### Get User's Articles
```javascript
const { articles, total } = await getUserArticles(userId, page);
// Get articles published by specific user
// Paginated, ordered by newest first
```

### Add Comment
```javascript
await addComment(articleId, userId, contentText);
// Creates new comment
// Returns: Comment object
```

### Delete Comment
```javascript
await deleteComment(commentId);
// Deletes comment
// User must be author or admin
```

## Storage Service

Located in: `src/services/storage-service.js`

### Upload Image
```javascript
const publicUrl = await uploadImage(file, folder = '');
// file: File object from input
// folder: Optional subfolder (e.g., 'articles')
// Generates unique filename with timestamp
// Returns: Public URL string
```

### Delete Image
```javascript
await deleteImage(filePath);
// filePath: Path returned from upload
// Deletes from storage
```

## User Service (Admin)

Located in: `src/services/user-service.js`

### Get All Users
```javascript
const users = await getAllUsers();
// Admin only (check with RLS)
// Returns: Array of user objects
```

### Get Statistics
```javascript
const { totalUsers, totalArticles } = await getUserStats();
// Quick counts for dashboard
```

### Update User Role
```javascript
await updateUserRole(userId, role);
// role: 'user' or 'admin'
// Admin only
```

### Delete User
```javascript
await deleteUser(userId);
// Deletes user and their articles
// Admin only
```

## Utility Functions

Located in: `src/utils/`

### Validators

```javascript
import { 
  validateEmail, 
  validatePassword, 
  validateImage,
  validateArticleForm 
} from '../utils/validators.js';

// Email validation
if (!validateEmail(email)) {
  // Invalid format
}

// Password validation (min 6 chars)
if (!validatePassword(password)) {
  // Too short
}

// Image validation
const result = validateImage(file);
if (!result.valid) {
  console.log(result.error); // Error message
}

// Article form validation
const errors = validateArticleForm(formData);
if (Object.keys(errors).length > 0) {
  // errors = { title: 'error msg', ... }
}
```

### Helpers

```javascript
import {
  formatDate,
  formatDatetime,
  truncateText,
  generateSlug,
  isLoggedIn,
  showNotification,
  showConfirmDialog,
  escapeHtml
} from '../utils/helpers.js';

// Format date to readable string
formatDate('2026-02-06T12:00:00Z'); // 'February 6, 2026'

// Format with time
formatDatetime('2026-02-06T12:00:00Z'); // 'Feb 6, 2026 at 12:00 PM'

// Truncate text
truncateText(longText, 150); // 'Text...'

// Generate URL slug
generateSlug('Article Title'); // 'article-title'

// Check if user logged in
if (isLoggedIn()) {
  // User has token
}

// Show notification
showNotification('Success message', 'success');
showNotification('Error occurred', 'danger');

// Confirm dialog
showConfirmDialog('Delete this?', () => {
  // User clicked confirm
}, () => {
  // User clicked cancel
});

// HTML escape (prevent XSS)
escapeHtml('<script>alert("xss")</script>');
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

### Constants

```javascript
import { 
  ITEMS_PER_PAGE,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES
} from '../utils/constants.js';

ITEMS_PER_PAGE; // 10
MAX_FILE_SIZE; // 5242880 (5MB in bytes)
ALLOWED_IMAGE_TYPES; // ['image/jpeg', 'image/png', 'image/webp']
```

## Error Handling

All service functions throw errors that should be caught:

```javascript
try {
  const article = await getArticleById(id);
} catch (error) {
  // Handle: Article not found, DB error, etc.
  showNotification('Failed: ' + error.message, 'danger');
}
```

Common errors:
- `"Article not found"` - 404
- `"User not authenticated"` - Need to login
- `"Insufficient permissions"` - Role/ownership check failed
- `"Database error"` - Server-side issue

## Rate Limiting

Supabase applies rate limits on free tier:
- ~100 DB queries per second
- Large file uploads: ~5MB max
- See Supabase docs for limits

## Caching Strategy

Currently minimal caching. To improve performance:

```javascript
// Basic in-memory cache
const cache = new Map();

export async function fetchArticlesWithCache(page) {
  const key = `articles_${page}`;
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetchArticles(page);
  cache.set(key, data);
  return data;
}
```

## Testing Services

```javascript
// Mock Supabase for testing
jest.mock('../services/supabase-client.js', () => ({
  supabase: {
    from: jest.fn()
  }
}));

test('fetchArticles returns articles', async () => {
  const articles = await fetchArticles(1);
  expect(articles.length).toBeGreaterThan(0);
});
```

---

For detailed integration examples, see page files in `src/pages/`
