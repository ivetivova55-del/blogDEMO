# Blog Demo Setup Guide

## Quick Start (5 minutes)

### 1. Initialize Project
```bash
npm install
cp .env.example .env
```

### 2. Configure Supabase
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Copy your URL and anon key to `.env`

### 3. Setup Database
In Supabase SQL editor, run:
- `db/migrations/001_init_users.sql`
- `db/migrations/002_init_categories.sql`
- `db/migrations/003_init_articles.sql`
- `db/migrations/004_init_comments.sql`
- `db/seed.sql` (optional, for sample data)

### 4. Create Storage Bucket
- In Supabase Storage, create bucket named `article-images`
- Set public access policies

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and login with demo credentials.

## Production Build

```bash
npm run build
```

Output will be in `dist/` directory, ready for deployment to Netlify or Vercel.

## Key Pages

| Route | Purpose |
|-------|---------|
| `/` | Home page |
| `/login` | User login |
| `/register` | New account |
| `/articles` | All articles |
| `/article/:id` | Single article |
| `/create-article` | Write article |
| `/profile` | User profile |
| `/admin` | Admin panel (admin only) |

## File Structure Overview

- **pages/** - Application pages (router targets these)
- **components/** - Reusable UI pieces (header, footer, cards)
- **services/** - API calls and business logic
- **utils/** - Helpers, validators, constants
- **styles/** - CSS organized by concern
- **db/** - SQL migrations and seed data

## Architecture Pattern

```
Router (main.js)
    ↓
Page (pages/*.js)
    ↓
Components + Services
    ↓
Utils + Styles
```

Each page exports `init()` and `render()` functions. Components are pure HTML generators.

## Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- --port 3001
```

**Build size too large?**
Check `dist/` folder, consider code splitting with dynamic imports.

**Database migrations failing?**
- Copy SQL from `db/migrations/` files
- Paste into Supabase SQL editor one by one
- Check for errors in output

## Next Steps

1. Customize styling in `src/styles/`
2. Add more features to services/
3. Extend pages with new functionality
4. Deploy to Netlify/Vercel
5. Monitor with Supabase dashboard

Happy coding! 🚀
