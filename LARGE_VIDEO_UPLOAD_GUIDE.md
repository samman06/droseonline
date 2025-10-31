# Large Video Upload Configuration Guide
**For Recorded Session Videos**  
**Date:** October 31, 2025

---

## Current Configuration

✅ **Already Configured:**
- Multer file upload: 100MB limit (`routes/materials.js:31`)
- Express JSON body: 10MB limit (`server.js:59`)
- File storage: Local disk (`uploads/materials/`)

---

## Recommended Configuration for Large Videos

### Option 1: Local Storage (Quick Setup) - Up to 500MB

**Pros:** Simple, no external dependencies, free  
**Cons:** Uses server storage, not scalable for many videos  
**Best for:** Small deployments (2-3 teachers, few recorded sessions)

#### Step 1: Increase Upload Limits

Update `routes/materials.js` Multer configuration:

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB (adjust as needed)
  },
  fileFilter: function (req, file, cb) {
    // Accept video files
    const allowedVideoTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
    const extname = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedVideoTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    // Accept other file types
    cb(null, true);
  }
});
```

#### Step 2: Increase Server Timeouts

Add to `server.js` before routes:

```javascript
// Increase timeout for large file uploads (10 minutes)
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // 10 minutes
  res.setTimeout(10 * 60 * 1000);
  next();
});
```

#### Step 3: Update Environment Variables

Add to `.env`:

```bash
# File Upload Configuration
MAX_FILE_SIZE=524288000  # 500MB in bytes
UPLOAD_TIMEOUT=600000     # 10 minutes in milliseconds

# Video Upload Specific
MAX_VIDEO_SIZE=524288000  # 500MB
ALLOWED_VIDEO_FORMATS=mp4,avi,mov,wmv,mkv,webm
```

#### Step 4: Frontend Configuration

Update `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  // ... other config
  maxFileUploadSize: 500 * 1024 * 1024, // 500MB
  maxVideoUploadSize: 500 * 1024 * 1024, // 500MB
  supportedVideoFormats: ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'],
  uploadTimeout: 600000 // 10 minutes
};
```

---

### Option 2: Cloudinary (Recommended) - Up to 100MB Free / Unlimited Paid

**Pros:** Scalable, CDN delivery, video processing, free tier available  
**Cons:** Requires account setup, 100MB limit on free tier  
**Best for:** Professional deployments, multiple teachers

#### Step 1: Sign Up for Cloudinary

1. Go to https://cloudinary.com/users/register/free
2. Create free account (100MB/day upload, 25GB storage)
3. Get credentials from dashboard:
   - Cloud Name
   - API Key
   - API Secret

#### Step 2: Install Cloudinary SDK

```bash
cd /home/abdelmoneam.elsamman@ad.cyshield/Documents/samman/droseonline
npm install cloudinary
```

#### Step 3: Configure Cloudinary

Add to `.env`:

```bash
# Cloudinary Video Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=droseonline/videos
```

#### Step 4: Create Cloudinary Upload Utility

Create `utils/cloudinaryService.js`:

```javascript
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload video to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} Upload result with URL and public_id
 */
async function uploadVideo(filePath, folder = 'droseonline/videos') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: folder,
      chunk_size: 6000000, // 6MB chunks for large files
      timeout: 600000 // 10 minutes
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload video to Cloudinary');
  }
}

