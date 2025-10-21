const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const { authenticate } = require('../middleware/auth');
const validation = require('../middleware/validation');
const Joi = require('joi');

// Validation schemas
const createAttendanceSchema = Joi.object({
  groupId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  sessionDate: Joi.date().required(),
  scheduleIndex: Joi.number().integer().min(0).required(),
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
      minutesLate: Joi.number().min(0).optional(),
      notes: Joi.string().max(500).optional().allow('')
    })
  ).required(),
  sessionNotes: Joi.string().max(1000).optional().allow(''),
  isCompleted: Joi.boolean().optional()
});

const updateAttendanceSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
      minutesLate: Joi.number().min(0).optional(),
      notes: Joi.string().max(500).optional().allow('')
    })
  ).optional(),
  sessionNotes: Joi.string().max(1000).optional().allow(''),
  isCompleted: Joi.boolean().optional()
});

const attendanceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  search: Joi.string().max(100).optional().allow(''),
  groupId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  teacherId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  subjectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  studentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  isCompleted: Joi.string().valid('true', 'false', '').optional().allow(''),
  minRate: Joi.number().min(0).max(100).optional(),
  maxRate: Joi.number().min(0).max(100).optional()
});

// ==========================================
// ROLE-SPECIFIC ENDPOINTS (Must come before generic routes)
// ==========================================

