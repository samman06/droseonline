# Production Readiness Checklist
**Date:** October 31, 2025  
**Version:** 1.0.0  
**Status:** Pre-Launch Final Steps

---

## ✅ Completed (Automated)

### Security
- [x] **Fixed nodemailer vulnerability** - Updated to 7.0.10 (zero vulnerabilities)
- [x] **Removed debug code** - Cleaned console.log statements from routes
- [x] **Strong JWT secret generated** - 128-character cryptographic key
- [x] **Environment template ready** - `.env.example` with all variables documented

### Features
- [x] **Material file cleanup** - Pre-remove hook implemented with error handling
- [x] **Password reset emails** - Complete with HTML templates and 1-hour token expiration
- [x] **Email service** - Comprehensive emailService.js module created
- [x] **System validation** - All core features tested and documented

---

## 🔧 Required Manual Steps (Critical)

### 1. Environment Configuration ⚠️ REQUIRED

**Update `.env` file with production values:**

```bash
# Copy and update these in your .env file

# 1. CRITICAL: Change to production
NODE_ENV=production

# 2. CRITICAL: Generate new JWT secret
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# 3. CRITICAL: Update MongoDB URI for production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/droseonline?retryWrites=true&w=majority

# 4. CRITICAL: Set production frontend URL
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# 5. OPTIONAL: Configure email for password reset
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@yourdomain.com

# 6. OPTIONAL: Add Sentry for error tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# 7. OPTIONAL: Configure Cloudinary for large files
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 8. RECOMMENDED: Lower rate limit for production
RATE_LIMIT_MAX_REQUESTS=100
```

**How to generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Database Setup ⚠️ REQUIRED

**Option A: MongoDB Atlas (Recommended)**
1. Go to https://cloud.mongodb.com
2. Create free cluster or paid plan
3. Create database user with password
4. Whitelist your server IP
5. Get connection string
6. Update `MONGODB_URI` in `.env`

**Option B: Self-hosted MongoDB**
1. Install MongoDB 6+ on server
2. Configure authentication
3. Create database `droseonline`
4. Update `MONGODB_URI` in `.env`

### 3. Email Service Setup (Optional but Recommended)

**Option A: Gmail App Password**
1. Enable 2FA on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `EMAIL_PASSWORD`
4. Set `EMAIL_USERNAME` to your Gmail

**Option B: SendGrid**
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Get API key
3. Configure SMTP settings
4. Update EMAIL_* variables

**Option C: Mailgun**
1. Sign up at https://mailgun.com (free tier: 5000 emails/month)
2. Verify domain or use sandbox
3. Get SMTP credentials
4. Update EMAIL_* variables

### 4. Error Tracking Setup (Optional but Recommended)

**Sentry Configuration:**
1. Sign up at https://sentry.io (free tier available)
2. Create new project (Node.js)
3. Get DSN from project settings
4. Add to `.env`: `SENTRY_DSN=https://xxxxx@sentry.io/xxxxx`
5. Restart server - errors will be tracked automatically

### 5. Automated Backups ⚠️ REQUIRED

**Set up daily backups with cron:**

```bash
# 1. Make backup script executable
chmod +x /path/to/droseonline/scripts/backup-database.js

# 2. Create backup directory
mkdir -p /path/to/droseonline/backups

# 3. Test backup manually
cd /path/to/droseonline
node scripts/backup-database.js

# 4. Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * cd /path/to/droseonline && node scripts/backup-database.js >> /var/log/droseonline-backup.log 2>&1
```

**Test restore process:**
```bash
# List backups
ls -lh /path/to/droseonline/backups/

# Test restore (CAUTION: This will replace current database)
node scripts/restore-database.js /path/to/droseonline/backups/backup_droseonline_2025-XX-XX_XX-XX-XX.tar.gz
```

---

## 🚀 Deployment Steps

### Step 1: Server Preparation

**Minimum Requirements:**
- OS: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- CPU: 2 cores
- RAM: 2GB minimum, 4GB recommended
- Storage: 10GB minimum, 20GB recommended
- Node.js: 18+ installed
- MongoDB: 6+ installed or Atlas configured

**Install Dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx (web server)
sudo apt install -y nginx
```

### Step 2: Deploy Backend

```bash
# 1. Clone or copy project to server
cd /var/www/
sudo git clone <your-repo> droseonline
cd droseonline

# 2. Install dependencies
npm install --production

# 3. Configure environment
sudo nano .env
# (Paste production values from section 1)

# 4. Start with PM2
pm2 start server.js --name droseonline-api
pm2 save
pm2 startup

# 5. Verify running
pm2 status
curl http://localhost:5000/api/health
```

### Step 3: Configure Nginx

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/droseonline

# Paste this configuration:
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

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
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/droseonline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Step 5: Deploy Frontend

```bash
# On your local machine
cd frontend
npm run build

