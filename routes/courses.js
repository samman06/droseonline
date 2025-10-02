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
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, teacherId, subjectId, academicYear, semester, isActive } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      // Students see courses from their enrolled groups
      const User = require('../models/User');
      const student = await User.findById(req.user._id).populate('academicInfo.groups');
      const groupIds = student.academicInfo.groups.map(g => g._id);
      query.groups = { $in: groupIds };
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
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .populate('subject', 'name code credits type')
      .populate('teacher', 'firstName lastName fullName email')
      .populate('groups', 'name code level semester currentEnrollment capacity')
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

    // Verify academic year exists
    const academicYear = await AcademicYear.findById(req.body.academicYear);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: req.body.code });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
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
      .populate('teacher', 'firstName lastName fullName')
      .populate('groups', 'name code level semester')
      .populate('academicYear', 'name code');

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

// Other essential routes...
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('subject', 'name code credits type syllabus')
      .populate('teacher', 'firstName lastName fullName email academicInfo.department')
      .populate('groups', 'name code level semester currentEnrollment capacity')
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

module.exports = router;