// @route   GET /api/attendance/my-attendance
// @desc    Get attendance records for current student (own attendance only)
// @access  Private (Student only)
router.get('/my-attendance', authenticate, validation.validateQuery(attendanceQuerySchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-session.date', dateFrom, dateTo } = req.query;
    
    const User = require('../models/User');
    const student = await User.findById(req.user._id).select('academicInfo.groups');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const groupIds = student.academicInfo?.groups || [];
    
    // Build query for student's attendance
    const query = {
      group: { $in: groupIds },
      'records.student': req.user._id
    };
    
    // Apply date filters
    if (dateFrom || dateTo) {
      query['session.date'] = {};
      if (dateFrom) query['session.date'].$gte = new Date(dateFrom);
      if (dateTo) query['session.date'].$lte = new Date(dateTo);
    }
    
    const attendances = await Attendance.find(query)
      .populate('group', 'name code gradeLevel')
      .populate({
        path: 'group',
        populate: {
          path: 'course',
          select: 'name code',
          populate: [
            { path: 'teacher', select: 'firstName lastName fullName' },
            { path: 'subject', select: 'name code' }
          ]
        }
      })
      .populate('teacher', 'firstName lastName fullName')
      .populate('subject', 'name code')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Attendance.countDocuments(query);
    
    // Filter records to show only student's own attendance
    const studentAttendances = attendances.map(att => {
      const studentRecord = att.records?.find(r => 
        r.student.toString() === req.user._id.toString()
      );
      
      return {
        _id: att._id,
        group: att.group,
        session: att.session,
        code: att.code,
        teacher: att.teacher,
        subject: att.subject,
        isCompleted: att.isCompleted,
        isLocked: att.isLocked,
        createdAt: att.createdAt,
        myRecord: studentRecord || null
      };
    });
    
    res.json({
      success: true,
      data: {
        attendances: studentAttendances,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching your attendance' });
  }
});

// @route   GET /api/attendance/teacher/attendance
// @desc    Get attendance records for current teacher's groups
// @access  Private (Teacher only)
router.get('/teacher/attendance', authenticate, validation.validateQuery(attendanceQuerySchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-session.date', search, groupId, dateFrom, dateTo, isCompleted } = req.query;
    
    // Find groups taught by this teacher
    const Course = require('../models/Course');
    const teacherCourses = await Course.find({ teacher: req.user._id, isActive: true }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);
    
    const teacherGroups = await Group.find({ course: { $in: courseIds }, isActive: true }).select('_id');
    const groupIds = teacherGroups.map(g => g._id);
    
    // Build query
    const query = {
      group: { $in: groupIds }
    };
    
    // Apply filters
    if (groupId) query.group = groupId;
    if (dateFrom || dateTo) {
      query['session.date'] = {};
      if (dateFrom) query['session.date'].$gte = new Date(dateFrom);
      if (dateTo) query['session.date'].$lte = new Date(dateTo);
    }
    if (isCompleted === 'true') query.isCompleted = true;
    else if (isCompleted === 'false') query.isCompleted = false;
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { 'session.notes': { $regex: search, $options: 'i' } }
      ];
    }
    
    const attendances = await Attendance.find(query)
      .populate('group', 'name code gradeLevel currentEnrollment')
      .populate({
        path: 'group',
        populate: {
          path: 'course',
          select: 'name code',
          populate: [
            { path: 'teacher', select: 'firstName lastName fullName' },
            { path: 'subject', select: 'name code' }
          ]
        }
      })
      .populate('teacher', 'firstName lastName fullName')
      .populate('subject', 'name code')
      .populate('records.student', 'firstName lastName fullName')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Attendance.countDocuments(query);
    
    // Add statistics for each attendance record
    const attendancesWithStats = attendances.map(att => {
      const totalRecords = att.records?.length || 0;
      const present = att.records?.filter(r => r.status === 'present').length || 0;
      const late = att.records?.filter(r => r.status === 'late').length || 0;
      const absent = att.records?.filter(r => r.status === 'absent').length || 0;
      const excused = att.records?.filter(r => r.status === 'excused').length || 0;
      const attendanceRate = totalRecords > 0 ? Math.round(((present + late) / totalRecords) * 100) : 0;
      
      return {
        ...att,
        stats: {
          totalRecords,
          present,
          late,
          absent,
          excused,
          attendanceRate
        }
      };
    });
    
    res.json({
      success: true,
      data: {
        attendances: attendancesWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher attendance' });
  }
});

// GET /api/attendance - List all attendance records with filters
router.get('/', authenticate, validation.validateQuery(attendanceQuerySchema), async (req, res) => {
  try {
    const { page, limit, sort, search, groupId, teacherId, subjectId, studentId, dateFrom, dateTo, isCompleted, minRate, maxRate } = req.query;

    const query = {};

    // Basic filters
    if (groupId) query.group = groupId;
    if (teacherId) query.teacher = teacherId;
    if (subjectId) query.subject = subjectId;
    if (studentId) query['records.student'] = studentId;
    if (isCompleted !== undefined && isCompleted !== '') query.isCompleted = isCompleted === 'true';

    // Search functionality (search in code)
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { sessionNotes: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query['session.date'] = {};
      if (dateFrom) query['session.date'].$gte = new Date(dateFrom);
      if (dateTo) query['session.date'].$lte = new Date(dateTo);
    }

    const sortOption = sort || '-session.date';
    const skip = (page - 1) * limit;

    let [attendances, total] = await Promise.all([
      Attendance.find(query)
        .populate('group', 'name code gradeLevel')
        .populate('teacher', 'firstName lastName fullName')
        .populate('subject', 'name code')
        .populate('records.student', 'firstName lastName fullName')
        .populate('createdBy', 'firstName lastName fullName')
        .populate('lockedBy', 'firstName lastName fullName')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    // Apply rate filtering if specified (post-query filtering)
    if (minRate !== undefined || maxRate !== undefined) {
      attendances = attendances.filter(attendance => {
        const rate = attendance.stats ? attendance.stats.rate : 0;
        if (minRate !== undefined && rate < minRate) return false;
        if (maxRate !== undefined && rate > maxRate) return false;
        return true;
      });
    }

    // Standardized response
    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/attendance/pending - Get groups with pending attendance for today
router.get('/pending', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active groups with course populated
    const groups = await Group.find({})
      .populate({
        path: 'course',
        populate: [
          { path: 'teacher', select: 'fullName email' },
          { path: 'subject', select: 'name code' }
        ]
      })
      .populate('students.student', 'fullName');

    console.log(`📊 Found ${groups.length} groups`);

    // Check which groups have sessions today based on schedule
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
    
    const groupsWithSessionToday = groups.filter(group => 
      group.schedule && group.schedule.some(s => s.day && s.day.toLowerCase() === dayOfWeek)
    );

    console.log(`📅 ${groupsWithSessionToday.length} groups have sessions today (${dayOfWeek})`);

    // Check which groups already have attendance marked for today
    const attendanceToday = await Attendance.find({
      'session.date': { $gte: today, $lt: tomorrow }
    }).select('group');

    const groupsWithAttendance = new Set(attendanceToday.map(a => a.group.toString()));

    console.log(`✅ ${groupsWithAttendance.size} groups already have attendance marked`);

    // Filter groups that need attendance
    const pendingGroups = groupsWithSessionToday
      .filter(group => !groupsWithAttendance.has(group._id.toString()))
      .map(group => ({
        _id: group._id,
        name: group.name,
        code: group.code,
        gradeLevel: group.gradeLevel,
        teacher: group.course?.teacher,
        subject: group.course?.subject,
        studentCount: group.students ? group.students.length : 0,
        schedule: group.schedule.filter(s => s.day.toLowerCase() === dayOfWeek)
      }));

    console.log(`⏳ ${pendingGroups.length} groups pending attendance`);

    res.json({ 
      success: true,
      pendingGroups, 
      count: pendingGroups.length,
      today: today.toISOString().split('T')[0],
      dayOfWeek: dayOfWeek
    });
  } catch (error) {
    console.error('❌ Error fetching pending attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch pending attendance. Please try again.',
      error: error.message 
    });
  }
});

// GET /api/attendance/group/:groupId - Get all attendance for a specific group
router.get('/group/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;

    const attendances = await Attendance.find({ group: groupId })
      .populate('teacher', 'fullName')
      .populate('subject', 'name')
      .populate('records.student', 'fullName')
      .populate('createdBy', 'username')
      .sort('-session.date');

    const stats = await Attendance.getGroupStats(groupId);

    res.json({ attendances, stats });
  } catch (error) {
    console.error('Error fetching group attendance:', error);
    res.status(500).json({ message: 'Error fetching group attendance', error: error.message });
  }
});

// GET /api/attendance/student/:studentId - Get student's attendance across all groups
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    const attendances = await Attendance.find({ 'records.student': studentId })
      .populate('group', 'name')
      .populate('teacher', 'fullName')
      .populate('subject', 'name')
      .sort('-session.date');

    // Filter records to only include the specific student
    const studentAttendances = attendances.map(attendance => {
      const studentRecord = attendance.records.find(r => r.student.toString() === studentId);
      return {
        _id: attendance._id,
        group: attendance.group,
        teacher: attendance.teacher,
        subject: attendance.subject,
        sessionDate: attendance.session.date,
        status: studentRecord.status,
        notes: studentRecord.notes,
        markedAt: studentRecord.markedAt
      };
    });

    const stats = await Attendance.getStudentStats(studentId);

    res.json({ attendances: studentAttendances, stats });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Error fetching student attendance', error: error.message });
  }
});

