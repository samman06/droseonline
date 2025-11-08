# Production Deployment Guide

Complete guide for deploying Drose Online to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Domain & SSL Setup](#domain--ssl-setup)
7. [Monitoring & Backups](#monitoring--backups)
8. [Post-Deployment Testing](#post-deployment-testing)
9. [Rollback Plan](#rollback-plan)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All features tested
- [ ] Mobile testing complete
- [ ] Security audit passed
- [ ] No critical bugs
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] npm audit issues fixed

### Configuration
- [ ] Environment variables prepared
- [ ] JWT secret generated (64+ chars)
- [ ] Database credentials secured
- [ ] API keys obtained
- [ ] Domain name registered
- [ ] SSL certificate plan

### Third-Party Services
- [ ] MongoDB Atlas account created
- [ ] Cloudinary account configured
- [ ] Sentry project created
- [ ] Email service configured (SendGrid/Mailgun)
- [ ] Payment gateway (if needed)

---

## Infrastructure Setup

### Recommended Providers

#### Option 1: DigitalOcean (Recommended for beginners)
**Pros:** Simple, good docs, predictable pricing
**Droplet Size:** 4GB RAM / 2 vCPU minimum

```bash
# Cost: ~$24/month
```

#### Option 2: AWS EC2
**Pros:** Scalable, many services
**Instance:** t3.medium or t3.large

#### Option 3: Heroku (Easiest)
**Pros:** Very simple deployment
**Cons:** More expensive, less control

### Server Requirements

**Minimum Specifications:**
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS
- **RAM:** 4GB (8GB recommended)
- **CPU:** 2 cores (4 cores recommended)
- **Storage:** 50GB SSD
- **Network:** 2TB transfer/month

**Software Stack:**
- Node.js 18.x or 20.x LTS
- MongoDB (via Atlas - don't host on same server)
- Nginx (reverse proxy)
- PM2 (process manager)
- Certbot (SSL certificates)

---

## Database Configuration

### MongoDB Atlas Setup

#### 1. Create Cluster
1. Go to https://cloud.mongodb.com
2. Create account (or login)
3. Click "Build a Database"
4. Choose "Shared" (free tier) or "Dedicated" (production)
5. Select region closest to your server
6. Cluster name: `droseonline-prod`

#### 2. Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `droseonline_user`
4. Password: Generate strong password (save securely)
5. Role: "Atlas admin" or "Read and write to any database"

#### 3. Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Add your server's IP address
4. Or: "Allow Access from Anywhere" (0.0.0.0/0) - less secure but easier

#### 4. Connection String
1. Go to "Database" > "Connect"
2. Choose "Connect your application"
3. Copy connection string:
```
mongodb+srv://droseonline_user:<password>@droseonline-prod.xxxxx.mongodb.net/droseonline?retryWrites=true&w=majority
```
4. Replace `<password>` with actual password
5. Save for `.env` file

#### 5. Backup Configuration
1. Go to "Backup"
2. Enable automated backups (recommended)
3. Set retention policy (30 days recommended)

---

## Backend Deployment

### Initial Server Setup

#### 1. Connect to Server
```bash
ssh root@your-server-ip
```

#### 2. Create Deploy User
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

#### 3. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x.x
npm --version
```

#### 4. Install PM2
```bash
sudo npm install -g pm2
pm2 --version
```

#### 5. Install MongoDB Tools (for backups)
```bash
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb
sudo dpkg -i mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb
mongodump --version
```

#### 6. Install Git
```bash
sudo apt-get install -y git
git --version
```

### Deploy Backend Code

#### 1. Clone Repository
```bash
cd /home/deploy
git clone https://github.com/yourusername/droseonline.git
cd droseonline
```

#### 2. Install Dependencies
```bash
npm install --production
```

#### 3. Create Environment File
```bash
nano .env
```

Paste and configure:
```env
# Production Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/droseonline

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Security
FORCE_HTTPS=true
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com

# Email (choose one)
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Drose Online

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=/home/deploy/backups

# Frontend
FRONTEND_URL=https://yourdomain.com
```

Save with `Ctrl+X`, `Y`, `Enter`

#### 4. Test Application
```bash
npm start
```

Visit `http://your-server-ip:5000/api/health`
Should see: `{"status":"OK","message":"Drose Online Educational System is running"}`

Stop with `Ctrl+C`

#### 5. Start with PM2
```bash
pm2 start server.js --name droseonline-api
pm2 save
pm2 startup
```

Copy and run the command PM2 outputs

#### 6. Check Status
```bash
pm2 status
pm2 logs droseonline-api
```

### Configure Nginx

#### 1. Install Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### 2. Create Configuration
```bash
sudo nano /etc/nginx/sites-available/droseonline-api
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your API subdomain

    # Redirect HTTP to HTTPS (after SSL is setup)
    # return 301 https://$server_name$request_uri;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Increase max body size for file uploads
    client_max_body_size 10M;
}
```

#### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/droseonline-api /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## Frontend Deployment

### Build Frontend

#### 1. On Local Machine
```bash
cd frontend
npm install
npm run build --configuration production
```

This creates `frontend/dist/frontend/` directory

#### 2. Upload to Server
```bash
# From local machine
scp -r dist/frontend/* deploy@your-server-ip:/home/deploy/droseonline-frontend/
```

Or use Git:
```bash
# On server
cd /home/deploy
git clone https://github.com/yourusername/droseonline-frontend.git
cd droseonline-frontend
# Upload built files via FTP/SFTP
```

### Configure Nginx for Frontend

```bash
sudo nano /etc/nginx/sites-available/droseonline-frontend
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /home/deploy/droseonline-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/droseonline-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Domain & SSL Setup

### Domain Configuration

#### 1. DNS Records
Point your domain to server IP:

**A Records:**
- `yourdomain.com` → `your-server-ip`
- `www.yourdomain.com` → `your-server-ip`
- `api.yourdomain.com` → `your-server-ip`

**Wait 5-60 minutes for DNS propagation**

### SSL Certificate (Let's Encrypt)

#### 1. Install Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 2. Get Certificates
```bash
# For frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API
sudo certbot --nginx -d api.yourdomain.com
```

Follow prompts, choose to redirect HTTP to HTTPS

#### 3. Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

Certificates auto-renew via cron job.

---

## Monitoring & Backups

### Sentry Setup
Already configured in code. Just add `SENTRY_DSN` to `.env`

### Automated Backups

#### 1. Create Backup Directory
```bash
mkdir -p /home/deploy/backups
```

#### 2. Setup Cron Job
```bash
crontab -e
```

Add:
```cron
# Daily backup at 2 AM
0 2 * * * cd /home/deploy/droseonline && /usr/bin/node scripts/backup-database.js >> /home/deploy/backups/backup.log 2>&1
```

#### 3. Test Backup
```bash
cd /home/deploy/droseonline
npm run backup
```

### Monitoring Tools

#### PM2 Monitoring
```bash
pm2 monit
```

#### Server Monitoring (Optional)
- **Uptime Robot:** https://uptimerobot.com (free)
- **DataDog:** https://www.datadoghq.com
- **New Relic:** https://newrelic.com

---

## Post-Deployment Testing

### Smoke Tests

#### 1. API Health Check
```bash
curl https://api.yourdomain.com/api/health
```
Should return: `{"status":"OK"...}`

#### 2. Frontend Access
Visit: `https://yourdomain.com`
Should see login page

#### 3. Login Test
Try logging in with test credentials

#### 4. Create Test Data
- Create a student
- Create a course
- Create an assignment
- Mark attendance

#### 5. File Upload Test
Upload a profile picture or material

### Performance Testing
```bash
# Install Apache Bench
sudo apt-get install -y apache2-utils

# Test API
ab -n 100 -c 10 https://api.yourdomain.com/api/health
```

Target: < 500ms response time

---

## Rollback Plan

### If Deployment Fails

#### 1. Restore Previous Version
```bash
cd /home/deploy/droseonline
git log  # Find previous commit
git checkout <previous-commit-hash>
pm2 restart droseonline-api
```

#### 2. Restore Database Backup
```bash
cd /home/deploy/droseonline
npm run restore:latest
```

#### 3. Check Logs
```bash
pm2 logs droseonline-api --lines 100
```

---

## Maintenance

### Update Application
```bash
cd /home/deploy/droseonline
git pull origin main
npm install --production
pm2 restart droseonline-api
```

### View Logs
```bash
pm2 logs droseonline-api
pm2 logs droseonline-api --lines 1000
```

### Restart Application
```bash
pm2 restart droseonline-api
```

### Server Reboot
```bash
sudo reboot
# PM2 will auto-start apps after reboot
```

---

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs droseonline-api

# Check if port is in use
sudo lsof -i :5000

# Check environment variables
pm2 env droseonline-api
```

### Database Connection Failed
- Check MongoDB Atlas network access
- Verify connection string in `.env`
- Test connection: `mongo "<connection-string>"`

### 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check Nginx config: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### SSL Issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## Support & Resources

- MongoDB Atlas: https://docs.atlas.mongodb.com/
- PM2: https://pm2.keymetrics.io/docs/
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/
- DigitalOcean Tutorials: https://www.digitalocean.com/community/tutorials

---

## Post-Launch Checklist

- [ ] Application is accessible
- [ ] SSL certificates working
- [ ] Database connected
- [ ] File uploads working
- [ ] Email sending working
- [ ] Sentry receiving errors
- [ ] Backups running
- [ ] PM2 auto-starts on reboot
- [ ] Monitoring alerts configured
- [ ] Team has access to servers
- [ ] Documentation updated
- [ ] Pilot users invited

**Deployed by:** _______________
**Date:** _______________
**Production URL:** _______________

