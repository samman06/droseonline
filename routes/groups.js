const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, groupSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/groups
// @desc    Get all groups
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, level, semester, academicYear, isActive } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (level) query.level = level;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const groups = await Group.find(query)
      .populate('academicYear', 'name code isCurrent')
      .populate('classMonitor', 'firstName lastName fullName')
      .populate('createdBy', 'firstName lastName fullName')
      .populate({
        path: 'students.student',
        select: 'firstName lastName fullName email academicInfo.studentId'
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('academicYear', 'name code startDate endDate isCurrent')
      .populate('classMonitor', 'firstName lastName fullName email')
      .populate('createdBy', 'firstName lastName fullName')
      .populate({
        path: 'students.student',
        select: 'firstName lastName fullName email dateOfBirth academicInfo.studentId'
      })
      .populate({
        path: 'schedule.subject',
        select: 'name code credits'
      })
      .populate({
        path: 'schedule.teacher',
        select: 'firstName lastName fullName email'
      });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: { group }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group'
    });
  }
});

// @route   POST /api/groups
// @desc    Create new group
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin'), validate(groupSchema), async (req, res) => {
  try {
    // Check if group code already exists
    const existingGroup = await Group.findOne({ code: req.body.code });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Group with this code already exists'
      });
    }

    // Verify academic year exists
    const academicYear = await AcademicYear.findById(req.body.academicYear);
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year not found'
      });
    }

    const groupData = {
      ...req.body,
      createdBy: req.user._id
    };

    const group = new Group(groupData);
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('academicYear', 'name code')
      .populate('classMonitor', 'firstName lastName fullName')
      .populate('createdBy', 'firstName lastName fullName');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group: populatedGroup }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin'), validate(groupSchema), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if code is being changed and if new code already exists
    if (req.body.code && req.body.code !== group.code) {
      const existingGroup = await Group.findOne({ code: req.body.code });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: 'Group with this code already exists'
        });
      }
    }

    // Verify academic year exists if being changed
    if (req.body.academicYear && req.body.academicYear !== group.academicYear.toString()) {
      const academicYear = await AcademicYear.findById(req.body.academicYear);
      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year not found'
        });
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('academicYear', 'name code')
    .populate('classMonitor', 'firstName lastName fullName')
    .populate('createdBy', 'firstName lastName fullName');

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: { group: updatedGroup }
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating group'
    });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group (soft delete)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if group has active students
    if (group.currentEnrollment > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete group with ${group.currentEnrollment} active students. Please move students to other groups first.`
      });
    }

    // Check if group is used in any active courses
    const Course = require('../models/Course');
    const activeCourses = await Course.countDocuments({ 
      groups: req.params.id,
      isActive: true 
    });

    if (activeCourses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete group. It is used in ${activeCourses} active course(s).`
      });
    }

    // Soft delete
    group.isActive = false;
    await group.save();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting group'
    });
  }
});

// @route   POST /api/groups/:id/students
// @desc    Add student to group
// @access  Private (Admin)
router.post('/:id/students', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Add student to group
    await group.addStudent(studentId);

    // Add group to student's academic info
    if (!student.academicInfo.groups.includes(req.params.id)) {
      student.academicInfo.groups.push(req.params.id);
      await student.save();
    }

    const updatedGroup = await Group.findById(req.params.id)
      .populate({
        path: 'students.student',
        select: 'firstName lastName fullName email academicInfo.studentId'
      });

    res.json({
      success: true,
      message: 'Student added to group successfully',
      data: { group: updatedGroup }
    });
  } catch (error) {
    console.error('Add student to group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while adding student to group'
    });
  }
});

// @route   DELETE /api/groups/:id/students/:studentId
// @desc    Remove student from group
// @access  Private (Admin)
router.delete('/:id/students/:studentId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const student = await User.findOne({ _id: req.params.studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from group
    await group.removeStudent(req.params.studentId);

    // Remove group from student's academic info
    student.academicInfo.groups = student.academicInfo.groups.filter(
      g => g.toString() !== req.params.id
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

// @route   PUT /api/groups/:id/class-monitor
// @desc    Set class monitor
// @access  Private (Admin)
router.put('/:id/class-monitor', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { studentId } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (studentId) {
      // Verify student is in this group
      const isStudentInGroup = group.students.some(s => 
        s.student.toString() === studentId && s.status === 'active'
      );

      if (!isStudentInGroup) {
        return res.status(400).json({
          success: false,
          message: 'Student must be an active member of this group to be class monitor'
        });
      }
    }

    group.classMonitor = studentId || null;
    await group.save();

    const updatedGroup = await Group.findById(req.params.id)
      .populate('classMonitor', 'firstName lastName fullName email');

    res.json({
      success: true,
      message: studentId ? 'Class monitor set successfully' : 'Class monitor removed successfully',
      data: { group: updatedGroup }
    });
  } catch (error) {
    console.error('Set class monitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting class monitor'
    });
  }
});

// @route   GET /api/groups/:id/schedule
// @desc    Get group schedule
// @access  Private
router.get('/:id/schedule', authenticate, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate({
        path: 'schedule.subject',
        select: 'name code credits type'
      })
      .populate({
        path: 'schedule.teacher',
        select: 'firstName lastName fullName email'
      });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Organize schedule by day
    const scheduleByDay = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      scheduleByDay[day] = group.schedule
        .filter(s => s.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      success: true,
      data: { 
        group: {
          id: group._id,
          name: group.name,
          code: group.code,
          level: group.level,
          semester: group.semester
        },
        schedule: scheduleByDay
      }
    });
  } catch (error) {
    console.error('Get group schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group schedule'
    });
  }
});

// @route   GET /api/groups/:id/statistics
// @desc    Get group statistics
// @access  Private (Admin/Teacher)
router.get('/:id/statistics', authenticate, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get courses for this group
    const Course = require('../models/Course');
    const courses = await Course.find({ groups: req.params.id });
    const courseIds = courses.map(c => c._id);

    // Get attendance statistics
    const Attendance = require('../models/Attendance');
    const attendanceStats = await Attendance.aggregate([
      { $match: { group: group._id } },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          totalAttendance: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $in: ['$status', ['present', 'excused']] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      }
    ]);

    // Get assignment statistics
    const Assignment = require('../models/Assignment');
    const assignmentStats = await Assignment.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          publishedAssignments: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } }
        }
      }
    ]);

    const attendance = attendanceStats[0] || {};
    const assignment = assignmentStats[0] || {};

    const stats = {
      group: {
        id: group._id,
        name: group.name,
        code: group.code,
        capacity: group.capacity,
        currentEnrollment: group.currentEnrollment,
        availableSpots: group.availableSpots
      },
      students: {
        total: group.currentEnrollment,
        active: group.activeStudentsCount
      },
      courses: {
        total: courses.length,
        active: courses.filter(c => c.isActive).length
      },
      attendance: {
        totalClasses: attendance.totalClasses || 0,
        averageAttendance: attendance.totalClasses > 0 
          ? Math.round((attendance.presentCount / attendance.totalClasses) * 100)
          : 0,
        absentCount: attendance.absentCount || 0,
        lateCount: attendance.lateCount || 0
      },
      assignments: {
        total: assignment.totalAssignments || 0,
        published: assignment.publishedAssignments || 0
      }
    };

    res.json({
      success: true,
      data: { statistics: stats }
    });
  } catch (error) {
    console.error('Get group statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group statistics'
    });
  }
});

module.exports = router;
