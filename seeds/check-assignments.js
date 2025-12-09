const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Group = require('../models/Group');
const Submission = require('../models/Submission');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function checkAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allAssignments = await Assignment.find({})
      .populate('course', 'name code')
      .populate('teacher', 'fullName role')
      .populate('groups', 'name code')
      .sort({ createdAt: -1 });
    
    console.log(`📊 TOTAL ASSIGNMENTS IN DB: ${allAssignments.length}\n`);

    if (allAssignments.length === 0) {
      console.log('❌ NO ASSIGNMENTS FOUND!\n');
      console.log('💡 Run seed script to create assignments:\n');
      console.log('   node seeds/seed-courses-assignments-announcements.js\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Analysis
    let issues = [];
    const now = new Date();
    const stats = {
      total: allAssignments.length,
      byType: {},
      byStatus: {},
      upcoming: 0,
      overdue: 0,
      completed: 0,
      missingTeacher: 0,
      missingCourse: 0,
      missingGroups: 0,
      invalidDates: 0,
      brokenReferences: 0
    };

    console.log('🔍 ANALYZING ASSIGNMENTS...\n');

    for (const assignment of allAssignments) {
      // Count by type
      stats.byType[assignment.type] = (stats.byType[assignment.type] || 0) + 1;

      // Determine status
      if (assignment.dueDate) {
        if (assignment.dueDate > now) {
          stats.upcoming++;
        } else {
          stats.overdue++;
        }
      }

      // Check for issues
      if (!assignment.teacher) {
        stats.missingTeacher++;
        issues.push(`Assignment "${assignment.title}" has no teacher assigned`);
      }

      if (!assignment.course) {
        stats.missingCourse++;
        issues.push(`Assignment "${assignment.title}" has no course`);
      } else if (!assignment.course.name) {
        stats.brokenReferences++;
        issues.push(`Assignment "${assignment.title}" has broken course reference`);
      }

      if (!assignment.groups || assignment.groups.length === 0) {
        stats.missingGroups++;
        issues.push(`Assignment "${assignment.title}" has no groups assigned`);
      }

      if (assignment.dueDate && assignment.availableFrom && assignment.dueDate < assignment.availableFrom) {
        stats.invalidDates++;
        issues.push(`Assignment "${assignment.title}" has due date before available date`);
      }
    }

    // Count submissions
    const totalSubmissions = await Submission.countDocuments();

    // Display Statistics
    console.log('📈 STATISTICS:');
    console.log(`   Total Assignments: ${stats.total}`);
    console.log(`   Total Submissions: ${totalSubmissions}`);
    console.log(`   Upcoming: ${stats.upcoming}`);
    console.log(`   Overdue: ${stats.overdue}`);
    console.log('');

    console.log('📑 BY TYPE:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log('');

    // Display Issues
    if (issues.length > 0) {
      console.log(`⚠️  ISSUES FOUND (${issues.length}):\n`);
      console.log(`   Missing Teacher: ${stats.missingTeacher}`);
      console.log(`   Missing Course: ${stats.missingCourse}`);
      console.log(`   Missing Groups: ${stats.missingGroups}`);
      console.log(`   Invalid Dates: ${stats.invalidDates}`);
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
      console.log('✅ NO ISSUES FOUND - All assignments are valid!\n');
    }

    // Sample assignments
    if (allAssignments.length > 0) {
      console.log('📋 SAMPLE ASSIGNMENTS (First 5):');
      allAssignments.slice(0, 5).forEach((a, i) => {
        const status = a.dueDate > now ? '📅 Upcoming' : '⏰ Overdue';
        console.log(`   ${i + 1}. ${a.title} ${status}`);
        console.log(`      Type: ${a.type}`);
        console.log(`      Teacher: ${a.teacher?.fullName || 'Unknown'}`);
        console.log(`      Course: ${a.course?.name || 'N/A'}`);
        console.log(`      Groups: ${a.groups?.length || 0}`);
        console.log(`      Points: ${a.totalPoints || 'N/A'}`);
        console.log(`      Available: ${a.availableFrom?.toLocaleString() || 'N/A'}`);
        console.log(`      Due: ${a.dueDate?.toLocaleString() || 'N/A'}`);
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

checkAssignments();

