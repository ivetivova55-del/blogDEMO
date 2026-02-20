# Pre-Deployment Checklist ✅

Use this checklist before deploying to ensure everything is configured correctly.

## Local Setup

- [ ] `.env` file exists in project root
- [ ] `VITE_SUPABASE_URL` is set in `.env`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set in `.env`
- [ ] `npm install` runs without errors
- [ ] `npm run build` completes successfully
- [ ] Site works locally with `npm run dev`

## GitHub Repository

- [ ] Project is pushed to GitHub
- [ ] Branch is `main` or `master`
- [ ] `.github/workflows/deploy.yml` exists
- [ ] Workflow uses `nwtgck/actions-netlify@v3.0` (not v2.0.11)

## GitHub Secrets (Repository Settings)

Go to: **Settings** → **Secrets and variables** → **Actions**

- [ ] `VITE_SUPABASE_URL` added
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` added  
- [ ] `NETLIFY_AUTH_TOKEN` added
- [ ] `NETLIFY_SITE_ID` added

## Netlify Setup

- [ ] Netlify site created (manually or via import)
- [ ] Site ID copied from Netlify settings
- [ ] Personal access token generated from Netlify
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`

## Netlify Environment Variables

Go to: **Site settings** → **Environment variables**

- [ ] `VITE_SUPABASE_URL` added
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` added

## Supabase Configuration

- [ ] Database migrations applied (from `db/migrations/`)
- [ ] Seed data loaded (optional, use `db/seed.sql`)
- [ ] RLS policies enabled on tables
- [ ] API keys visible in Project Settings → API
- [ ] Storage bucket `task-attachments` created (if using file uploads)

## Test Before Deployment

- [ ] Demo login works: `admin@digiquill.com` / `pass123`
- [ ] Tasks can be created/edited/deleted
- [ ] Calendar shows tasks correctly
- [ ] Projects page loads
- [ ] Admin panel accessible to admin users
- [ ] FAQ page loads and works
- [ ] Mobile responsive (test on phone/tablet)

## Post-Deployment Verification

After deployment completes:

- [ ] GitHub Actions workflow succeeded (green checkmark)
- [ ] Netlify deployment succeeded
- [ ] Site URL is accessible
- [ ] Homepage loads correctly
- [ ] Login works with demo credentials
- [ ] Dashboard displays user data
- [ ] No console errors in browser DevTools
- [ ] All pages accessible (Home, Dashboard, Projects, FAQ, Admin)

## Common Issues Fixed

✅ Changed `nwtgck/actions-netlify@v2.0.11` → `@v3.0` (v2.0.11 doesn't exist)
✅ Updated `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY` in workflow
✅ Added detailed instructions for getting Netlify credentials
✅ Verified build works locally before pushing

---

**All checked?** You're ready to deploy! 🚀

```bash
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

Then watch the magic happen in GitHub Actions → Deploy to Netlify workflow.
