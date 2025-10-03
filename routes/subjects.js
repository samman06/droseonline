const express = require('express');
const Subject = require('../models/Subject');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, subjectSchema, paginationSchema, objectIdSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get all subjects with pagination and filtering
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, grade, isActive } = req.query;
    
    console.log('GET /api/subjects - Query params:', req.query);
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (grade) query.gradeLevels = grade;
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
      console.log('Applied isActive filter:', query.isActive);
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    const subjects = await Subject.find(query)
      .populate('createdBy', 'firstName lastName fullName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Subject.countDocuments(query);

    res.json({
      success: true,
      data: {
        subjects,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects'
    });
  }
});

// @route   GET /api/subjects/:id
// @desc    Get single subject by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('createdBy', 'firstName lastName fullName email')
      .populate('activeCourses');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      data: { subject }
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subject'
    });
  }
});

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private (Admin/Teacher)
router.post('/', authenticate, authorize('admin', 'teacher'), validate(subjectSchema), async (req, res) => {
  try {
    const subjectData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code: subjectData.code });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }

    const subject = new Subject(subjectData);
    await subject.save();

    const populatedSubject = await Subject.findById(subject._id)
      .populate('createdBy', 'firstName lastName fullName');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject: populatedSubject }
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating subject'
    });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private (Admin/Owner)
router.put('/:id', authenticate, validate(subjectSchema), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check permissions (admin or creator can update)
    if (req.user.role !== 'admin' && subject.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update subjects you created.'
      });
    }

    // Check if code is being changed and if new code already exists
    if (req.body.code && req.body.code !== subject.code) {
      const existingSubject = await Subject.findOne({ code: req.body.code });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this code already exists'
        });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName fullName');

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject: updatedSubject }
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subject'
    });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if subject is used in any active courses
    const Course = require('../models/Course');
    const activeCourses = await Course.countDocuments({ 
      subject: req.params.id,
      isActive: true 
    });

    if (activeCourses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. It is used in ${activeCourses} active course(s).`
      });
    }

    // Soft delete by setting isActive to false
    subject.isActive = false;
    await subject.save();

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subject'
    });
  }
});

// @route   GET /api/subjects/:id/courses
// @desc    Get all courses for a subject
// @access  Private
router.get('/:id/courses', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const Course = require('../models/Course');
    const query = { subject: req.params.id };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .populate('teacher', 'firstName lastName fullName email')
      .populate('groups', 'name code level semester')
      .populate('academicYear', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code
        },
        courses,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subject courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subject courses'
    });
  }
});

// @route   GET /api/subjects/:id/statistics
// @desc    Get subject statistics
// @access  Private (Admin/Teacher)
router.get('/:id/statistics', authenticate, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const Course = require('../models/Course');
    const Assignment = require('../models/Assignment');
    const Submission = require('../models/Submission');

    // Get course statistics
    const courseStats = await Course.aggregate([
      { $match: { subject: subject._id } },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          activeCourses: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalStudents: { $sum: '$stats.totalStudents' },
          averageGrade: { $avg: '$stats.averageGrade' }
        }
      }
    ]);

    // Get assignment statistics
    const assignmentStats = await Assignment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $match: { 'courseInfo.subject': subject._id } },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          publishedAssignments: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          averageMaxPoints: { $avg: '$maxPoints' }
        }
      }
    ]);

    const stats = {
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        gradeLevels: subject.gradeLevels,
        totalMarks: subject.totalMarks
      },
      courses: courseStats[0] || {
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0
      },
      assignments: assignmentStats[0] || {
        totalAssignments: 0,
        publishedAssignments: 0,
        averageMaxPoints: 0
      }
    };

    res.json({
      success: true,
      data: { statistics: stats }
    });
  } catch (error) {
    console.error('Get subject statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subject statistics'
    });
  }
});

// @route   POST /api/subjects/:id/restore
// @desc    Restore deleted subject
// @access  Private (Admin only)
router.post('/:id/restore', authenticate, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (subject.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Subject is already active'
      });
    }

    subject.isActive = true;
    await subject.save();

    res.json({
      success: true,
      message: 'Subject restored successfully',
      data: { subject }
    });
  } catch (error) {
    console.error('Restore subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring subject'
    });
  }
});

// @route   GET /api/subjects/search/suggestions
// @desc    Get subject search suggestions
// @access  Private
router.get('/search/suggestions', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const suggestions = await Subject.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .select('name code gradeLevels')
    .limit(10)
    .sort({ name: 1 });

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Subject search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggestions'
    });
  }
});

module.exports = router;
