const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Analytics Routes
 * Provides performance metrics and insights for teachers and admins
 */

// GET /api/analytics/teacher-overview - Overall stats for teacher
router.get('/teacher-overview', authenticate, authorize('teacher', 'admin'), asyncHandler(async (req, res) => {
  const teacherId = req.user.role === 'admin' && req.query.teacherId ? req.query.teacherId : req.user._id;
  
  // Get teacher's courses and groups
  const courses = await Course.find({ teacher: teacherId }).select('_id name');
  const courseIds = courses.map(c => c._id);
  
  const groups = await Group.find({ course: { $in: courseIds } }).select('_id name students');
  const groupIds = groups.map(g => g._id);
  
  // Calculate total students
  const studentSet = new Set();
  groups.forEach(group => {
    group.students.forEach(student => {
      if (student.status === 'active') {
        studentSet.add(student.student.toString());
      }
    });
  });
  const totalStudents = studentSet.size;
  
  // Get assignments stats
  const assignments = await Assignment.find({ 
    teacher: teacherId,
    status: { $in: ['published', 'closed', 'graded'] }
  }).select('_id maxPoints');
  
  const totalAssignments = assignments.length;
  const assignmentIds = assignments.map(a => a._id);
  
  // Get submissions stats
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds }
  }).select('grade score assignment isLate gradedAt');
  
  const gradedSubmissions = submissions.filter(s => s.grade).length;
  const pendingGrading = submissions.length - gradedSubmissions;
  
  // Calculate average grade
  const gradedScores = submissions.filter(s => s.score !== undefined && s.score !== null);
  const averageGrade = gradedScores.length > 0
    ? (gradedScores.reduce((sum, s) => sum + (s.score || 0), 0) / gradedScores.length).toFixed(2)
    : 0;
  
  // Calculate late submission rate
  const lateSubmissions = submissions.filter(s => s.isLate).length;
  const lateSubmissionRate = submissions.length > 0
    ? ((lateSubmissions / submissions.length) * 100).toFixed(1)
    : 0;
  
  // Get attendance stats
  const attendanceRecords = await Attendance.find({
    group: { $in: groupIds }
  }).select('status');
  
  const totalAttendanceRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const attendanceRate = totalAttendanceRecords > 0
    ? ((presentCount / totalAttendanceRecords) * 100).toFixed(1)
    : 0;
  
  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentSubmissions = await Submission.find({
    assignment: { $in: assignmentIds },
    submittedAt: { $gte: sevenDaysAgo }
  }).countDocuments();
  
  const recentAttendance = await Attendance.find({
    group: { $in: groupIds },
    sessionDate: { $gte: sevenDaysAgo }
  }).countDocuments();
  
  res.json({
    success: true,
    data: {
      overview: {
        totalStudents,
        totalCourses: courses.length,
        totalGroups: groups.length,
        totalAssignments,
        pendingGrading,
        averageGrade: parseFloat(averageGrade),
        attendanceRate: parseFloat(attendanceRate),
        lateSubmissionRate: parseFloat(lateSubmissionRate)
      },
      recentActivity: {
        submissionsLast7Days: recentSubmissions,
        attendanceLast7Days: recentAttendance
      },
      courses: courses.map(c => ({ id: c._id, name: c.name }))
    }
  });
}));

