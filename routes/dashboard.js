const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for current user
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'admin') {
      // Admin dashboard stats
      stats = await getAdminStats();
    } else if (req.user.role === 'teacher') {
      // Teacher dashboard stats
      stats = await getTeacherStats(req.user._id);
    } else if (req.user.role === 'student') {
      // Student dashboard stats
      stats = await getStudentStats(req.user._id);
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// Admin statistics
async function getAdminStats() {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalAssignments,
    totalAnnouncements,
    recentUsers
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Course.countDocuments({ isActive: true }),
    Assignment.countDocuments({ status: 'published' }),
    Announcement.countDocuments({ status: 'published' }),
    User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('firstName lastName role createdAt')
  ]);

  return {
    overview: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalAssignments,
      totalAnnouncements
    },
    recentUsers
  };
}

// Teacher statistics
async function getTeacherStats(teacherId) {
  const [
    totalCourses,
    totalStudents,
    totalAssignments,
    pendingGrading,
    recentSubmissions
  ] = await Promise.all([
    Course.countDocuments({ teacher: teacherId, isActive: true }),
    Course.aggregate([
      { $match: { teacher: teacherId, isActive: true } },
      { $group: { _id: null, totalStudents: { $sum: '$stats.totalStudents' } } }
    ]).then(result => result[0]?.totalStudents || 0),
    Assignment.countDocuments({ teacher: teacherId }),
    Submission.aggregate([
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignment',
          foreignField: '_id',
          as: 'assignmentInfo'
        }
      },
      { $match: { 'assignmentInfo.teacher': teacherId, status: 'submitted' } },
      { $count: 'total' }
    ]).then(result => result[0]?.total || 0),
    Submission.find()
      .populate({
        path: 'assignment',
        match: { teacher: teacherId },
        select: 'title dueDate'
      })
      .populate('student', 'firstName lastName fullName')
      .sort({ submittedAt: -1 })
      .limit(5)
      .then(submissions => submissions.filter(s => s.assignment))
  ]);

  return {
    overview: {
      totalCourses,
      totalStudents,
      totalAssignments,
      pendingGrading
    },
    recentSubmissions
  };
}

// Student statistics
async function getStudentStats(studentId) {
  const student = await User.findById(studentId).populate('academicInfo.groups');
  const groupIds = student.academicInfo.groups.map(g => g._id);
  
  const courses = await Course.find({ groups: { $in: groupIds }, isActive: true });
  const courseIds = courses.map(c => c._id);

  const [
    totalCourses,
    totalAssignments,
    submittedAssignments,
    averageGrade,
    upcomingAssignments,
    recentGrades
  ] = await Promise.all([
    courses.length,
    Assignment.countDocuments({ course: { $in: courseIds }, status: 'published' }),
    Submission.countDocuments({ student: studentId }),
    Submission.aggregate([
      { $match: { student: studentId, status: 'graded' } },
      { $group: { _id: null, avg: { $avg: '$grade.percentage' } } }
    ]).then(result => Math.round(result[0]?.avg || 0)),
    Assignment.find({ 
      course: { $in: courseIds }, 
      status: 'published',
      dueDate: { $gte: new Date() }
    })
    .populate('course', 'name code')
    .sort({ dueDate: 1 })
    .limit(5),
    Submission.find({ student: studentId, status: 'graded' })
      .populate('assignment', 'title maxPoints')
      .populate({
        path: 'assignment',
        populate: {
          path: 'course',
          select: 'name code'
        }
      })
      .sort({ 'grade.gradedAt': -1 })
      .limit(5)
  ]);

  // Calculate attendance percentage
  const attendanceStats = await Attendance.calculateCourseAttendance(studentId, null);

  return {
    overview: {
      totalCourses,
      totalAssignments,
      submittedAssignments,
      averageGrade,
      attendancePercentage: attendanceStats.attendancePercentage
    },
    upcomingAssignments,
    recentGrades
  };
}

module.exports = router;
