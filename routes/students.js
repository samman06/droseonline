const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const { authenticate, authorize, checkResourceOwnership, checkStudentAccess } = require('../middleware/auth');
const { validate, validateQuery, updateProfileSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students
// @access  Private (Admin/Teacher)
router.get('/', authenticate, authorize('admin', 'teacher'), validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, year, grade, currentYear, isActive, groupId } = req.query;
    console.log("--------------------------------------------");
    
    console.log('GET /api/students - Query params:', req.query);
    console.log('isActive param:', isActive, 'type:', typeof isActive);
    
    // Build query for students only
    const query = { role: 'student' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'academicInfo.studentId': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Support both 'year' and 'currentYear' for backward compatibility, and new 'grade' filter
    if (year) query['academicInfo.year'] = year;
    if (grade) query['academicInfo.currentGrade'] = grade;
    if (currentYear) query['academicInfo.currentYear'] = parseInt(currentYear);
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
      console.log('Applied isActive filter:', query.isActive);
    }
    if (groupId) query['academicInfo.groups'] = groupId;

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    const students = await User.find(query)
      .select('-password')
      .populate('academicInfo.groups', 'name code gradeLevel teacher subject')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ firstName: 1, lastName: 1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get student profile
// @access  Private (Admin/Teacher/Own Profile)
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check if user can access this student's profile
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .select('-password')
      .populate('academicInfo.groups', 'name code gradeLevel teacher subject schedule pricePerSession');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get additional student statistics
    const stats = await getStudentStatistics(student._id);

    res.json({
      success: true,
      data: { 
        student: {
          ...student.toObject(),
          statistics: stats
        }
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student profile
// @access  Private (Admin/Own Profile)
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Define allowed fields based on user role
    const allowedFields = req.user.role === 'admin' 
      ? ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth', 'address', 'academicInfo', 'isActive']
      : ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth', 'address'];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate('academicInfo.groups', 'name code gradeLevel');

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: { student: updatedStudent }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating student'
    });
  }
});

// @route   GET /api/students/:id/courses
// @desc    Get student's enrolled courses
// @access  Private (Admin/Teacher/Own Profile)
router.get('/:id/courses', authenticate, checkStudentAccess, async (req, res) => {
  try {
    const { academicYear, semester, isActive } = req.query;

    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('academicInfo.groups');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all courses for student's groups
    const groupIds = student.academicInfo.groups.map(g => g._id);
    
    const query = { 
      groups: { $in: groupIds }
    };
    
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .populate('subject', 'name code credits type')
      .populate('teacher', 'firstName lastName fullName email')
      .populate('academicYear', 'name code isCurrent')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student courses'
    });
  }
});

// @route   GET /api/students/:id/assignments
// @desc    Get student's assignments
// @access  Private (Admin/Teacher/Own Profile)
router.get('/:id/assignments', authenticate, checkStudentAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, courseId } = req.query;

    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('academicInfo.groups');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get courses for student's groups
    const groupIds = student.academicInfo.groups.map(g => g._id);
    const courseQuery = { groups: { $in: groupIds } };
    if (courseId) courseQuery._id = courseId;
    
    const courses = await Course.find(courseQuery).select('_id');
    const courseIds = courses.map(c => c._id);

    // Get assignments
    const assignmentQuery = { 
      course: { $in: courseIds },
      status: 'published'
    };
    if (type) assignmentQuery.type = type;

    const assignments = await Assignment.find(assignmentQuery)
      .populate('course', 'name code')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .sort({ dueDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get submissions for these assignments
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.params.id
    }).select('assignment status grade submittedAt isLate');

    // Combine assignments with submission status
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = submissions.find(s => 
        s.assignment.toString() === assignment._id.toString()
      );
      
      return {
        ...assignment.toObject(),
        submission: submission || null,
        submissionStatus: submission ? submission.status : 'not_submitted',
        isOverdue: !submission && new Date() > assignment.dueDate
      };
    });

    // Filter by status if requested
    let filteredAssignments = assignmentsWithStatus;
    if (status === 'submitted') {
      filteredAssignments = assignmentsWithStatus.filter(a => a.submission);
    } else if (status === 'not_submitted') {
      filteredAssignments = assignmentsWithStatus.filter(a => !a.submission);
    } else if (status === 'overdue') {
      filteredAssignments = assignmentsWithStatus.filter(a => a.isOverdue);
    }

    const total = await Assignment.countDocuments(assignmentQuery);

    res.json({
      success: true,
      data: {
        assignments: filteredAssignments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student assignments'
    });
  }
});

