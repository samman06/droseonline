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
    const { page = 1, limit = 10, search, teacherId, subjectId, courseId, gradeLevel, day, isActive } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by course directly
    if (courseId) {
      query.course = courseId;
    }
    // Or filter by teacher/subject (query courses first, then groups)
    else if (teacherId || subjectId) {
      const Course = require('../models/Course');
      const courseQuery = {};
      if (teacherId) courseQuery.teacher = teacherId;
      if (subjectId) courseQuery.subject = subjectId;
      
      const courses = await Course.find(courseQuery).select('_id');
      const courseIds = courses.map(c => c._id);
      query.course = { $in: courseIds };
    }
    
    if (gradeLevel) query.gradeLevel = gradeLevel;
    if (day) query['schedule.day'] = day;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const groups = await Group.find(query)
      .populate({
        path: 'course',
        select: 'name code academicYear startDate endDate',
        populate: [
          { path: 'teacher', select: 'firstName lastName fullName' },
          { path: 'subject', select: 'name code' }
        ]
      })
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
      .populate({
        path: 'course',
        select: 'name code academicYear startDate endDate creditHours',
        populate: [
          { path: 'teacher', select: 'firstName lastName fullName email' },
          { path: 'subject', select: 'name code' }
        ]
      })
      .populate('classMonitor', 'firstName lastName fullName email')
      .populate('createdBy', 'firstName lastName fullName')
      .populate({
        path: 'students.student',
        select: 'firstName lastName fullName phoneNumber parentContact academicInfo'
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
    // Verify course exists
    const Course = require('../models/Course');
    const course = await Course.findById(req.body.course).populate('teacher subject');
    if (!course) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    const groupData = {
      ...req.body,
      createdBy: req.user._id
    };

    const group = new Group(groupData);
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate({
        path: 'course',
        populate: [
          { path: 'teacher', select: 'firstName lastName fullName' },
          { path: 'subject', select: 'name code' }
        ]
      })
      .populate('students', 'firstName lastName fullName academicInfo.studentId')
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

    // Verify course exists if changed
    if (req.body.course) {
      const Course = require('../models/Course');
      const course = await Course.findById(req.body.course);
      if (!course) {
        return res.status(400).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate({
      path: 'course',
      populate: [
        { path: 'teacher', select: 'firstName lastName fullName' },
        { path: 'subject', select: 'name code' }
      ]
    })
    .populate('students', 'firstName lastName fullName academicInfo.studentId')
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

    // No course dependency

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

// @route   POST /api/groups/:id/toggle-status
// @desc    Toggle group active status
// @access  Private (Admin)
router.post('/:id/toggle-status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Toggle the status
    group.isActive = !group.isActive;
    await group.save();

    const status = group.isActive ? 'activated' : 'deactivated';
    return res.json({ 
      success: true, 
      message: `Group ${status} successfully`,
      data: { isActive: group.isActive }
    });
  } catch (error) {
    console.error('Toggle group status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while toggling group status' });
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

    // Auto filter: enforce grade match
    const studentGrade = student.academicInfo?.currentGrade || student.academicInfo?.year;
    if (studentGrade && group.gradeLevel && studentGrade !== group.gradeLevel) {
      return res.status(400).json({ success: false, message: `Student grade (${studentGrade}) does not match group grade (${group.gradeLevel})` });
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

// @route   POST /api/groups/check-schedule-conflict
// @desc    Check for schedule conflicts
// @access  Private
router.post('/check-schedule-conflict', authenticate, async (req, res) => {
  try {
    const { courseId, schedule, excludeGroupId } = req.body;

    if (!courseId || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and schedule are required'
      });
    }

    // Get the course to find its teacher
    const Course = require('../models/Course');
    const course = await Course.findById(courseId).select('teacher');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find all courses taught by the same teacher
    const teacherCourses = await Course.find({ teacher: course.teacher }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);

    // Build query to find groups in courses with the same teacher
    const query = { course: { $in: courseIds } };
    if (excludeGroupId) {
      query._id = { $ne: excludeGroupId };
    }

    // Find all groups taught by this teacher (through their courses)
    const teacherGroups = await Group.find(query).select('name code schedule');

    // Check for schedule conflicts
    const conflicts = [];
    
    for (const slot of schedule) {
      for (const group of teacherGroups) {
        for (const existingSlot of group.schedule) {
          // Check if days match
          if (slot.day === existingSlot.day) {
            // Check if times overlap
            const newStart = slot.startTime;
            const newEnd = slot.endTime;
            const existingStart = existingSlot.startTime;
            const existingEnd = existingSlot.endTime;

            if (timeOverlaps(newStart, newEnd, existingStart, existingEnd)) {
              conflicts.push({
                groupId: group._id,
                groupName: group.name,
                groupCode: group.code,
                day: slot.day,
                time: `${existingSlot.startTime} - ${existingSlot.endTime}`,
                conflictWith: `${slot.startTime} - ${slot.endTime}`
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        hasConflict: conflicts.length > 0,
        conflicts
      }
    });
  } catch (error) {
    console.error('Check schedule conflict error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking schedule conflicts'
    });
  }
});

// Helper function to check if time ranges overlap
function timeOverlaps(start1, end1, start2, end2) {
  // Convert times to minutes for easier comparison
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Check if ranges overlap
  return (s1 < e2) && (e1 > s2);
}

module.exports = router;
