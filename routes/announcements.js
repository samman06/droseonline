const express = require('express');
const Announcement = require('../models/Announcement');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, announcementSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/announcements
// @desc    Get announcements (filtered by user's audience)
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, priority, status } = req.query;
    
    let query = {
      status: 'published',
      publishAt: { $lte: new Date() },
      $or: [
        { expiresAt: { $gte: new Date() } },
        { expiresAt: null }
      ]
    };
    
    // Filter by user role and targeting
    const userRole = req.user.role;
    query.$or = [
      { audience: 'all' },
      { audience: userRole + 's' }, // students, teachers, admins
      { targetUsers: req.user._id }
    ];

    // If student, also check for group/course targeting
    if (userRole === 'student') {
      const User = require('../models/User');
      const student = await User.findById(req.user._id).populate('academicInfo.groups');
      const groupIds = student.academicInfo.groups.map(g => g._id);
      
      const Course = require('../models/Course');
      const courses = await Course.find({ groups: { $in: groupIds } });
      const courseIds = courses.map(c => c._id);
      
      query.$or.push(
        { audience: 'specific_groups', targetGroups: { $in: groupIds } },
        { audience: 'specific_courses', targetCourses: { $in: courseIds } }
      );
    }
    
    // Apply additional filters
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status && req.user.role === 'admin') query.status = status;

    const announcements = await Announcement.find(query)
      .populate('author', 'firstName lastName fullName role')
      .populate('targetGroups', 'name code')
      .populate('targetCourses', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ isPinned: -1, priority: -1, publishAt: -1 });

    const total = await Announcement.countDocuments(query);

    // Mark announcements as read
    for (const announcement of announcements) {
      await announcement.markAsRead(req.user._id, req.ip);
    }

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements'
    });
  }
});

// @route   POST /api/announcements
// @desc    Create new announcement
// @access  Private (Admin/Teacher)
router.post('/', authenticate, authorize('admin', 'teacher'), validate(announcementSchema), async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      author: req.user._id
    };

    const announcement = new Announcement(announcementData);
    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'firstName lastName fullName')
      .populate('targetGroups', 'name code')
      .populate('targetCourses', 'name code');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement: populatedAnnouncement }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating announcement'
    });
  }
});

module.exports = router;
