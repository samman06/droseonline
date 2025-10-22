require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const Course = require('./models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function enrollStudentsInGroups() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get all students
    const students = await User.find({ role: 'student' });
    console.log(`\n📚 Found ${students.length} students\n`);

    if (students.length === 0) {
      console.log('❌ No students found');
      return;
    }

    // Get all groups
    const groups = await Group.find({}).populate('course');
    console.log(`📋 Found ${groups.length} groups\n`);

    if (groups.length === 0) {
      console.log('❌ No groups found');
      return;
    }

    let enrollmentCount = 0;

    // Enroll each student in 2-3 groups
    for (const student of students) {
      console.log(`👤 Processing student: ${student.firstName} ${student.lastName}`);
      
      // Get current groups
      const currentGroups = student.academicInfo?.groups || [];
      console.log(`   Current groups: ${currentGroups.length}`);

      // If student already has groups, skip
      if (currentGroups.length >= 2) {
        console.log(`   ✓ Already enrolled in ${currentGroups.length} groups, skipping...`);
        continue;
      }

      // Select 2-3 random groups for this student
      const numGroupsToAdd = Math.min(3 - currentGroups.length, groups.length);
      const availableGroups = groups.filter(g => 
        !currentGroups.some(cg => cg.toString() === g._id.toString())
      );

      const selectedGroups = [];
      for (let i = 0; i < numGroupsToAdd && i < availableGroups.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableGroups.length);
        const group = availableGroups.splice(randomIndex, 1)[0];
        selectedGroups.push(group);
      }

      // Add student to groups (both in User.academicInfo.groups and Group.students)
      for (const group of selectedGroups) {
        // Add to user's groups
        if (!student.academicInfo) {
          student.academicInfo = {};
        }
        if (!student.academicInfo.groups) {
          student.academicInfo.groups = [];
        }
        
        if (!student.academicInfo.groups.includes(group._id)) {
          student.academicInfo.groups.push(group._id);
          console.log(`   ✅ Enrolled in: ${group.name} (${group.course?.name})`);
          enrollmentCount++;
        }

        // Add to group's students array
        const studentInGroup = group.students.find(s => 
          s.student.toString() === student._id.toString()
        );

        if (!studentInGroup) {
          group.students.push({
            student: student._id,
            enrollmentDate: new Date(),
            status: 'active'
          });
          await group.save();
        }
      }

      await student.save();
    }

    console.log(`\n🎉 Successfully created ${enrollmentCount} enrollments!`);
    console.log(`\n✨ Students can now access assignments for their enrolled groups!`);

  } catch (error) {
    console.error('❌ Error enrolling students:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the enrollment function
enrollStudentsInGroups();

