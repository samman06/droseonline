/**
 * Fix Groups: Remove old groups without course references and create proper ones
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const Course = require('./models/Course');
const User = require('./models/User');
const Subject = require('./models/Subject');

async function fixGroups() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/droseonline');
    console.log('✅ Connected to MongoDB\n');

    // Find all groups without course references
    const invalidGroups = await Group.find({ course: { $exists: false } });
    console.log(`Found ${invalidGroups.length} groups without course references`);
    
    if (invalidGroups.length > 0) {
      console.log('Deleting invalid groups...');
      for (const group of invalidGroups) {
        console.log(`  - Deleting: ${group.name || 'Unnamed group'} (${group.code || 'No code'})`);
        await Group.deleteOne({ _id: group._id });
      }
      console.log(`✅ Deleted ${invalidGroups.length} invalid groups\n`);
    }

    // Create new groups for each course
    const courses = await Course.find().populate('teacher').populate('subject');
    console.log(`Found ${courses.length} courses\n`);

    let groupsCreated = 0;
    for (const course of courses) {
      // Check if course already has groups
      const existingGroups = await Group.find({ course: course._id });
      
      if (existingGroups.length === 0) {
        console.log(`Creating group for course: ${course.name}`);
        
        // Get students to enroll (first 3 students)
        const students = await User.find({ role: 'student' }).limit(3);
        
        // Get grade level from subject
        const gradeLevel = course.subject.gradeLevel && course.subject.gradeLevel.length > 0
          ? course.subject.gradeLevel[0]
          : 'Grade 10';
        
        const group = new Group({
          name: `${course.subject.name} - Group A`,
          course: course._id,
          gradeLevel: gradeLevel,
          createdBy: course.teacher._id,
          capacity: 30,
          schedule: [
            {
              day: 'sunday',
              startTime: '09:00',
              endTime: '10:30',
              room: 'Room 101'
            },
            {
              day: 'tuesday',
              startTime: '09:00',
              endTime: '10:30',
              room: 'Room 101'
            }
          ],
          students: students.map(s => ({
            student: s._id,
            enrolledAt: new Date(),
            status: 'active'
          })),
          status: 'active'
        });

        await group.save();
        console.log(`  ✅ Created group: ${group.name} (${group.code})\n`);
        groupsCreated++;
      } else {
        console.log(`Course "${course.name}" already has ${existingGroups.length} group(s)\n`);
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   - Deleted ${invalidGroups.length} invalid groups`);
    console.log(`   - Created ${groupsCreated} new groups`);
    console.log(`   - Total groups now: ${await Group.countDocuments()}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixGroups();

