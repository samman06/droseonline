const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Group = require('../models/Group');
const Announcement = require('../models/Announcement');
const { authenticate } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Calendar Routes
 * Provides unified calendar view for students and teachers
 * Aggregates assignments, quizzes, group sessions, and announcements
 */

// GET /api/calendar/my-calendar - Get all calendar events for current user
router.get('/my-calendar', authenticate, asyncHandler(async (req, res) => {
  const { month, year, view = 'month', type } = req.query;
  const user = req.user;
  
  // Calculate date range
  let startDate, endDate;
  const now = new Date();
  const currentYear = year ? parseInt(year) : now.getFullYear();
  const currentMonth = month ? parseInt(month) - 1 : now.getMonth(); // 0-indexed
  
  if (view === 'month') {
    // First day of month to last day of month
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  } else if (view === 'week') {
    // Current week (Sunday to Saturday)
    const today = new Date(currentYear, currentMonth, now.getDate());
    const dayOfWeek = today.getDay();
    startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (view === 'day') {
    // Single day
    startDate = new Date(currentYear, currentMonth, now.getDate());
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default: current month
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  }

  const events = [];

  // Get user's groups
  let userGroups = [];
  if (user.role === 'student') {
    const groups = await Group.find({
      'students.student': user._id,
      'students.status': 'active'
    }).select('_id name code course schedule');
    userGroups = groups;
  } else if (user.role === 'teacher') {
    // For teachers, first get their courses, then find groups for those courses
    const Course = require('../models/Course');
    const teacherCourses = await Course.find({ teacher: user._id }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);
    
    const groups = await Group.find({
      course: { $in: courseIds }
    }).populate('course', 'name').select('_id name code course schedule');
    userGroups = groups;
  } else if (user.role === 'admin') {
    // Admin sees all groups (or we can limit this)
    const groups = await Group.find({}).populate('course', 'name').select('_id name code course schedule').limit(100);
    userGroups = groups;
  }

  const groupIds = userGroups.map(g => g._id);

  // 1. Get Assignments/Quizzes
  if (!type || type === 'assignment' || type === 'quiz') {
    const assignmentQuery = {
      groups: { $in: groupIds },
      dueDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['published', 'closed'] }
    };

    if (type === 'assignment') {
      assignmentQuery.type = { $ne: 'quiz' };
    } else if (type === 'quiz') {
      assignmentQuery.type = 'quiz';
    }

    const assignments = await Assignment.find(assignmentQuery)
      .populate('course', 'name')
      .populate('groups', 'name code')
      .select('title code type dueDate maxPoints course groups status')
      .lean();

    assignments.forEach(assignment => {
      events.push({
        id: assignment._id,
        type: assignment.type === 'quiz' ? 'quiz' : 'assignment',
        title: assignment.title,
        description: `${assignment.type === 'quiz' ? 'Quiz' : 'Assignment'} - ${assignment.maxPoints} points`,
        date: assignment.dueDate,
        allDay: false,
        color: assignment.type === 'quiz' ? '#EF4444' : '#3B82F6', // red for quiz, blue for assignment
        course: assignment.course?.name,
        groups: assignment.groups?.map(g => g.name).join(', '),
        status: assignment.status,
        metadata: {
          code: assignment.code,
          maxPoints: assignment.maxPoints,
          assignmentType: assignment.type
        }
      });
    });
  }

  // 2. Get Group Sessions (from schedule)
  if (!type || type === 'session') {
    // Generate session events from group schedules within date range
    userGroups.forEach(group => {
      if (group.schedule && group.schedule.length > 0) {
        group.schedule.forEach(session => {
          // Generate occurrences for this session within the date range
          const occurrences = generateSessionOccurrences(
            session,
            startDate,
            endDate,
            group
          );
          events.push(...occurrences);
        });
      }
    });
  }

  // 3. Get Announcements
  if (!type || type === 'announcement') {
    const announcementQuery = {
      $or: [
        { audience: 'all' },
        { audience: user.role + 's' }, // 'students', 'teachers'
        { targetGroups: { $in: groupIds } }
      ],
      publishAt: { $lte: endDate },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: startDate } }
      ],
      isPublished: true
    };

    const announcements = await Announcement.find(announcementQuery)
      .populate('author', 'firstName lastName')
      .select('title type priority publishAt expiresAt author isPinned')
      .lean();

    announcements.forEach(announcement => {
      events.push({
        id: announcement._id,
        type: 'announcement',
        title: announcement.title,
        description: `${announcement.type} announcement${announcement.isPinned ? ' (Pinned)' : ''}`,
        date: announcement.publishAt,
        allDay: true,
        color: announcement.priority === 'urgent' ? '#DC2626' : '#FBBF24', // red for urgent, yellow for others
        priority: announcement.priority,
        author: `${announcement.author?.firstName} ${announcement.author?.lastName}`,
        metadata: {
          type: announcement.type,
          isPinned: announcement.isPinned,
          expiresAt: announcement.expiresAt
        }
      });
    });
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group events by date for easier frontend rendering
  const eventsByDate = {};
  events.forEach(event => {
    const dateKey = new Date(event.date).toISOString().split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  res.json({
    success: true,
    data: {
      events,
      eventsByDate,
      dateRange: {
        start: startDate,
        end: endDate
      },
      stats: {
        total: events.length,
        assignments: events.filter(e => e.type === 'assignment').length,
        quizzes: events.filter(e => e.type === 'quiz').length,
        sessions: events.filter(e => e.type === 'session').length,
        announcements: events.filter(e => e.type === 'announcement').length
      }
    }
  });
}));

