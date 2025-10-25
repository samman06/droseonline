const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Group = require('../models/Group');
const { authenticate } = require('../middleware/auth');
const mongoose = require('mongoose');

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

// @route   GET /api/dashboard/quick-actions
// @desc    Get quick actions data for teachers
// @access  Private (Teacher only)
router.get('/quick-actions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - teachers only'
      });
    }

    const today = new Date();
    const teacherId = req.user._id;

    // Get teacher's courses
    const teacherCourses = await Course.find({ teacher: teacherId, isActive: true }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);

    // Get teacher's groups
    const teacherGroups = await Group.find({ 
      course: { $in: courseIds },
      isActive: true 
    }).select('_id');
    const groupIds = teacherGroups.map(g => g._id);

    // Parallel queries for efficiency
    const [
      pendingGradingSubmissions,
      recentSubmissions,
      upcomingAssignments,
      lowAttendanceStudents,
      assignmentTemplateCount
    ] = await Promise.all([
      // Pending grading (submissions that need grading)
      Submission.find({
        assignment: {
          $in: await Assignment.find({ teacher: teacherId, status: 'published' }).select('_id')
        },
        status: 'submitted'
      })
        .populate('student', 'firstName lastName fullName academicInfo.studentId')
        .populate('assignment', 'title dueDate')
        .sort({ submittedAt: 1 })
        .limit(5)
        .select('student assignment submittedAt'),

      // Recent submissions (last 5)
      Submission.find({
        assignment: {
          $in: await Assignment.find({ teacher: teacherId, status: 'published' }).select('_id')
        },
        status: { $in: ['submitted', 'graded'] }
      })
        .populate('student', 'firstName lastName fullName')
        .populate('assignment', 'title')
        .sort({ submittedAt: -1 })
        .limit(5)
        .select('student assignment status submittedAt grade'),

      // Upcoming assignments (due in next 7 days)
      Assignment.find({
        teacher: teacherId,
        status: 'published',
        dueDate: { 
          $gte: today,
          $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      })
        .populate('course', 'name')
        .sort({ dueDate: 1 })
        .limit(5)
        .select('title dueDate course maxPoints'),

      // Low attendance students (< 75%)
      Attendance.aggregate([
        { $match: { group: { $in: groupIds } } },
        { $unwind: '$records' },
        {
          $group: {
            _id: '$records.student',
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } }
          }
        },
        {
          $project: {
            student: '$_id',
            attendanceRate: { 
              $multiply: [{ $divide: ['$present', '$total'] }, 100]
            }
          }
        },
        { $match: { attendanceRate: { $lt: 75 } } },
        { $sort: { attendanceRate: 1 } },
        { $limit: 5 }
      ]),

      // Count of assignment templates
      Assignment.countDocuments({ teacher: teacherId, isTemplate: true })
    ]);

    // Populate student details for low attendance
    const lowAttendanceStudentIds = lowAttendanceStudents.map(s => s.student);
    const students = await User.find({ _id: { $in: lowAttendanceStudentIds } })
      .select('firstName lastName fullName academicInfo.studentId');
    
    const lowAttendanceWithDetails = lowAttendanceStudents.map(record => {
      const student = students.find(s => s._id.toString() === record.student.toString());
      return {
        student,
        attendanceRate: Math.round(record.attendanceRate)
      };
    });

    res.json({
      success: true,
      data: {
        pendingGrading: pendingGradingSubmissions,
        recentSubmissions,
        upcomingAssignments,
        lowAttendanceStudents: lowAttendanceWithDetails,
        templateCount: assignmentTemplateCount,
        summary: {
          pendingCount: pendingGradingSubmissions.length,
          upcomingCount: upcomingAssignments.length,
          atRiskCount: lowAttendanceWithDetails.length
        }
      }
    });
  } catch (error) {
    console.error('Get quick actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quick actions'
    });
  }
});

