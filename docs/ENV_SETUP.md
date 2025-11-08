# Environment Variables Setup Guide

This guide explains how to configure environment variables for the Drose Online system.

## Quick Start

1. **Create `.env` file in the project root:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values** (minimum required):
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/droseonline
   
   # JWT Secret (IMPORTANT: Change this!)
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

## Production Setup Checklist

### Critical (Must Configure)

#### 1. JWT Secret
```env
JWT_SECRET=<generate-secure-random-string>
```
**Generate with:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. MongoDB
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/droseonline?retryWrites=true&w=majority
```
- Create MongoDB Atlas account (free tier available)
- Create cluster and database
- Get connection string from Atlas dashboard

#### 3. Cloudinary (File Storage)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
- Sign up at https://cloudinary.com (free tier available)
- Get credentials from dashboard

### High Priority (Recommended)

#### 4. Sentry Error Tracking
```env
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
```
**Setup steps:**
1. Create free account at https://sentry.io
2. Create new Node.js project
3. Get DSN from Project Settings > Client Keys
4. Add to `.env` file
5. Restart server

**Benefits:**
- Real-time error notifications
- Error stack traces
- Performance monitoring
- User context
- Request breadcrumbs

#### 5. Security Settings
```env
NODE_ENV=production
FORCE_HTTPS=true
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com
```

### Medium Priority

#### 6. Email Service (Choose one)

**Option A: SendGrid**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Drose Online
```

**Option B: Mailgun**
```env
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Drose Online
```

#### 7. Automated Backups
```env
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
# Every day at 2:00 AM
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=/backups
```

### Optional (Nice to Have)

#### 8. SMS Notifications (Twilio)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### 9. Analytics
```env
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## Environment Files

### Development
Create `.env` in project root:
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/droseonline
JWT_SECRET=dev-secret-change-in-production
PORT=5000
```

### Staging
Create `.env.staging`:
```env
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/droseonline
JWT_SECRET=<secure-random-string>
PORT=5000
SENTRY_DSN=https://...
```

### Production
Create `.env.production`:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/droseonline
JWT_SECRET=<secure-random-string>
PORT=5000
SENTRY_DSN=https://...
FORCE_HTTPS=true
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Best Practices

1. **Never commit `.env` files to Git**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use strong JWT secret**
   - Minimum 64 characters
   - Random hex string
   - Different for each environment

3. **Restrict CORS origins**
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

4. **Enable rate limiting**
   ```env
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=900000
   ```

5. **Use environment-specific secrets**
   - Different passwords for each environment
   - Rotate secrets regularly

## Deployment Checklist

Before deploying to production:

- [ ] JWT_SECRET is changed from default
- [ ] MongoDB credentials are secure
- [ ] Cloudinary account is configured
- [ ] Sentry DSN is added for error tracking
- [ ] NODE_ENV=production
- [ ] FORCE_HTTPS=true
- [ ] CORS origins are restricted
- [ ] Rate limiting is configured
- [ ] Email service is set up
- [ ] Backup configuration is enabled
- [ ] All sensitive data is secured
- [ ] `.env` file is NOT in version control

## Testing Configuration

Test your configuration:

```bash
# Start server
npm run dev

# Check logs for:
# ✅ Connected to MongoDB
# ✅ Sentry error tracking initialized (if configured)
# ✅ Server running on port 5000
```

## Troubleshooting

### MongoDB Connection Issues
```
Error: MongooseServerSelectionError
```
**Solution:** Check MONGODB_URI format and network access in MongoDB Atlas

### Sentry Not Working
```
Warning: Sentry DSN not configured
```
**Solution:** Add valid SENTRY_DSN to `.env` file

### Cloudinary Upload Fails
```
Error: Must supply cloud_name
```
**Solution:** Configure CLOUDINARY_* variables in `.env`

## Support

For configuration help:
- Check logs for specific error messages
- Review `.env.example` for all options
- Ensure `.env` file is in project root
- Restart server after changing `.env`

## Additional Resources

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Cloudinary: https://cloudinary.com
- Sentry: https://sentry.io
- SendGrid: https://sendgrid.com
- Twilio: https://www.twilio.com

