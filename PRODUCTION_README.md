# 🎓 Drose Online - Production Deployment Guide

**Educational Management System**  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Production Deployment](#production-deployment)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 💻 System Requirements

### Minimum Requirements
- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **MongoDB:** 6.0 or higher
- **RAM:** 4GB minimum
- **Storage:** 10GB available

### Recommended for Production
- **Node.js:** 20.x LTS
- **MongoDB:** 7.0
- **RAM:** 8GB+
- **Storage:** 50GB+ (with backups)

---

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd droseonline
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## ⚙️ Environment Setup

### 1. Backend Environment

Create `.env` in root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/droseonline

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS
FRONTEND_URL=https://your-domain.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Drose Online <noreply@droseonline.com>
```

### 2. Frontend Environment

Create `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.your-domain.com/api',
  uploadUrl: 'https://api.your-domain.com/uploads'
};
```

---

## 🗄️ Database Setup

### 1. Start MongoDB
```bash
# macOS/Linux
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 2. Seed Initial Data
```bash
# Create admin user and basic data
node seeds/seed-mock-data.js

# Add courses, assignments, announcements
node seeds/seed-courses-assignments-announcements.js

# Verify data integrity
node seeds/audit-all.js
```

### 3. Create Indexes (Production)
```bash
# Connect to MongoDB
mongosh droseonline

# Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.groups.createIndex({ isActive: 1 })
db.courses.createIndex({ teacher: 1 })
db.assignments.createIndex({ dueDate: 1 })
db.announcements.createIndex({ status: 1, publishAt: -1 })
```

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Access: http://localhost:4200

### Production Build

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend (serves frontend):**
```bash
npm start
```

Access: http://localhost:5000

---

## 🌐 Production Deployment

### Option 1: Traditional Server (Ubuntu/Linux)

#### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 2. Deploy Application
```bash
# Clone and setup
git clone <repository-url> /var/www/droseonline
cd /var/www/droseonline

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Setup environment
cp .env.example .env
nano .env  # Edit with production values
```

#### 3. Setup PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name droseonline

# Setup auto-restart
pm2 startup
pm2 save
```

#### 4. Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/droseonline
```

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
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/droseonline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 2: Docker Deployment

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: droseonline-db
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: droseonline

  backend:
    build: .
    container_name: droseonline-api
    restart: always
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://mongodb:27017/droseonline
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}

volumes:
  mongodb_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 🔧 Maintenance

### Daily Backups
```bash
# MongoDB backup
mongodump --db droseonline --out /backups/$(date +%Y%m%d)

# Automated (crontab)
0 2 * * * mongodump --db droseonline --out /backups/$(date +\%Y\%m\%d)
```

### Monitor Application
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs droseonline

# Restart if needed
pm2 restart droseonline
```

### Database Maintenance
```bash
# Compact database
mongosh droseonline --eval "db.runCommand({ compact: 'users' })"

# Repair if needed
mongod --repair
```

### Update Application
```bash
cd /var/www/droseonline
git pull origin main
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart droseonline
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs droseonline

# Common fixes:
# 1. Check MongoDB is running
sudo systemctl status mongod

# 2. Check environment variables
cat .env

# 3. Check port not in use
lsof -i :5000
```

### Database connection errors
```bash
# Verify MongoDB is accessible
mongosh

# Check connection string in .env
# Should be: mongodb://localhost:27017/droseonline
```

### Frontend build fails
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### High memory usage
```bash
# Restart PM2
pm2 restart droseonline

# Increase Node memory if needed
pm2 start server.js --name droseonline --node-args="--max-old-space-size=4096"
```

---

## 📞 Support

**Documentation:** See `/docs` folder  
**Issues:** Create GitHub issue  
**Email:** support@droseonline.com

---

## 📄 License

[Your License Here]

---

## ✅ Production Checklist

Before going live:

- [ ] Changed all default passwords
- [ ] Set secure JWT_SECRET
- [ ] Configured email service
- [ ] Setup SSL certificate
- [ ] Configured backups
- [ ] Setup monitoring
- [ ] Tested all user roles
- [ ] Verified data integrity (`node seeds/audit-all.js`)
- [ ] Configured firewall
- [ ] Setup error logging

