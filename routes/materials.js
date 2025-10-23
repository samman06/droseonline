const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/materials');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: function (req, file, cb) {
    // Accept all file types for now
    cb(null, true);
  }
});

/**
 * GET /api/materials
 * List all materials with role-based filtering
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  console.log('\n========================================');
  console.log('GET /api/materials');
  console.log('User:', req.user.email, '(', req.user.role, ')');
  console.log('Query:', req.query);
  console.log('========================================');

  const {
    page = 1,
    limit = 20,
    course,
    type,
    category,
    search,
    sort = '-uploadDate'
  } = req.query;

  // Build query
  const query = { isActive: true };

  // Role-based filtering
  if (req.user.role === 'student') {
    query.isPublished = true;
    
    // Get student's groups
    const student = await User.findById(req.user._id).select('academicInfo.groups');
    const studentGroupIds = student?.academicInfo?.groups || [];
    
    console.log('Student groups:', studentGroupIds.length);
    
    query.$or = [
      { visibility: 'all_students' },
      { 
        visibility: 'specific_groups', 
        groups: { $in: studentGroupIds } 
      }
    ];
  } else if (req.user.role === 'teacher') {
    const teacherCourses = await Course.find({ teacher: req.user._id }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);
    
    console.log('Teacher courses:', courseIds.length);
    
    if (courseIds.length > 0) {
      query.course = { $in: courseIds };
    } else {
      return res.json({
        success: true,
        data: {
          materials: [],
          pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
        }
      });
    }
  }

  // Additional filters
  if (course) query.course = course;
  if (type) query.type = type;
  if (category) query.category = category;
  
  if (search) {
    query.$text = { $search: search };
  }

  console.log('Final query:', JSON.stringify(query));

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const [materials, total] = await Promise.all([
    Material.find(query)
      .populate('course', 'name code')
      .populate('groups', 'name code')
      .populate('uploadedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Material.countDocuments(query)
  ]);

  console.log('Found:', materials.length, 'materials (total:', total, ')');
  console.log('========================================\n');

  res.json({
    success: true,
    data: {
      materials,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

/**
 * GET /api/materials/:id
 * Get single material
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id)
    .populate('course', 'name code')
    .populate('groups', 'name code')
    .populate('uploadedBy', 'firstName lastName email');

  if (!material) {
    throw new AppError('Material not found', 404);
  }

  // Check access
  if (req.user.role === 'student') {
    if (!material.isPublished || !material.isActive) {
      throw new AppError('Material not available', 403);
    }
    
    // Check group access
    const student = await User.findById(req.user._id).select('academicInfo.groups');
    const studentGroupIds = student?.academicInfo?.groups?.map(g => g.toString()) || [];
    const materialGroupIds = material.groups?.map(g => g._id.toString()) || [];
    
    if (material.visibility === 'specific_groups') {
      const hasAccess = materialGroupIds.some(gId => studentGroupIds.includes(gId));
      if (!hasAccess) {
        throw new AppError('You do not have access to this material', 403);
      }
    }
  }

  res.json({
    success: true,
    data: material
  });
}));

/**
 * POST /api/materials
 * Create new material with file upload
 */