// GET /api/analytics/course/:courseId - Course-specific analytics
router.get('/course/:courseId', authenticate, authorize('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { startDate, endDate } = req.query;
  
  // Verify access
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404, true);
  }
  
  if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have access to this course analytics', 403, true);
  }
  
  // Get course groups
  const groups = await Group.find({ course: courseId }).populate('students.student', 'firstName lastName email');
  const groupIds = groups.map(g => g._id);
  
  // Get students
  const studentSet = new Set();
  const studentDetails = [];
  groups.forEach(group => {
    group.students.forEach(student => {
      if (student.status === 'active' && student.student) {
        const studentId = student.student._id.toString();
        if (!studentSet.has(studentId)) {
          studentSet.add(studentId);
          studentDetails.push({
            id: student.student._id,
            name: `${student.student.firstName} ${student.student.lastName}`,
            email: student.student.email
          });
        }
      }
    });
  });
  
  // Build date filter
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  // Get assignments
  const assignments = await Assignment.find({
    course: courseId,
    status: { $in: ['published', 'closed', 'graded'] },
    ...(Object.keys(dateFilter).length > 0 && { dueDate: dateFilter })
  }).select('_id title type maxPoints dueDate');
  
  const assignmentIds = assignments.map(a => a._id);
  
  // Get submissions
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
    course: courseId
  }).populate('student', 'firstName lastName').select('assignment student score grade isLate submittedAt');
  
  // Calculate assignment stats
  const assignmentStats = assignments.map(assignment => {
    const assignmentSubmissions = submissions.filter(s => s.assignment.toString() === assignment._id.toString());
    const gradedSubmissions = assignmentSubmissions.filter(s => s.score !== undefined);
    
    const avgScore = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length).toFixed(2)
      : 0;
    
    const submissionRate = studentDetails.length > 0
      ? ((assignmentSubmissions.length / studentDetails.length) * 100).toFixed(1)
      : 0;
    
    return {
      id: assignment._id,
      title: assignment.title,
      type: assignment.type,
      maxPoints: assignment.maxPoints,
      dueDate: assignment.dueDate,
      totalSubmissions: assignmentSubmissions.length,
      gradedSubmissions: gradedSubmissions.length,
      averageScore: parseFloat(avgScore),
      submissionRate: parseFloat(submissionRate)
    };
  });
  
  // Get attendance stats
  const attendanceRecords = await Attendance.find({
    group: { $in: groupIds },
    ...(Object.keys(dateFilter).length > 0 && { sessionDate: dateFilter })
  }).populate('student', 'firstName lastName').select('student status sessionDate');
  
  // Calculate per-student stats
  const studentStats = studentDetails.map(student => {
    const studentSubmissions = submissions.filter(s => s.student && s.student._id.toString() === student.id.toString());
    const studentAttendance = attendanceRecords.filter(a => a.student && a.student._id.toString() === student.id.toString());
    
    const gradedSubmissions = studentSubmissions.filter(s => s.score !== undefined);
    const avgScore = gradedSubmissions.length > 0
      ? (gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length).toFixed(2)
      : 0;
    
    const presentCount = studentAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = studentAttendance.length > 0
      ? ((presentCount / studentAttendance.length) * 100).toFixed(1)
      : 0;
    
    const lateSubmissions = studentSubmissions.filter(s => s.isLate).length;
    
    return {
      ...student,
      totalSubmissions: studentSubmissions.length,
      averageScore: parseFloat(avgScore),
      attendanceRate: parseFloat(attendanceRate),
      lateSubmissions,
      isAtRisk: parseFloat(avgScore) < 60 || parseFloat(attendanceRate) < 70
    };
  });
  
  // Sort to get top performers and at-risk students
  const topPerformers = [...studentStats].sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);
  const atRiskStudents = studentStats.filter(s => s.isAtRisk);
  
  // Calculate grade distribution
  const gradeRanges = {
    'A (90-100)': 0,
    'B (80-89)': 0,
    'C (70-79)': 0,
    'D (60-69)': 0,
    'F (0-59)': 0
  };
  
  studentStats.forEach(student => {
    if (student.averageScore >= 90) gradeRanges['A (90-100)']++;
    else if (student.averageScore >= 80) gradeRanges['B (80-89)']++;
    else if (student.averageScore >= 70) gradeRanges['C (70-79)']++;
    else if (student.averageScore >= 60) gradeRanges['D (60-69)']++;
    else gradeRanges['F (0-59)']++;
  });
  
  res.json({
    success: true,
    data: {
      course: {
        id: course._id,
        name: course.name,
        code: course.code
      },
      summary: {
        totalStudents: studentDetails.length,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        averageAttendanceRate: studentStats.length > 0
          ? (studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) / studentStats.length).toFixed(1)
          : 0
      },
      assignmentStats,
      studentStats,
      topPerformers,
      atRiskStudents,
      gradeDistribution: gradeRanges
    }
  });
}));

