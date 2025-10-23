const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

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
 * Create new material
 */
router.post('/', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const materialData = {
    ...req.body,
    uploadedBy: req.user._id
  };

  const material = new Material(materialData);
  await material.save();

  await material.populate([
    { path: 'course', select: 'name code' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Material created successfully',
    data: material
  });
}));

/**
 * PUT /api/materials/:id
 * Update material
 */
router.put('/:id', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    throw new AppError('Material not found', 404);
  }

  // Check ownership
  if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update your own materials', 403);
  }

  Object.assign(material, req.body);
  await material.save();

  await material.populate([
    { path: 'course', select: 'name code' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

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

