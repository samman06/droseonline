const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const Group = require('../models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function checkGroups() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allGroups = await Group.find({})
      .populate({
        path: 'course',
        populate: [
          { path: 'subject', select: 'name code' },
          { path: 'teacher', select: 'fullName role' }
        ]
      })
      .sort({ createdAt: -1 });
    
    console.log(`📊 TOTAL GROUPS IN DB: ${allGroups.length}\n`);

    if (allGroups.length === 0) {
      console.log('❌ NO GROUPS FOUND!\n');
      console.log('💡 Run seed script to create groups\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Count enrolled students
    const students = await User.find({ role: 'student' });
    let totalEnrollments = 0;
    students.forEach(s => {
      if (s.academicInfo?.groups) {
        totalEnrollments += s.academicInfo.groups.length;
      }
    });

    // Analysis
    let issues = [];
    const stats = {
      total: allGroups.length,
      active: 0,
      inactive: 0,
      missingTeacher: 0,
      missingSubject: 0,
      missingSchedule: 0,
      missingCode: 0,
      emptyGroups: 0,
      fullGroups: 0,
      brokenReferences: 0,
      byGrade: {},
      bySubject: {}
    };

    console.log('🔍 ANALYZING GROUPS...\n');

    for (const group of allGroups) {
      // Count active/inactive
      if (group.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Count by grade
      if (group.gradeLevel) {
        stats.byGrade[group.gradeLevel] = (stats.byGrade[group.gradeLevel] || 0) + 1;
      }

      // Count by subject
      if (group.course?.subject?.name) {
        stats.bySubject[group.course.subject.name] = (stats.bySubject[group.course.subject.name] || 0) + 1;
      }

      // Check enrollment
      const enrolledCount = students.filter(s => 
        s.academicInfo?.groups?.some(g => g.toString() === group._id.toString())
      ).length;

      if (enrolledCount === 0) {
        stats.emptyGroups++;
      }

      if (group.maxStudents && enrolledCount >= group.maxStudents) {
        stats.fullGroups++;
      }

      // Check for issues
      if (!group.course) {
        stats.missingTeacher++;
        stats.missingSubject++;
        issues.push(`Group "${group.name}" has no course assigned (missing teacher and subject)`);
      } else {
        if (!group.course.teacher) {
          stats.missingTeacher++;
          issues.push(`Group "${group.name}" course has no teacher assigned`);
        }

        if (!group.course.subject) {
          stats.missingSubject++;
          issues.push(`Group "${group.name}" course has no subject`);
        } else if (!group.course.subject.name) {
          stats.brokenReferences++;
          issues.push(`Group "${group.name}" has broken subject reference`);
        }
      }

      if (!group.schedule || group.schedule.length === 0) {
        stats.missingSchedule++;
        issues.push(`Group "${group.name}" has no schedule`);
      }

      if (!group.code) {
        stats.missingCode++;
        issues.push(`Group "${group.name}" has no group code`);
      }
    }

    // Display Statistics
    console.log('📈 STATISTICS:');
    console.log(`   Total Groups: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Inactive: ${stats.inactive}`);
    console.log(`   Empty Groups: ${stats.emptyGroups}`);
    console.log(`   Full Groups: ${stats.fullGroups}`);
    console.log(`   Total Student Enrollments: ${totalEnrollments}`);
    console.log('');

    if (Object.keys(stats.byGrade).length > 0) {
      console.log('🎓 BY GRADE:');
      Object.entries(stats.byGrade)
        .sort()
        .forEach(([grade, count]) => {
          console.log(`   Grade ${grade}: ${count}`);
        });
      console.log('');
    }

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
      console.log(`   Missing Schedule: ${stats.missingSchedule}`);
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
      console.log('✅ NO ISSUES FOUND - All groups are valid!\n');
    }

    // Sample groups
    if (allGroups.length > 0) {
      console.log('📋 SAMPLE GROUPS (First 5):');
      for (let i = 0; i < Math.min(5, allGroups.length); i++) {
        const g = allGroups[i];
        const enrolledCount = students.filter(s => 
          s.academicInfo?.groups?.some(gId => gId.toString() === g._id.toString())
        ).length;
        
        console.log(`   ${i + 1}. ${g.name} (${g.code || 'No Code'})`);
        console.log(`      Course: ${g.course?.name || 'N/A'}`);
        console.log(`      Subject: ${g.course?.subject?.name || 'N/A'}`);
        console.log(`      Teacher: ${g.course?.teacher?.fullName || 'Unknown'}`);
        console.log(`      Grade: ${g.gradeLevel || 'N/A'}`);
        console.log(`      Students: ${enrolledCount}/${g.maxStudents || '∞'}`);
        console.log(`      Schedule: ${g.schedule?.length || 0} sessions`);
        console.log(`      Active: ${g.isActive ? 'Yes' : 'No'}`);
        console.log('');
      }
    }

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkGroups();

