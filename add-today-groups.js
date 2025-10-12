const mongoose = require('mongoose');
require('dotenv').config();
const Group = require('./models/Group');
const User = require('./models/User');
const Subject = require('./models/Subject');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drose-online';

const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function addTodayGroups() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's day
    const today = new Date();
    const dayOfWeek = daysOfWeek[today.getDay()];
    console.log(`📅 Today is: ${dayOfWeek.toUpperCase()}`);
    console.log('='.repeat(80) + '\n');

    // Get teachers and subjects
    const teachers = await User.find({ role: 'teacher', isActive: true }).limit(5);
    const subjects = await Subject.find({ isActive: true }).limit(5);
    const students = await User.find({ role: 'student', isActive: true }).limit(20);

    console.log(`📊 Found:`);
    console.log(`   - ${teachers.length} active teachers`);
    console.log(`   - ${subjects.length} active subjects`);
    console.log(`   - ${students.length} active students\n`);

    if (teachers.length === 0 || subjects.length === 0) {
      console.log('❌ Not enough data. Need at least 1 teacher and 1 subject.');
      console.log('   Run: node create-demo-data.js first\n');
      process.exit(1);
    }

    // Delete existing groups to start fresh
    const deleted = await Group.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing groups\n`);

    // Create groups with today's schedule
    const gradeLevels = ['Grade 10', 'Grade 11', 'Grade 12'];
    const rooms = ['Room A101', 'Room B202', 'Room C303', 'Lab 1', 'Lab 2'];
    const groups = [];

    for (let i = 0; i < Math.min(5, teachers.length * subjects.length); i++) {
      const teacher = teachers[i % teachers.length];
      const subject = subjects[i % subjects.length];
      const gradeLevel = gradeLevels[i % gradeLevels.length];
      const room = rooms[i % rooms.length];
      
      // Create schedule for today
      const hour = 9 + (i * 2); // 9 AM, 11 AM, 1 PM, 3 PM, 5 PM
      const schedule = [
        {
          day: dayOfWeek,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:30`,
          room: room
        }
      ];

      // Assign 3-5 random students to this group
      const numStudents = Math.floor(Math.random() * 3) + 3; // 3-5 students
      const groupStudents = [];
      for (let j = 0; j < Math.min(numStudents, students.length); j++) {
        const studentIndex = (i * numStudents + j) % students.length;
        groupStudents.push(students[studentIndex]._id);
      }

      const group = await Group.create({
        name: `${subject.name} - ${gradeLevel} - Group ${i + 1}`,
        code: `GRP${(i + 1).toString().padStart(3, '0')}`,
        subject: subject._id,
        teacher: teacher._id,
        gradeLevel: gradeLevel,
        academicYear: '2024-2025',
        students: groupStudents,
        schedule: schedule,
        capacity: 30,
        isActive: true
      });

      groups.push(group);
      
      console.log(`✅ Created Group ${i + 1}:`);
      console.log(`   Name: ${group.name}`);
      console.log(`   Teacher: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`   Subject: ${subject.name}`);
      console.log(`   Grade: ${gradeLevel}`);
      console.log(`   Students: ${groupStudents.length}`);
      console.log(`   Schedule: ${dayOfWeek} ${schedule[0].startTime}-${schedule[0].endTime} (${room})\n`);
    }

    console.log('='.repeat(80));
    console.log(`✅ Successfully created ${groups.length} groups with ${dayOfWeek} schedules!`);
    console.log('='.repeat(80) + '\n');

    console.log(`📋 Summary:`);
    console.log(`   - Total groups created: ${groups.length}`);
    console.log(`   - All groups have sessions today (${dayOfWeek})`);
    console.log(`   - All groups are pending attendance (no records yet)`);
    console.log(`\n✨ Now try the "Pending Today" button in the attendance page!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚀 Adding groups with today\'s schedule...\n');
addTodayGroups();

