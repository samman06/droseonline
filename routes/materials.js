const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const Course = require('../models/Course');
const Group = require('../models/Group');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');
const multer = require('multer');

// Configure multer for memory storage (files will be uploaded to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

// Validation schemas
const materialSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('file', 'link', 'video', 'document', 'presentation', 'image', 'other').required(),
  category: Joi.string().valid('lecture_notes', 'reading', 'video', 'practice', 'syllabus', 'exam_material', 'supplementary', 'other').optional(),
  course: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  groups: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  visibility: Joi.string().valid('all_students', 'specific_groups', 'teachers_only').optional(),
  isPublished: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  folder: Joi.string().max(100).optional(),
  externalUrl: Joi.string().uri().optional(),
  relatedAssignment: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  // File upload fields (base64)
  fileUrl: Joi.string().optional(),
  fileName: Joi.string().optional(),
  fileSize: Joi.number().optional(),
  mimeType: Joi.string().optional()
});

const updateMaterialSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().valid('lecture_notes', 'reading', 'video', 'practice', 'syllabus', 'exam_material', 'supplementary', 'other').optional(),
  groups: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  visibility: Joi.string().valid('all_students', 'specific_groups', 'teachers_only').optional(),
  isPublished: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  folder: Joi.string().max(100).optional(),
  externalUrl: Joi.string().uri().optional()
});

// GET /api/materials - List all materials (with filters)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    course,
    group,
    type,
    category,
    folder,
    search,
    sort = '-uploadDate'
  } = req.query;

  // Build query based on user role
  const query = { isActive: true };
  
  // Only show published materials to students
  if (req.user.role === 'student') {
    query.isPublished = true;
    
    // Check if student can access
    // Either visibility is all_students OR student is in one of the groups
    const Group = require('../models/Group');
    const studentGroups = await Group.find({
      'students.student': req.user._id,
      'students.status': 'active'
    }).select('_id');
    
    const studentGroupIds = studentGroups.map(g => g._id);
    
    query.$or = [
      { visibility: 'all_students' },
      { visibility: 'specific_groups', groups: { $in: studentGroupIds } }
    ];
  }

  // Apply filters
  if (course) query.course = course;
  if (group) query.groups = group;
  if (type) query.type = type;
  if (category) query.category = category;
  if (folder) query.folder = folder;
  
  // Search in title, description, tags
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [materials, total] = await Promise.all([
    Material.find(query)
      .populate('course', 'name code')
      .populate('groups', 'name code')
      .populate('uploadedBy', 'firstName lastName email')
      .populate('relatedAssignment', 'title code')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Material.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      materials,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// GET /api/materials/:id - Get single material
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id)
    .populate('course', 'name code teacher')
    .populate('groups', 'name code')
    .populate('uploadedBy', 'firstName lastName email role')
    .populate('relatedAssignment', 'title code type');

  if (!material) {
    throw new AppError('Material not found', 404, true);
  }

  // Check if user can access this material
  const canAccess = await material.canAccess(req.user._id, req.user.role);
  if (!canAccess) {
    throw new AppError('You do not have permission to access this material', 403, true);
  }

  // Track view (don't count if uploader is viewing)
  if (material.uploadedBy._id.toString() !== req.user._id.toString()) {
    await material.trackView();
  }

  res.json({
    success: true,
    data: material
  });
}));

// POST /api/materials - Create new material
router.post('/', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = materialSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 422, true);
  }

  // Check if course exists and user has access
  const course = await Course.findById(value.course);
  if (!course) {
    throw new AppError('Course not found', 404, true);
  }

  // Only course teacher or admin can upload materials
  if (req.user.role !== 'admin' && course.teacher.toString() !== req.user._id.toString()) {
    throw new AppError('You can only upload materials to your own courses', 403, true);
  }

  // Validate groups if provided
  if (value.groups && value.groups.length > 0) {
    const groups = await Group.find({ _id: { $in: value.groups }, course: value.course });
    if (groups.length !== value.groups.length) {
      throw new AppError('Some groups are invalid or do not belong to this course', 400, true);
    }
  }

  // Create material
  const material = new Material({
    ...value,
    uploadedBy: req.user._id
  });

  await material.save();

  // Populate before returning
  await material.populate([
    { path: 'course', select: 'name code' },
    { path: 'groups', select: 'name code' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Material uploaded successfully',
    data: material
  });
}));