// GET /api/analytics/student-performance/:groupId - Group performance metrics
router.get('/student-performance/:groupId', authenticate, authorize('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  
  const group = await Group.findById(groupId).populate('course', 'name teacher').populate('students.student', 'firstName lastName email');
  
  if (!group) {
    throw new AppError('Group not found', 404, true);
  }
  
  // Verify access
  if (req.user.role === 'teacher' && group.course.teacher.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have access to this group analytics', 403, true);
  }
  
  // Get assignments for this group
  const assignments = await Assignment.find({
    groups: groupId,
    status: { $in: ['published', 'closed', 'graded'] }
  }).select('_id title type maxPoints dueDate');
  
  const assignmentIds = assignments.map(a => a._id);
  
  // Get submissions
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds }
  }).populate('student', 'firstName lastName').select('student assignment score isLate submittedAt');
  
  // Get attendance
  const attendanceRecords = await Attendance.find({
    group: groupId
  }).populate('student', 'firstName lastName').select('student status sessionDate');
  
  // Calculate per-student performance
  const studentPerformance = group.students
    .filter(s => s.status === 'active' && s.student)
    .map(s => {
      const studentId = s.student._id.toString();
      const studentSubmissions = submissions.filter(sub => sub.student && sub.student._id.toString() === studentId);
      const studentAttendance = attendanceRecords.filter(att => att.student && att.student._id.toString() === studentId);
      
      const gradedSubmissions = studentSubmissions.filter(sub => sub.score !== undefined);
      const avgScore = gradedSubmissions.length > 0
        ? (gradedSubmissions.reduce((sum, sub) => sum + sub.score, 0) / gradedSubmissions.length).toFixed(2)
        : 0;
      
      const presentCount = studentAttendance.filter(att => att.status === 'present').length;
      const attendanceRate = studentAttendance.length > 0
        ? ((presentCount / studentAttendance.length) * 100).toFixed(1)
        : 0;
      
      return {
        id: s.student._id,
        name: `${s.student.firstName} ${s.student.lastName}`,
        email: s.student.email,
        totalSubmissions: studentSubmissions.length,
        averageScore: parseFloat(avgScore),
        attendanceRate: parseFloat(attendanceRate),
        lateSubmissions: studentSubmissions.filter(sub => sub.isLate).length,
        status: s.status
      };
    });
  
  res.json({
    success: true,
    data: {
      group: {
        id: group._id,
        name: group.name,
        code: group.code,
        course: group.course.name
      },
      studentPerformance
    }
  });
}));

// GET /api/analytics/grade-trends - Grade trends over time
router.get('/grade-trends', authenticate, authorize('teacher', 'admin'), asyncHandler(async (req, res) => {
  const { courseId, studentId, startDate, endDate } = req.query;
  const teacherId = req.user.role === 'teacher' ? req.user._id : req.query.teacherId;
  
  const query = {};
  
  if (courseId) {
    query.course = courseId;
  } else if (teacherId) {
    query.teacher = teacherId;
  }
  
  if (studentId) {
    query.student = studentId;
  }
  
  // Get submissions with grades
  const submissions = await Submission.find(query)
    .populate('assignment', 'title type dueDate maxPoints')
    .populate('student', 'firstName lastName')
    .sort('submittedAt')
    .lean();
  
  // Filter by date if provided
  let filteredSubmissions = submissions;
  if (startDate || endDate) {
    filteredSubmissions = submissions.filter(s => {
      const subDate = new Date(s.submittedAt);
      if (startDate && subDate < new Date(startDate)) return false;
      if (endDate && subDate > new Date(endDate)) return false;
      return true;
    });
  }
  
  // Group by month for trend
  const trendData = {};
  filteredSubmissions.forEach(submission => {
    if (submission.score !== undefined && submission.score !== null) {
      const monthKey = new Date(submission.submittedAt).toISOString().slice(0, 7); // YYYY-MM
      if (!trendData[monthKey]) {
        trendData[monthKey] = { scores: [], count: 0 };
      }
      trendData[monthKey].scores.push(submission.score);
      trendData[monthKey].count++;
    }
  });
  
  // Calculate average for each month
  const trends = Object.keys(trendData).sort().map(month => ({
    month,
    averageScore: (trendData[month].scores.reduce((a, b) => a + b, 0) / trendData[month].count).toFixed(2),
    submissionCount: trendData[month].count
  }));
  
  res.json({
    success: true,
    data: trends
  });
}));

module.exports = router;

