# Deployment Guide

## Hosting Options

### Option 1: Vercel (Recommended - Free)

1. Push code to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Deploy to Vercel
- Visit vercel.com
- Click "New Project"
- Import your GitHub repository
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Click "Deploy"

3. Environment Variables (if using backend)
- Add `VITE_API_URL=https://your-backend.com`

### Option 2: Netlify (Free)

1. Build the project
```bash
npm run build
```

2. Deploy to Netlify
- Visit netlify.com
- Drag and drop the `dist` folder
OR
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`

### Option 3: GitHub Pages (Free)

1. Install gh-pages
```bash
npm install --save-dev gh-pages
```

2. Add to package.json
```json
{
  "homepage": "https://yourusername.github.io/Smart-Waste",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update vite.config.ts
```typescript
export default defineConfig({
  base: '/Smart-Waste/',
  plugins: [react()]
})
```

4. Deploy
```bash
npm run deploy
```

### Option 4: Railway (Backend + Frontend)

1. Install Railway CLI
```bash
npm install -g @railway/cli
```

2. Login and init
```bash
railway login
railway init
```

3. Deploy backend
```bash
cd backend
railway up
```

4. Deploy frontend
```bash
cd ..
railway up
```

## Backend Deployment

### Render.com (Free)

1. Create render.yaml in backend folder
```yaml
services:
  - type: web
    name: ecosort-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

2. Connect GitHub and deploy

### Railway (Free Tier)

1. Push backend to GitHub
2. Visit railway.app
3. New Project from GitHub
4. Select backend folder
5. Add environment variables
6. Deploy

## Environment Setup

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env.production)
```
NODE_ENV=production
PORT=5000
DATABASE_PATH=./database/app.db
```

## Post-Deployment Checklist

- [ ] Test all features
- [ ] Verify AI model loads
- [ ] Check multilingual support
- [ ] Test PWA installation
- [ ] Verify leaderboard
- [ ] Test location finder
- [ ] Check responsive design

## Custom Domain Setup

### Vercel
1. Go to Project Settings
2. Add domain
3. Update DNS records

### Netlify  
1. Domain Settings
2. Add custom domain
3. Configure DNS

## Performance Optimization

1. Enable compression
2. Use CDN for assets
3. Implement caching headers
4. Optimize images
5. Lazy load components

## Monitoring

- Vercel Analytics (free)
- Google Analytics
- Sentry for error tracking