// GET /api/calendar/upcoming - Get upcoming events (next 7 days)
router.get('/upcoming', authenticate, asyncHandler(async (req, res) => {
  const user = req.user;
  const limit = parseInt(req.query.limit) || 10;
  
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + 7);

  // Get user's groups
  let groupIds = [];
  if (user.role === 'student') {
    const groups = await Group.find({
      'students.student': user._id,
      'students.status': 'active'
    }).select('_id');
    groupIds = groups.map(g => g._id);
  } else if (user.role === 'teacher') {
    // For teachers, first get their courses, then find groups for those courses
    const Course = require('../models/Course');
    const teacherCourses = await Course.find({ teacher: user._id }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);
    
    const groups = await Group.find({
      course: { $in: courseIds }
    }).select('_id');
    groupIds = groups.map(g => g._id);
  }

  const events = [];

  // Get upcoming assignments
  const assignments = await Assignment.find({
    groups: { $in: groupIds },
    dueDate: { $gte: now, $lte: futureDate },
    status: 'published'
  })
    .populate('course', 'name')
    .sort('dueDate')
    .limit(limit)
    .lean();

  assignments.forEach(assignment => {
    events.push({
      id: assignment._id,
      type: assignment.type === 'quiz' ? 'quiz' : 'assignment',
      title: assignment.title,
      date: assignment.dueDate,
      course: assignment.course?.name,
      daysUntil: Math.ceil((new Date(assignment.dueDate) - now) / (1000 * 60 * 60 * 24))
    });
  });

  // Sort by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json({
    success: true,
    data: events
  });
}));

// Helper function to generate session occurrences
function generateSessionOccurrences(session, startDate, endDate, group) {
  const occurrences = [];
  const dayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };

  const sessionDayOfWeek = dayMap[session.day.toLowerCase()];
  if (sessionDayOfWeek === undefined) return occurrences;

  // Find first occurrence of this day within range
  let currentDate = new Date(startDate);
  while (currentDate.getDay() !== sessionDayOfWeek && currentDate <= endDate) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Generate all occurrences of this day within range
  while (currentDate <= endDate) {
    const sessionDate = new Date(currentDate);
    const [startHour, startMinute] = session.startTime.split(':').map(Number);
    const [endHour, endMinute] = session.endTime.split(':').map(Number);
    
    sessionDate.setHours(startHour, startMinute, 0, 0);

    occurrences.push({
      id: `${group._id}_${session.day}_${sessionDate.getTime()}`,
      type: 'session',
      title: `${group.name} - Class Session`,
      description: `${session.startTime} - ${session.endTime}${session.room ? ` • Room ${session.room}` : ''}`,
      date: sessionDate,
      allDay: false,
      color: '#10B981', // green for sessions
      course: group.course?.name,
      group: group.name,
      metadata: {
        groupId: group._id,
        groupCode: group.code,
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        room: session.room,
        duration: calculateDuration(session.startTime, session.endTime)
      }
    });

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return occurrences;
}

// Helper function to calculate duration in minutes
function calculateDuration(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
}

module.exports = router;

