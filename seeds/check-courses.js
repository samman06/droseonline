const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Group = require('../models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function checkCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allCourses = await Course.find({})
      .populate('subject', 'name code')
      .populate('teacher', 'fullName role')
      .populate('groups', 'name code')
      .sort({ createdAt: -1 });
    
    console.log(`📊 TOTAL COURSES IN DB: ${allCourses.length}\n`);

    if (allCourses.length === 0) {
      console.log('❌ NO COURSES FOUND!\n');
      console.log('💡 Run seed script to create courses:\n');
      console.log('   node seeds/seed-courses-assignments-announcements.js\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Analysis
    let issues = [];
    const stats = {
      total: allCourses.length,
      active: 0,
      inactive: 0,
      missingTeacher: 0,
      missingSubject: 0,
      missingGroups: 0,
      missingCode: 0,
      brokenReferences: 0,
      bySubject: {}
    };

    console.log('🔍 ANALYZING COURSES...\n');

    for (const course of allCourses) {
      // Count active/inactive
      if (course.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Count by subject
      if (course.subject?.name) {
        const subjectName = course.subject.name;
        stats.bySubject[subjectName] = (stats.bySubject[subjectName] || 0) + 1;
      }

      // Check for issues
      if (!course.teacher) {
        stats.missingTeacher++;
        issues.push(`Course "${course.name}" has no teacher assigned`);
      }

      if (!course.subject) {
        stats.missingSubject++;
        issues.push(`Course "${course.name}" has no subject`);
      } else if (!course.subject.name) {
        stats.brokenReferences++;
        issues.push(`Course "${course.name}" has broken subject reference`);
      }

      if (!course.groups || course.groups.length === 0) {
        stats.missingGroups++;
        issues.push(`Course "${course.name}" has no groups assigned`);
      }

      if (!course.code) {
        stats.missingCode++;
        issues.push(`Course "${course.name}" has no course code`);
      }
    }

    // Display Statistics
    console.log('📈 STATISTICS:');
    console.log(`   Total Courses: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Inactive: ${stats.inactive}`);
    console.log('');

    if (Object.keys(stats.bySubject).length > 0) {
      console.log('📚 BY SUBJECT:');
      Object.entries(stats.bySubject)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
          console.log(`   ${subject}: ${count}`);
        });
      console.log('');
    }

    // Display Issues
    if (issues.length > 0) {
      console.log(`⚠️  ISSUES FOUND (${issues.length}):\n`);
      console.log(`   Missing Teacher: ${stats.missingTeacher}`);
      console.log(`   Missing Subject: ${stats.missingSubject}`);
      console.log(`   Missing Groups: ${stats.missingGroups}`);
      console.log(`   Missing Code: ${stats.missingCode}`);
      console.log(`   Broken References: ${stats.brokenReferences}`);
      console.log('');

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
    } else {
      console.log('✅ NO ISSUES FOUND - All courses are valid!\n');
    }

    // Sample courses
    if (allCourses.length > 0) {
      console.log('📋 SAMPLE COURSES (First 5):');
      allCourses.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (${c.code || 'No Code'})`);
        console.log(`      Subject: ${c.subject?.name || 'N/A'}`);
        console.log(`      Teacher: ${c.teacher?.fullName || 'Unknown'}`);
        console.log(`      Groups: ${c.groups?.length || 0}`);
        console.log(`      Active: ${c.isActive ? 'Yes' : 'No'}`);
        console.log(`      Description: ${c.description ? c.description.substring(0, 60) + '...' : 'N/A'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCourses();

