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
  groupId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  teacherId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  subjectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  studentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  isCompleted: Joi.string().valid('true', 'false', '').optional().allow('')
});

// GET /api/attendance - List all attendance records with filters
router.get('/', authenticate, validation.validateQuery(attendanceQuerySchema), async (req, res) => {
  try {
    const { page, limit, sort, groupId, teacherId, subjectId, studentId, dateFrom, dateTo, isCompleted } = req.query;

    const query = {};

    if (groupId) query.group = groupId;
    if (teacherId) query.teacher = teacherId;
    if (subjectId) query.subject = subjectId;
    if (studentId) query['records.student'] = studentId;
    if (isCompleted !== undefined && isCompleted !== '') query.isCompleted = isCompleted === 'true';

    // Date range filter
    if (dateFrom || dateTo) {
      query['session.date'] = {};
      if (dateFrom) query['session.date'].$gte = new Date(dateFrom);
      if (dateTo) query['session.date'].$lte = new Date(dateTo);
    }

    const sortOption = sort || '-session.date';
    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      Attendance.find(query)
        .populate('group', 'name')
        .populate('teacher', 'fullName')
        .populate('subject', 'name')
        .populate('records.student', 'fullName')
        .populate('createdBy', 'username')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    res.json({
      attendances,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
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
      .populate('teacher', 'fullName')
      .populate('subject', 'name');

    // Check which groups have sessions today based on schedule
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
    
    const groupsWithSessionToday = groups.filter(group => 
      group.schedule.some(s => s.day.toLowerCase() === dayOfWeek)
    );

    // Check which groups already have attendance marked for today
    const attendanceToday = await Attendance.find({
      'session.date': { $gte: today, $lt: tomorrow }
    }).select('group');

    const groupsWithAttendance = new Set(attendanceToday.map(a => a.group.toString()));

    // Filter groups that need attendance
    const pendingGroups = groupsWithSessionToday
      .filter(group => !groupsWithAttendance.has(group._id.toString()))
      .map(group => ({
        _id: group._id,
        name: group.name,
        teacher: group.teacher,
        subject: group.subject,
        schedule: group.schedule.filter(s => s.day.toLowerCase() === dayOfWeek)
      }));

    res.json({ pendingGroups, count: pendingGroups.length });
  } catch (error) {
    console.error('Error fetching pending attendance:', error);
    res.status(500).json({ message: 'Error fetching pending attendance', error: error.message });
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
      .populate('group', 'name')
      .populate('teacher', 'fullName')
      .populate('subject', 'name')
      .populate('records.student', 'fullName gradeLevel')
      .populate('createdBy', 'username');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance record', error: error.message });
  }
});

// POST /api/attendance - Create/mark attendance for a session
router.post('/', authenticate, validation.validate(createAttendanceSchema), async (req, res) => {
  try {
    const { groupId, sessionDate, scheduleIndex, records, sessionNotes, isCompleted } = req.body;

    // Verify group exists
    const group = await Group.findById(groupId).populate('students');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if attendance already exists for this group and date
    const existingAttendance = await Attendance.findOne({
      group: groupId,
      'session.date': new Date(sessionDate)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this session' });
    }

    // Build attendance records
    const attendanceRecords = records.map(record => ({
      student: record.studentId,
      status: record.status,
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
      { path: 'group', select: 'name' },
      { path: 'teacher', select: 'fullName' },
      { path: 'subject', select: 'name' },
      { path: 'records.student', select: 'fullName' },
      { path: 'createdBy', select: 'username' }
    ]);

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', authenticate, validation.validate(updateAttendanceSchema), async (req, res) => {
  try {
    const { records, sessionNotes, isCompleted } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Update records if provided
    if (records) {
      records.forEach(record => {
        const existingRecord = attendance.records.find(
          r => r.student.toString() === record.studentId
        );
        if (existingRecord) {
          existingRecord.status = record.status;
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
      { path: 'group', select: 'name' },
      { path: 'teacher', select: 'fullName' },
      { path: 'subject', select: 'name' },
      { path: 'records.student', select: 'fullName' },
      { path: 'createdBy', select: 'username' }
    ]);

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
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