// GET /api/attendance/teacher/:teacherId - Get teacher's groups attendance
router.get('/teacher/:teacherId', authenticate, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const attendances = await Attendance.find({ teacher: teacherId })
      .populate('group', 'name')
      .populate('subject', 'name')
      .populate('records.student', 'fullName')
      .sort('-session.date');

    res.json({ attendances });
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    res.status(500).json({ message: 'Error fetching teacher attendance', error: error.message });
  }
});

// GET /api/attendance/stats - Get overall attendance statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalSessions = await Attendance.countDocuments();
    const completedSessions = await Attendance.countDocuments({ isCompleted: true });
    const pendingSessions = totalSessions - completedSessions;

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = await Attendance.countDocuments({
      'session.date': { $gte: today, $lt: tomorrow }
    });

    // Calculate overall attendance rate
    const allAttendances = await Attendance.find();
    let totalRecords = 0;
    let totalPresent = 0;
    let totalLate = 0;

    allAttendances.forEach(attendance => {
      totalRecords += attendance.records.length;
      totalPresent += attendance.records.filter(r => r.status === 'present').length;
      totalLate += attendance.records.filter(r => r.status === 'late').length;
    });

    const overallRate = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0;

    res.json({
      totalSessions,
      completedSessions,
      pendingSessions,
      todaySessions,
      overallRate,
      totalRecords
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Error fetching attendance statistics', error: error.message });
  }
});

