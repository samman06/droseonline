const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allUsers = await User.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 TOTAL USERS IN DB: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('❌ NO USERS FOUND!\n');
      console.log('💡 Run seed script to create users\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Analysis
    let issues = [];
    const stats = {
      total: allUsers.length,
      byRole: {},
      active: 0,
      inactive: 0,
      missingEmail: 0,
      missingName: 0,
      missingPassword: 0,
      studentsWithoutGroups: 0,
      teachersWithoutSubject: 0,
      byGrade: {}
    };

    console.log('🔍 ANALYZING USERS...\n');

    for (const user of allUsers) {
      // Count by role
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;

      // Count active/inactive
      if (user.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Check for issues
      if (!user.email) {
        stats.missingEmail++;
        issues.push(`User "${user.fullName || 'Unknown'}" has no email`);
      }

      if (!user.firstName || !user.lastName) {
        stats.missingName++;
        issues.push(`User "${user.email || user._id}" has incomplete name`);
      }

      if (!user.password) {
        stats.missingPassword++;
        issues.push(`User "${user.email || user.fullName}" has no password`);
      }

      // Role-specific checks
      if (user.role === 'student') {
        if (user.academicInfo?.gradeLevel) {
          stats.byGrade[user.academicInfo.gradeLevel] = (stats.byGrade[user.academicInfo.gradeLevel] || 0) + 1;
        }

        if (!user.academicInfo?.groups || user.academicInfo.groups.length === 0) {
          stats.studentsWithoutGroups++;
        }
      }

      if (user.role === 'teacher') {
        if (!user.academicInfo?.subjects || user.academicInfo.subjects.length === 0) {
          stats.teachersWithoutSubject++;
          issues.push(`Teacher "${user.fullName}" has no subject assigned`);
        }
      }
    }

    // Display Statistics
    console.log('📈 STATISTICS:');
    console.log(`   Total Users: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Inactive: ${stats.inactive}`);
    console.log('');

    console.log('👥 BY ROLE:');
    Object.entries(stats.byRole)
      .sort((a, b) => b[1] - a[1])
      .forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
    console.log('');

    if (Object.keys(stats.byGrade).length > 0) {
      console.log('🎓 STUDENTS BY GRADE:');
      Object.entries(stats.byGrade)
        .sort()
        .forEach(([grade, count]) => {
          console.log(`   Grade ${grade}: ${count}`);
        });
      console.log('');
    }

    // Display Issues
    if (issues.length > 0 || stats.studentsWithoutGroups > 0) {
      console.log(`⚠️  ISSUES FOUND:\n`);
      console.log(`   Missing Email: ${stats.missingEmail}`);
      console.log(`   Missing Name: ${stats.missingName}`);
      console.log(`   Missing Password: ${stats.missingPassword}`);
      console.log(`   Students Without Groups: ${stats.studentsWithoutGroups}`);
      console.log(`   Teachers Without Subject: ${stats.teachersWithoutSubject}`);
      console.log('');

      if (issues.length > 0) {
        if (issues.length <= 20) {
          console.log('📝 DETAILED ISSUES:');
          issues.forEach((issue, i) => {
            console.log(`   ${i + 1}. ${issue}`);
          });
        } else {
          console.log(`📝 Showing first 20 issues:`);
          issues.slice(0, 20).forEach((issue, i) => {
            console.log(`   ${i + 1}. ${issue}`);
          });
          console.log(`   ... and ${issues.length - 20} more`);
        }
        console.log('');
      }
    } else {
      console.log('✅ NO CRITICAL ISSUES FOUND!\n');
      if (stats.studentsWithoutGroups > 0) {
        console.log(`ℹ️  Note: ${stats.studentsWithoutGroups} students are not enrolled in any groups\n`);
      }
    }

    // Sample users by role
    console.log('📋 SAMPLE USERS BY ROLE:\n');
    
    for (const [role, count] of Object.entries(stats.byRole)) {
      const roleUsers = allUsers.filter(u => u.role === role).slice(0, 3);
      console.log(`   ${role.toUpperCase()} (${count} total):`);
      roleUsers.forEach((u, i) => {
        console.log(`      ${i + 1}. ${u.fullName || 'Unknown'} (${u.email})`);
        if (u.role === 'student') {
          const groupCount = u.academicInfo?.groups?.length || 0;
          console.log(`         Grade: ${u.academicInfo?.gradeLevel || 'N/A'}, Groups: ${groupCount}`);
        } else if (u.role === 'teacher') {
          const subjectCount = u.academicInfo?.subjects?.length || 0;
          console.log(`         Subjects: ${subjectCount}`);
        }
      });
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();

