const Notification = require('../models/Notification');

/**
 * Notification Helper
 * Centralized utility for creating notifications across the system
 */

/**
 * Create a single notification
 */
async function createNotification(data) {
  try {
    const notification = await Notification.createNotification(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create bulk notifications for multiple users
 */
async function createBulkNotifications(recipients, notificationData) {
  try {
    const notifications = await Notification.createBulkNotifications(recipients, notificationData);
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Notification: New Announcement Created
 */
async function notifyNewAnnouncement(announcement, recipients) {
  const notificationData = {
    type: 'announcement',
    title: '📢 New Announcement',
    message: announcement.title,
    priority: announcement.priority === 'urgent' ? 'urgent' : announcement.priority === 'high' ? 'high' : 'normal',
    relatedEntity: {
      entityType: 'announcement',
      entityId: announcement._id
    },
    actionUrl: `/dashboard/announcements/${announcement._id}`,
    sender: announcement.author,
    icon: 'megaphone',
    color: announcement.priority === 'urgent' ? 'red' : announcement.priority === 'high' ? 'orange' : 'blue'
  };

  return await createBulkNotifications(recipients, notificationData);
}

/**
 * Notification: New Assignment Posted
 */
async function notifyNewAssignment(assignment, groupStudents) {
  const notificationData = {
    type: 'assignment',
    title: '📝 New Assignment',
    message: `New assignment: "${assignment.title}"`,
    priority: assignment.priority || 'normal',
    relatedEntity: {
      entityType: 'assignment',
      entityId: assignment._id
    },
    actionUrl: `/dashboard/assignments/${assignment._id}`,
    sender: assignment.createdBy,
    icon: 'clipboard',
    color: 'purple'
  };

  return await createBulkNotifications(groupStudents, notificationData);
}

/**
 * Notification: Assignment Graded
 */
async function notifyAssignmentGraded(student, assignment, grade) {
  const notificationData = {
    recipient: student,
    type: 'grade',
    title: '⭐ Assignment Graded',
    message: `Your assignment "${assignment.title}" has been graded. Score: ${grade.score}/${assignment.totalPoints}`,
    priority: 'normal',
    relatedEntity: {
      entityType: 'assignment',
      entityId: assignment._id
    },
    actionUrl: `/dashboard/assignments/${assignment._id}`,
    icon: 'star',
    color: 'yellow',
    metadata: {
      score: grade.score,
      maxScore: assignment.totalPoints
    }
  };

  return await createNotification(notificationData);
}

/**
 * Notification: Attendance Marked
 */
async function notifyAttendanceMarked(student, attendance, status) {
  const statusColors = {
    present: 'green',
    absent: 'red',
    late: 'yellow',
    excused: 'blue'
  };

  const statusIcons = {
    present: '✓',
    absent: '✗',
    late: '⏱',
    excused: '📋'
  };

  const notificationData = {
    recipient: student,
    type: 'attendance',
    title: '📋 Attendance Marked',
    message: `Your attendance has been marked as ${status.toUpperCase()}`,
    priority: status === 'absent' ? 'high' : 'normal',
    relatedEntity: {
      entityType: 'attendance',
      entityId: attendance._id
    },
    actionUrl: '/dashboard/attendance',
    icon: statusIcons[status] || 'clipboard',
    color: statusColors[status] || 'blue',
    metadata: {
      status: status,
      date: attendance.session.date
    }
  };

  return await createNotification(notificationData);
}

/**
 * Notification: New Comment on Assignment/Announcement
 */
async function notifyNewComment(entityType, entityId, commenter, recipientUserId, entityTitle) {
  const notificationData = {
    recipient: recipientUserId,
    type: 'comment',
    title: '💬 New Comment',
    message: `${commenter.firstName} ${commenter.lastName} commented on "${entityTitle}"`,
    priority: 'normal',
    relatedEntity: {
      entityType: entityType,
      entityId: entityId
    },
    actionUrl: entityType === 'announcement' 
      ? `/dashboard/announcements/${entityId}` 
      : `/dashboard/assignments/${entityId}`,
    sender: commenter._id,
    icon: 'chat',
    color: 'blue'
  };

  return await createNotification(notificationData);
}

/**
 * Notification: Joined Group
 */
async function notifyGroupJoined(student, group, course) {
  const notificationData = {
    recipient: student,
    type: 'group',
    title: '👥 Joined Group',
    message: `You have successfully joined ${group.name}`,
    priority: 'normal',
    relatedEntity: {
      entityType: 'group',
      entityId: group._id
    },
    actionUrl: `/dashboard/groups/${group._id}`,
    icon: 'users',
    color: 'green',
    metadata: {
      groupName: group.name,
      courseName: course?.name
    }
  };

  return await createNotification(notificationData);
}

/**
 * Notification: Left Group
 */
async function notifyGroupLeft(student, group) {
  const notificationData = {
    recipient: student,
    type: 'group',
    title: '👥 Left Group',
    message: `You have left ${group.name}`,
    priority: 'normal',
    relatedEntity: {
      entityType: 'group',
      entityId: group._id
    },
    actionUrl: '/dashboard/browse-teachers',
    icon: 'users',
    color: 'gray'
  };

  return await createNotification(notificationData);
}

/**
 * Notification: Assignment Deadline Reminder (for cron/scheduled tasks)
 */
async function notifyAssignmentDeadline(students, assignment, hoursUntilDeadline) {
  const notificationData = {
    type: 'assignment',
    title: '⏰ Assignment Due Soon',
    message: `"${assignment.title}" is due in ${hoursUntilDeadline} hours`,
    priority: hoursUntilDeadline <= 24 ? 'high' : 'normal',
    relatedEntity: {
      entityType: 'assignment',
      entityId: assignment._id
    },
    actionUrl: `/dashboard/assignments/${assignment._id}`,
    icon: 'clock',
    color: hoursUntilDeadline <= 24 ? 'red' : 'yellow'
  };

  return await createBulkNotifications(students, notificationData);
}

/**
 * Notification: Welcome New User
 */
async function notifyWelcome(userId, userRole) {
  const roleMessages = {
    student: 'Welcome to Drose Online! Browse teachers to join groups and start learning.',
    teacher: 'Welcome to Drose Online! Start creating courses and managing your students.',
    admin: 'Welcome to Drose Online! You have full system access.'
  };

  const notificationData = {
    recipient: userId,
    type: 'system',
    title: '👋 Welcome!',
    message: roleMessages[userRole] || 'Welcome to Drose Online!',
    priority: 'normal',
    actionUrl: '/dashboard',
    icon: 'hand',
    color: 'blue'
  };

  return await createNotification(notificationData);
}

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyNewAnnouncement,
  notifyNewAssignment,
  notifyAssignmentGraded,
  notifyAttendanceMarked,
  notifyNewComment,
  notifyGroupJoined,
  notifyGroupLeft,
  notifyAssignmentDeadline,
  notifyWelcome
};