// GET /api/attendance/:id - Get specific attendance record
router.get('/:id', authenticate, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('group', 'name code gradeLevel')
      .populate('teacher', 'firstName lastName fullName email')
      .populate('subject', 'name code')
      .populate('records.student', 'firstName lastName fullName phoneNumber parentContact academicInfo')
      .populate('records.markedBy', 'firstName lastName fullName')
      .populate('createdBy', 'firstName lastName fullName')
      .populate('lockedBy', 'firstName lastName fullName');

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    res.json({
      success: true,
      data: { attendance: attendance.toObject() }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching attendance record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/attendance - Create/mark attendance for a session
router.post('/', authenticate, validation.validate(createAttendanceSchema), async (req, res) => {
  try {
    const { groupId, sessionDate, scheduleIndex, records, sessionNotes, isCompleted } = req.body;

    // Verify group exists and populate course with teacher and subject
    const group = await Group.findById(groupId)
      .populate('students')
      .populate({
        path: 'course',
        populate: [
          { path: 'teacher', select: '_id fullName' },
          { path: 'subject', select: '_id name' }
        ]
      });
    
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    // Ensure course with teacher and subject exists
    if (!group.course || !group.course.teacher || !group.course.subject) {
      return res.status(400).json({ 
        success: false,
        message: 'Group must have a course with teacher and subject assigned' 
      });
    }

    // Check if attendance already exists for this group and date
    const existingAttendance = await Attendance.findOne({
      group: groupId,
      'session.date': new Date(sessionDate)
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false,
        message: 'Attendance already marked for this session' 
      });
    }

    // Build attendance records
    const attendanceRecords = records.map(record => ({
      student: record.studentId,
      status: record.status,
      minutesLate: record.minutesLate || 0,
      notes: record.notes || '',
      markedAt: new Date(),
      markedBy: req.user.id
    }));

    // Create attendance record
    const attendance = new Attendance({
      group: groupId,
      session: {
        date: new Date(sessionDate),
        scheduleIndex
      },
      teacher: group.course.teacher._id,
      subject: group.course.subject._id,
      records: attendanceRecords,
      sessionNotes: sessionNotes || '',
      isCompleted: isCompleted || false,
      createdBy: req.user.id
    });

    await attendance.save();

    // Populate before sending response
    await attendance.populate([
      { path: 'group', select: 'name code gradeLevel' },
      { path: 'teacher', select: 'firstName lastName fullName' },
      { path: 'subject', select: 'name code' },
      { path: 'records.student', select: 'firstName lastName fullName' },
      { path: 'createdBy', select: 'firstName lastName fullName' }
    ]);

    res.status(201).json({ 
      success: true,
      message: 'Attendance marked successfully', 
      data: { attendance: attendance.toObject() }
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', authenticate, validation.validate(updateAttendanceSchema), async (req, res) => {
  try {
    const { records, sessionNotes, isCompleted } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    // Check if locked
    if (attendance.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Attendance record is locked and cannot be edited' 
      });
    }

    // Update records if provided
    if (records) {
      records.forEach(record => {
        const existingRecord = attendance.records.find(
          r => r.student.toString() === record.studentId
        );
        if (existingRecord) {
          existingRecord.status = record.status;
          existingRecord.minutesLate = record.minutesLate || 0;
          existingRecord.notes = record.notes || existingRecord.notes;
          existingRecord.markedAt = new Date();
          existingRecord.markedBy = req.user.id;
        }
      });
    }

    // Update session notes if provided
    if (sessionNotes !== undefined) {
      attendance.sessionNotes = sessionNotes;
    }

    // Update completion status if provided
    if (isCompleted !== undefined) {
      attendance.isCompleted = isCompleted;
    }

    await attendance.save();

    // Populate before sending response
    await attendance.populate([
      { path: 'group', select: 'name code gradeLevel' },
      { path: 'teacher', select: 'firstName lastName fullName' },
      { path: 'subject', select: 'name code' },
      { path: 'records.student', select: 'firstName lastName fullName' },
      { path: 'createdBy', select: 'firstName lastName fullName' }
    ]);

    res.json({ 
      success: true,
      message: 'Attendance updated successfully', 
      data: { attendance: attendance.toObject() }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/attendance/:id/bulk-update - Bulk update multiple records
router.post('/:id/bulk-update', authenticate, async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Records array is required' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance session not found' });
    }

    // Check if user can edit
    if (!attendance.canEdit(req.user.role)) {
      return res.status(403).json({ 
        message: 'This attendance session is locked. Only admins can make changes.' 
      });
    }

    // Update all records
    records.forEach(record => {
      attendance.updateStudentStatus(
        record.studentId,
        record.status,
        record.notes,
        req.user.id,
        record.minutesLate
      );
    });

    await attendance.save();
    await attendance.populate([
      { path: 'group', select: 'name' },
      { path: 'teacher', select: 'fullName' },
      { path: 'subject', select: 'name' },
      { path: 'records.student', select: 'fullName' }
    ]);

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    console.error('Error bulk updating attendance:', error);
    res.status(500).json({ message: 'Error bulk updating attendance', error: error.message });
  }
});

// POST /api/attendance/:id/lock - Lock attendance session
router.post('/:id/lock', authenticate, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance session not found' 
      });
    }

    if (attendance.isLocked) {
      return res.status(400).json({ 
        success: false,
        message: 'Session is already locked' 
      });
    }

    await attendance.lock(req.user.id);

    res.json({ 
      success: true,
      message: 'Attendance session locked successfully', 
      data: { attendance: attendance.toObject() }
    });
  } catch (error) {
    console.error('Error locking attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while locking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/attendance/:id/unlock - Unlock attendance session (admin only)
router.post('/:id/unlock', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only admins can unlock attendance sessions' 
      });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance session not found' 
      });
    }

    if (!attendance.isLocked) {
      return res.status(400).json({ 
        success: false,
        message: 'Session is not locked' 
      });
    }

    await attendance.unlock();

    res.json({ 
      success: true,
      message: 'Attendance session unlocked successfully', 
      data: { attendance: attendance.toObject() }
    });
  } catch (error) {
    console.error('Error unlocking attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while unlocking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/attendance/reports/export - Export attendance records
router.get('/reports/export', authenticate, async (req, res) => {
  try {
    const { groupId, dateFrom, dateTo, format = 'json' } = req.query;

    const query = {};
    if (groupId) query.group = groupId;
    if (dateFrom || dateTo) {
      query['session.date'] = {};
      if (dateFrom) query['session.date'].$gte = new Date(dateFrom);
      if (dateTo) query['session.date'].$lte = new Date(dateTo);
    }

    const attendances = await Attendance.find(query)
      .populate('group', 'name')
      .populate('teacher', 'fullName')
      .populate('subject', 'name')
      .populate('records.student', 'fullName academicInfo.studentId')
      .sort('session.date');

    // Flatten data for export
    const exportData = [];
    attendances.forEach(attendance => {
      attendance.records.forEach(record => {
        exportData.push({
          Date: new Date(attendance.session.date).toLocaleDateString(),
          Group: attendance.group.name,
          Subject: attendance.subject.name,
          Teacher: attendance.teacher.fullName,
          StudentID: record.student.academicInfo?.studentId || '',
          StudentName: record.student.fullName,
          Status: record.status,
          MinutesLate: record.minutesLate || 0,
          Notes: record.notes || ''
        });
      });
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-export.csv');
      res.send(csv);
    } else {
      res.json({ data: exportData, count: exportData.length });
    }
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ message: 'Error exporting attendance', error: error.message });
  }
});

// GET /api/attendance/statistics/dashboard - Get comprehensive dashboard statistics
router.get('/statistics/dashboard', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Overall statistics
    const totalSessions = await Attendance.countDocuments();
    const completedSessions = await Attendance.countDocuments({ isCompleted: true });
    const pendingSessions = await Attendance.countDocuments({ isCompleted: false });
    const lockedSessions = await Attendance.countDocuments({ isLocked: true });

    // Today's pending sessions
    const todaysPending = await Attendance.find({
      'session.date': { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      isCompleted: false
    })
    .populate('group', 'name code')
    .populate('teacher', 'fullName')
    .populate('subject', 'name')
    .limit(10)
    .sort('session.date');

    // Recent sessions (last 7 days)
    const recentSessions = await Attendance.find({
      'session.date': { $gte: weekAgo }
    }).populate('group teacher subject records.student');

    // Calculate overall attendance rate
    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    recentSessions.forEach(session => {
      session.records.forEach(record => {
        totalStudents++;
        if (record.status === 'present') totalPresent++;
        else if (record.status === 'absent') totalAbsent++;
        else if (record.status === 'late') totalLate++;
        else if (record.status === 'excused') totalExcused++;
      });
    });

    const overallRate = totalStudents > 0 ? Math.round(((totalPresent + totalLate) / totalStudents) * 100) : 0;

    // Attendance trends (daily for last 7 days)
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySessions = await Attendance.find({
        'session.date': { $gte: date, $lt: nextDate }
      });

      let dayTotal = 0;
      let dayPresent = 0;
      daySessions.forEach(session => {
        session.records.forEach(record => {
          dayTotal++;
          if (record.status === 'present' || record.status === 'late') dayPresent++;
        });
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        rate: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0,
        sessions: daySessions.length,
        students: dayTotal
      });
    }

    // Top performing groups (last 30 days)
    const groupStats = await Attendance.aggregate([
      {
        $match: {
          'session.date': { $gte: monthAgo }
        }
      },
      {
        $unwind: '$records'
      },
      {
        $group: {
          _id: '$group',
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$records.status', 'present'] },
                  { $eq: ['$records.status', 'late'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          rate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalRecords'] },
              100
            ]
          }
        }
      },
      {
        $sort: { rate: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Populate group details
    const Group = require('../models/Group');
    for (let stat of groupStats) {
      const group = await Group.findById(stat._id).populate({
        path: 'course',
        populate: [
          { path: 'teacher', select: 'fullName email' },
          { path: 'subject', select: 'name code' }
        ]
      });
      stat.group = group;
    }

    // Students at risk (< 70% attendance rate in last 30 days)
    const studentStats = await Attendance.aggregate([
      {
        $match: {
          'session.date': { $gte: monthAgo }
        }
      },
      {
        $unwind: '$records'
      },
      {
        $group: {
          _id: '$records.student',
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$records.status', 'present'] },
                  { $eq: ['$records.status', 'late'] }
                ]},
                1,
                0
              ]
            }
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          rate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalRecords'] },
              100
            ]
          }
        }
      },
      {
        $match: {
          rate: { $lt: 70 },
          totalRecords: { $gte: 3 } // At least 3 sessions
        }
      },
      {
        $sort: { rate: 1 }
      },
      {
        $limit: 10
      }
    ]);

    // Populate student details
    const User = require('../models/User');
    for (let stat of studentStats) {
      const student = await User.findById(stat._id).select('fullName email academicInfo');
      stat.student = student;
    }

    // Week-over-week comparison
    const thisWeekSessions = await Attendance.find({
      'session.date': { $gte: weekAgo }
    });
    const lastWeekStart = new Date(weekAgo);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekSessions = await Attendance.find({
      'session.date': { $gte: lastWeekStart, $lt: weekAgo }
    });

    let thisWeekTotal = 0, thisWeekPresent = 0;
    let lastWeekTotal = 0, lastWeekPresent = 0;

    thisWeekSessions.forEach(session => {
      session.records.forEach(record => {
        thisWeekTotal++;
        if (record.status === 'present' || record.status === 'late') thisWeekPresent++;
      });
    });

    lastWeekSessions.forEach(session => {
      session.records.forEach(record => {
        lastWeekTotal++;
        if (record.status === 'present' || record.status === 'late') lastWeekPresent++;
      });
    });

    const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekPresent / thisWeekTotal) * 100) : 0;
    const lastWeekRate = lastWeekTotal > 0 ? Math.round((lastWeekPresent / lastWeekTotal) * 100) : 0;
    const weekChange = thisWeekRate - lastWeekRate;

    // Month-over-month comparison
    const thisMonthSessions = await Attendance.find({
      'session.date': { $gte: monthAgo }
    });
    const lastMonthSessions = await Attendance.find({
      'session.date': { $gte: twoMonthsAgo, $lt: monthAgo }
    });

    let thisMonthTotal = 0, thisMonthPresent = 0;
    let lastMonthTotal = 0, lastMonthPresent = 0;

    thisMonthSessions.forEach(session => {
      session.records.forEach(record => {
        thisMonthTotal++;
        if (record.status === 'present' || record.status === 'late') thisMonthPresent++;
      });
    });

    lastMonthSessions.forEach(session => {
      session.records.forEach(record => {
        lastMonthTotal++;
        if (record.status === 'present' || record.status === 'late') lastMonthPresent++;
      });
    });

    const thisMonthRate = thisMonthTotal > 0 ? Math.round((thisMonthPresent / thisMonthTotal) * 100) : 0;
    const lastMonthRate = lastMonthTotal > 0 ? Math.round((lastMonthPresent / lastMonthTotal) * 100) : 0;
    const monthChange = thisMonthRate - lastMonthRate;

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          completedSessions,
          pendingSessions,
          lockedSessions,
          overallRate,
          totalStudents,
          totalPresent,
          totalAbsent,
          totalLate,
          totalExcused
        },
        trends,
        comparisons: {
          weekOverWeek: {
            thisWeek: thisWeekRate,
            lastWeek: lastWeekRate,
            change: weekChange,
            changePercent: lastWeekRate > 0 ? Math.round((weekChange / lastWeekRate) * 100) : 0
          },
          monthOverMonth: {
            thisMonth: thisMonthRate,
            lastMonth: lastMonthRate,
            change: monthChange,
            changePercent: lastMonthRate > 0 ? Math.round((monthChange / lastMonthRate) * 100) : 0
          }
        },
        topGroups: groupStats.map(stat => ({
          group: stat.group,
          rate: Math.round(stat.rate),
          totalRecords: stat.totalRecords,
          presentCount: stat.presentCount
        })),
        studentsAtRisk: studentStats.map(stat => ({
          student: stat.student,
          rate: Math.round(stat.rate),
          totalRecords: stat.totalRecords,
          presentCount: stat.presentCount,
          absentCount: stat.absentCount
        })),
        todaysPending: todaysPending.map(session => ({
          _id: session._id,
          code: session.code,
          group: session.group,
          teacher: session.teacher,
          subject: session.subject,
          sessionDate: session.session.date,
          studentCount: session.records.length
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ message: 'Error deleting attendance record', error: error.message });
  }
});

