const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const Group = require('../models/Group');
const Assignment = require('../models/Assignment');
const Material = require('../models/Material');
const Announcement = require('../models/Announcement');
const Submission = require('../models/Submission');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function auditAll() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                 DROSE ONLINE - DATA AUDIT SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const issues = [];
    const warnings = [];

    // Users
    const users = await User.find({});
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const studentsWithoutGroups = students.filter(s => !s.academicInfo?.groups || s.academicInfo.groups.length === 0);
    const teachersWithoutSubject = teachers.filter(t => !t.academicInfo?.subjects || t.academicInfo.subjects.length === 0);
    
    console.log('👥 USERS:');
    console.log(`   Total: ${users.length}`);
    console.log(`   ├─ Admin: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`   ├─ Teachers: ${teachers.length}`);
    console.log(`   ├─ Assistants: ${users.filter(u => u.role === 'assistant').length}`);
    console.log(`   └─ Students: ${students.length}`);
    
    if (studentsWithoutGroups.length > 0) {
      issues.push(`${studentsWithoutGroups.length} students not enrolled in any groups`);
    }
    if (teachersWithoutSubject.length > 0) {
      issues.push(`${teachersWithoutSubject.length} teachers have no subject assigned`);
    }
    console.log('');

    // Groups
    const groups = await Group.find({}).populate('course');
    const activeGroups = groups.filter(g => g.isActive);
    
    console.log('📚 GROUPS:');
    console.log(`   Total: ${groups.length}`);
    console.log(`   Active: ${activeGroups.length}`);
    console.log('');

    // Courses
    const courses = await Course.find({});
    const activeCourses = courses.filter(c => c.isActive);
    const coursesWithoutTeacher = courses.filter(c => !c.teacher);
    
    console.log('📖 COURSES:');
    console.log(`   Total: ${courses.length}`);
    console.log(`   Active: ${activeCourses.length}`);
    
    if (coursesWithoutTeacher.length > 0) {
      issues.push(`${coursesWithoutTeacher.length} courses have no teacher assigned`);
    }
    console.log('');

    // Assignments
    const assignments = await Assignment.find({});
    const now = new Date();
    const upcomingAssignments = assignments.filter(a => a.dueDate && a.dueDate > now);
    const overdueAssignments = assignments.filter(a => a.dueDate && a.dueDate <= now);
    const assignmentsWithoutCourse = assignments.filter(a => !a.course);
    const submissions = await Submission.find({});
    
    console.log('📝 ASSIGNMENTS:');
    console.log(`   Total: ${assignments.length}`);
    console.log(`   ├─ Upcoming: ${upcomingAssignments.length}`);
    console.log(`   ├─ Overdue: ${overdueAssignments.length}`);
    console.log(`   └─ Submissions: ${submissions.length}`);
    
    if (overdueAssignments.length > 20) {
      warnings.push(`${overdueAssignments.length} assignments are overdue (may need date adjustment)`);
    }
    if (assignmentsWithoutCourse.length > 0) {
      issues.push(`${assignmentsWithoutCourse.length} assignments have no course`);
    }
    console.log('');

    // Materials
    const materials = await Material.find({});
    const materialsWithoutFile = materials.filter(m => !m.file && !m.link);
    
    console.log('📁 MATERIALS:');
    console.log(`   Total: ${materials.length}`);
    console.log(`   ├─ Documents: ${materials.filter(m => m.type === 'document').length}`);
    console.log(`   ├─ Videos: ${materials.filter(m => m.type === 'video').length}`);
    console.log(`   ├─ Links: ${materials.filter(m => m.type === 'link').length}`);
    console.log(`   └─ Others: ${materials.filter(m => !['document', 'video', 'link'].includes(m.type)).length}`);
    
    if (materialsWithoutFile.length > 0) {
      issues.push(`${materialsWithoutFile.length} materials have no file or link (placeholders)`);
    }
    console.log('');

    // Announcements
    const announcements = await Announcement.find({});
    const publishedAnnouncements = announcements.filter(a => 
      a.status === 'published' && 
      a.publishAt <= now &&
      (!a.expiresAt || a.expiresAt >= now)
    );
    const draftAnnouncements = announcements.filter(a => a.status === 'draft');
    
    console.log('📢 ANNOUNCEMENTS:');
    console.log(`   Total: ${announcements.length}`);
    console.log(`   ├─ Published & Active: ${publishedAnnouncements.length}`);
    console.log(`   ├─ Drafts: ${draftAnnouncements.length}`);
    console.log(`   └─ Expired: ${announcements.length - publishedAnnouncements.length - draftAnnouncements.length}`);
    
    if (publishedAnnouncements.length === 0 && announcements.length > 0) {
      warnings.push('No active announcements (all are draft or expired)');
    }
    console.log('');

    // Subjects
    const subjects = await Subject.find({ isActive: true });
    console.log(`🎓 SUBJECTS: ${subjects.length} active subjects`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                         AUDIT RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ NO ISSUES FOUND - Database is in good shape!\n');
    } else {
      if (issues.length > 0) {
        console.log(`🔴 CRITICAL ISSUES (${issues.length}):\n`);
        issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
        console.log('');
      }

      if (warnings.length > 0) {
        console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
        warnings.forEach((warning, i) => {
          console.log(`   ${i + 1}. ${warning}`);
        });
        console.log('');
      }

      console.log('📋 RECOMMENDED ACTIONS:\n');
      
      if (studentsWithoutGroups.length > 0) {
        console.log('   • Enroll students in appropriate groups');
      }
      if (teachersWithoutSubject.length > 0) {
        console.log('   • Assign subjects to teachers');
      }
      if (materialsWithoutFile.length > 0) {
        console.log('   • Materials are placeholders - actual files/links can be added via UI');
      }
      if (overdueAssignments.length > 20) {
        console.log('   • Update assignment due dates for demo/testing purposes');
      }
      if (coursesWithoutTeacher.length > 0) {
        console.log('   • Assign teachers to courses');
      }
      
      console.log('');
    }

    console.log('💡 TIP: Run specific audit scripts for detailed analysis:');
    console.log('   node seeds/check-users.js');
    console.log('   node seeds/check-groups.js');
    console.log('   node seeds/check-courses.js');
    console.log('   node seeds/check-assignments.js');
    console.log('   node seeds/check-materials.js');
    console.log('   node seeds/check-announcements.js');
    console.log('');

    await mongoose.connection.close();
    console.log('✅ Audit Complete!\n');
    
    // Exit with code 1 if there are critical issues
    if (issues.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

auditAll();

