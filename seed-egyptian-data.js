require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Course = require('./models/Course');
const Group = require('./models/Group');
const Assignment = require('./models/Assignment');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');
const Attendance = require('./models/Attendance');
const AcademicYear = require('./models/AcademicYear');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

// Egyptian-themed data
const SUBJECTS_DATA = [
  { name: 'Arabic Language', code: 'ARB-101', credits: 4, description: 'Comprehensive Arabic language and literature' },
  { name: 'English Language', code: 'ENG-101', credits: 4, description: 'English language skills and communication' },
  { name: 'Mathematics', code: 'MTH-101', credits: 5, description: 'Advanced mathematics and problem solving' },
  { name: 'Science', code: 'SCI-101', credits: 4, description: 'General science - Physics, Chemistry, Biology' },
  { name: 'History', code: 'HIS-101', credits: 3, description: 'Egyptian and world history' },
  { name: 'Geography', code: 'GEO-101', credits: 3, description: 'Physical and human geography' },
  { name: 'Islamic Studies', code: 'ISL-101', credits: 2, description: 'Islamic religion and values' },
  { name: 'Computer Science', code: 'CS-101', credits: 3, description: 'Programming and technology' },
  { name: 'Physical Education', code: 'PE-101', credits: 2, description: 'Sports and fitness' },
  { name: 'Art', code: 'ART-101', credits: 2, description: 'Visual arts and creativity' }
];

