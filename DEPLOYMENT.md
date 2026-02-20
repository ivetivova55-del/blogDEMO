# Deployment Guide

## Deploy to Netlify

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
```bash
git remote add origin https://github.com/your-username/blogDEMO.git
git branch -M main
git push -u origin main
```

2. **Connect to Netlify**
   - Visit https://app.netlify.com
   - Click "New site from Git"
   - Authorize GitHub and select repository
   
3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click Deploy

4. **Add Environment Variables**
   - Go to Site settings → Environment
   - Add secrets:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`

5. **Configure GitHub Secrets (for GitHub Actions)**
   - Go to repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key
     - `NETLIFY_AUTH_TOKEN` - Personal access token from Netlify (see below)
     - `NETLIFY_SITE_ID` - Site ID from Netlify (see below)
   
   **Getting Netlify Credentials:**
   
   For `NETLIFY_AUTH_TOKEN`:
   - Visit https://app.netlify.com/user/applications
   - Click "New access token"
   - Give it a name (e.g., "GitHub Actions")
   - Copy the generated token
   
   For `NETLIFY_SITE_ID`:
   - Go to your site in Netlify
   - Click Site settings
   - Under "Site details" → "Site information"
   - Copy the "Site ID" (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

6. **Redeploy**
   - Go to Deploys and trigger redeploy
   - Live site is now active!

### Option 2: Manual Deploy

```bash
npm run build
# Download dist/ folder
# Drag to Netlify drop zone
```

## Deploy to Vercel

1. **Import Project**
   - Visit https://vercel.com
   - Click "New Project"
   - Import from GitHub

2. **Configure**
   - Framework: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Deploy**
   - Click Deploy
   - URL generated automatically

## Post-Deployment Checklist

- [ ] Site is accessible via HTTPS
- [ ] Home page loads correctly
- [ ] Login/register functionality works
- [ ] Demo credentials authenticate properly
- [ ] Articles display with images
- [ ] Search and filtering work
- [ ] Admin panel accessible to admins
- [ ] Mobile responsive on all devices
- [ ] Environment variables configured
- [ ] Database migrations applied

## Monitoring & Maintenance

### Supabase Dashboard
- Monitor real-time activity
- Check API usage
- Review Row Level Security logs
- Manage storage buckets

### Netlify/Vercel Analytics
- View deployment history
- Monitor build times
- Track page performance
- Set up alerts

## Common Issues

**Build fails with "Module not found"**
- Run `npm install` locally
- Verify all imports are correct
- Check that all dependencies are in package.json

**Static files not loading**
- Verify vite.config.js paths are correct
- Check that assets are in src/

**Database queries timeout**
- Add indexes to frequently queried columns
- Optimize RLS policies
- Check Supabase connection limits

**Environment variables not working**
- Verify naming matches vite.config.js (must start with `VITE_`)
- Redeploy after adding variables
- Check that values don't have extra spaces
- For GitHub Actions, ensure secrets are set in repository settings

## Scaling Considerations

1. **Database**
   - Monitor Supabase usage
   - Upgrade plan if needed
   - Optimize queries with indexes

2. **Storage**
   - Images stored in Supabase
   - Consider CDN for large deployments
   - Implement image optimization

3. **Performance**
   - Enable caching on static assets
   - Consider serverless functions
   - Monitor Core Web Vitals

## Backup Strategy

- Export Supabase data regularly
- Git commits serve as code backup
- Store environment variables securely
- Document deployment process

---

**Deployed successfully?** 🎉 Time to monitor and iterate!
