# Blog Demo - AI Development Instructions

## Project Context
Blog Demo is a modern, multi-page IT and marketing news blog application built with vanilla JavaScript, Vite, Bootstrap, and Supabase. The project emphasizes modular architecture, clean code separation, and professional development practices.

## Technology Stack
- **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Backend**: Supabase (Auth, Database, Storage)
- **No**: TypeScript, React, Vue, Angular, or other frameworks

## Architecture Principles

### 1. Modular Structure
- Each page is a separate file in `src/pages/`
- Business logic is in `src/services/`
- UI components are in `src/components/`
- Utilities and helpers are in `src/utils/`
- Styles are organized in `src/styles/`
- Never create monolithic files; split concerns clearly

### 2. File Organization
```
src/
├── pages/          # Page controllers (each page is a self-contained module)
├── components/     # Reusable UI components
├── services/       # Business logic (API calls, data operations)
├── utils/          # Helper functions and utilities
└── styles/         # CSS files organized by concern
```

### 3. Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.js`, `article-card.js`)
- **Functions**: camelCase (e.g., `loadArticles()`, `initializeApp()`)
- **Classes**: PascalCase (e.g., `ArticleService`, `AuthManager`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_URL`, `MAX_ITEMS_PER_PAGE`)
- **CSS Classes**: kebab-case (e.g., `article-card`, `main-header`)

### 4. Code Style
- Use ES6+ syntax (arrow functions, const/let, template literals)
- Keep functions small and focused (single responsibility principle)
- Add comments for complex logic
- Use meaningful variable names
- Avoid global variables; use modules and exports
- Always validate user input and handle errors gracefully

### 5. Service Layer Pattern
All services export functions that handle specific domains:

```javascript
// services/article-service.js
export async function fetchArticles(page = 1, limit = 10) { ... }
export async function getArticleById(id) { ... }
export async function createArticle(articleData) { ... }
export async function updateArticle(id, articleData) { ... }
export async function deleteArticle(id) { ... }
```

### 6. Page Structure
Each page file exports initialization and render functions:

```javascript
// pages/article-detail.js
export async function initArticleDetail() {
  // Setup event listeners
  // Load initial data
}

export function renderArticleDetail(article) {
  // Render the page UI
}
```

### 7. Component Pattern
Reusable components return HTML strings or DOM elements:

```javascript
// components/article-card.js
export function createArticleCard(article) {
  return `
    <div class="article-card">
      <!-- Card content -->
    </div>
  `;
}
```

## Database Schema Rules
- All tables have `id` (UUID), `created_at`, `updated_at` columns
- Foreign keys use `_id` suffix (e.g., `user_id`, `category_id`)
- Boolean fields use `is_` prefix (e.g., `is_published`, `is_verified`)
- Enum fields use lowercase values (e.g., 'draft', 'published')

## Authentication & Authorization
- Store JWT tokens in localStorage (key: `supabase_auth_token`)
- Check user role before rendering admin features
- Always validate permissions on backend before allowing operations
- Roles: 'user' (default) and 'admin' (super user)

## Styling Guidelines
- Use Bootstrap 5 utility classes for common styles
- Create custom CSS only for application-specific styles
- Organize styles by component/page
- Use CSS variables for colors and spacing
- Mobile-first responsive design
- Maintain consistency with existing design

## Error Handling
- Always use try-catch blocks around async operations
- Display user-friendly error messages (not technical details)
- Log errors for debugging (in development)
- Validate data before operations
- Handle network errors gracefully

## Performance Considerations
- Lazy load images
- Paginate large data sets
- Cache frequently accessed data
- Minimize DOM manipulation
- Use event delegation for dynamic content
- Avoid nested loops

## Security Practices
- Never store sensitive data in localStorage (only tokens)
- Sanitize user input (use textContent instead of innerHTML when safe)
- Use HTTPS for all external requests
- Validate user permissions on every sensitive operation
- Use parameterized queries (Supabase handles this)
- Never expose API keys in client code (use Vite env variables)

## Git Workflow
- Make meaningful commits with clear messages
- One feature/fix per commit
- Use present tense in commit messages (e.g., "Add user authentication")
- Push commits across multiple days for project progression
- Example commits:
  - "Setup project structure and Vite configuration"
  - "Add Supabase integration and authentication service"
  - "Implement home page with featured articles"
  - "Create article management UI and CRUD operations"
  - "Add admin dashboard with user management"
  - "Implement image upload and storage integration"
  - "Add article search and filtering"
  - "Create user profile page"
  - "Add article comments functionality"
  - "Setup deployment configuration"

## When Making Changes

### Adding a New Page
1. Create file in `src/pages/[page-name].js`
2. Export `init[PageName]()` and `render[PageName]()` functions
3. Add route to `main.js`
4. Update header navigation component
5. Test navigation and rendering

### Adding a New Component
1. Create file in `src/components/[component-name].js`
2. Export function(s) that return HTML or manipulate DOM
3. Use in pages or other components
4. Keep component logic separate from page logic

### Adding Backend Logic
1. Create service in `src/services/[domain]-service.js`
2. Export async functions for CRUD operations
3. Use Supabase client from `supabase-client.js`
4. Handle errors and validation
5. Call from pages/components

### Modifying Database
1. Create new migration script in `db/migrations/`
2. Name: `NNN_description.sql` (e.g., `005_add_tags_to_articles.sql`)
3. Include both schema changes and initial data if needed
4. Document changes in comments
5. Update seed.sql with new sample data

## Common Tasks

### Setup Development Environment
```bash
npm install
cp .env.example .env
# Add Supabase credentials to .env
npm run dev
```

### Run Database Migrations
- Execute SQL files from `db/migrations/` in Supabase SQL Editor
- Run seed.sql for sample data

### Build for Production
```bash
npm run build
```

### Deploy
- Push to GitHub
- Deploy via Netlify/Vercel using `npm run build`
- Configure environment variables in deployment platform
- Test demo credentials work on live site

## Code Review Checklist
- [ ] Code follows naming conventions
- [ ] Functions have single responsibility
- [ ] Error handling is present
- [ ] No console.logs in production code (except development helper)
- [ ] CSS is organized and follows guidelines
- [ ] No hardcoded values (use constants)
- [ ] Accessibility considerations addressed
- [ ] Mobile-responsive design verified
- [ ] Git commit message is clear
- [ ] Documentation is updated if needed

## Testing Checklist Before Commits
- [ ] Page renders correctly
- [ ] Navigation works between pages
- [ ] Forms validate input
- [ ] API calls work with sample data
- [ ] Errors display user-friendly messages
- [ ] Mobile responsiveness verified
- [ ] Demo credentials work for testing

## Documentation Standards
- README: Project overview, setup, deployment
- Comments: Explain WHY not WHAT (code explains itself)
- Commit messages: Clear, actionable descriptions
- Function descriptions: Purpose, parameters, return value
- Complex logic: Step-by-step explanation

## Deployment Checklist
- [ ] All tests pass
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Sample data seeded
- [ ] Demo credentials working
- [ ] Live site responsive and functional
- [ ] Error logging configured
- [ ] Security headers set (if applicable)
- [ ] Performance acceptable