const TEACHERS_DATA = [
  { firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@school.eg', gender: 'male', department: 'Languages' },
  { firstName: 'Fatma', lastName: 'Ali', email: 'fatma.ali@school.eg', gender: 'female', department: 'Languages' },
  { firstName: 'Mohamed', lastName: 'Ibrahim', email: 'mohamed.ibrahim@school.eg', gender: 'male', department: 'Science' },
  { firstName: 'Nour', lastName: 'Mahmoud', email: 'nour.mahmoud@school.eg', gender: 'female', department: 'Mathematics' },
  { firstName: 'Omar', lastName: 'Khaled', email: 'omar.khaled@school.eg', gender: 'male', department: 'Technology' },
  { firstName: 'Menna', lastName: 'Youssef', email: 'menna.youssef@school.eg', gender: 'female', department: 'Humanities' },
  { firstName: 'Kareem', lastName: 'Said', email: 'kareem.said@school.eg', gender: 'male', department: 'Science' },
  { firstName: 'Hana', lastName: 'Mostafa', email: 'hana.mostafa@school.eg', gender: 'female', department: 'Arts' }
];

const STUDENTS_DATA = [
  { firstName: 'Youssef', lastName: 'Ahmed', email: 'youssef.ahmed@student.eg', gender: 'male', grade: 'Grade 10' },
  { firstName: 'Mariam', lastName: 'Mohamed', email: 'mariam.mohamed@student.eg', gender: 'female', grade: 'Grade 10' },
  { firstName: 'Hassan', lastName: 'Mahmoud', email: 'hassan.mahmoud@student.eg', gender: 'male', grade: 'Grade 10' },
  { firstName: 'Sara', lastName: 'Ali', email: 'sara.ali@student.eg', gender: 'female', grade: 'Grade 10' },
  { firstName: 'Karim', lastName: 'Hassan', email: 'karim.hassan@student.eg', gender: 'male', grade: 'Grade 11' },
  { firstName: 'Salma', lastName: 'Ibrahim', email: 'salma.ibrahim@student.eg', gender: 'female', grade: 'Grade 11' },
  { firstName: 'Adam', lastName: 'Khaled', email: 'adam.khaled@student.eg', gender: 'male', grade: 'Grade 11' },
  { firstName: 'Nada', lastName: 'Youssef', email: 'nada.youssef@student.eg', gender: 'female', grade: 'Grade 11' },
  { firstName: 'Ziad', lastName: 'Said', email: 'ziad.said@student.eg', gender: 'male', grade: 'Grade 12' },
  { firstName: 'Layla', lastName: 'Mostafa', email: 'layla.mostafa@student.eg', gender: 'female', grade: 'Grade 12' },
  { firstName: 'Tamer', lastName: 'Fathy', email: 'tamer.fathy@student.eg', gender: 'male', grade: 'Grade 12' },
  { firstName: 'Hoda', lastName: 'Sami', email: 'hoda.sami@student.eg', gender: 'female', grade: 'Grade 12' },
  { firstName: 'Amr', lastName: 'Tarek', email: 'amr.tarek@student.eg', gender: 'male', grade: 'Grade 9' },
  { firstName: 'Dina', lastName: 'Hamdy', email: 'dina.hamdy@student.eg', gender: 'female', grade: 'Grade 9' },
  { firstName: 'Seif', lastName: 'Gamal', email: 'seif.gamal@student.eg', gender: 'male', grade: 'Grade 9' }
];

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
const TIMES = [
  { start: '08:00', end: '09:30' },
  { start: '09:45', end: '11:15' },
  { start: '11:30', end: '13:00' },
  { start: '13:15', end: '14:45' }
];

async function seedEgyptianData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({ role: { $in: ['teacher', 'student'] } });
    await Subject.deleteMany({});
    await Course.deleteMany({});
    await Group.deleteMany({});
    await Assignment.deleteMany({});
    await Announcement.deleteMany({});
    await Notification.deleteMany({});
    await Attendance.deleteMany({});
    console.log('✅ Cleared\n');

    // 0. Create/Get Admin User
    console.log('👤 Creating Admin...');
    await User.deleteOne({ email: 'admin@droseonline.com' }); // Always recreate admin
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@droseonline.com',
      password: 'admin123', // Plain password - will be hashed by pre-save hook
      role: 'admin',
      gender: 'male',
      isActive: true
    });
    console.log(`✅ Admin: ${admin.email}\n`);

    // 1. Create Academic Year
    console.log('📅 Creating Academic Year...');
    let academicYear = await AcademicYear.findOne({ isCurrent: true });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        isCurrent: true
      });
    }
    console.log(`✅ Academic Year: ${academicYear.name}\n`);

    // 2. Create Subjects
    console.log('📚 Creating Subjects...');
    const subjects = [];
    for (const subjectData of SUBJECTS_DATA) {
      const subject = await Subject.create({
        ...subjectData,
        gradeLevel: 'Secondary',
        isActive: true,
        createdBy: admin._id
      });
      subjects.push(subject);
      console.log(`   ✅ ${subject.name} (${subject.code})`);
    }
    console.log(`✅ Created ${subjects.length} subjects\n`);

    // 3. Create Teachers
    console.log('👨‍🏫 Creating Teachers...');
    const teachers = [];
    
    for (const teacherData of TEACHERS_DATA) {
      const teacher = await User.create({
        ...teacherData,
        password: 'teacher123', // Plain password - will be hashed by pre-save hook
        role: 'teacher',
        isActive: true,
        academicInfo: {
          employeeId: `T${Date.now()}${Math.floor(Math.random() * 1000)}`,
          hireDate: new Date('2020-09-01'),
          department: teacherData.department
        }
      });
      teachers.push(teacher);
      console.log(`   ✅ ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    }
    console.log(`✅ Created ${teachers.length} teachers\n`);

    // 4. Create Courses (each teacher teaches 1-2 subjects)
    console.log('📖 Creating Courses...');
    const courses = [];
    const courseTeacherMap = [
      { teacherIndex: 0, subjectIndex: 0, gradeLevels: ['Grade 10', 'Grade 11'] }, // Ahmed - Arabic
      { teacherIndex: 1, subjectIndex: 1, gradeLevels: ['Grade 10', 'Grade 11'] }, // Fatma - English
      { teacherIndex: 2, subjectIndex: 3, gradeLevels: ['Grade 10', 'Grade 12'] }, // Mohamed - Science
      { teacherIndex: 3, subjectIndex: 2, gradeLevels: ['Grade 10', 'Grade 11'] }, // Nour - Mathematics
      { teacherIndex: 4, subjectIndex: 7, gradeLevels: ['Grade 10', 'Grade 11', 'Grade 12'] }, // Omar - CS
      { teacherIndex: 5, subjectIndex: 4, gradeLevels: ['Grade 11', 'Grade 12'] }, // Menna - History
      { teacherIndex: 6, subjectIndex: 5, gradeLevels: ['Grade 9', 'Grade 10'] }, // Kareem - Geography
      { teacherIndex: 7, subjectIndex: 9, gradeLevels: ['Grade 9', 'Grade 10'] }, // Hana - Art
    ];

    for (const mapping of courseTeacherMap) {
      for (const gradeLevel of mapping.gradeLevels) {
        const course = await Course.create({
          name: `${subjects[mapping.subjectIndex].name} - ${gradeLevel}`,
          code: `${subjects[mapping.subjectIndex].code}-${gradeLevel.replace('Grade ', 'G')}`,
          description: `${subjects[mapping.subjectIndex].name} course for ${gradeLevel}`,
          teacher: teachers[mapping.teacherIndex]._id,
          subject: subjects[mapping.subjectIndex]._id,
          academicYear: academicYear._id,
          gradeLevel: gradeLevel,
          maxStudents: 30,
          isActive: true,
          createdBy: admin._id
        });
        courses.push(course);
        console.log(`   ✅ ${course.name} by ${teachers[mapping.teacherIndex].firstName}`);
      }
    }
    console.log(`✅ Created ${courses.length} courses\n`);

    // 5. Create Groups (2 groups per course for smaller class sizes)
    console.log('👥 Creating Groups...');
    const groups = [];
    
    for (const course of courses) {
      for (let i = 1; i <= 2; i++) {
        const dayIndex = Math.floor(Math.random() * DAYS.length);
        const timeIndex = Math.floor(Math.random() * TIMES.length);
        
        // Determine grade level from course name (e.g., "Arabic Language - Grade 10")
        const gradeLevelMatch = course.name.match(/Grade (\d+)/);
        const gradeLevel = gradeLevelMatch ? `Grade ${gradeLevelMatch[1]}` : 'Grade 10';
        
        const group = await Group.create({
          name: `${course.name} - Section ${i}`,
          code: `${course.code}-S${i}`,
          description: `Section ${i} for ${course.name}`,
          course: course._id,
          academicYear: academicYear._id,
          gradeLevel: gradeLevel,
          maxStudents: 15,
          schedule: [
            {
              day: DAYS[dayIndex],
              startTime: TIMES[timeIndex].start,
              endTime: TIMES[timeIndex].end,
              room: `Room ${Math.floor(Math.random() * 20) + 101}`
            },
            {
              day: DAYS[(dayIndex + 2) % DAYS.length],
              startTime: TIMES[(timeIndex + 1) % TIMES.length].start,
              endTime: TIMES[(timeIndex + 1) % TIMES.length].end,
              room: `Room ${Math.floor(Math.random() * 20) + 101}`
            }
          ],
          students: [], // Will add later
          isActive: true,
          createdBy: admin._id
        });
        groups.push(group);
        console.log(`   ✅ ${group.name}`);
      }
    }
    console.log(`✅ Created ${groups.length} groups\n`);

    // 6. Create Students
    console.log('👨‍🎓 Creating Students...');
    const students = [];
    
    for (const studentData of STUDENTS_DATA) {
      const student = await User.create({
        ...studentData,
        password: 'student123', // Plain password - will be hashed by pre-save hook
        role: 'student',
        isActive: true,
        academicInfo: {
          studentId: `S${Date.now()}${Math.floor(Math.random() * 10000)}`,
          enrollmentDate: new Date('2024-09-01'),
          currentGrade: studentData.grade,
          groups: [] // Will add later
        }
      });
      students.push(student);
      console.log(`   ✅ ${student.firstName} ${student.lastName} - ${student.academicInfo.currentGrade}`);
    }
    console.log(`✅ Created ${students.length} students\n`);

    // 7. Enroll Students in Groups
    console.log('🔗 Enrolling Students in Groups...');
    let enrollmentCount = 0;
    
    for (const student of students) {
      // Find groups for student's grade level
      const studentGrade = student.academicInfo.currentGrade;
      const availableGroups = groups.filter(g => g.gradeLevel === studentGrade);
      
      // Enroll in 4-6 random groups
      const numGroups = Math.min(Math.floor(Math.random() * 3) + 4, availableGroups.length);
      const shuffled = availableGroups.sort(() => 0.5 - Math.random());
      const selectedGroups = shuffled.slice(0, numGroups);
      
      for (const group of selectedGroups) {
        // Add to student's groups
        student.academicInfo.groups.push(group._id);
        
        // Add to group's students
        group.students.push({
          student: student._id,
          enrollmentDate: new Date('2024-09-01'),
          status: 'active'
        });
        await group.save();
        enrollmentCount++;
      }
      
      await student.save();
      console.log(`   ✅ ${student.firstName} enrolled in ${selectedGroups.length} groups`);
    }
    console.log(`✅ Created ${enrollmentCount} enrollments\n`);

    // 8. Create Assignments
    console.log('📝 Creating Assignments...');
    let assignmentCount = 0;
    
    for (const course of courses.slice(0, 10)) { // First 10 courses
      const courseGroups = groups.filter(g => g.course.toString() === course._id.toString());
      
      // Create 2-3 assignments per course
      const assignmentTypes = ['homework', 'essay', 'project'];
      for (let i = 0; i < 3; i++) {
        const daysAhead = Math.floor(Math.random() * 20) + 5; // 5-25 days ahead
        const assignment = await Assignment.create({
          title: `${course.name} - Assignment ${i + 1}`,
          description: `Complete the assigned tasks for ${course.name}`,
          type: assignmentTypes[i % assignmentTypes.length],
          course: course._id,
          groups: courseGroups.map(g => g._id),
          teacher: course.teacher,
          maxPoints: Math.floor(Math.random() * 50) + 50, // 50-100 points
          dueDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
          status: 'published',
          acceptingSubmissions: true
        });
        assignmentCount++;
        console.log(`   ✅ ${assignment.title}`);
      }
    }
    console.log(`✅ Created ${assignmentCount} assignments\n`);

    // 9. Create Announcements
    console.log('📢 Creating Announcements...');
    const announcementTemplates = [
      { title: 'Welcome to the New Academic Year', content: 'We wish all students success in the 2024-2025 academic year!', priority: 'high', type: 'general' },
      { title: 'Exam Schedule Released', content: 'The midterm exam schedule has been published. Please check your calendar.', priority: 'urgent', type: 'exam' },
      { title: 'School Trip to Egyptian Museum', content: 'Join us for an educational trip to the Egyptian Museum next month.', priority: 'normal', type: 'event' },
      { title: 'Library Hours Extended', content: 'The library will now be open until 6 PM for studying.', priority: 'normal', type: 'policy' },
      { title: 'Parent-Teacher Meeting', content: 'Parent-teacher meetings scheduled for next week.', priority: 'high', type: 'event' }
    ];
    
    for (const template of announcementTemplates) {
      const announcement = await Announcement.create({
        ...template,
        author: teachers[Math.floor(Math.random() * teachers.length)]._id,
        audience: 'all',
        publishAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isPublished: true,
        isPinned: template.priority === 'urgent'
      });
      console.log(`   ✅ ${announcement.title}`);
    }
    console.log(`✅ Created ${announcementTemplates.length} announcements\n`);

    // 10. Create Notifications
    console.log('🔔 Creating Notifications...');
    let notificationCount = 0;
    
    for (const student of students.slice(0, 5)) { // First 5 students
      // Welcome notification
      await Notification.create({
        recipient: student._id,
        title: 'Welcome to Drose Online!',
        message: 'Your account has been created. Start exploring your courses and assignments.',
        type: 'announcement',
        isRead: false
      });
      notificationCount++;
      
      // Assignment reminder
      await Notification.create({
        recipient: student._id,
        title: 'New Assignment Posted',
        message: 'A new assignment has been posted in one of your courses.',
        type: 'assignment',
        isRead: false
      });
      notificationCount++;
    }
    console.log(`✅ Created ${notificationCount} notifications\n`);

    // 11. Create Attendance Records (for past sessions) - SKIPPED for now
    console.log('📊 Skipping Attendance Records (can be created through UI)...');
    let attendanceCount = 0;
    /* ATTENDANCE CREATION COMMENTED OUT - Use UI to create attendance
    
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7); // Last week
    
    for (const group of groups.slice(0, 10)) { // First 10 groups
      const groupStudents = await User.find({
        'academicInfo.groups': group._id,
        role: 'student'
      });
      
      // Create attendance for 3 past sessions
      for (let i = 0; i < 3; i++) {
        const sessionDate = new Date(pastDate);
        sessionDate.setDate(sessionDate.getDate() + i * 2);
        
        for (const student of groupStudents) {
          const statuses = ['present', 'present', 'present', 'late', 'absent']; // 60% present, 20% late, 20% absent
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          await Attendance.create({
            student: student._id,
            group: group._id,
            course: group.course,
            date: sessionDate,
            status: status,
            markedBy: await Course.findById(group.course).then(c => c.teacher),
            notes: status === 'absent' ? 'No excuse provided' : ''
          });
          attendanceCount++;
        }
      }
    }
    */ // END ATTENDANCE COMMENT
    console.log(`✅ Attendance can be created through UI\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Egyptian Data Seeding Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`📚 Subjects: ${subjects.length}`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    console.log(`📖 Courses: ${courses.length}`);
    console.log(`👥 Groups: ${groups.length}`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`🔗 Enrollments: ${enrollmentCount}`);
    console.log(`📝 Assignments: ${assignmentCount}`);
    console.log(`📢 Announcements: ${announcementTemplates.length}`);
    console.log(`🔔 Notifications: ${notificationCount}`);
    console.log(`📊 Attendance Records: ${attendanceCount}`);
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Demo Login Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('👨‍🏫 TEACHERS:');
    console.log('   ahmed.hassan@school.eg / teacher123');
    console.log('   fatma.ali@school.eg / teacher123');
    console.log('   mohamed.ibrahim@school.eg / teacher123');
    console.log('   omar.khaled@school.eg / teacher123');
    console.log('\n👨‍🎓 STUDENTS:');
    console.log('   youssef.ahmed@student.eg / student123');
    console.log('   mariam.mohamed@student.eg / student123');
    console.log('   hassan.mahmoud@student.eg / student123');
    console.log('   karim.hassan@student.eg / student123');
    console.log('\n👑 ADMIN:');
    console.log('   admin@droseonline.com / admin123');
    console.log('═══════════════════════════════════════');
    console.log('\n✨ All data is synchronized and ready to use!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedEgyptianData();