// ============================================
// STUDENT-SPECIFIC ATTENDANCE ENDPOINTS
// ============================================

// GET /api/attendance/my-records - Student's attendance records
router.get('/my-records', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { page = 1, limit = 20, groupId, dateFrom, dateTo, status } = req.query;

    // Build query
    const query = { 'records.student': req.user._id };
    if (groupId) query.group = groupId;
    if (dateFrom || dateTo) {
      query['session.date'] = {};
      if (dateFrom) query['session.date'].$gte = new Date(dateFrom);
      if (dateTo) query['session.date'].$lte = new Date(dateTo);
    }

    const attendance = await Attendance.find(query)
      .populate('group', 'name code')
      .populate({
        path: 'group',
        populate: {
          path: 'course',
          select: 'name',
          populate: { path: 'subject', select: 'name' }
        }
      })
      .sort({ 'session.date': -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .lean();

    // Extract student's records
    const myRecords = attendance.map(att => {
      const myRecord = att.records.find(r => r.student.toString() === req.user._id.toString());
      return {
        _id: att._id,
        group: att.group,
        sessionDate: att.session.date,
        scheduleIndex: att.session.scheduleIndex,
        status: myRecord?.status || 'N/A',
        minutesLate: myRecord?.minutesLate,
        notes: myRecord?.notes,
        markedAt: att.markedAt
      };
    }).filter(r => !status || r.status === status);

    const total = await Attendance.countDocuments(query);

    // Calculate statistics
    const allRecords = await Attendance.find({ 'records.student': req.user._id })
      .select('records')
      .lean();
    
    const myStatuses = allRecords.flatMap(att => 
      att.records.filter(r => r.student.toString() === req.user._id.toString()).map(r => r.status)
    );

    const stats = {
      total: myStatuses.length,
      present: myStatuses.filter(s => s === 'present').length,
      absent: myStatuses.filter(s => s === 'absent').length,
      late: myStatuses.filter(s => s === 'late').length,
      excused: myStatuses.filter(s => s === 'excused').length,
      rate: myStatuses.length > 0 
        ? Math.round(((myStatuses.filter(s => s === 'present' || s === 'late').length) / myStatuses.length) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        records: myRecords,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance records:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance records', error: error.message });
  }
});

// GET /api/attendance/my-schedule - Student's weekly schedule from enrolled groups
router.get('/my-schedule', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const User = require('../models/User');
    const student = await User.findById(req.user._id)
      .populate({
        path: 'academicInfo.groups',
        populate: [
          {
            path: 'course',
            populate: [
              { path: 'subject', select: 'name' },
              { path: 'teacher', select: 'firstName lastName fullName' }
            ]
          }
        ]
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Extract schedule from all enrolled groups
    const schedule = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };

    student.academicInfo.groups.forEach(group => {
      if (group.schedule && group.schedule.length > 0) {
        group.schedule.forEach(session => {
          schedule[session.day].push({
            groupId: group._id,
            groupName: group.name,
            groupCode: group.code,
            subject: group.course?.subject?.name || 'N/A',
            teacher: group.course?.teacher?.fullName || 'N/A',
            startTime: session.startTime,
            endTime: session.endTime
          });
        });
      }
    });

    // Sort each day by start time
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({ success: false, message: 'Error fetching schedule', error: error.message });
  }
});

// GET /api/attendance/today-sessions - Student's sessions for today
router.get('/today-sessions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const User = require('../models/User');
    const student = await User.findById(req.user._id)
      .populate({
        path: 'academicInfo.groups',
        populate: [
          {
            path: 'course',
            populate: [
              { path: 'subject', select: 'name' },
              { path: 'teacher', select: 'firstName lastName fullName' }
            ]
          }
        ]
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get current day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Get today's sessions
    const todaySessions = [];
    
    student.academicInfo.groups.forEach(group => {
      if (group.schedule && group.schedule.length > 0) {
        group.schedule.forEach(session => {
          if (session.day === today) {
            todaySessions.push({
              groupId: group._id,
              groupName: group.name,
              groupCode: group.code,
              subject: group.course?.subject?.name || 'N/A',
              teacher: group.course?.teacher?.fullName || 'N/A',
              startTime: session.startTime,
              endTime: session.endTime
            });
          }
        });
      }
    });

    // Sort by start time
    todaySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Check attendance status for today's sessions
    const groupIds = todaySessions.map(s => s.groupId);
    const todayAttendance = await Attendance.find({
      group: { $in: groupIds },
      'session.date': { $gte: todayStart, $lte: todayEnd },
      'records.student': req.user._id
    }).select('group records').lean();

    // Add attendance status to sessions
    const sessionsWithStatus = todaySessions.map(session => {
      const attendanceRecord = todayAttendance.find(att => 
        att.group.toString() === session.groupId.toString()
      );
      
      let status = 'pending';
      if (attendanceRecord) {
        const myRecord = attendanceRecord.records.find(r => 
          r.student.toString() === req.user._id.toString()
        );
        status = myRecord ? myRecord.status : 'pending';
      }

      return {
        ...session,
        attendanceStatus: status
      };
    });

    res.json({
      success: true,
      data: {
        date: new Date().toISOString(),
        dayOfWeek: today,
        sessions: sessionsWithStatus,
        totalSessions: sessionsWithStatus.length
      }
    });
  } catch (error) {
    console.error('Error fetching today sessions:', error);
    res.status(500).json({ success: false, message: 'Error fetching today sessions', error: error.message });
  }
});

// ============================================
// TEACHER-SPECIFIC ATTENDANCE ENDPOINTS
// ============================================

// GET /api/attendance/my-teaching-schedule - Teacher's weekly teaching schedule
router.get('/my-teaching-schedule', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const Course = require('../models/Course');
    
    // Get teacher's courses
    const courses = await Course.find({ teacher: req.user._id, isActive: true })
      .populate('subject', 'name')
      .populate('groups', 'name code schedule students')
      .lean();

    // Extract schedule from all groups
    const schedule = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };

    courses.forEach(course => {
      if (course.groups && course.groups.length > 0) {
        course.groups.forEach(group => {
          if (group.schedule && group.schedule.length > 0) {
            group.schedule.forEach(session => {
              schedule[session.day].push({
                groupId: group._id,
                groupName: group.name,
                groupCode: group.code,
                subject: course.subject?.name || 'N/A',
                courseId: course._id,
                courseName: course.name,
                startTime: session.startTime,
                endTime: session.endTime,
                studentsCount: group.students.filter(s => s.status === 'active').length
              });
            });
          }
        });
      }
    });

    // Sort each day by start time
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ success: false, message: 'Error fetching schedule', error: error.message });
  }
});