# Copy dist folder to server
scp -r dist/frontend/* user@server:/var/www/html/

# Or configure nginx to serve frontend
```

### Step 6: Verify Deployment

```bash
# Check backend
curl https://api.yourdomain.com/api/health

# Check PM2 logs
pm2 logs droseonline-api

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🧪 Post-Deployment Testing

### Critical Tests
1. **Login Test**
   - Admin, Teacher, Student logins work
   - JWT token generated correctly
   - Dashboard loads without errors

2. **Create Assignment Test**
   - Teacher can create assignment
   - Students can view and submit
   - Auto-grading works for quizzes

3. **Mark Attendance Test**
   - Teacher marks attendance
   - Revenue calculated correctly
   - Financial transaction created automatically

4. **Accounting Test**
   - Dashboard shows correct metrics
   - Transactions list loads
   - Add manual transaction works
   - Attendance transactions are read-only

5. **File Upload Test**
   - Material upload works
   - Assignment submission with files
   - Avatar upload

6. **RBAC Test**
   - Student cannot access admin pages
   - Teacher cannot access other teachers' data
   - Assistant cannot access accounting

### Performance Tests
1. Load 100+ students in list - should load <2s
2. Load 50+ assignments - should load <1.5s
3. Dashboard with 200+ records - should load <3s
4. Concurrent users (5-10 simultaneous) - should handle smoothly

---

## 📊 Monitoring Setup

### Server Monitoring

**Recommended Tools:**
- **Uptime Robot** (free): Monitor API availability
- **New Relic** (free tier): Application performance monitoring
- **Datadog** (free tier): Infrastructure monitoring

**Basic Monitoring Commands:**
```bash
# Check CPU/RAM usage
pm2 monit

# Check disk space
df -h

# Check MongoDB status
sudo systemctl status mongod

# Check nginx status
sudo systemctl status nginx

# View error logs
pm2 logs droseonline-api --err --lines 50
```

### Application Monitoring

**Sentry Integration (Already Configured):**
- Add `SENTRY_DSN` to `.env`
- Restart application
- Errors automatically tracked at https://sentry.io

**Manual Checks:**
```bash
# Weekly: Check error rates
pm2 logs droseonline-api --err | grep "Error" | wc -l

# Daily: Check database size
mongo --eval "db.stats()" droseonline

# Daily: Check backup status
ls -lh /path/to/droseonline/backups/
```

---

## 🔒 Security Hardening

### Server Security
- [ ] Configure firewall (ufw/iptables)
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Keep system updated (`apt update && apt upgrade`)
- [ ] Configure fail2ban for SSH protection

### Application Security
- [x] JWT secret is strong (128+ characters)
- [x] Rate limiting enabled
- [x] CORS configured for production domain only
- [x] Helmet security headers active
- [x] Input validation on all endpoints
- [ ] Review user permissions regularly
- [ ] Monitor suspicious login attempts

---

## 📋 Pre-Launch Final Checklist

### Environment
- [ ] `.env` configured with production values
- [ ] JWT_SECRET is strong and unique
- [ ] MONGODB_URI points to production database
- [ ] CORS_ORIGIN set to production frontend
- [ ] EMAIL_* configured (or documented as Phase 2)
- [ ] SENTRY_DSN added (recommended)

### Database
- [ ] MongoDB Atlas cluster created or MongoDB installed
- [ ] Database user created with strong password
- [ ] Network access configured
- [ ] Connection tested successfully

### Server
- [ ] Node.js 18+ installed
- [ ] PM2 process manager installed
- [ ] Nginx web server configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Backend running and accessible
- [ ] Frontend deployed and accessible

### Backups & Monitoring
- [ ] Daily backup cron job configured
- [ ] Backup restore tested successfully
- [ ] Sentry error tracking active
- [ ] Server monitoring configured (Uptime Robot, etc.)

### Testing
- [ ] All user roles login successfully
- [ ] Create assignment works
- [ ] Mark attendance and revenue calculation works
- [ ] Accounting dashboard loads correctly
- [ ] File uploads work
- [ ] RBAC verified (try accessing restricted pages)
- [ ] Mobile spot check (5 critical pages)

### Documentation
- [ ] Admin credentials documented securely
- [ ] Server access details documented
- [ ] Database connection details secured
- [ ] Emergency contact list created
- [ ] User training materials prepared (optional)

---

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs droseonline-api --err

# Common issues:
# - Port 5000 already in use: Change PORT in .env
# - MongoDB connection failed: Check MONGODB_URI
# - Missing dependencies: Run npm install
```

### Database Connection Error
```bash
# Test MongoDB connection
mongo "mongodb://localhost:27017/droseonline"

# For Atlas:
mongo "mongodb+srv://username:password@cluster.mongodb.net/droseonline"

# Check firewall:
sudo ufw status
# If blocked: sudo ufw allow 27017
```

### Email Not Sending
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});
transport.verify((err, success) => {
  if (err) console.error('❌', err);
  else console.log('✅ Email service ready');
});
"
```

### High Memory Usage
```bash
# Check PM2 memory
pm2 monit

# If high, restart:
pm2 restart droseonline-api

# Check MongoDB memory:
free -h

# Optimize: Limit MongoDB cache
# Add to /etc/mongod.conf:
# storage:
#   wiredTiger:
#     engineConfig:
#       cacheSizeGB: 1
```

---

## 📞 Support Resources

### Documentation
- **User Guide:** `USER_GUIDE.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **Security Audit:** `SECURITY_AUDIT_CHECKLIST.md`
- **Mobile Testing:** `MOBILE_TESTING_CHECKLIST.md`
- **Deployment Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`

### External Resources
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Node.js Docs:** https://nodejs.org/docs/
- **PM2 Docs:** https://pm2.keymetrics.io/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **Sentry Docs:** https://docs.sentry.io/

---

## 🎉 Ready to Launch!

**Once all checklist items are complete:**
1. ✅ All automated fixes applied
2. ✅ Environment configured
3. ✅ Database connected
4. ✅ Server deployed
5. ✅ SSL enabled
6. ✅ Backups configured
7. ✅ Monitoring active
8. ✅ Testing passed

**You're ready to launch Drose Online! 🚀**

---

**Last Updated:** October 31, 2025  
**Next Review:** After launch (1 week)

