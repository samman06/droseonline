const express = require('express');
const Announcement = require('../models/Announcement');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, announcementSchema, paginationSchema } = require('../middleware/validation');
const { notifyNewAnnouncement, notifyNewComment } = require('../utils/notificationHelper');
const User = require('../models/User');
const Group = require('../models/Group');
const Course = require('../models/Course');

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
      .populate('author', 'firstName lastName fullName role avatar email')
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

// @route   GET /api/announcements/:id
// @desc    Get single announcement details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'firstName lastName fullName role avatar email')
      .populate('targetGroups', 'name code')
      .populate('targetCourses', 'name code')
      .populate({
        path: 'comments.user',
        select: 'firstName lastName fullName avatar email'
      })
      .populate({
        path: 'comments.replies.user',
        select: 'firstName lastName fullName avatar email'
      });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user has access to this announcement
    const userRole = req.user.role;
    const canView = await checkAnnouncementAccess(announcement, req.user);

    if (!canView && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this announcement'
      });
    }

    // Mark as read
    await announcement.markAsRead(req.user._id, req.ip);

    res.json({
      success: true,
      data: { announcement }
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcement'
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
      .populate('author', 'firstName lastName fullName role avatar email')
      .populate('targetGroups', 'name code')
      .populate('targetCourses', 'name code');

    // Send notifications to target audience
    try {
      const recipients = await getAnnouncementRecipients(populatedAnnouncement);
      if (recipients.length > 0) {
        await notifyNewAnnouncement(populatedAnnouncement, recipients);
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notifications fail
    }

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

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (Admin or Author)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check permissions: admin or author
    if (req.user.role !== 'admin' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this announcement'
      });
    }

    // Update fields
    const updateFields = [
      'title', 'content', 'summary', 'type', 'priority', 'audience',
      'targetGroups', 'targetCourses', 'targetUsers', 'publishAt', 'expiresAt',
      'status', 'isUrgent', 'isPinned', 'allowComments', 'tags',
      'eventDetails', 'notificationSettings'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        announcement[field] = req.body[field];
      }
    });

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'firstName lastName fullName role avatar email')
      .populate('targetGroups', 'name code')
      .populate('targetCourses', 'name code');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement: updatedAnnouncement }
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating announcement'
    });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (Admin or Author)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check permissions: admin or author
    if (req.user.role !== 'admin' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this announcement'
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting announcement'
    });
  }
});

// @route   POST /api/announcements/:id/comment
// @desc    Add comment to announcement
// @access  Private
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (!announcement.allowComments) {
      return res.status(403).json({
        success: false,
        message: 'Comments are not allowed on this announcement'
      });
    }

    await announcement.addComment(req.user._id, content);

    const updatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', '_id')
      .populate({
        path: 'comments.user',
        select: 'firstName lastName fullName avatar email'
      });

    // Notify announcement author (if commenter is not the author)
    if (updatedAnnouncement.author._id.toString() !== req.user._id.toString()) {
      try {
        await notifyNewComment(
          'announcement',
          announcement._id,
          req.user,
          updatedAnnouncement.author._id,
          announcement.title
        );
      } catch (notifError) {
        console.error('Error sending comment notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: { announcement: updatedAnnouncement }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// @route   POST /api/announcements/:id/like
// @desc    Toggle like on announcement
// @access  Private
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await announcement.toggleLike(req.user._id);

    res.json({
      success: true,
      message: 'Like toggled successfully',
      data: { 
        likes: announcement.stats.likes,
        isLiked: announcement.likes.some(like => like.user.toString() === req.user._id.toString())
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
});

// Helper function to check announcement access
async function checkAnnouncementAccess(announcement, user) {
  // Published announcements are accessible if:
  // 1. User role matches audience
  // 2. User is in targetUsers
  // 3. User is in a group that's targeted
  // 4. User is in a course that's targeted

  if (announcement.status !== 'published') {
    // Only author and admin can see non-published
    return announcement.author.toString() === user._id.toString() || user.role === 'admin';
  }

  // Check audience
  if (announcement.audience === 'all') return true;
  if (announcement.audience === 'students' && user.role === 'student') return true;
  if (announcement.audience === 'teachers' && user.role === 'teacher') return true;
  if (announcement.audience === 'admins' && user.role === 'admin') return true;

  // Check specific targeting
  if (announcement.targetUsers && announcement.targetUsers.some(u => u.toString() === user._id.toString())) {
    return true;
  }

  // Check groups (for students)
  if (user.role === 'student' && announcement.targetGroups && announcement.targetGroups.length > 0) {
    const User = require('../models/User');
    const student = await User.findById(user._id).populate('academicInfo.groups');
    const userGroupIds = student.academicInfo.groups.map(g => g._id.toString());
    const targetGroupIds = announcement.targetGroups.map(g => g._id.toString());
    if (userGroupIds.some(gid => targetGroupIds.includes(gid))) {
      return true;
    }
  }

  return false;
}

// Helper function to get announcement recipients for notifications
async function getAnnouncementRecipients(announcement) {
  const recipients = [];

  try {
    // If status is not published, no notifications
    if (announcement.status !== 'published') {
      return [];
    }

    // Based on audience
    if (announcement.audience === 'all') {
      const allUsers = await User.find({ isActive: true }).select('_id');
      return allUsers.map(u => u._id);
    }

    if (announcement.audience === 'students') {
      const students = await User.find({ role: 'student', isActive: true }).select('_id');
      return students.map(u => u._id);
    }

    if (announcement.audience === 'teachers') {
      const teachers = await User.find({ role: 'teacher', isActive: true }).select('_id');
      return teachers.map(u => u._id);
    }

    if (announcement.audience === 'admins') {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      return admins.map(u => u._id);
    }

    // For specific targeting
    if (announcement.audience === 'specific') {
      // Add targetUsers
      if (announcement.targetUsers && announcement.targetUsers.length > 0) {
        recipients.push(...announcement.targetUsers.map(u => u._id || u));
      }

      // Add students from targetGroups
      if (announcement.targetGroups && announcement.targetGroups.length > 0) {
        const groupIds = announcement.targetGroups.map(g => g._id || g);
        const studentsInGroups = await User.find({
          role: 'student',
          'academicInfo.groups': { $in: groupIds }
        }).select('_id');
        recipients.push(...studentsInGroups.map(s => s._id));
      }

      // Add students/teachers from targetCourses
      if (announcement.targetCourses && announcement.targetCourses.length > 0) {
        const courseIds = announcement.targetCourses.map(c => c._id || c);
        
        // Get groups from these courses
        const groups = await Group.find({ course: { $in: courseIds } }).select('_id');
        const groupIds = groups.map(g => g._id);
        
        // Get students from these groups
        const studentsInCourses = await User.find({
          role: 'student',
          'academicInfo.groups': { $in: groupIds }
        }).select('_id');
        recipients.push(...studentsInCourses.map(s => s._id));

        // Get teachers for these courses
        const courses = await Course.find({ _id: { $in: courseIds } }).populate('teacher');
        courses.forEach(course => {
          if (course.teacher && course.teacher._id) {
            recipients.push(course.teacher._id);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error getting announcement recipients:', error);
  }

  // Remove duplicates
  return [...new Set(recipients.map(id => id.toString()))];
}

module.exports = router;