router.post('/', authenticate, authorize('admin', 'teacher'), upload.single('file'), asyncHandler(async (req, res) => {
  console.log('\n========================================');
  console.log('POST /api/materials');
  console.log('User:', req.user.email, '(', req.user.role, ')');
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.filename : 'No file');
  console.log('========================================');

  const materialData = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    category: req.body.category,
    course: req.body.course,
    visibility: req.body.visibility || 'all_students',
    uploadedBy: req.user._id
  };

  // Handle groups (might be JSON string from FormData)
  if (req.body.groups) {
    try {
      materialData.groups = typeof req.body.groups === 'string' 
        ? JSON.parse(req.body.groups) 
        : req.body.groups;
    } catch (e) {
      console.error('Failed to parse groups:', e);
    }
  }

  // Handle file upload
  if (req.file) {
    materialData.fileUrl = `/uploads/materials/${req.file.filename}`;
    materialData.fileName = req.file.originalname;
    materialData.fileSize = req.file.size;
    materialData.mimeType = req.file.mimetype;
  }

  // Handle external URL (for links)
  if (req.body.externalUrl) {
    materialData.externalUrl = req.body.externalUrl;
  }

  console.log('Creating material with data:', materialData);

  const material = new Material(materialData);
  await material.save();

  console.log('Material created with ID:', material._id);

  await material.populate([
    { path: 'course', select: 'name code' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  console.log('Material populated successfully');
  console.log('========================================\n');

  res.status(201).json({
    success: true,
    message: 'Material uploaded successfully',
    data: material
  });
}));

/**
 * PUT /api/materials/:id
 * Update material (with optional file replacement)
 */
router.put('/:id', authenticate, authorize('admin', 'teacher'), upload.single('file'), asyncHandler(async (req, res) => {
  console.log('\n========================================');
  console.log('PUT /api/materials/:id - UPDATE REQUEST');
  console.log('Material ID:', req.params.id);
  console.log('User:', req.user.email, '(', req.user.role, ')');
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.filename : 'No new file');
  console.log('Replace file:', req.body.replaceFile);
  console.log('========================================');

  const material = await Material.findById(req.params.id);
  
  if (!material) {
    throw new AppError('Material not found', 404);
  }

  // Check ownership
  if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update your own materials', 403);
  }

  // Store old file path for deletion if replacing
  const oldFilePath = material.fileUrl ? path.join(__dirname, '..', material.fileUrl) : null;

  // Update basic fields
  if (req.body.title) material.title = req.body.title;
  if (req.body.description !== undefined) material.description = req.body.description;
  if (req.body.type) material.type = req.body.type;
  if (req.body.category) material.category = req.body.category;
  if (req.body.course) material.course = req.body.course;
  
  // Update groups
  if (req.body.groups) {
    try {
      material.groups = typeof req.body.groups === 'string' 
        ? JSON.parse(req.body.groups) 
        : req.body.groups;
    } catch (e) {
      console.error('Failed to parse groups:', e);
    }
  }

  // Handle file replacement
  if (req.body.replaceFile === 'true') {
    console.log('🔄 Replacing file...');
    
    // If new file uploaded
    if (req.file) {
      console.log('New file uploaded:', req.file.filename);
      
      // Delete old file from disk
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log('✅ Old file deleted:', oldFilePath);
        } catch (err) {
          console.error('⚠️ Failed to delete old file:', err.message);
        }
      }
      
      // Update with new file info
      material.fileUrl = `/uploads/materials/${req.file.filename}`;
      material.fileName = req.file.originalname;
      material.fileSize = req.file.size;
      material.mimeType = req.file.mimetype;
      material.externalUrl = undefined; // Clear external URL if was a link before
      
      console.log('Updated file info:', {
        fileUrl: material.fileUrl,
        fileName: material.fileName,
        fileSize: material.fileSize
      });
    }
    // If replacing with external URL (for links)
    else if (req.body.externalUrl) {
      console.log('New external URL:', req.body.externalUrl);
      
      // Delete old file from disk if exists
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log('✅ Old file deleted:', oldFilePath);
        } catch (err) {
          console.error('⚠️ Failed to delete old file:', err.message);
        }
      }
      
      // Update with new link
      material.externalUrl = req.body.externalUrl;
      material.fileUrl = undefined;
      material.fileName = undefined;
      material.fileSize = undefined;
      material.mimeType = undefined;
    }
  }

  await material.save();

  await material.populate([
    { path: 'course', select: 'name code' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  console.log('Material updated successfully');
  console.log('========================================\n');

  res.json({
    success: true,
    message: 'Material updated successfully',
    data: material
  });
}));

/**
 * DELETE /api/materials/:id
 * Delete material
 */
router.delete('/:id', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    throw new AppError('Material not found', 404);
  }

  // Check ownership
  if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only delete your own materials', 403);
  }

  material.isActive = false;
  await material.save();

  res.json({
    success: true,
    message: 'Material deleted successfully'
  });
}));

/**
 * POST /api/materials/:id/download
 * Track download
 */
router.post('/:id/download', authenticate, asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    throw new AppError('Material not found', 404);
  }

  // Increment download count
  material.stats.downloadCount += 1;
  await material.save();

  res.json({
    success: true,
    message: 'Download tracked',
    data: {
      fileUrl: material.fileUrl,
      fileName: material.fileName,
      fileSize: material.fileSize
    }
  });
}));

module.exports = router;