// GET /api/attendance/today-teaching-sessions - Teacher's sessions for today
router.get('/today-teaching-sessions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const Course = require('../models/Course');
    
    // Get current day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Get teacher's courses
    const courses = await Course.find({ teacher: req.user._id, isActive: true })
      .populate('subject', 'name')
      .populate('groups', 'name code schedule students')
      .lean();

    // Get today's sessions
    const todaySessions = [];
    
    courses.forEach(course => {
      if (course.groups && course.groups.length > 0) {
        course.groups.forEach(group => {
          if (group.schedule && group.schedule.length > 0) {
            group.schedule.forEach(session => {
              if (session.day === today) {
                todaySessions.push({
                  groupId: group._id,
                  groupName: group.name,
                  groupCode: group.code,
                  subject: course.subject?.name || 'N/A',
                  courseId: course._id,
                  courseName: course.name,
                  startTime: session.startTime,
                  endTime: session.endTime,
                  studentsCount: group.students.filter(s => s.status === 'active').length
                });
              }
            });
          }
        });
      }
    });

    // Sort by start time
    todaySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Check attendance status for today's sessions
    const groupIds = todaySessions.map(s => s.groupId);
    const todayAttendance = await Attendance.find({
      group: { $in: groupIds },
      'session.date': { $gte: todayStart, $lte: todayEnd }
    }).select('group isCompleted records').lean();

    // Add attendance status to sessions
    const sessionsWithStatus = todaySessions.map(session => {
      const attendanceRecord = todayAttendance.find(att => 
        att.group.toString() === session.groupId.toString()
      );
      
      let status = 'pending';
      let attendanceId = null;
      let recordedCount = 0;

      if (attendanceRecord) {
        status = attendanceRecord.isCompleted ? 'completed' : 'in_progress';
        attendanceId = attendanceRecord._id;
        recordedCount = attendanceRecord.records.length;
      }

      return {
        ...session,
        attendanceStatus: status,
        attendanceId,
        recordedStudents: recordedCount
      };
    });

    res.json({
      success: true,
      data: {
        date: new Date().toISOString(),
        dayOfWeek: today,
        sessions: sessionsWithStatus,
        totalSessions: sessionsWithStatus.length,
        pendingSessions: sessionsWithStatus.filter(s => s.attendanceStatus === 'pending').length
      }
    });
  } catch (error) {
    console.error('Error fetching today teaching sessions:', error);
    res.status(500).json({ success: false, message: 'Error fetching today sessions', error: error.message });
  }
});

module.exports = router;