// Admin statistics
async function getAdminStats() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalAssignments,
    totalAnnouncements,
    totalGroups,
    activeStudents,
    activeTeachers,
    recentUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    pendingGrading,
    lowAttendanceGroups,
    overdueAssignments,
    inactiveUsers,
    recentActivity
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Course.countDocuments({ isActive: true }),
    Assignment.countDocuments({ status: 'published' }),
    Announcement.countDocuments({ status: 'published' }),
    Group.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('firstName lastName fullName role createdAt'),
    User.countDocuments({ isActive: true, createdAt: { $gte: startOfWeek } }),
    User.countDocuments({ isActive: true, createdAt: { $gte: startOfMonth } }),
    Submission.countDocuments({ status: 'submitted' }),
    Group.find({ 'stats.averageAttendance': { $lt: 70 }, isActive: true })
      .populate('course', 'name')
      .populate({ path: 'course', populate: { path: 'subject', select: 'name' } })
      .limit(5)
      .select('name code stats.averageAttendance gradeLevel'),
    Assignment.find({ status: 'published', dueDate: { $lt: new Date() } })
      .populate('course', 'name')
      .sort({ dueDate: -1 })
      .limit(5)
      .select('title dueDate'),
    User.find({ isActive: false }).sort({ updatedAt: -1 }).limit(5).select('firstName lastName fullName role updatedAt'),
    getRecentActivity()
  ]);

  // Calculate average attendance across all groups
  const attendanceStats = await Attendance.aggregate([
    {
      $unwind: '$records'
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] }
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0] }
        }
      }
    }
  ]);

  const averageAttendance = attendanceStats.length > 0
    ? Math.round(((attendanceStats[0].presentCount + attendanceStats[0].lateCount) / attendanceStats[0].totalRecords) * 100)
    : 0;

  return {
    overview: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalAssignments,
      totalAnnouncements,
      totalGroups,
      activeStudents,
      activeTeachers,
      averageAttendance,
      pendingGrading
    },
    growth: {
      newUsersThisWeek,
      newUsersThisMonth
    },
    alerts: {
      lowAttendanceGroups,
      overdueAssignments: overdueAssignments.length,
      inactiveUsers: inactiveUsers.length,
      pendingGrading
    },
    lowAttendanceGroups,
    inactiveUsers,
    overdueAssignments,
    recentUsers,
    recentActivity
  };
}

// Helper function to get recent activity across the system
async function getRecentActivity() {
  const activities = [];

  // Recent assignments
  const recentAssignments = await Assignment.find({ status: 'published' })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('teacher', 'fullName')
    .populate('course', 'name')
    .select('title createdAt');

  recentAssignments.forEach(a => {
    activities.push({
      type: 'assignment',
      title: 'New Assignment Created',
      description: `${a.title} - ${a.course?.name || 'Unknown Course'}`,
      user: a.teacher?.fullName,
      time: a.createdAt
    });
  });

  // Recent attendance
  const recentAttendance = await Attendance.find({ isCompleted: true })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('teacher', 'fullName')
    .populate('group', 'name')
    .select('createdAt');

  recentAttendance.forEach(a => {
    activities.push({
      type: 'attendance',
      title: 'Attendance Recorded',
      description: `${a.group?.name || 'Unknown Group'}`,
      user: a.teacher?.fullName,
      time: a.createdAt
    });
  });

  // Recent submissions
  const recentSubmissions = await Submission.find({ status: 'graded' })
    .sort({ 'grade.gradedAt': -1 })
    .limit(2)
    .populate('student', 'fullName')
    .populate('assignment', 'title')
    .select('grade.gradedAt');

  recentSubmissions.forEach(s => {
    activities.push({
      type: 'grade',
      title: 'Assignment Graded',
      description: `${s.assignment?.title || 'Unknown'} - ${s.student?.fullName}`,
      time: s.grade?.gradedAt
    });
  });

  // Sort by time and return top 10
  return activities.sort((a, b) => b.time - a.time).slice(0, 10);
}

