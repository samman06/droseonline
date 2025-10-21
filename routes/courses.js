const express = require('express');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Group = require('../models/Group');
const AcademicYear = require('../models/AcademicYear');
const { authenticate, authorize, checkTeacherAccess } = require('../middleware/auth');
const { validate, validateQuery, courseSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private (Admin, Teacher only - Students use Browse Teachers)
router.get('/', authenticate, authorize('admin', 'teacher'), validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, teacherId, subjectId, academicYear, isActive } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }
    
    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (teacherId) query.teacher = teacherId;
    if (subjectId) query.subject = subjectId;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .populate('subject', 'name code credits type')
      .populate('teacher', 'firstName lastName fullName email')
      .populate('groups', 'name code gradeLevel currentEnrollment capacity isActive')
      .populate('academicYear', 'name code isCurrent')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: -1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
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
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Admin/Teacher)
router.post('/', authenticate, authorize('admin', 'teacher'), validate(courseSchema), async (req, res) => {
  try {
    // Verify subject exists
    const subject = await Subject.findById(req.body.subject);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const courseData = {
      ...req.body,
      createdBy: req.user._id
    };

    // If teacher role, set teacher to current user
    if (req.user.role === 'teacher') {
      courseData.teacher = req.user._id;
    }

    const course = new Course(courseData);
    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('subject', 'name code credits type')
      .populate('teacher', 'firstName lastName fullName email')
      .populate('groups', 'name code gradeLevel currentEnrollment capacity');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course: populatedCourse }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('subject', 'name code credits type syllabus')
      .populate('teacher', 'firstName lastName fullName email academicInfo.department')
      .populate('groups', 'name code gradeLevel schedule currentEnrollment capacity isActive')
      .populate('academicYear', 'name code startDate endDate isCurrent');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin/Teacher who owns the course)
router.put('/:id', authenticate, authorize('admin', 'teacher'), validate(courseSchema), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if teacher is updating their own course
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Verify subject exists if being updated
    if (req.body.subject) {
      const subject = await Subject.findById(req.body.subject);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }
    }

    // Update course fields
    const updateFields = [
      'name', 'description', 'subject', 'teacher', 
      'creditHours', 'maxStudents', 'startDate', 'endDate',
      'assessmentStructure', 'syllabus', 'settings'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    const updatedCourse = await Course.findById(course._id)
      .populate('subject', 'name code credits type')
      .populate('teacher', 'firstName lastName fullName email')
      .populate('groups', 'name code gradeLevel currentEnrollment capacity')
      .populate('academicYear', 'name code');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course: updatedCourse }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course has groups
    if (course.groups && course.groups.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with existing groups. Please delete or reassign groups first.'
      });
    }

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course'
    });
  }
});

module.exports = router;
