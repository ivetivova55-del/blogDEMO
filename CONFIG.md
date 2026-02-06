# Configuration & Environment Setup

## Environment Variables

Create `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key-here
```

### Getting Supabase Credentials

1. Create free account at https://supabase.com
2. Create new project (takes ~2 minutes)
3. Go to Project Settings → API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` (public) API key → `VITE_SUPABASE_ANON_KEY`

**⚠️ Important**: Never commit `.env` file to git. Use `.env.example` as template.

## Vite Configuration

File: `vite.config.js`

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',              // Source directory
  build: {
    outDir: '../dist',      // Output directory
    emptyOutDir: true,      // Clean before build
  },
  server: {
    port: 3000,             // Dev server port
    open: true,             // Auto-open browser
  },
});
```

### Build Process
1. Vite bundles all modules
2. CSS is minified
3. JavaScript is optimized
4. Output to `dist/` folder
5. Ready for deployment

## NPM Scripts

In `package.json`:

```json
{
  "scripts": {
    "dev": "vite",              // Start dev server
    "build": "vite build",      // Production build
    "preview": "vite preview"   // Preview built site
  }
}
```

### Running Commands

```bash
# Development
npm run dev
# Opens http://localhost:3000

# Production build
npm run build
# Creates optimized dist/

# Preview production build
npm run preview
```

## Dependencies

### Current Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "bootstrap": "^5.3.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### Why These?
- **@supabase/supabase-js**: Supabase client library
- **bootstrap**: CSS framework for styling
- **vite**: Modern build tool and dev server

### No TypeScript
Keeping vanilla JavaScript for simplicity and faster learning curve.

## Supabase Project Setup

### Creating Tables

Use Supabase SQL Editor to run migrations:

1. **Users Table** (001_init_users.sql)
   - Stores user profiles
   - RLS policies for privacy
   - Role-based access control

2. **Categories Table** (002_init_categories.sql)
   - Article categorization
   - Predefined categories seeded

3. **Articles Table** (003_init_articles.sql)
   - Blog post content
   - Indexed for performance
   - Full RLS policies

4. **Comments Table** (004_init_comments.sql)
   - Article discussions
   - Author tracking
   - Approval status

### Creating Storage Bucket

1. Go to Supabase → Storage
2. Click "New Bucket"
3. Name: `article-images`
4. Allow public access (for image URLs)

### RLS Policies

Automatically created by migrations:
- `anyone` can read published articles
- `users` can create articles
- `authors` can edit own articles
- `admins` can edit/delete any article

## Development Workflow

### Start Project

```bash
git clone <repo>
cd blogDEMO
npm install
cp .env.example .env
# Edit .env with credentials
npm run dev
```

### Make Changes

1. Edit files in `src/`
2. Save - Vite auto-reloads
3. Browser refreshes instantly
4. Check console for errors

### Commit Changes

```bash
git add .
git commit -m "Clear message about changes"
git push origin main
```

## Deployment Configuration

### Netlify (`netlify.toml` - optional)

```toml
[build]
command = "npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "18"
```

### Vercel (`vercel.json` - optional)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## GitHub Configuration

### Branch Protection

Recommended `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
```

## Performance Configuration

### Image Optimization

Add to vite.config.js for image optimization:

```javascript
import imagemin from 'vite-plugin-imagemin';

export default {
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 20 },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4
      },
      svgo: { plugins: [{ name: 'removeViewBox' }] }
    })
  ]
};
```

## Database Configuration

### Connection Pooling

Supabase handles automatically for PostgreSQL connections.

### Backup

Enable in Supabase:
- Settings → Backups
- Automatic backups enabled
- Manual backup available

## Security Configuration

### CORS

Supabase automatically handles CORS for your domain.

### SSL/TLS

All Supabase connections are HTTPS.

### Rate Limiting

Free tier limits:
- 100 DB queries/second
- 5MB max file upload
- See Supabase docs for full limits

## Monitoring

### Supabase Dashboard

View:
- Real-time API usage
- Database performance
- Storage usage
- Auth events

### Deployment Monitoring

**Netlify:**
- Build logs
- Deployment history
- Performance analytics

**Vercel:**
- Build output
- Edge function logs
- Analytics dashboard

## Local Development Tips

### VS Code Extensions Recommended

- ES6 Intellisense
- Bootstrap Intellisense
- SQL Formatter
- GitLens

### Browser DevTools

- Use Network tab to debug API calls
- Console for JavaScript errors
- Storage tab to inspect localStorage

### Debugging Tips

```javascript
// Log API responses
console.log('Data:', data);

// Check user auth status
const user = await getCurrentUser();
console.log('User:', user);

// Time API calls
console.time('fetch-articles');
const articles = await fetchArticles();
console.timeEnd('fetch-articles');
```

## Troubleshooting Configuration Issues

**Port 3000 in use?**
```bash
npm run dev -- --port 3001
```

**Module not found?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Supabase connection failing?**
- Verify .env variables are correct
- Check network connectivity
- Ensure Supabase project is active

**Build fails?**
- Check Node version: `node --version`
- Clear cache: `rm -rf .cache dist`
- Reinstall: `npm install`

---

**Ready to configure? Start with environment variables and Supabase setup!**
