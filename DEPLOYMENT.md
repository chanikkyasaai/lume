# Deployment Guide

## GitHub Push Sequence

1. **Check git status and add files:**
```bash
git status
git add .
```

2. **Commit changes with descriptive message:**
```bash
git commit -m "feat: add custom scrollbar design and prepare for deployment

- Add custom gradient scrollbar design across entire app
- Implement responsive scrollbar sizing for mobile
- Complete settings modal optimization for mobile experience
- Add Vercel deployment configuration with SPA routing
- Remove live discussion mode and simplify to auto-only
- Fix localStorage API key loading issues"
```

3. **Push to GitHub:**
```bash
git push origin main
```

## Alternative if you need to set up repository:
```bash
# Initialize git (if not already done)
git init

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/thechanedev/summon-the-council.git

# Set upstream and push
git push -u origin main
```

## Vercel Deployment Options

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: Connect GitHub to Vercel (Web Interface)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration from vercel.json
6. Click "Deploy"

## Build Verification Commands (Run locally before deployment)
```bash
# Test build locally
npm run build

# Preview the build
npm run preview

# Check for any TypeScript errors
npm run lint
```

## Environment Variables (Set in Vercel Dashboard)
Since you're using localStorage for API keys, no environment variables needed for the build. However, if you want to add analytics or other services:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add any needed variables

## Post-Deployment Checklist
- [ ] Test all routes work correctly (/, /council, /404)
- [ ] Verify API key modal functionality
- [ ] Test custom scrollbar appearance
- [ ] Check mobile responsiveness
- [ ] Verify audio playback works
- [ ] Test localStorage persistence