// @route   GET /api/students/:id/grades
// @desc    Get student's grades
// @access  Private (Admin/Teacher/Own Profile)
router.get('/:id/grades', authenticate, checkStudentAccess, async (req, res) => {
  try {
    const { academicYear, semester, courseId } = req.query;

    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('academicInfo.groups');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build course query
    const groupIds = student.academicInfo.groups.map(g => g._id);
    const courseQuery = { groups: { $in: groupIds } };
    if (academicYear) courseQuery.academicYear = academicYear;
    if (semester) courseQuery.semester = semester;
    if (courseId) courseQuery._id = courseId;

    const courses = await Course.find(courseQuery)
      .populate('subject', 'name code credits')
      .populate('academicYear', 'name code');

    const gradesData = [];

    for (const course of courses) {
      // Get assignments for this course
      const assignments = await Assignment.find({ 
        course: course._id,
        status: 'published'
      }).sort({ dueDate: 1 });

      // Get submissions for these assignments
      const submissions = await Submission.find({
        student: req.params.id,
        course: course._id,
        status: 'graded'
      }).populate('assignment', 'title type maxPoints weightage dueDate');

      // Calculate course grade
      let totalWeightedPoints = 0;
      let totalWeightage = 0;
      let gradeBreakdown = [];

      submissions.forEach(submission => {
        const assignment = submission.assignment;
        const points = submission.finalGrade;
        const percentage = (points / assignment.maxPoints) * 100;
        const weightedPoints = (percentage * assignment.weightage) / 100;

        totalWeightedPoints += weightedPoints;
        totalWeightage += assignment.weightage;

        gradeBreakdown.push({
          assignment: {
            id: assignment._id,
            title: assignment.title,
            type: assignment.type,
            maxPoints: assignment.maxPoints,
            weightage: assignment.weightage,
            dueDate: assignment.dueDate
          },
          submission: {
            pointsEarned: points,
            percentage: Math.round(percentage),
            submittedAt: submission.submittedAt,
            isLate: submission.isLate,
            feedback: submission.grade.feedback
          }
        });
      });

      const courseGrade = totalWeightage > 0 ? totalWeightedPoints / totalWeightage * 100 : 0;

      gradesData.push({
        course: {
          id: course._id,
          name: course.name,
          code: course.code,
          subject: course.subject,
          academicYear: course.academicYear
        },
        grade: {
          overall: Math.round(courseGrade * 100) / 100,
          totalAssignments: assignments.length,
          submittedAssignments: submissions.length,
          breakdown: gradeBreakdown
        }
      });
    }

    res.json({
      success: true,
      data: { grades: gradesData }
    });
  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student grades'
    });
  }
});

// @route   GET /api/students/:id/attendance
// @desc    Get student's attendance
// @access  Private (Admin/Teacher/Own Profile)
router.get('/:id/attendance', authenticate, checkStudentAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, startDate, endDate } = req.query;

    const query = { student: req.params.id };
    if (courseId) query.course = courseId;
    if (startDate && endDate) {
      query.classDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'name code')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .populate('teacher', 'firstName lastName fullName')
      .sort({ classDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate attendance statistics
    const stats = await Attendance.calculateCourseAttendance(
      req.params.id,
      courseId,
      startDate,
      endDate
    );

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
        statistics: stats,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student attendance'
    });
  }
});

// @route   POST /api/students/:id/enroll-group
// @desc    Enroll student in a group
// @access  Private (Admin only)
router.post('/:id/enroll-group', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Add student to group
    await group.addStudent(req.params.id);

    // Add group to student's academic info
    if (!student.academicInfo.groups.includes(groupId)) {
      student.academicInfo.groups.push(groupId);
      await student.save();
    }

    res.json({
      success: true,
      message: 'Student enrolled in group successfully',
      data: {
        student: {
          id: student._id,
          fullName: student.fullName
        },
        group: {
          id: group._id,
          name: group.name,
          code: group.code
        }
      }
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while enrolling student'
    });
  }
});

// @route   DELETE /api/students/:id/remove-group/:groupId
// @desc    Remove student from a group
// @access  Private (Admin only)
router.delete('/:id/remove-group/:groupId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { groupId } = req.params;

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Remove student from group
    await group.removeStudent(req.params.id);

    // Remove group from student's academic info
    student.academicInfo.groups = student.academicInfo.groups.filter(
      g => g.toString() !== groupId
    );
    await student.save();

    res.json({
      success: true,
      message: 'Student removed from group successfully'
    });
  } catch (error) {
    console.error('Remove student from group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while removing student from group'
    });
  }
});

