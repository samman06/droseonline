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

    // Get all active groups
    const groups = await Group.find({ isActive: true })
      .populate('teacher', 'fullName email')
      .populate('subject', 'name code')
      .populate('students.student', 'fullName');

    console.log(`📊 Found ${groups.length} active groups`);

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
        gradeLevel: group.gradeLevel,
        teacher: group.teacher,
        subject: group.subject,
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

    // Verify group exists
    const group = await Group.findById(groupId).populate('students');
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
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
      teacher: group.teacher,
      subject: group.subject,
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
      const group = await Group.findById(stat._id).populate('course');
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

module.exports = router;