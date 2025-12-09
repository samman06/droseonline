const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Group = require('../models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function fixStudentEnrollments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get students without groups
    const students = await User.find({ role: 'student' });
    const studentsWithoutGroups = students.filter(s => 
      !s.academicInfo?.groups || s.academicInfo.groups.length === 0
    );
    
    console.log(`📊 Found ${studentsWithoutGroups.length} students without groups\n`);

    if (studentsWithoutGroups.length === 0) {
      console.log('✅ All students are already enrolled in groups!\n');
      await mongoose.connection.close();
      return;
    }

    // Get all active groups
    const allGroups = await Group.find({ isActive: true });
    
    if (allGroups.length === 0) {
      console.log('❌ No active groups found! Cannot enroll students.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Group groups by grade level
    const groupsByGrade = {};
    allGroups.forEach(group => {
      if (!groupsByGrade[group.gradeLevel]) {
        groupsByGrade[group.gradeLevel] = [];
      }
      groupsByGrade[group.gradeLevel].push(group);
    });

    console.log(`📚 Available groups by grade:`);
    Object.entries(groupsByGrade).forEach(([grade, groups]) => {
      console.log(`   ${grade}: ${groups.length} groups`);
    });
    console.log('');

    console.log('🔧 Enrolling students in groups...\n');

    let fixed = 0;
    const grades = Object.keys(groupsByGrade);
    
    for (const student of studentsWithoutGroups) {
      // Determine grade level
      let grade = student.academicInfo?.gradeLevel;
      
      // If no grade assigned, assign one randomly from available grades
      if (!grade || !groupsByGrade[grade]) {
        grade = grades[Math.floor(Math.random() * grades.length)];
        
        // Update student grade level
        if (!student.academicInfo) {
          student.academicInfo = {};
        }
        student.academicInfo.gradeLevel = grade;
      }

      // Get groups for this grade
      const gradeGroups = groupsByGrade[grade];
      
      if (!gradeGroups || gradeGroups.length === 0) {
        console.log(`⚠️  No groups available for ${grade} - skipping ${student.fullName}`);
        continue;
      }

      // Enroll in 2-4 random groups from their grade
      const numGroupsToEnroll = 2 + Math.floor(Math.random() * 3); // 2-4 groups
      const shuffled = [...gradeGroups].sort(() => Math.random() - 0.5);
      const selectedGroups = shuffled.slice(0, Math.min(numGroupsToEnroll, gradeGroups.length));
      
      student.academicInfo.groups = selectedGroups.map(g => g._id);
      await student.save();
      
      fixed++;
      console.log(`✅ ${student.fullName} → ${grade} (${selectedGroups.length} groups)`);
    }

    console.log(`\n🎉 Successfully enrolled ${fixed} students!\n`);

    // Show updated stats
    const allStudents = await User.find({ role: 'student' });
    const stillWithoutGroups = allStudents.filter(s => 
      !s.academicInfo?.groups || s.academicInfo.groups.length === 0
    );

    console.log(`📈 UPDATED STATS:`);
    console.log(`   Total Students: ${allStudents.length}`);
    console.log(`   Enrolled: ${allStudents.length - stillWithoutGroups.length}`);
    console.log(`   Without Groups: ${stillWithoutGroups.length}\n`);

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixStudentEnrollments();

