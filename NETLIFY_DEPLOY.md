# Quick Netlify Deployment Guide

## Prerequisites

- GitHub repository with this project
- Netlify account (free tier works)
- Supabase project with credentials

## Step-by-Step Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Configure GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 4 secrets:

| Secret Name | Where to Find It |
|-------------|------------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → Project API keys → `anon` `public` |
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Applications → Personal access tokens → New token |
| `NETLIFY_SITE_ID` | Create site first (step 3), then get ID from Site settings → General → Site details |

### 3. Create Netlify Site

**Option A: Manual (first time)**
1. Visit https://app.netlify.com
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag & drop the `dist/` folder (after running `npm run build`)
4. Once created, copy the **Site ID** from Site settings

**Option B: Import from Git**
1. Click **"Add new site"** → **"Import an existing project"**
2. Connect GitHub and select your repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4. Enable GitHub Actions

After adding all 4 secrets, push any commit or go to **Actions** tab → **Deploy to Netlify** → **Run workflow**

### 5. Verify Deployment

- Check GitHub Actions workflow completes successfully (green checkmark)
- Visit your Netlify site URL
- Test login with demo credentials:
  - Email: `admin@digiquill.com`
  - Password: `pass123`

## Troubleshooting

### Build fails with "Missing Supabase env vars"
→ Ensure secrets are added in GitHub **repository settings**, not personal settings
→ Secret names must match exactly (including `VITE_` prefix)

### "Unable to resolve action nwtgck/actions-netlify"
→ Already fixed! We're using `v3.0` which is stable

### Netlify site shows blank page
→ Check browser console for errors
→ Verify environment variables in Netlify Site settings → Environment
→ Re-run deployment

### Database queries fail
→ Run database migrations in Supabase SQL Editor
→ Check RLS policies are enabled
→ Verify API keys are correct

## Manual Deployment (Alternative)

If GitHub Actions don't work, you can deploy manually:

```bash
# Build locally
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## Monitoring

- **Netlify deploys**: https://app.netlify.com/sites/YOUR_SITE/deploys
- **GitHub Actions**: https://github.com/YOUR_USERNAME/blogDEMO/actions
- **Supabase logs**: https://supabase.com/dashboard/project/YOUR_PROJECT/logs

---

**Need help?** Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
