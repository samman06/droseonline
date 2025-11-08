# Drose Online - Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: v6.0 or higher
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB free space

### Required Accounts
- MongoDB Atlas account (for cloud database) OR local MongoDB
- Cloud Storage (Cloudinary for file uploads)
- Email Service (for notifications)
- Domain name (for production)
- SSL Certificate (Let's Encrypt recommended)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/droseonline.git
cd droseonline
```

### 2. Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

---

## Database Configuration

### Option A: MongoDB Atlas (Cloud - Recommended for Production)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database user and password
4. Whitelist IP addresses (or allow from anywhere for testing)
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB

1. Install MongoDB:
   ```bash
   # Ubuntu
   sudo apt-get install -y mongodb
   
   # macOS
   brew install mongodb-community
   ```

2. Start MongoDB:
   ```bash
   # Ubuntu
   sudo systemctl start mongodb
   
   # macOS
   brew services start mongodb-community
   ```

3. Connection string:
   ```
   mongodb://localhost:27017/droseonline
   ```

---

## Backend Deployment

### 1. Environment Variables

Create `.env` file in root directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/droseonline

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Seed Database (First Time Only)

```bash
# Seed with Egyptian mock data
node seed-egyptian-data.js

# Or create custom admin user
node create-users-manual.js
```

### 3. Start Backend

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Using PM2 (Recommended for Production):**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name droseonline-backend

# Configure auto-restart on system reboot
pm2 startup
pm2 save

# View logs
pm2 logs droseonline-backend

# Monitor
pm2 monit
```

### 4. Verify Backend

```bash
curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"Server is running"}
```

---

## Frontend Deployment

### 1. Environment Variables

Create `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.yourdomain.com/api'
};
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/frontend` folder with optimized production files.

### 3. Deployment Options

#### Option A: Nginx (Recommended)

1. Install Nginx:
   ```bash
   sudo apt-get install nginx
   ```

2. Create Nginx config `/etc/nginx/sites-available/droseonline`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    root /var/www/droseonline/dist/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. Enable site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/droseonline /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Option B: Apache

1. Install Apache:
   ```bash
   sudo apt-get install apache2
   ```

2. Create Apache config `/etc/apache2/sites-available/droseonline.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    DocumentRoot /var/www/droseonline/dist/frontend
    
    <Directory /var/www/droseonline/dist/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Angular routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API Proxy
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
</VirtualHost>
```

3. Enable site and restart Apache:
   ```bash
   sudo a2ensite droseonline.conf
   sudo a2enmod rewrite proxy proxy_http
   sudo systemctl restart apache2
   ```

#### Option C: Vercel / Netlify (Frontend Only)

**Vercel:**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=dist/frontend
```

---

## Production Checklist

### Security

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Performance

- [ ] Enable gzip compression
- [ ] Configure CDN (Cloudflare recommended)
- [ ] Set up caching headers
- [ ] Optimize database indexes
- [ ] Monitor response times
- [ ] Implement lazy loading

### Monitoring

- [ ] Set up error logging (Sentry recommended)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable server monitoring (PM2, New Relic)
- [ ] Set up email alerts
- [ ] Monitor disk space
- [ ] Track user analytics (Google Analytics)

### Backup

- [ ] Automated database backups (daily recommended)
- [ ] File storage backups
- [ ] Off-site backup storage
- [ ] Test restore procedures
- [ ] Document backup process

### Documentation

- [ ] API documentation
- [ ] User guides
- [ ] Admin procedures
- [ ] Troubleshooting guide
- [ ] Emergency contacts

---

## Monitoring & Maintenance

### Daily Tasks
- Check server logs for errors
- Monitor system resources (CPU, RAM, Disk)
- Review uptime status
- Check backup completion

### Weekly Tasks
- Review user activity
- Check for security updates
- Analyze performance metrics
- Review error logs

### Monthly Tasks
- Database optimization
- Security audit
- Performance review
- User feedback review
- Backup restore test

### Monitoring Commands

```bash
# Check backend status
pm2 status

# View logs
pm2 logs droseonline-backend

# Check disk space
df -h

# Check memory usage
free -h

# Check MongoDB status
mongo --eval "db.serverStatus()"

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Backend Not Starting

1. Check MongoDB connection:
   ```bash
   mongo mongodb://your-connection-string
   ```

2. Verify environment variables:
   ```bash
   node -e "console.log(process.env.MONGODB_URI)"
   ```

3. Check port availability:
   ```bash
   lsof -i :5000
   ```

### Frontend Build Errors

1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. Check Angular version compatibility

3. Verify environment files exist

### Database Connection Issues

1. Check MongoDB is running:
   ```bash
   sudo systemctl status mongodb
   ```

2. Verify connection string

3. Check network connectivity

4. Whitelist IP in MongoDB Atlas

### High Memory Usage

1. Check PM2 status:
   ```bash
   pm2 monit
   ```

2. Restart application:
   ```bash
   pm2 restart droseonline-backend
   ```

3. Check for memory leaks in logs

4. Optimize database queries

---

## Scaling

### Vertical Scaling (Single Server)
- Upgrade server resources (CPU, RAM)
- Optimize database indexes
- Enable caching (Redis)
- Use CDN for static assets

### Horizontal Scaling (Multiple Servers)
- Load balancer (Nginx, HAProxy)
- Multiple backend instances
- Shared database (MongoDB Atlas)
- Distributed file storage
- Session management (Redis)

---

## Support & Resources

- **Documentation**: See USER_GUIDE.md
- **API Docs**: See API_DOCUMENTATION.md
- **RBAC Guide**: See RBAC_STATUS.md
- **Issues**: GitHub Issues
- **Community**: [Your support forum/chat]

---

## License

[Your License Information]

---

**Last Updated**: October 2025
**Version**: 1.0.0