// PUT /api/materials/:id - Update material
router.put('/:id', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).populate('course');
  
  if (!material) {
    throw new AppError('Material not found', 404, true);
  }

  // Check permissions
  if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only update your own materials', 403, true);
  }

  // Validate request body
  const { error, value } = updateMaterialSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 422, true);
  }

  // Update fields
  Object.assign(material, value);
  await material.save();

  // Populate before returning
  await material.populate([
    { path: 'course', select: 'name code' },
    { path: 'groups', select: 'name code' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  res.json({
    success: true,
    message: 'Material updated successfully',
    data: material
  });
}));

// DELETE /api/materials/:id - Delete material
router.delete('/:id', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    throw new AppError('Material not found', 404, true);
  }

  // Check permissions
  if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only delete your own materials', 403, true);
  }

  await material.remove();

  res.json({
    success: true,
    message: 'Material deleted successfully'
  });
}));

// POST /api/materials/:id/download - Track download
router.post('/:id/download', authenticate, asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    throw new AppError('Material not found', 404, true);
  }

  // Check access
  const canAccess = await material.canAccess(req.user._id, req.user.role);
  if (!canAccess) {
    throw new AppError('You do not have permission to download this material', 403, true);
  }

  // Track download (don't count if uploader is downloading)
  if (material.uploadedBy.toString() !== req.user._id.toString()) {
    await material.trackDownload();
  }

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

// GET /api/materials/course/:courseId - Get materials for a specific course
router.get('/course/:courseId', authenticate, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { type, category, folder } = req.query;

  const query = { 
    course: courseId,
    isActive: true
  };

  // Students only see published materials
  if (req.user.role === 'student') {
    query.isPublished = true;
    
    // Check student group access
    const Group = require('../models/Group');
    const studentGroups = await Group.find({
      'students.student': req.user._id,
      'students.status': 'active',
      course: courseId
    }).select('_id');
    
    const studentGroupIds = studentGroups.map(g => g._id);
    
    query.$or = [
      { visibility: 'all_students' },
      { visibility: 'specific_groups', groups: { $in: studentGroupIds } }
    ];
  }

  if (type) query.type = type;
  if (category) query.category = category;
  if (folder) query.folder = folder;

  const materials = await Material.find(query)
    .populate('uploadedBy', 'firstName lastName')
    .sort('-uploadDate')
    .lean();

  res.json({
    success: true,
    data: materials
  });
}));

// GET /api/materials/stats - Get materials statistics (teachers/admins only)
router.get('/stats/overview', authenticate, authorize('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { course } = req.query;
  
  const query = {};
  if (course) query.course = course;
  
  // If teacher, only show their materials
  if (req.user.role === 'teacher') {
    query.uploadedBy = req.user._id;
  }

  const [
    totalMaterials,
    publishedMaterials,
    totalDownloads,
    totalViews,
    byType,
    byCategory,
    recentMaterials
  ] = await Promise.all([
    Material.countDocuments(query),
    Material.countDocuments({ ...query, isPublished: true }),
    Material.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$stats.downloadCount' } } }
    ]),
    Material.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$stats.viewCount' } } }
    ]),
    Material.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Material.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    Material.find(query)
      .sort('-uploadDate')
      .limit(5)
      .populate('course', 'name')
      .select('title type uploadDate stats')
      .lean()
  ]);

  res.json({
    success: true,
    data: {
      totalMaterials,
      publishedMaterials,
      totalDownloads: totalDownloads[0]?.total || 0,
      totalViews: totalViews[0]?.total || 0,
      byType,
      byCategory,
      recentMaterials
    }
  });
}));

module.exports = router;