/**
 * Delete video from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
async function deleteVideo(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    console.log(`✅ Deleted video from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
  }
}

module.exports = {
  uploadVideo,
  deleteVideo
};
```

#### Step 5: Update Materials Route

Modify `routes/materials.js` to use Cloudinary:

```javascript
const { uploadVideo, deleteVideo } = require('../utils/cloudinaryService');

// POST /api/materials - with Cloudinary upload
router.post('/', authenticate, checkTeacherOrAssistantAccess, upload.single('file'), asyncHandler(async (req, res) => {
  let fileUrl = null;
  let cloudinaryPublicId = null;

  if (req.file) {
    // Check if it's a video file
    const isVideo = /video/.test(req.file.mimetype);
    
    if (isVideo && process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary for videos
      const uploadResult = await uploadVideo(req.file.path);
      fileUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
      
      // Delete local file after Cloudinary upload
      fs.unlinkSync(req.file.path);
    } else {
      // Use local storage for non-video files
      fileUrl = `/uploads/materials/${req.file.filename}`;
    }
  }

  const material = new Material({
    ...req.body,
    fileUrl,
    cloudinaryPublicId,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    mimeType: req.file?.mimetype,
    uploadedBy: req.user._id
  });

  await material.save();
  res.status(201).json({ success: true, data: material });
}));
```

---

### Option 3: AWS S3 (Enterprise) - Unlimited

**Pros:** Unlimited storage, highly scalable, professional  
**Cons:** Requires AWS account, costs money (very cheap)  
**Best for:** Large-scale deployments (10+ teachers, 500+ students)

#### Pricing
- Storage: $0.023 per GB/month (~$0.50/month for 20GB)
- Uploads: Free
- Downloads: First 100GB free/month

#### Setup AWS S3

1. **Create AWS Account:** https://aws.amazon.com/
2. **Create S3 Bucket:**
   - Go to S3 Console
   - Create bucket (e.g., `droseonline-videos`)
   - Enable versioning
   - Block public access (use signed URLs)

3. **Create IAM User:**
   - Go to IAM Console
   - Create user with S3 access
   - Get Access Key and Secret Key

4. **Install AWS SDK:**
```bash
npm install aws-sdk
```

5. **Configure AWS:**

Add to `.env`:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=droseonline-videos
```

6. **Create S3 Upload Utility:**

Create `utils/s3Service.js`:

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadVideoToS3(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `videos/${Date.now()}-${fileName}`,
    Body: fileContent,
    ContentType: 'video/mp4', // Adjust based on file type
    ACL: 'private' // Require signed URLs
  };

  const result = await s3.upload(params).promise();
  return result.Location; // S3 URL
}

async function getSignedUrl(key, expiresIn = 3600) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expiresIn // URL expires in 1 hour
  };

  return s3.getSignedUrl('getObject', params);
}

async function deleteVideoFromS3(key) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  };

  await s3.deleteObject(params).promise();
}

module.exports = {
  uploadVideoToS3,
  getSignedUrl,
  deleteVideoFromS3
};
```

---

## Comparison Table

| Feature | Local Storage | Cloudinary Free | Cloudinary Paid | AWS S3 |
|---------|---------------|-----------------|-----------------|--------|
| **Max Upload** | 500MB (configurable) | 100MB/day | Unlimited | Unlimited |
| **Storage** | Server disk | 25GB | Unlimited | Unlimited |
| **Monthly Cost** | $0 | $0 | $89+ | $0.50+ |
| **CDN Delivery** | ❌ | ✅ | ✅ | ✅ (extra) |
| **Video Processing** | ❌ | ✅ | ✅ | ❌ (extra) |
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐ Medium | ⭐⭐⭐ Hard |
| **Best For** | Testing | Small schools | Medium-large | Enterprise |

---

## Implementation Steps (Recommended: Local Storage First)

### Phase 1: Quick Setup (Local Storage - 30 minutes)

```bash
# 1. Update materials route
nano routes/materials.js
# Change line 31: fileSize: 500 * 1024 * 1024

# 2. Add timeouts to server.js
nano server.js
# Add timeout middleware

# 3. Update .env
nano .env
# Add MAX_FILE_SIZE=524288000

# 4. Restart server
pm2 restart droseonline-api

# 5. Test upload
# Upload a large video via Materials section
```

### Phase 2: Upgrade to Cloudinary (When Needed - 1 hour)

```bash
# 1. Sign up for Cloudinary
# Get credentials from dashboard

# 2. Install SDK
npm install cloudinary

# 3. Create cloudinaryService.js
# Copy code from Option 2 above

# 4. Update .env with Cloudinary credentials
# 5. Modify materials.js to use Cloudinary
# 6. Test video upload
```

---

## Frontend Configuration

### Update Material Upload Component

Add video file validation and progress indicator:

```typescript
// In material upload component
uploadVideo(file: File): void {
  // Validate file size
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    this.toastService.error('Video file too large. Maximum size is 500MB');
    return;
  }

  // Validate file type
  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    this.toastService.error('Invalid video format. Allowed: MP4, AVI, MOV, WEBM');
    return;
  }

  // Show upload progress
  this.uploading = true;
  this.uploadProgress = 0;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', this.title);
  formData.append('type', 'video');

  this.http.post('/api/materials', formData, {
    reportProgress: true,
    observe: 'events'
  }).subscribe({
    next: (event: HttpEvent<any>) => {
      if (event.type === HttpEventType.UploadProgress) {
        this.uploadProgress = Math.round((100 * event.loaded) / event.total!);
      } else if (event.type === HttpEventType.Response) {
        this.toastService.success('Video uploaded successfully');
        this.uploading = false;
      }
    },
    error: (error) => {
      this.toastService.error('Upload failed: ' + error.message);
      this.uploading = false;
    }
  });
}
```

---

## Testing Checklist

- [ ] Upload 50MB video - should succeed
- [ ] Upload 200MB video - should succeed
- [ ] Upload 600MB video - should show error or succeed based on config
- [ ] Check upload progress indicator works
- [ ] Verify video plays after upload
- [ ] Test download/stream video
- [ ] Verify file deletion removes video from storage
- [ ] Check server disk space doesn't fill up
- [ ] Test concurrent uploads (2-3 videos at once)
- [ ] Verify timeout doesn't kill large uploads

---

## Monitoring

### Check Storage Usage

```bash
# Local storage
du -sh /path/to/droseonline/uploads/materials/

# Set up alerts when > 80% full
```

### Cloudinary Dashboard
- Monitor upload quota (100MB/day on free tier)
- Check storage used (25GB limit on free tier)
- Review bandwidth usage

### AWS S3 Console
- Monitor bucket size
- Check data transfer costs
- Set up CloudWatch alarms

---

## Troubleshooting

### Upload Times Out
```bash
# Increase timeout in server.js
req.setTimeout(20 * 60 * 1000); // 20 minutes

# Increase nginx timeout (if using)
# Add to nginx config:
client_max_body_size 500M;
proxy_read_timeout 600s;
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
```

### Out of Disk Space
```bash
# Check disk space
df -h

# Clean old uploads
find uploads/materials/ -mtime +30 -delete

# Or migrate to Cloudinary/S3
```

### Cloudinary Upload Fails
```bash
# Test credentials
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.api.ping((error, result) => {
  if (error) console.error('❌', error);
  else console.log('✅ Cloudinary connection OK');
});
"
```

---

## Recommended Approach for Your Use Case

### For Launch (Now):
1. ✅ **Use Local Storage with 500MB limit**
2. Configure timeouts to 10 minutes
3. Monitor disk usage weekly
4. Works perfectly for 2-5 teachers recording sessions

### For Growth (1-3 months):
1. Upgrade to **Cloudinary** when:
   - Recording 10+ videos/week
   - Need CDN delivery for faster playback
   - Want automatic video optimization
2. Start with free tier (100MB/day = ~20 videos/week)
3. Upgrade to paid ($89/month) if needed

### For Scale (6+ months):
1. Migrate to **AWS S3** when:
   - 20+ teachers using system
   - 100+ videos/month
   - Need custom video processing
2. Very cost-effective at scale (~$5-10/month for 100GB)

---

## Quick Implementation (Copy-Paste Ready)

### 1. Update `routes/materials.js` (Line 28-37):

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB for recorded sessions
  },
  fileFilter: function (req, file, cb) {
    cb(null, true); // Accept all file types
  }
});
```

### 2. Add to `server.js` (after line 61):

```javascript
// Increase timeout for large file uploads (recorded sessions)
app.use('/api/materials', (req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // 10 minutes
  res.setTimeout(10 * 60 * 1000);
  next();
});
```

### 3. Update `.env`:

```bash
# Add this line
MAX_VIDEO_SIZE=524288000  # 500MB
```

### 4. Restart Server:

```bash
pm2 restart droseonline-api
```

**Done! You can now upload videos up to 500MB. 🎉**

---

**Need Help?** 
- For Cloudinary setup: https://cloudinary.com/documentation
- For AWS S3 setup: https://docs.aws.amazon.com/s3/
- For custom solutions: Contact development team

---

**Last Updated:** October 31, 2025  
**Status:** Production Ready for Local Storage, Cloudinary-Ready

