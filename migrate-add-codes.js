/**
 * Migration Script: Add auto-generated codes to existing data
 * This script updates all existing documents that don't have proper codes
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Subject = require('./models/Subject');
const Course = require('./models/Course');
const Group = require('./models/Group');
const AcademicYear = require('./models/AcademicYear');
const Counter = require('./models/Counter');

async function migrateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/droseonline');
    console.log('✅ Connected to MongoDB\n');

    // Migrate Students
    console.log('📝 Migrating Students...');
    const students = await User.find({ role: 'student' });
    let studentCount = 0;
    for (const student of students) {
      if (!student.academicInfo) student.academicInfo = {};
      if (!student.academicInfo.studentId || !student.academicInfo.studentId.match(/^ST-\d{6}$/)) {
        const counter = await Counter.getNextSequence('student');
        student.academicInfo.studentId = `ST-${String(counter).padStart(6, '0')}`;
        student.markModified('academicInfo');
        await student.save();
        studentCount++;
      }
    }
    console.log(`   Updated ${studentCount}/${students.length} students`);

    // Migrate Teachers
    console.log('📝 Migrating Teachers...');
    const teachers = await User.find({ role: 'teacher' });
    let teacherCount = 0;
    for (const teacher of teachers) {
      if (!teacher.academicInfo) teacher.academicInfo = {};
      if (!teacher.academicInfo.employeeId || !teacher.academicInfo.employeeId.match(/^TE-\d{6}$/)) {
        const counter = await Counter.getNextSequence('teacher');
        teacher.academicInfo.employeeId = `TE-${String(counter).padStart(6, '0')}`;
        teacher.markModified('academicInfo');
        await teacher.save();
        teacherCount++;
      }
    }
    console.log(`   Updated ${teacherCount}/${teachers.length} teachers`);

    // Migrate Admins
    console.log('📝 Migrating Admins...');
    const admins = await User.find({ role: 'admin' });
    let adminCount = 0;
    for (const admin of admins) {
      if (!admin.academicInfo) admin.academicInfo = {};
      if (!admin.academicInfo.employeeId || !admin.academicInfo.employeeId.match(/^AD-\d{6}$/)) {
        const counter = await Counter.getNextSequence('admin');
        admin.academicInfo.employeeId = `AD-${String(counter).padStart(6, '0')}`;
        admin.markModified('academicInfo');
        await admin.save();
        adminCount++;
      }
    }
    console.log(`   Updated ${adminCount}/${admins.length} admins`);

    // Migrate Subjects
    console.log('📝 Migrating Subjects...');
    const subjects = await Subject.find();
    let subjectCount = 0;
    for (const subject of subjects) {
      if (!subject.code || !subject.code.match(/^SU-\d{6}$/)) {
        const counter = await Counter.getNextSequence('subjectId');
        subject.code = `SU-${String(counter).padStart(6, '0')}`;
        await subject.save();
        subjectCount++;
      }
    }
    console.log(`   Updated ${subjectCount}/${subjects.length} subjects`);

    // Migrate Courses (should already be good from seed script)
    console.log('📝 Migrating Courses...');
    const courses = await Course.find();
    let courseCount = 0;
    for (const course of courses) {
      if (!course.code || !course.code.match(/^CO-\d{6}$/)) {
        const counter = await Counter.getNextSequence('courseId');
        course.code = `CO-${String(counter).padStart(6, '0')}`;
        await course.save();
        courseCount++;
      }
    }
    console.log(`   Updated ${courseCount}/${courses.length} courses`);

    // Migrate Groups
    console.log('📝 Migrating Groups...');
    const groups = await Group.find();
    let groupCount = 0;
    let groupCourseFixed = 0;
    
    for (const group of groups) {
      let needsSave = false;
      
      // Fix code
      if (!group.code || !group.code.match(/^GR-\d{6}$/)) {
        const counter = await Counter.getNextSequence('groupId');
        group.code = `GR-${String(counter).padStart(6, '0')}`;
        groupCount++;
        needsSave = true;
      }
      
      // Fix missing course reference - find the course based on old data structure
      if (!group.course) {
        // Try to find a course with matching teacher and subject from old group structure
        const Course = require('./models/Course');
        
        if (group.teacher && group.subject) {
          const matchingCourse = await Course.findOne({
            teacher: group.teacher,
            subject: group.subject
          });
          
          if (matchingCourse) {
            group.course = matchingCourse._id;
            groupCourseFixed++;
            needsSave = true;
            console.log(`   ✅ Fixed group "${group.name}" - linked to course "${matchingCourse.name}"`);
          } else {
            console.log(`   ⚠️  Group "${group.name}" - no matching course found (needs manual fix)`);
          }
        } else {
          console.log(`   ⚠️  Group "${group.name}" - missing teacher/subject (needs manual fix)`);
        }
      }
      
      // Only save if we made changes and the group has a course
      if (needsSave && group.course) {
        // Temporarily disable the required validation for this save
        await group.save({ validateBeforeSave: false });
      }
    }
    console.log(`   Updated ${groupCount}/${groups.length} group codes`);
    console.log(`   Fixed ${groupCourseFixed} group course references`);

    // Migrate Academic Years
    console.log('📝 Migrating Academic Years...');
    const academicYears = await AcademicYear.find();
    let ayCount = 0;
    for (const ay of academicYears) {
      if (!ay.code || !ay.code.match(/^AY-\d{6}$/)) {
        const counter = await Counter.getNextSequence('academicYearId');
        ay.code = `AY-${String(counter).padStart(6, '0')}`;
        await ay.save();
        ayCount++;
      }
    }
    console.log(`   Updated ${ayCount}/${academicYears.length} academic years`);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run migration
migrateData();

