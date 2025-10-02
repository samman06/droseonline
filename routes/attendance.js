const express = require('express');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { authenticate, authorize, checkTeacherAccess } = require('../middleware/auth');
const { validate, validateQuery, attendanceSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, studentId, teacherId, startDate, endDate, status } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }
    
    // Apply filters
    if (courseId) query.course = courseId;
    if (studentId && req.user.role !== 'student') query.student = studentId;
    if (teacherId && req.user.role === 'admin') query.teacher = teacherId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.classDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName fullName academicInfo.studentId')
      .populate('teacher', 'firstName lastName fullName')
      .populate('course', 'name code')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .populate('group', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ classDate: -1, classStartTime: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance'
    });
  }
});

// @route   POST /api/attendance
// @desc    Record attendance
// @access  Private (Teacher/Admin)
router.post('/', authenticate, authorize('teacher', 'admin'), validate(attendanceSchema), async (req, res) => {
  try {
    const attendanceData = {
      ...req.body,
      teacher: req.user.role === 'teacher' ? req.user._id : req.body.teacher,
      recordedBy: req.user._id
    };

    // Check for duplicate attendance record
    const existingRecord = await Attendance.findOne({
      student: attendanceData.student,
      course: attendanceData.course,
      classDate: attendanceData.classDate,
      classStartTime: attendanceData.classStartTime
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this student and class'
      });
    }

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'firstName lastName fullName')
      .populate('teacher', 'firstName lastName fullName')
      .populate('course', 'name code');

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: { attendance: populatedAttendance }
    });
  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording attendance'
    });
  }
});

module.exports = router;
