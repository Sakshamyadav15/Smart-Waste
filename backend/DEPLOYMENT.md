# Deployment Guide

Comprehensive deployment guide for EcoSort SmartWaste Backend API.

## Table of Contents

- [Deployment Checklist](#deployment-checklist)
- [Platform-Specific Guides](#platform-specific-guides)
  - [Heroku](#heroku)
  - [Render](#render)
  - [Railway](#railway)
  - [AWS EC2](#aws-ec2)
  - [DigitalOcean](#digitalocean)
  - [Google Cloud Run](#google-cloud-run)
- [Database Options](#database-options)
- [Environment Variables](#environment-variables)
- [Monitoring](#monitoring)
- [Scaling](#scaling)

---

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Seed data prepared
- [ ] API tokens secured
- [ ] Rate limits configured
- [ ] Logging configured
- [ ] Error monitoring setup (Sentry)
- [ ] SSL/HTTPS enabled
- [ ] CORS origins restricted
- [ ] File upload limits set
- [ ] Backup strategy in place
- [ ] Health check endpoint tested
- [ ] Load testing completed

---

## Platform-Specific Guides

### Heroku

**Cost:** Free tier available, $7/month for basic dyno

**Steps:**

```bash
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Create app
heroku create ecosort-backend-prod

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set HF_API_TOKEN=your_token_here
heroku config:set ADMIN_API_KEY=your_admin_key
heroku config:set MAX_IMAGE_SIZE_MB=5
heroku config:set MAX_AUDIO_SIZE_MB=10

# 5. Deploy
git push heroku main

# 6. Run migrations
heroku run npm run migrate

# 7. Seed database
heroku run npm run seed

# 8. Scale (optional)
heroku ps:scale web=1

# 9. View logs
heroku logs --tail

# 10. Open app
heroku open
```

**Heroku-specific Configuration:**

Create `Procfile`:
```
web: node server.js
```

**Database:** Use Heroku Postgres addon for production
```bash
heroku addons:create heroku-postgresql:mini
```

---

### Render

**Cost:** Free tier available, $7/month for starter

**Steps:**

1. **Create Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect GitHub repository

2. **Configure Service:**
   - **Name:** ecosort-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free or Starter

3. **Environment Variables:**
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`

4. **Deploy:**
   - Click "Create Web Service"
   - Render automatically deploys

5. **Post-Deploy:**
   - Add build command: `npm run migrate && npm run seed`
   - Or run manually via Shell

**Auto-Deploy:** Enable GitHub auto-deploy for continuous deployment

---

### Railway

**Cost:** $5 credit free, pay-as-you-go

**Steps:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Link to project
railway link

# 5. Set environment variables
railway variables set HF_API_TOKEN=your_token
railway variables set ADMIN_API_KEY=your_key

# 6. Deploy
railway up

# 7. Run migrations
railway run npm run migrate

# 8. Get URL
railway domain
```

**Railway.toml:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

### AWS EC2

**Cost:** Free tier eligible (t2.micro), ~$10/month for t3.small

**Steps:**

```bash
# 1. Launch EC2 instance (Ubuntu 22.04 LTS)

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Install Git
sudo apt install -y git

# 6. Clone repository
git clone https://github.com/your-repo/ecosort-backend.git
cd ecosort-backend

# 7. Install dependencies
npm install --production

# 8. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 9. Run migrations
npm run migrate
npm run seed

# 10. Install PM2 for process management
sudo npm install -g pm2

# 11. Start application
pm2 start server.js --name ecosort-backend

# 12. Configure PM2 to start on boot
pm2 startup systemd
pm2 save

# 13. Setup NGINX reverse proxy
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/ecosort

# Add configuration (see below)
sudo ln -s /etc/nginx/sites-available/ecosort /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 14. Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**NGINX Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        client_max_body_size 20M;
    }
}
```

---

### DigitalOcean

**Cost:** Droplet from $4/month, App Platform from $5/month

**Option 1: Droplet (Similar to AWS EC2)**

Follow AWS EC2 steps with Ubuntu 22.04 droplet.

**Option 2: App Platform**

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App" → GitHub
3. Select repository and branch
4. Configure:
   - **Environment Variables:** Add all from `.env`
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
5. Choose plan and deploy

---

### Google Cloud Run

**Cost:** Free tier generous, pay-per-use

**Steps:**

```bash
# 1. Install Google Cloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# 2. Authenticate
gcloud auth login

# 3. Set project
gcloud config set project YOUR_PROJECT_ID

# 4. Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ecosort-backend

# 5. Deploy
gcloud run deploy ecosort-backend \
  --image gcr.io/YOUR_PROJECT_ID/ecosort-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,HF_API_TOKEN=your_token \
  --max-instances 10 \
  --memory 512Mi \
  --timeout 60s

# 6. Get URL
gcloud run services describe ecosort-backend --region us-central1 --format 'value(status.url)'
```

**Note:** Cloud Run is serverless and stateless. Use Cloud SQL for database.

---

## Database Options

### Production Databases

**PostgreSQL (Recommended for production):**

1. **Install PostgreSQL adapter:**
```bash
npm install pg
```

2. **Update knexfile.js:**
```javascript
production: {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './db/migrations',
  },
}
```

3. **Managed PostgreSQL:**
   - Heroku Postgres
   - AWS RDS
   - DigitalOcean Managed Database
   - Render PostgreSQL

**MySQL:**

Similar to PostgreSQL, use `mysql2` client.

**SQLite (Development/Small Scale):**

Default configuration, suitable for:
- Development
- Testing
- Small-scale deployments
- Read-heavy workloads

---

## Environment Variables

**Production Environment Variables:**

```env
# Server
NODE_ENV=production
PORT=5000

# API Tokens
HF_API_TOKEN=hf_your_production_token
ADMIN_API_KEY=secure-random-string-64-chars

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Security
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=200
CLASSIFY_RATE_LIMIT_MAX=50

# File Upload
MAX_IMAGE_SIZE_MB=5
MAX_AUDIO_SIZE_MB=10

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# Firebase (if used)
USE_FIREBASE=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT=/app/config/firebase-service-account.json
```

---

## Monitoring

### Logging

**Cloud Logging Services:**
- **Papertrail:** Free tier, easy Heroku integration
- **Loggly:** Comprehensive log aggregation
- **CloudWatch:** AWS native solution

**Setup Papertrail:**
```bash
# Heroku
heroku addons:create papertrail

# Manual
# Add Papertrail transport to Winston logger
npm install winston-papertrail
```

### Error Monitoring

**Sentry Setup:**

```bash
npm install @sentry/node
```

**Add to server.js:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring

**Free Services:**
- **UptimeRobot:** Monitor health endpoint every 5 minutes
- **Pingdom:** Basic uptime monitoring
- **Better Uptime:** Comprehensive monitoring

**Setup:**
1. Add `/health` endpoint to monitor
2. Set check interval: 5 minutes
3. Configure alerts via email/SMS

---

## Scaling

### Horizontal Scaling

**Load Balancer + Multiple Instances:**

```bash
# Heroku
heroku ps:scale web=3

# AWS with Load Balancer
# Create Application Load Balancer
# Add EC2 instances to target group

# Kubernetes (Advanced)
kubectl scale deployment ecosort-backend --replicas=3
```

### Vertical Scaling

**Increase Resources:**

```bash
# Heroku
heroku ps:resize web=standard-2x

# AWS
# Change instance type: t3.small → t3.medium
```

### Database Scaling

**Read Replicas:**
- Route read queries to replicas
- Master handles writes
- Reduces load on primary database

**Connection Pooling:**
```javascript
// Add to knexfile.js
pool: {
  min: 2,
  max: 10,
}
```

### Caching

**Redis for Caching:**

```bash
npm install redis
```

**Cache taxonomy mappings:**
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache for 1 hour
await client.setex(`taxonomy:${cityId}`, 3600, JSON.stringify(mappings));
```

---

## Backup Strategy

### Database Backups

**Automated Backups:**
- Heroku Postgres: Automatic daily backups
- AWS RDS: Automated snapshots
- Managed databases: Built-in backup

**Manual Backup:**
```bash
# PostgreSQL
pg_dump DATABASE_URL > backup-$(date +%Y%m%d).sql

# SQLite
cp db/ecosort.sqlite backups/ecosort-$(date +%Y%m%d).sqlite
```

### File Uploads Backup

**Cloud Storage:**
- AWS S3 with versioning
- Google Cloud Storage
- DigitalOcean Spaces

---

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured
- [ ] API tokens rotated regularly
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled
- [ ] File upload validation
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (Helmet.js)
- [ ] CSRF tokens (if using sessions)
- [ ] Security headers configured
- [ ] Dependencies updated regularly
- [ ] Secrets never in code/logs

---

## Cost Optimization

**Tips:**
1. Use free tiers for development/staging
2. Enable auto-scaling with min/max limits
3. Use CDN for static assets
4. Implement caching aggressively
5. Monitor and set billing alerts
6. Use spot instances (AWS) for non-critical workloads
7. Optimize Docker image size

---

**For questions or issues, see [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue.**