// Helper function to get student statistics
async function getStudentStatistics(studentId) {
  try {
    // Get total courses
    const totalCourses = await Course.countDocuments({
      groups: { 
        $in: await Group.find({
          'students.student': studentId,
          'students.status': 'active'
        }).distinct('_id')
      }
    });

    // Get assignment statistics
    const assignmentStats = await Submission.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          gradedSubmissions: { 
            $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] }
          },
          averageGrade: { $avg: '$grade.percentage' },
          lateSubmissions: { $sum: { $cond: ['$isLate', 1, 0] } }
        }
      }
    ]);

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'excused']] }, 1, 0] }
          },
          lateClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          absentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      }
    ]);

    const assignment = assignmentStats[0] || {};
    const attendance = attendanceStats[0] || {};

    return {
      courses: {
        total: totalCourses
      },
      assignments: {
        totalSubmissions: assignment.totalSubmissions || 0,
        gradedSubmissions: assignment.gradedSubmissions || 0,
        averageGrade: Math.round(assignment.averageGrade || 0),
        lateSubmissions: assignment.lateSubmissions || 0
      },
      attendance: {
        totalClasses: attendance.totalClasses || 0,
        presentClasses: attendance.presentClasses || 0,
        lateClasses: attendance.lateClasses || 0,
        absentClasses: attendance.absentClasses || 0,
        attendancePercentage: attendance.totalClasses > 0 
          ? Math.round((attendance.presentClasses / attendance.totalClasses) * 100)
          : 0
      }
    };
  } catch (error) {
    console.error('Error calculating student statistics:', error);
    return {
      courses: { total: 0 },
      assignments: { totalSubmissions: 0, gradedSubmissions: 0, averageGrade: 0, lateSubmissions: 0 },
      attendance: { totalClasses: 0, presentClasses: 0, lateClasses: 0, absentClasses: 0, attendancePercentage: 0 }
    };
  }
}

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      address,
      academicInfo,
      isActive = true
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new student
    const student = new User({
      firstName,
      lastName,
      email,
      password: password || 'student123', // Default password
      role: 'student',
      phoneNumber,
      dateOfBirth,
      address,
      academicInfo: {
        ...academicInfo,
        groups: [],
        subjects: []
      },
      isActive
    });

    await student.save();

    // Remove password from response
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student: studentResponse }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating student'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from all groups (updated to match Group schema structure)
    await Group.updateMany(
      { 'students.student': req.params.id },
      { $pull: { students: { student: req.params.id } } }
    );

    // Also remove from assignments, attendance, and submissions
    await Assignment.deleteMany({ student: req.params.id });
    await Attendance.deleteMany({ student: req.params.id });
    await Submission.deleteMany({ student: req.params.id });

    // Delete the student
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting student'
    });
  }
});

// @route   POST /api/students/bulk-action
// @desc    Perform bulk actions on students
// @access  Private (Admin only)
router.post('/bulk-action', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { action, studentIds } = req.body;

    if (!action || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action and student IDs are required'
      });
    }

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: studentIds }, role: 'student' },
          { isActive: true }
        );
        message = `${result.modifiedCount} students activated successfully`;
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: studentIds }, role: 'student' },
          { isActive: false }
        );
        message = `${result.modifiedCount} students deactivated successfully`;
        break;

      case 'delete':
        // Remove students from all groups first (updated to match Group schema structure)
        await Group.updateMany(
          { 'students.student': { $in: studentIds } },
          { $pull: { students: { student: { $in: studentIds } } } }
        );
        
        // Also remove from assignments, attendance, and submissions
        await Assignment.deleteMany({ student: { $in: studentIds } });
        await Attendance.deleteMany({ student: { $in: studentIds } });
        await Submission.deleteMany({ student: { $in: studentIds } });
        
        // Delete students
        result = await User.deleteMany({
          _id: { $in: studentIds },
          role: 'student'
        });
        message = `${result.deletedCount} students deleted successfully`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Supported actions: activate, deactivate, delete'
        });
    }

    res.json({
      success: true,
      message,
      data: {
        action,
        affected: result.modifiedCount || result.deletedCount,
        requested: studentIds.length
      }
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk action'
    });
  }
});

module.exports = router;
