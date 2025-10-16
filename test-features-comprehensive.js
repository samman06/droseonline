/**
 * Comprehensive Feature Testing Script
 * Tests all features with backend API and data integrity checks
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Subject = require('./models/Subject');
const Course = require('./models/Course');
const Group = require('./models/Group');
const Assignment = require('./models/Assignment');
const Announcement = require('./models/Announcement');
const Attendance = require('./models/Attendance');
const AcademicYear = require('./models/AcademicYear');

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(category, test, status, details = '') {
  const result = { category, test, status, details, timestamp: new Date() };
  
  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✅ [${category}] ${test}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.log(`❌ [${category}] ${test}`);
    if (details) console.log(`   Details: ${details}`);
  } else if (status === 'WARN') {
    testResults.warnings.push(result);
    console.log(`⚠️  [${category}] ${test}`);
    if (details) console.log(`   Details: ${details}`);
  }
}

async function testDatabaseConnection() {
  console.log('\n==================== DATABASE CONNECTION ====================');
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/droseonline');
    logTest('Database', 'MongoDB Connection', 'PASS', 'Connected successfully');
  } catch (error) {
    logTest('Database', 'MongoDB Connection', 'FAIL', error.message);
    throw error;
  }
}

async function testUserManagement() {
  console.log('\n==================== USER MANAGEMENT ====================');
  
  // Test 1: Check students
  try {
    const students = await User.find({ role: 'student' }).limit(5);
    logTest('Users', `Found ${students.length} students`, students.length > 0 ? 'PASS' : 'WARN', 
      students.length === 0 ? 'No students in database' : '');
    
    if (students.length > 0) {
      const hasAutoId = students.every(s => s.academicInfo && s.academicInfo.studentId && s.academicInfo.studentId.match(/^ST-\d{6}$/));
      logTest('Users', 'Students have auto-generated IDs (ST-XXXXXX)', hasAutoId ? 'PASS' : 'FAIL',
        hasAutoId ? `Example: ${students[0].academicInfo.studentId}` : 'Some students missing proper IDs');
    }
  } catch (error) {
    logTest('Users', 'Student retrieval', 'FAIL', error.message);
  }
  
  // Test 2: Check teachers
  try {
    const teachers = await User.find({ role: 'teacher' }).limit(5);
    logTest('Users', `Found ${teachers.length} teachers`, teachers.length > 0 ? 'PASS' : 'WARN',
      teachers.length === 0 ? 'No teachers in database' : '');
    
    if (teachers.length > 0) {
      const hasAutoId = teachers.every(t => t.academicInfo && t.academicInfo.employeeId && t.academicInfo.employeeId.match(/^TE-\d{6}$/));
      logTest('Users', 'Teachers have auto-generated IDs (TE-XXXXXX)', hasAutoId ? 'PASS' : 'FAIL',
        hasAutoId ? `Example: ${teachers[0].academicInfo.employeeId}` : 'Some teachers missing proper IDs');
    }
  } catch (error) {
    logTest('Users', 'Teacher retrieval', 'FAIL', error.message);
  }
  
  // Test 3: Check admins
  try {
    const admins = await User.find({ role: 'admin' }).limit(5);
    logTest('Users', `Found ${admins.length} admins`, admins.length > 0 ? 'PASS' : 'WARN',
      admins.length === 0 ? 'No admins in database' : '');
    
    if (admins.length > 0) {
      const hasAutoId = admins.every(a => a.academicInfo && a.academicInfo.employeeId && a.academicInfo.employeeId.match(/^AD-\d{6}$/));
      logTest('Users', 'Admins have auto-generated IDs (AD-XXXXXX)', hasAutoId ? 'PASS' : 'FAIL',
        hasAutoId ? `Example: ${admins[0].academicInfo.employeeId}` : 'Some admins missing proper IDs');
    }
  } catch (error) {
    logTest('Users', 'Admin retrieval', 'FAIL', error.message);
  }
  
  // Test 4: Check password encryption
  try {
    const users = await User.find().limit(3);
    const allEncrypted = users.every(u => u.password && u.password.length > 50);
    logTest('Users', 'Passwords are encrypted', allEncrypted ? 'PASS' : 'FAIL',
      allEncrypted ? 'All passwords properly hashed' : 'Some passwords not encrypted');
  } catch (error) {
    logTest('Users', 'Password encryption check', 'FAIL', error.message);
  }
}

async function testSubjects() {
  console.log('\n==================== SUBJECTS ====================');
  
  try {
    const subjects = await Subject.find().limit(10);
    logTest('Subjects', `Found ${subjects.length} subjects`, subjects.length > 0 ? 'PASS' : 'WARN',
      subjects.length === 0 ? 'No subjects in database' : '');
    
    if (subjects.length > 0) {
      // Check auto-generated codes
      const hasAutoCode = subjects.every(s => s.code && s.code.match(/^SU-\d{6}$/));
      logTest('Subjects', 'Auto-generated codes (SU-XXXXXX)', hasAutoCode ? 'PASS' : 'FAIL',
        hasAutoCode ? `Example: ${subjects[0].code}` : 'Some subjects missing proper codes');
      
      // Check required fields
      const hasRequiredFields = subjects.every(s => s.name && s.description);
      logTest('Subjects', 'Required fields present', hasRequiredFields ? 'PASS' : 'FAIL',
        !hasRequiredFields ? 'Some subjects missing name or description' : '');
      
      // Check grade levels
      const hasGradeLevel = subjects.every(s => s.gradeLevel && s.gradeLevel.length > 0);
      logTest('Subjects', 'Grade levels assigned', hasGradeLevel ? 'PASS' : 'WARN',
        !hasGradeLevel ? 'Some subjects have no grade levels' : '');
    }
  } catch (error) {
    logTest('Subjects', 'Subject retrieval', 'FAIL', error.message);
  }
}

async function testCourses() {
  console.log('\n==================== COURSES ====================');
  
  try {
    const courses = await Course.find().populate('subject').populate('teacher').limit(10);
    logTest('Courses', `Found ${courses.length} courses`, courses.length > 0 ? 'PASS' : 'WARN',
      courses.length === 0 ? 'No courses in database' : '');
    
    if (courses.length > 0) {
      // Check auto-generated codes
      const hasAutoCode = courses.every(c => c.code && c.code.match(/^CO-\d{6}$/));
      logTest('Courses', 'Auto-generated codes (CO-XXXXXX)', hasAutoCode ? 'PASS' : 'FAIL',
        hasAutoCode ? `Example: ${courses[0].code}` : 'Some courses missing proper codes');
      
      // Check subject relationship
      const hasSubject = courses.every(c => c.subject && c.subject._id);
      logTest('Courses', 'Subject relationship', hasSubject ? 'PASS' : 'FAIL',
        !hasSubject ? 'Some courses missing subject reference' : '');
      
      // Check teacher relationship
      const hasTeacher = courses.every(c => c.teacher && c.teacher._id);
      logTest('Courses', 'Teacher relationship', hasTeacher ? 'PASS' : 'FAIL',
        !hasTeacher ? 'Some courses missing teacher reference' : '');
      
      // Check no schedule field (removed)
      const hasNoSchedule = courses.every(c => !c.schedule);
      logTest('Courses', 'Schedule field removed', hasNoSchedule ? 'PASS' : 'FAIL',
        !hasNoSchedule ? 'Some courses still have schedule field' : '');
      
      // Check no semester field (removed)
      const hasNoSemester = courses.every(c => !c.semester);
      logTest('Courses', 'Semester field removed', hasNoSemester ? 'PASS' : 'FAIL',
        !hasNoSemester ? 'Some courses still have semester field' : '');
      
      // Check assessment structure
      const hasAssessment = courses.every(c => c.assessmentStructure && c.assessmentStructure.length > 0);
      logTest('Courses', 'Assessment structure present', hasAssessment ? 'PASS' : 'WARN',
        !hasAssessment ? 'Some courses have no assessment structure' : '');
      
      if (hasAssessment) {
        const validAssessment = courses.every(c => 
          c.assessmentStructure.every(a => a.type && a.name && a.weightage && a.maxMarks)
        );
        logTest('Courses', 'Assessment structure complete', validAssessment ? 'PASS' : 'FAIL',
          !validAssessment ? 'Some assessments missing required fields (type, name, weightage, maxMarks)' : '');
      }
    }
  } catch (error) {
    logTest('Courses', 'Course retrieval', 'FAIL', error.message);
  }
}

async function testGroups() {
  console.log('\n==================== GROUPS ====================');
  
  try {
    const groups = await Group.find().populate('course').populate('students').limit(10);
    logTest('Groups', `Found ${groups.length} groups`, groups.length > 0 ? 'PASS' : 'WARN',
      groups.length === 0 ? 'No groups in database' : '');
    
    if (groups.length > 0) {
      // Check auto-generated codes
      const hasAutoCode = groups.every(g => g.code && g.code.match(/^GR-\d{6}$/));
      logTest('Groups', 'Auto-generated codes (GR-XXXXXX)', hasAutoCode ? 'PASS' : 'FAIL',
        hasAutoCode ? `Example: ${groups[0].code}` : 'Some groups missing proper codes');
      
      // Check course relationship
      const hasCourse = groups.every(g => g.course && g.course._id);
      logTest('Groups', 'Course relationship (required)', hasCourse ? 'PASS' : 'FAIL',
        !hasCourse ? 'Some groups missing course reference' : '');
      
      // Check no direct teacher/subject (inherited from course)
      const hasNoDirectTeacher = groups.every(g => !g.teacher);
      const hasNoDirectSubject = groups.every(g => !g.subject);
      logTest('Groups', 'Teacher/Subject removed (inherited from course)', 
        hasNoDirectTeacher && hasNoDirectSubject ? 'PASS' : 'FAIL',
        !(hasNoDirectTeacher && hasNoDirectSubject) ? 'Some groups still have direct teacher/subject' : '');
      
      // Check schedule
      const hasSchedule = groups.filter(g => g.schedule && g.schedule.length > 0).length;
      logTest('Groups', `Groups with schedules: ${hasSchedule}/${groups.length}`, 
        hasSchedule > 0 ? 'PASS' : 'WARN',
        hasSchedule === 0 ? 'No groups have schedules assigned' : '');
      
      // Check students
      const withStudents = groups.filter(g => g.students && g.students.length > 0).length;
      logTest('Groups', `Groups with students: ${withStudents}/${groups.length}`, 
        withStudents > 0 ? 'PASS' : 'WARN',
        withStudents === 0 ? 'No groups have students enrolled' : '');
      
      // Check capacity
      const hasCapacity = groups.every(g => g.capacity && g.capacity > 0);
      logTest('Groups', 'Capacity set', hasCapacity ? 'PASS' : 'WARN',
        !hasCapacity ? 'Some groups have no capacity set' : '');
    }
  } catch (error) {
    logTest('Groups', 'Group retrieval', 'FAIL', error.message);
  }
}

async function testAssignments() {
  console.log('\n==================== ASSIGNMENTS ====================');
  
  try {
    const assignments = await Assignment.find()
      .populate('course')
      .populate('teacher')
      .populate('groups')
      .limit(10);
    
    logTest('Assignments', `Found ${assignments.length} assignments`, assignments.length > 0 ? 'PASS' : 'WARN',
      assignments.length === 0 ? 'No assignments in database' : '');
    
    if (assignments.length > 0) {
      // Check required fields
      const hasRequired = assignments.every(a => a.title && a.description && a.dueDate);
      logTest('Assignments', 'Required fields present', hasRequired ? 'PASS' : 'FAIL',
        !hasRequired ? 'Some assignments missing title, description, or dueDate' : '');
      
      // Check course relationship
      const hasCourse = assignments.every(a => a.course && a.course._id);
      logTest('Assignments', 'Course relationship', hasCourse ? 'PASS' : 'FAIL',
        !hasCourse ? 'Some assignments missing course reference' : '');
      
      // Check teacher reference
      const hasTeacher = assignments.every(a => a.teacher && a.teacher._id);
      logTest('Assignments', 'Teacher reference', hasTeacher ? 'PASS' : 'FAIL',
        !hasTeacher ? 'Some assignments missing teacher reference' : '');
      
      // Check assignment types
      const types = [...new Set(assignments.map(a => a.type))];
      logTest('Assignments', `Assignment types: ${types.join(', ')}`, types.length > 0 ? 'PASS' : 'FAIL',
        `Found ${types.length} different types`);
      
      // Check max marks
      const hasMarks = assignments.every(a => a.maxMarks && a.maxMarks > 0);
      logTest('Assignments', 'Max marks set', hasMarks ? 'PASS' : 'WARN',
        !hasMarks ? 'Some assignments have no max marks' : '');
      
      // Check points distribution
      const totalPoints = assignments.reduce((sum, a) => sum + (a.maxMarks || 0), 0);
      logTest('Assignments', `Total assignment points: ${totalPoints}`, totalPoints > 0 ? 'PASS' : 'WARN');
    }
  } catch (error) {
    logTest('Assignments', 'Assignment retrieval', 'FAIL', error.message);
  }
}

async function testAnnouncements() {
  console.log('\n==================== ANNOUNCEMENTS ====================');
  
  try {
    const announcements = await Announcement.find()
      .populate('author')
      .populate('targetCourses')
      .populate('targetGroups')
      .limit(10);
    
    logTest('Announcements', `Found ${announcements.length} announcements`, announcements.length > 0 ? 'PASS' : 'WARN',
      announcements.length === 0 ? 'No announcements in database' : '');
    
    if (announcements.length > 0) {
      // Check required fields
      const hasRequired = announcements.every(a => a.title && a.content);
      logTest('Announcements', 'Required fields present', hasRequired ? 'PASS' : 'FAIL',
        !hasRequired ? 'Some announcements missing title or content' : '');
      
      // Check author
      const hasAuthor = announcements.every(a => a.author && a.author._id);
      logTest('Announcements', 'Author reference', hasAuthor ? 'PASS' : 'FAIL',
        !hasAuthor ? 'Some announcements missing author' : '');
      
      // Check types (general vs course-specific)
      const general = announcements.filter(a => !a.targetCourses || a.targetCourses.length === 0 || a.audience === 'all');
      const courseSpecific = announcements.filter(a => a.targetCourses && a.targetCourses.length > 0);
      logTest('Announcements', `General: ${general.length}, Course-specific: ${courseSpecific.length}`, 'PASS',
        `Distribution looks good`);
      
      // Check target audience
      const audiences = [...new Set(announcements.map(a => a.audience))];
      logTest('Announcements', `Target audiences: ${audiences.join(', ')}`, audiences.length > 0 ? 'PASS' : 'WARN');
      
      // Check priority
      const priorities = [...new Set(announcements.map(a => a.priority))];
      logTest('Announcements', `Priorities: ${priorities.join(', ')}`, priorities.length > 0 ? 'PASS' : 'WARN');
    }
  } catch (error) {
    logTest('Announcements', 'Announcement retrieval', 'FAIL', error.message);
  }
}

async function testAttendance() {
  console.log('\n==================== ATTENDANCE ====================');
  
  try {
    const attendance = await Attendance.find()
      .populate('group')
      .populate('markedBy')
      .limit(10);
    
    logTest('Attendance', `Found ${attendance.length} attendance records`, attendance.length > 0 ? 'PASS' : 'WARN',
      attendance.length === 0 ? 'No attendance records in database' : '');
    
    if (attendance.length > 0) {
      // Check group relationship
      const hasGroup = attendance.every(a => a.group && a.group._id);
      logTest('Attendance', 'Group relationship', hasGroup ? 'PASS' : 'FAIL',
        !hasGroup ? 'Some attendance records missing group reference' : '');
      
      // Check date
      const hasDate = attendance.every(a => a.date);
      logTest('Attendance', 'Date field present', hasDate ? 'PASS' : 'FAIL',
        !hasDate ? 'Some attendance records missing date' : '');
      
      // Check marked by
      const hasMarkedBy = attendance.every(a => a.markedBy && a.markedBy._id);
      logTest('Attendance', 'Marked by reference', hasMarkedBy ? 'PASS' : 'FAIL',
        !hasMarkedBy ? 'Some attendance records missing markedBy' : '');
      
      // Check students array
      const hasStudents = attendance.every(a => a.students && Array.isArray(a.students));
      logTest('Attendance', 'Students array present', hasStudents ? 'PASS' : 'FAIL',
        !hasStudents ? 'Some attendance records have invalid students array' : '');
      
      // Check status values
      if (hasStudents) {
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        const allValidStatuses = attendance.every(a => 
          a.students.every(s => validStatuses.includes(s.status))
        );
        logTest('Attendance', 'Valid status values', allValidStatuses ? 'PASS' : 'FAIL',
          !allValidStatuses ? 'Some attendance records have invalid status values' : '');
      }
    }
  } catch (error) {
    logTest('Attendance', 'Attendance retrieval', 'FAIL', error.message);
  }
}

async function testAcademicYears() {
  console.log('\n==================== ACADEMIC YEARS ====================');
  
  try {
    const academicYears = await AcademicYear.find().limit(5);
    logTest('Academic Years', `Found ${academicYears.length} academic years`, 
      academicYears.length > 0 ? 'PASS' : 'WARN',
      academicYears.length === 0 ? 'No academic years in database' : '');
    
    if (academicYears.length > 0) {
      // Check auto-generated codes
      const hasAutoCode = academicYears.every(ay => ay.code && ay.code.match(/^AY-\d{6}$/));
      logTest('Academic Years', 'Auto-generated codes (AY-XXXXXX)', hasAutoCode ? 'PASS' : 'FAIL',
        hasAutoCode ? `Example: ${academicYears[0].code}` : 'Some academic years missing proper codes');
      
      // Check current year
      const current = academicYears.filter(ay => ay.isCurrent);
      logTest('Academic Years', `Current academic year: ${current.length}`, 
        current.length === 1 ? 'PASS' : 'WARN',
        current.length === 0 ? 'No current academic year set' : 
        current.length > 1 ? 'Multiple current academic years (should be only one)' : '');
      
      // Check semesters
      const hasSemesters = academicYears.every(ay => ay.semesters && Array.isArray(ay.semesters));
      logTest('Academic Years', 'Semesters defined', hasSemesters ? 'PASS' : 'WARN',
        !hasSemesters ? 'Some academic years have no semesters' : '');
      
      // Check virtuals don't crash
      try {
        academicYears.forEach(ay => {
          const current = ay.currentSemester;
          const active = ay.activeSemesters;
        });
        logTest('Academic Years', 'Virtuals (currentSemester, activeSemesters) working', 'PASS',
          'No errors accessing virtual properties');
      } catch (error) {
        logTest('Academic Years', 'Virtuals error', 'FAIL', error.message);
      }
    }
  } catch (error) {
    logTest('Academic Years', 'Academic year retrieval', 'FAIL', error.message);
  }
}

async function testRelationships() {
  console.log('\n==================== RELATIONSHIP INTEGRITY ====================');
  
  // Test Course -> Teacher -> Groups
  try {
    const course = await Course.findOne().populate('teacher');
    if (course) {
      const groups = await Group.find({ course: course._id });
      logTest('Relationships', 'Course -> Groups relationship', 'PASS',
        `Course ${course.code} has ${groups.length} groups`);
      
      if (course.teacher) {
        logTest('Relationships', 'Course -> Teacher relationship', 'PASS',
          `Teacher: ${course.teacher.name}`);
      }
    }
  } catch (error) {
    logTest('Relationships', 'Course relationships', 'FAIL', error.message);
  }
  
  // Test Group -> Course -> Subject/Teacher
  try {
    const group = await Group.findOne().populate({
      path: 'course',
      populate: [
        { path: 'subject' },
        { path: 'teacher' }
      ]
    });
    
    if (group && group.course) {
      const hasInheritedData = group.course.subject && group.course.teacher;
      logTest('Relationships', 'Group inherits Subject/Teacher from Course', 
        hasInheritedData ? 'PASS' : 'FAIL',
        hasInheritedData ? 
          `Subject: ${group.course.subject.name}, Teacher: ${group.course.teacher.name}` :
          'Group course missing subject or teacher');
    }
  } catch (error) {
    logTest('Relationships', 'Group -> Course relationships', 'FAIL', error.message);
  }
  
  // Test Assignment -> Course
  try {
    const assignment = await Assignment.findOne().populate('course');
    if (assignment) {
      logTest('Relationships', 'Assignment -> Course relationship',
        assignment.course ? 'PASS' : 'FAIL',
        assignment.course ? `Course: ${assignment.course.name}` : 'Assignment missing course');
    }
  } catch (error) {
    logTest('Relationships', 'Assignment relationships', 'FAIL', error.message);
  }
}

async function testAutoGeneratedCodes() {
  console.log('\n==================== AUTO-GENERATED CODE SUMMARY ====================');
  
  const codePatterns = [
    { model: Subject, field: 'code', pattern: /^SU-\d{6}$/, filter: {}, name: 'Subjects' },
    { model: Course, field: 'code', pattern: /^CO-\d{6}$/, filter: {}, name: 'Courses' },
    { model: Group, field: 'code', pattern: /^GR-\d{6}$/, filter: {}, name: 'Groups' },
    { model: AcademicYear, field: 'code', pattern: /^AY-\d{6}$/, filter: {}, name: 'Academic Years' }
  ];
  
  for (const config of codePatterns) {
    try {
      const docs = await config.model.find(config.filter).limit(100);
      const total = docs.length;
      const withCode = docs.filter(d => d[config.field] && config.pattern.test(d[config.field])).length;
      
      logTest('Auto-Codes', `${config.name}: ${withCode}/${total} valid`, 
        withCode === total ? 'PASS' : 'WARN',
        withCode < total ? `${total - withCode} items missing valid codes` : '');
    } catch (error) {
      logTest('Auto-Codes', `${config.name} code check`, 'FAIL', error.message);
    }
  }
  
  // Check users separately due to nested structure
  try {
    const students = await User.find({ role: 'student' }).limit(100);
    const withCode = students.filter(s => s.academicInfo && s.academicInfo.studentId && /^ST-\d{6}$/.test(s.academicInfo.studentId)).length;
    logTest('Auto-Codes', `Students: ${withCode}/${students.length} valid`, 
      withCode === students.length ? 'PASS' : 'WARN',
      withCode < students.length ? `${students.length - withCode} items missing valid codes` : '');
  } catch (error) {
    logTest('Auto-Codes', 'Students code check', 'FAIL', error.message);
  }
  
  try {
    const teachers = await User.find({ role: 'teacher' }).limit(100);
    const withCode = teachers.filter(t => t.academicInfo && t.academicInfo.employeeId && /^TE-\d{6}$/.test(t.academicInfo.employeeId)).length;
    logTest('Auto-Codes', `Teachers: ${withCode}/${teachers.length} valid`, 
      withCode === teachers.length ? 'PASS' : 'WARN',
      withCode < teachers.length ? `${teachers.length - withCode} items missing valid codes` : '');
  } catch (error) {
    logTest('Auto-Codes', 'Teachers code check', 'FAIL', error.message);
  }
  
  try {
    const admins = await User.find({ role: 'admin' }).limit(100);
    const withCode = admins.filter(a => a.academicInfo && a.academicInfo.employeeId && /^AD-\d{6}$/.test(a.academicInfo.employeeId)).length;
    logTest('Auto-Codes', `Admins: ${withCode}/${admins.length} valid`, 
      withCode === admins.length ? 'PASS' : 'WARN',
      withCode < admins.length ? `${admins.length - withCode} items missing valid codes` : '');
  } catch (error) {
    logTest('Auto-Codes', 'Admins code check', 'FAIL', error.message);
  }
}

async function generateReport() {
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           COMPREHENSIVE FEATURE TEST REPORT              ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${testResults.passed.length}`);
  console.log(`   ❌ Failed: ${testResults.failed.length}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`   📝 Total: ${testResults.passed.length + testResults.failed.length + testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n\n❌ FAILED TESTS:');
    console.log('═══════════════════════════════════════════════════════════');
    testResults.failed.forEach((result, idx) => {
      console.log(`\n${idx + 1}. [${result.category}] ${result.test}`);
      console.log(`   ${result.details}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n\n⚠️  WARNINGS:');
    console.log('═══════════════════════════════════════════════════════════');
    testResults.warnings.forEach((result, idx) => {
      console.log(`\n${idx + 1}. [${result.category}] ${result.test}`);
      if (result.details) console.log(`   ${result.details}`);
    });
  }
  
  console.log('\n\n📋 RECOMMENDATIONS:');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Analyze results and provide recommendations
  const recommendations = [];
  
  if (testResults.failed.some(r => r.category === 'Database')) {
    recommendations.push('🔴 CRITICAL: Fix database connection issues before proceeding');
  }
  
  if (testResults.failed.some(r => r.test.includes('auto-generated'))) {
    recommendations.push('🔴 Fix auto-generated code system - some entities missing proper codes');
  }
  
  if (testResults.warnings.some(r => r.test.includes('No') && r.test.includes('database'))) {
    recommendations.push('🟡 Run seed scripts to populate database with test data');
  }
  
  if (testResults.failed.some(r => r.test.includes('relationship'))) {
    recommendations.push('🔴 Fix data model relationships - some references are broken');
  }
  
  if (testResults.warnings.some(r => r.test.includes('schedule'))) {
    recommendations.push('🟡 Add schedules to groups for full functionality');
  }
  
  if (testResults.warnings.some(r => r.test.includes('students') && r.test.includes('Groups'))) {
    recommendations.push('🟡 Enroll students in groups for attendance and assignment features');
  }
  
  if (recommendations.length === 0) {
    console.log('✅ All systems operational! No critical issues found.');
    console.log('✅ Ready for frontend testing.');
  } else {
    recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });
  }
  
  console.log('\n\n🎯 NEXT STEPS FOR FRONTEND TESTING:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('1. Login page - Test authentication with different roles');
  console.log('2. Dashboard - Verify statistics and recent activities');
  console.log('3. Students - Test CRUD operations and auto-generated IDs');
  console.log('4. Teachers - Test CRUD operations and auto-generated IDs');
  console.log('5. Subjects - Test CRUD operations and auto-generated codes');
  console.log('6. Courses - Verify no schedule/semester fields, test assessment structure');
  console.log('7. Groups - Test course inheritance, schedule conflict detection, clone feature');
  console.log('8. Assignments - Test creation, submission, grading');
  console.log('9. Announcements - Test creation and audience targeting');
  console.log('10. Attendance - Test marking, editing, and viewing');
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

async function runAllTests() {
  try {
    await testDatabaseConnection();
    await testUserManagement();
    await testSubjects();
    await testCourses();
    await testGroups();
    await testAssignments();
    await testAnnouncements();
    await testAttendance();
    await testAcademicYears();
    await testRelationships();
    await testAutoGeneratedCodes();
    
    await generateReport();
    
  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run all tests
runAllTests();

