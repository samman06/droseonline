const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const { authenticate, authorize, checkTeacherAccess } = require('../middleware/auth');
const { validateQuery, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, isActive } = req.query;
    
    const query = { role: 'teacher' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'academicInfo.employeeId': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) query['academicInfo.department'] = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const teachers = await User.find(query)
      .select('-password')
      .populate('academicInfo.subjects', 'name code credits type')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ firstName: 1, lastName: 1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        teachers,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teachers'
    });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get teacher profile
// @access  Private (Admin/Own Profile)
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
      .select('-password')
      .populate('academicInfo.subjects', 'name code credits type level');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get teacher statistics
    const stats = await getTeacherStatistics(teacher._id);

    res.json({
      success: true,
      data: { 
        teacher: {
          ...teacher.toObject(),
          statistics: stats
        }
      }
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher'
    });
  }
});

// @route   GET /api/teachers/:id/courses
// @desc    Get teacher's courses
// @access  Private (Admin/Own Courses)
router.get('/:id/courses', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { academicYear, semester, isActive } = req.query;

    const query = { teacher: req.params.id };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .populate('subject', 'name code credits type')
      .populate('groups', 'name code level semester currentEnrollment capacity')
      .populate('academicYear', 'name code isCurrent')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher courses'
    });
  }
});

// @route   GET /api/teachers/:id/assignments
// @desc    Get teacher's assignments
// @access  Private (Admin/Own Assignments)
router.get('/:id/assignments', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, courseId } = req.query;

    const query = { teacher: req.params.id };
    if (status) query.status = status;
    if (type) query.type = type;
    if (courseId) query.course = courseId;

    const assignments = await Assignment.find(query)
      .populate('course', 'name code')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .populate('groups', 'name code')
      .sort({ dueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assignment.countDocuments(query);

    // Get submission stats for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const submissionStats = await Submission.aggregate([
          { $match: { assignment: assignment._id } },
          {
            $group: {
              _id: null,
              totalSubmissions: { $sum: 1 },
              gradedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
              averageGrade: { $avg: '$grade.percentage' }
            }
          }
        ]);

        return {
          ...assignment.toObject(),
          submissionStats: submissionStats[0] || {
            totalSubmissions: 0,
            gradedSubmissions: 0,
            averageGrade: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        assignments: assignmentsWithStats,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher assignments'
    });
  }
});

// @route   GET /api/teachers/:id/students
// @desc    Get teacher's students (from all courses)
// @access  Private (Admin/Own Students)
router.get('/:id/students', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { courseId, groupId } = req.query;

    // Get teacher's courses
    const courseQuery = { teacher: req.params.id };
    if (courseId) courseQuery._id = courseId;

    const courses = await Course.find(courseQuery).populate('groups');
    
    // Get all groups from teacher's courses
    let allGroups = [];
    courses.forEach(course => {
      allGroups = allGroups.concat(course.groups);
    });

    // Filter by specific group if requested
    if (groupId) {
      allGroups = allGroups.filter(g => g._id.toString() === groupId);
    }

    // Get all students from these groups
    const Group = require('../models/Group');
    const studentIds = new Set();
    
    for (const group of allGroups) {
      const fullGroup = await Group.findById(group._id).populate('students.student');
      if (fullGroup) {
        fullGroup.students
          .filter(s => s.status === 'active')
          .forEach(s => studentIds.add(s.student._id.toString()));
      }
    }

    // Get unique students
    const students = await User.find({
      _id: { $in: Array.from(studentIds) }
    })
    .select('-password')
    .populate('academicInfo.groups', 'name code level semester')
    .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: { 
        students,
        totalStudents: students.length
      }
    });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher students'
    });
  }
});

// Helper function to get teacher statistics
async function getTeacherStatistics(teacherId) {
  try {
    // Get course statistics
    const courseStats = await Course.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          activeCourses: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalStudents: { $sum: '$stats.totalStudents' }
        }
      }
    ]);

    // Get assignment statistics
    const assignmentStats = await Assignment.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          publishedAssignments: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } }
        }
      }
    ]);

    // Get submission statistics (for grading workload)
    const submissionStats = await Submission.aggregate([
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignment',
          foreignField: '_id',
          as: 'assignmentInfo'
        }
      },
      { $match: { 'assignmentInfo.teacher': teacherId } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          pendingGrading: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          gradedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } }
        }
      }
    ]);

    const course = courseStats[0] || {};
    const assignment = assignmentStats[0] || {};
    const submission = submissionStats[0] || {};

    return {
      courses: {
        total: course.totalCourses || 0,
        active: course.activeCourses || 0,
        totalStudents: course.totalStudents || 0
      },
      assignments: {
        total: assignment.totalAssignments || 0,
        published: assignment.publishedAssignments || 0
      },
      grading: {
        totalSubmissions: submission.totalSubmissions || 0,
        pendingGrading: submission.pendingGrading || 0,
        gradedSubmissions: submission.gradedSubmissions || 0
      }
    };
  } catch (error) {
    console.error('Error calculating teacher statistics:', error);
    return {
      courses: { total: 0, active: 0, totalStudents: 0 },
      assignments: { total: 0, published: 0 },
      grading: { totalSubmissions: 0, pendingGrading: 0, gradedSubmissions: 0 }
    };
  }
}

module.exports = router;