// Teacher statistics
async function getTeacherStats(teacherId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get teacher's courses
  const teacherCourses = await Course.find({ teacher: teacherId, isActive: true }).select('_id');
  const courseIds = teacherCourses.map(c => c._id);

  // Get teacher's groups
  const teacherGroups = await Group.find({ 
    course: { $in: courseIds },
    isActive: true 
  }).populate({
    path: 'course',
    populate: [
      { path: 'subject', select: 'name' },
      { path: 'teacher', select: 'fullName' }
    ]
  }).select('name code schedule students');

  const groupIds = teacherGroups.map(g => g._id);

  // Get today's sessions based on schedule
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
  const todaysSessions = teacherGroups.filter(group => 
    group.schedule.some(s => s.day === dayOfWeek)
  ).map(group => ({
    _id: group._id,
    name: group.name,
    code: group.code,
    subject: group.course?.subject?.name,
    schedule: group.schedule.filter(s => s.day === dayOfWeek),
    studentsCount: group.students?.filter(s => s.status === 'active').length || 0
  }));

  // Check which sessions have attendance marked today
  const todaysAttendance = await Attendance.find({
    group: { $in: groupIds },
    'session.date': { $gte: today, $lt: tomorrow }
  }).select('group');

  const markedGroupIds = todaysAttendance.map(a => a.group.toString());
  const pendingAttendanceCount = todaysSessions.filter(s => !markedGroupIds.includes(s._id.toString())).length;

  const [
    totalCourses,
    totalStudents,
    totalAssignments,
    pendingGrading,
    recentSubmissions,
    upcomingAssignments,
    studentsAtRisk
  ] = await Promise.all([
    courseIds.length,
    teacherGroups.reduce((sum, g) => sum + (g.students?.filter(s => s.status === 'active').length || 0), 0),
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
      { $match: { 'assignmentInfo.teacher': new mongoose.Types.ObjectId(teacherId), status: 'submitted' } },
      { $count: 'total' }
    ]).then(result => result[0]?.total || 0),
    Submission.find()
      .populate({
        path: 'assignment',
        match: { teacher: teacherId },
        select: 'title dueDate course',
        populate: { path: 'course', select: 'name' }
      })
      .populate('student', 'firstName lastName fullName')
      .sort({ submittedAt: -1 })
      .limit(5)
      .then(submissions => submissions.filter(s => s.assignment)),
    Assignment.find({
      teacher: teacherId,
      status: 'published',
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('course', 'name')
    .sort({ dueDate: 1 })
    .limit(5)
    .select('title dueDate maxPoints'),
    getStudentsAtRisk(groupIds)
  ]);

  // Calculate average attendance for teacher's groups
  const attendanceStats = await Attendance.aggregate([
    { $match: { teacher: new mongoose.Types.ObjectId(teacherId) } },
    { $unwind: '$records' },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] }
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0] }
        }
      }
    }
  ]);

  const averageAttendance = attendanceStats.length > 0
    ? Math.round(((attendanceStats[0].presentCount + attendanceStats[0].lateCount) / attendanceStats[0].totalRecords) * 100)
    : 0;

  return {
    overview: {
      totalCourses,
      totalStudents,
      totalAssignments,
      pendingGrading,
      averageAttendance,
      todaysSessionsCount: todaysSessions.length,
      pendingAttendance: pendingAttendanceCount
    },
    todaysSessions,
    pendingAttendance: pendingAttendanceCount,
    recentSubmissions,
    upcomingAssignments,
    studentsAtRisk
  };
}

// Helper function to get students at risk (low attendance)
async function getStudentsAtRisk(groupIds) {
  // Get all students from these groups
  const groups = await Group.find({ _id: { $in: groupIds } })
    .populate('students.student', 'fullName')
    .select('students name');

  const studentsMap = new Map();

  // Collect all unique students
  groups.forEach(group => {
    group.students.filter(s => s.status === 'active').forEach(s => {
      if (!studentsMap.has(s.student._id.toString())) {
        studentsMap.set(s.student._id.toString(), {
          _id: s.student._id,
          fullName: s.student.fullName,
          groups: []
        });
      }
      studentsMap.get(s.student._id.toString()).groups.push(group.name);
    });
  });

  // Calculate attendance for each student
  const studentsWithAttendance = await Promise.all(
    Array.from(studentsMap.values()).map(async (student) => {
      const stats = await Attendance.getStudentStats(student._id);
      return {
        ...student,
        attendanceRate: stats.rate,
        totalSessions: stats.total,
        absences: stats.absent
      };
    })
  );

  // Return students with attendance < 75%
  return studentsWithAttendance
    .filter(s => s.attendanceRate < 75 && s.totalSessions > 0)
    .sort((a, b) => a.attendanceRate - b.attendanceRate)
    .slice(0, 10);
}

