# BlogDemo Architecture Guide

## Project Philosophy

BlogDemo follows **modular**, **service-oriented** architecture principles:

- ✅ Each page is independent and self-contained
- ✅ Business logic separated from UI components
- ✅ Reusable components follow functional programming
- ✅ Services handle all API interactions
- ✅ Utils provide universal helper functions

## Directory Structure & Responsibilities

### `src/pages/`
Self-contained page modules that export:
- `init()` - Setup event listeners and initial data loading
- `render()` - Return HTML string for the page

Example: `src/pages/articles-list.js`
```javascript
export async function initArticlesList(params) {
  // Load data, setup filters
}

export async function renderArticlesList() {
  // Return HTML
}
```

### `src/components/`
Pure HTML-generating functions (no state, no side effects):
- Take data as parameters
- Return HTML strings
- Used by pages to build UI

Example: `src/components/article-card.js`
```javascript
export function createArticleCard(article) {
  return `<div class="article-card">...</div>`;
}
```

### `src/services/`
Business logic and API calls using Supabase:
- Handle all database operations
- Manage authentication
- Manage file uploads
- Return processed data to pages

Example: `src/services/article-service.js`
```javascript
export async function fetchArticles(page, filters) {
  // Query Supabase
  // Return articles
}
```

### `src/utils/`
Shared utility functions:
- **validators.js**: Form and data validation
- **helpers.js**: Formatting, notifications, common operations
- **constants.js**: Configuration values and limits

### `src/styles/`
CSS organized by concern:
- **main.css**: Global styles, typography, utilities
- **components.css**: Component-specific styles (cards, forms)
- **layout.css**: Header, footer, grid layouts, navigation

### `src/main.js`
Application entry point:
- Router implementation
- Header/footer rendering
- Page switching logic
- Hash-based navigation

## Data Flow

```
User Action (click, form submission)
    ↓
Page Event Handler
    ↓
Service Call (Supabase API)
    ↓
Data Processing
    ↓
Component Rendering
    ↓
DOM Update
```

## Authentication Flow

```
User enters credentials
    ↓
auth-service.register() or login()
    ↓
Supabase Auth creates session
    ↓
JWT token stored in localStorage
    ↓
User redirected to home
    ↓
Header updated with user info
```

## Article Management Flow

```
User writes article
    ↓
create-article page validates
    ↓
Image uploaded via storage-service
    ↓
Article data saved via article-service
    ↓
Redirects to articles-list
    ↓
New article appears in list
```

## Service Layer Patterns

### Authentication Service
```javascript
- register(email, password, name)
- login(email, password)
- logout()
- getCurrentUserWithProfile()
- updateUserProfile(userId, updates)
- isAdmin()
```

### Article Service
```javascript
- fetchArticles(page, filters)
- getArticleById(id)
- createArticle(data, userId)
- updateArticle(id, updates)
- deleteArticle(id)
- getCategories()
- addComment(articleId, userId, content)
```

### Storage Service
```javascript
- uploadImage(file, folder)
- deleteImage(filePath)
```

### User Service (Admin)
```javascript
- getAllUsers()
- getUserStats()
- updateUserRole(userId, role)
- deleteUser(userId)
```

## Component Usage Examples

```javascript
// In a page file:
import { createArticleCard } from '../components/article-card.js';
import { fetchArticles } from '../services/article-service.js';

export async function renderArticlesList() {
  const { articles } = await fetchArticles(1, {});
  const html = articles.map(createArticleCard).join('');
  return `<div class="articles-grid">${html}</div>`;
}
```

## Error Handling Strategy

All async operations use try-catch:
```javascript
try {
  const data = await someService();
  // Process data
} catch (error) {
  showNotification('User-friendly error message', 'danger');
  console.error('Technical error:', error);
}
```

## State Management

- **Local storage**: Auth tokens, user preferences
- **Page state**: Managed within page file
- **Global state**: Minimal (only auth/user info)
- **URL state**: Page and filters in hash/query params

## Validation Strategy

1. **Client-side**: Quick feedback to users
2. **Server-side**: Supabase RLS policies enforce rules
3. **Form validation**: Real-time before submission
4. **Data validation**: Before sending to API

Example:
```javascript
// In page:
const errors = validateArticleForm(formData);
if (errors.length > 0) {
  displayFormErrors(errors);
  return;
}
await article-service.createArticle(...);
```

## Styling Conventions

1. **Bootstrap utilities** for common styles
2. **Custom CSS** only for app-specific designs
3. **CSS classes** in kebab-case
4. **CSS variables** for colors/spacing
5. **Mobile-first** responsive design

Example:
```css
.article-card {
  --card-padding: 1.5rem;
  padding: var(--card-padding);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  transition: all var(--transition);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}
```

## Performance Optimizations

1. **Lazy loading**: Images use `loading="lazy"`
2. **Pagination**: 10 items per page
3. **Caching**: Frequently accessed data cached
4. **Code splitting**: Each page is separate module
5. **CSS optimization**: Bootstrap utilities + minimal custom CSS
6. **Event delegation**: Single listeners for dynamic content

## Security Considerations

1. **Supabase RLS**: Enforces row-level permissions
2. **Parameterized queries**: Prevents SQL injection
3. **Environment variables**: Secrets never in code
4. **XSS prevention**: Use textContent, not innerHTML
5. **Authentication**: JWT in localStorage
6. **Authorization**: Check user role before sensitive ops

## Testing Checklist

Before committing code:
- [ ] Page renders without errors
- [ ] All links navigate correctly
- [ ] Forms validate properly
- [ ] API calls work with sample data
- [ ] Error messages are user-friendly
- [ ] Mobile responsive (test on phone)
- [ ] No console errors/warnings
- [ ] Code follows conventions

## Adding a New Feature

1. **Plan**: Sketch data flow
2. **Database**: Add schema if needed
3. **Service**: Add API functions
4. **Component**: Create reusable UI piece
5. **Page**: Implement feature in page
6. **Style**: Add CSS if needed
7. **Test**: Verify all functionality
8. **Commit**: Meaningful commit message

Example: Adding article "likes" feature
1. Add `likes` column to articles table
2. Add `addLike()`, `removeLike()`, `getLikeCount()` to service
3. Create `<like-button>` component
4. Add component to article-detail page
5. Add CSS for button animations
6. Test all interactions
7. Commit: "Add article likes functionality"

---

This architecture ensures:
✅ Scalability - Easy to add features
✅ Maintainability - Clear file organization
✅ Testability - Isolated, pure functions
✅ Reusability - Components and services shared across pages
