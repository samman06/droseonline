const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
require('dotenv').config();

const notificationTypes = ['announcement', 'assignment', 'grade', 'attendance', 'comment', 'group', 'message', 'system'];
const priorities = ['low', 'normal', 'high', 'urgent'];
const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'gray'];

const notificationTemplates = [
  { type: 'announcement', title: '📢 New Announcement', message: 'Important announcement: School will be closed next Friday', priority: 'high', color: 'red' },
  { type: 'assignment', title: '📝 New Assignment Posted', message: 'Math homework Chapter 5 has been posted. Due date: Friday', priority: 'normal', color: 'blue' },
  { type: 'assignment', title: '📝 Assignment Due Soon', message: 'Your English essay is due in 24 hours', priority: 'high', color: 'yellow' },
  { type: 'grade', title: '⭐ Assignment Graded', message: 'Your Math Quiz has been graded. Score: 95/100', priority: 'normal', color: 'green' },
  { type: 'grade', title: '⭐ Excellent Performance', message: 'Congratulations! You scored 100/100 on the Science test', priority: 'normal', color: 'green' },
  { type: 'attendance', title: '📋 Attendance Marked', message: 'Your attendance has been marked as PRESENT for today\'s session', priority: 'normal', color: 'green' },
  { type: 'attendance', title: '📋 Attendance Alert', message: 'You were marked absent for Math class. Please contact your teacher', priority: 'high', color: 'red' },
  { type: 'attendance', title: '📋 Attendance Warning', message: 'Your attendance rate is below 80%. Please improve', priority: 'urgent', color: 'red' },
  { type: 'comment', title: '💬 New Comment', message: 'Your teacher commented on your assignment submission', priority: 'normal', color: 'blue' },
  { type: 'comment', title: '💬 Reply Received', message: 'Someone replied to your comment on the announcement', priority: 'normal', color: 'purple' },
  { type: 'group', title: '👥 Joined Group Successfully', message: 'You have successfully joined Mathematics - Grade 10A', priority: 'normal', color: 'green' },
  { type: 'group', title: '👥 Group Update', message: 'New schedule for Science group has been posted', priority: 'normal', color: 'blue' },
  { type: 'group', title: '👥 Group Invitation', message: 'You have been invited to join Advanced Physics group', priority: 'normal', color: 'purple' },
  { type: 'message', title: '✉️ New Message', message: 'You have received a new message from your teacher', priority: 'normal', color: 'blue' },
  { type: 'message', title: '✉️ Important Message', message: 'Urgent: Please check your email for important updates', priority: 'high', color: 'red' },
  { type: 'system', title: '⚙️ Welcome!', message: 'Welcome to Drose Online! Complete your profile to get started', priority: 'normal', color: 'blue' },
  { type: 'system', title: '⚙️ System Update', message: 'New features have been added to the platform. Check them out!', priority: 'low', color: 'gray' },
  { type: 'system', title: '⚙️ Maintenance Notice', message: 'Scheduled maintenance on Sunday from 2 AM to 4 AM', priority: 'normal', color: 'yellow' },
  { type: 'assignment', title: '📝 Quiz Available', message: 'New quiz on Chapter 6 is now available. Attempt before deadline', priority: 'normal', color: 'purple' },
  { type: 'grade', title: '⭐ Progress Report', message: 'Your monthly progress report is ready for review', priority: 'normal', color: 'blue' },
  { type: 'attendance', title: '📋 Perfect Attendance', message: 'Congratulations on maintaining 100% attendance this month!', priority: 'normal', color: 'green' },
  { type: 'comment', title: '💬 Feedback Received', message: 'Your teacher has provided feedback on your project', priority: 'normal', color: 'blue' },
  { type: 'group', title: '👥 Session Reminder', message: 'Reminder: Group session starts in 30 minutes', priority: 'high', color: 'yellow' },
  { type: 'announcement', title: '📢 Holiday Notice', message: 'School will be closed for winter break from Dec 20 to Jan 5', priority: 'normal', color: 'blue' },
  { type: 'assignment', title: '📝 Assignment Reminder', message: 'Reminder: 3 assignments are pending submission', priority: 'high', color: 'yellow' },
  { type: 'grade', title: '⭐ Grade Updated', message: 'Your Chemistry lab grade has been updated', priority: 'normal', color: 'green' },
  { type: 'message', title: '✉️ Parent Meeting', message: 'Parent-teacher meeting scheduled for next week', priority: 'high', color: 'blue' },
  { type: 'system', title: '⚙️ Password Reminder', message: 'It\'s been 60 days since you changed your password', priority: 'low', color: 'gray' },
  { type: 'announcement', title: '📢 Event Invitation', message: 'You\'re invited to the Annual Science Fair on Saturday', priority: 'normal', color: 'purple' },
  { type: 'group', title: '👥 New Member', message: 'A new student has joined your English Literature group', priority: 'low', color: 'blue' }
];

async function seedNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Get all users
    const users = await User.find({ isActive: true }).limit(10);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      process.exit(1);
    }

    console.log(`✓ Found ${users.length} users`);

    // Clear existing notifications (optional)
    await Notification.deleteMany({});
    console.log('✓ Cleared existing notifications');

    // Create notifications
    const notifications = [];
    const now = Date.now();
    
    for (let i = 0; i < 30; i++) {
      const template = notificationTemplates[i % notificationTemplates.length];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomSender = users[Math.floor(Math.random() * users.length)];
      
      // Create notification with varying timestamps (last 7 days)
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      const timestamp = new Date(now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
      
      // Random read status (70% unread, 30% read)
      const isRead = Math.random() > 0.7;
      
      const notification = {
        recipient: randomUser._id,
        type: template.type,
        title: template.title,
        message: template.message,
        priority: template.priority,
        color: template.color,
        icon: getIconForType(template.type),
        read: isRead,
        readAt: isRead ? timestamp : undefined,
        sender: randomSender._id,
        actionUrl: getActionUrl(template.type),
        metadata: {
          generated: true,
          seed: true
        },
        createdAt: timestamp,
        updatedAt: timestamp
      };

      notifications.push(notification);
    }

    // Insert notifications
    const result = await Notification.insertMany(notifications);
    console.log(`✓ Created ${result.length} notifications`);

    // Show summary
    const unreadCount = notifications.filter(n => !n.read).length;
    const readCount = notifications.filter(n => n.read).length;
    
    console.log('\n📊 Summary:');
    console.log(`   Total: ${notifications.length}`);
    console.log(`   Unread: ${unreadCount}`);
    console.log(`   Read: ${readCount}`);
    
    console.log('\n📋 By Type:');
    const typeCount = {};
    notifications.forEach(n => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\n✅ Notification seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    process.exit(1);
  }
}

function getIconForType(type) {
  const icons = {
    announcement: 'megaphone',
    assignment: 'clipboard',
    grade: 'star',
    attendance: 'check',
    comment: 'chat',
    group: 'users',
    message: 'mail',
    system: 'settings'
  };
  return icons[type] || 'bell';
}

function getActionUrl(type) {
  const urls = {
    announcement: '/dashboard/announcements',
    assignment: '/dashboard/assignments',
    grade: '/dashboard/assignments',
    attendance: '/dashboard/attendance',
    comment: '/dashboard/announcements',
    group: '/dashboard/groups',
    message: '/dashboard',
    system: '/dashboard'
  };
  return urls[type] || '/dashboard';
}

// Run seeder
seedNotifications();