// Student statistics
async function getStudentStats(studentId) {
  const student = await User.findById(studentId)
    .populate({
      path: 'academicInfo.groups',
      populate: {
        path: 'course',
        populate: [
          { path: 'subject', select: 'name code' },
          { path: 'teacher', select: 'fullName' }
        ]
      }
    });

  if (!student) {
    throw new Error('Student not found');
  }

  const groups = student.academicInfo?.groups || [];
  const groupIds = groups.map(g => g._id);

  // Get courses through groups
  const courseIds = groups.map(g => g.course?._id).filter(Boolean);

  const [
    totalGroups,
    totalAssignments,
    submittedAssignments,
    pendingAssignments,
    averageGrade,
    upcomingAssignments,
    recentGrades,
    recentAnnouncements
  ] = await Promise.all([
    groups.length,
    Assignment.countDocuments({ 
      $or: [
        { groups: { $in: groupIds } },
        { course: { $in: courseIds } }
      ],
      status: 'published' 
    }),
    Submission.countDocuments({ student: studentId }),
    Assignment.countDocuments({ 
      $or: [
        { groups: { $in: groupIds } },
        { course: { $in: courseIds } }
      ],
      status: 'published',
      dueDate: { $gte: new Date() },
      _id: { $nin: await Submission.find({ student: studentId }).distinct('assignment') }
    }),
    Submission.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId), status: 'graded' } },
      { $group: { _id: null, avg: { $avg: '$grade.percentage' } } }
    ]).then(result => Math.round(result[0]?.avg || 0)),
    Assignment.find({ 
      $or: [
        { groups: { $in: groupIds } },
        { course: { $in: courseIds } }
      ],
      status: 'published',
      dueDate: { $gte: new Date() }
    })
    .populate('course', 'name')
    .populate({
      path: 'course',
      populate: { path: 'subject', select: 'name' }
    })
    .sort({ dueDate: 1 })
    .limit(5)
    .select('title dueDate maxPoints type'),
    Submission.find({ student: studentId, status: 'graded' })
      .populate({
        path: 'assignment',
        select: 'title maxPoints type',
        populate: {
          path: 'course',
          select: 'name',
          populate: { path: 'subject', select: 'name' }
        }
      })
      .sort({ 'grade.gradedAt': -1 })
      .limit(5)
      .select('grade submittedAt'),
    Announcement.find({ 
      $or: [
        { targetGroups: { $in: groupIds } },
        { targetAudience: 'all' },
        { targetAudience: 'students' }
      ],
      status: 'published'
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title content createdAt')
  ]);

  // Calculate attendance percentage using existing method
  const attendanceStats = await Attendance.getStudentStats(studentId);

  // Format my groups with course info
  const myGroups = groups.map(g => ({
    _id: g._id,
    name: g.name,
    code: g.code,
    subject: g.course?.subject?.name,
    teacher: g.course?.teacher?.fullName,
    gradeLevel: g.gradeLevel,
    schedule: g.schedule
  }));

  return {
    overview: {
      totalGroups,
      totalAssignments,
      submittedAssignments,
      pendingAssignments,
      averageGrade,
      attendancePercentage: attendanceStats.rate,
      totalSessions: attendanceStats.total,
      presentCount: attendanceStats.present,
      absentCount: attendanceStats.absent,
      lateCount: attendanceStats.late
    },
    myGroups,
    upcomingAssignments,
    recentGrades,
    recentAnnouncements,
    attendanceDetails: {
      total: attendanceStats.total,
      present: attendanceStats.present,
      absent: attendanceStats.absent,
      late: attendanceStats.late,
      excused: attendanceStats.excused,
      rate: attendanceStats.rate
    }
  };
}

module.exports = router;
