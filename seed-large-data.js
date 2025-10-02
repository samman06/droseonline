const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Import models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Group = require('./models/Group');
const Course = require('./models/Course');
const AcademicYear = require('./models/AcademicYear');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');

// Configuration
const CONFIG = {
  ADMIN_COUNT: 5,
  TEACHER_COUNT: 50,
  STUDENT_COUNT: 500,
  SUBJECT_COUNT: 30,
  GROUP_COUNT: 20,
  COURSE_COUNT: 80,
  ASSIGNMENT_COUNT: 200,
  SUBMISSION_COUNT: 1000,
  ATTENDANCE_RECORDS: 2000,
  ANNOUNCEMENT_COUNT: 100,
  ACADEMIC_YEARS: 3
};

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Sample data arrays
const SUBJECTS_DATA = [
  { name: 'Advanced Mathematics', code: 'MATH401', description: 'Calculus, Linear Algebra, and Statistics', credits: 4, department: 'Mathematics' },
  { name: 'Computer Science Fundamentals', code: 'CS101', description: 'Introduction to Programming and Algorithms', credits: 3, department: 'Computer Science' },
  { name: 'Data Structures', code: 'CS201', description: 'Arrays, Lists, Trees, Graphs, and Hash Tables', credits: 4, department: 'Computer Science' },
  { name: 'Database Systems', code: 'CS301', description: 'Relational Databases, SQL, and NoSQL', credits: 3, department: 'Computer Science' },
  { name: 'Web Development', code: 'CS250', description: 'HTML, CSS, JavaScript, and Modern Frameworks', credits: 3, department: 'Computer Science' },
  { name: 'Mobile App Development', code: 'CS350', description: 'iOS and Android Development', credits: 4, department: 'Computer Science' },
  { name: 'Machine Learning', code: 'CS450', description: 'AI, Neural Networks, and Deep Learning', credits: 4, department: 'Computer Science' },
  { name: 'Physics I', code: 'PHY101', description: 'Mechanics, Thermodynamics, and Waves', credits: 4, department: 'Physics' },
  { name: 'Physics II', code: 'PHY201', description: 'Electricity, Magnetism, and Optics', credits: 4, department: 'Physics' },
  { name: 'Chemistry I', code: 'CHEM101', description: 'General Chemistry and Atomic Structure', credits: 3, department: 'Chemistry' },
  { name: 'Organic Chemistry', code: 'CHEM201', description: 'Carbon Compounds and Reactions', credits: 4, department: 'Chemistry' },
  { name: 'Biology I', code: 'BIO101', description: 'Cell Biology and Genetics', credits: 3, department: 'Biology' },
  { name: 'Microbiology', code: 'BIO301', description: 'Microorganisms and Infectious Diseases', credits: 4, department: 'Biology' },
  { name: 'English Literature', code: 'ENG201', description: 'Classical and Modern Literature', credits: 3, department: 'English' },
  { name: 'Creative Writing', code: 'ENG301', description: 'Fiction, Poetry, and Screenwriting', credits: 3, department: 'English' },
  { name: 'World History', code: 'HIST101', description: 'Ancient to Modern Civilizations', credits: 3, department: 'History' },
  { name: 'Modern European History', code: 'HIST301', description: '19th and 20th Century Europe', credits: 3, department: 'History' },
  { name: 'Psychology 101', code: 'PSY101', description: 'Introduction to Human Behavior', credits: 3, department: 'Psychology' },
  { name: 'Cognitive Psychology', code: 'PSY301', description: 'Memory, Learning, and Perception', credits: 4, department: 'Psychology' },
  { name: 'Business Administration', code: 'BUS101', description: 'Management and Leadership Principles', credits: 3, department: 'Business' },
  { name: 'Marketing Fundamentals', code: 'BUS201', description: 'Consumer Behavior and Market Analysis', credits: 3, department: 'Business' },
  { name: 'Financial Accounting', code: 'ACC101', description: 'Basic Accounting Principles', credits: 3, department: 'Accounting' },
  { name: 'Microeconomics', code: 'ECON101', description: 'Individual and Firm Behavior', credits: 3, department: 'Economics' },
  { name: 'Macroeconomics', code: 'ECON201', description: 'National and Global Economics', credits: 3, department: 'Economics' },
  { name: 'Art History', code: 'ART101', description: 'Western Art from Ancient to Modern', credits: 3, department: 'Art' },
  { name: 'Digital Design', code: 'ART301', description: 'Graphic Design and Digital Media', credits: 3, department: 'Art' },
  { name: 'Music Theory', code: 'MUS101', description: 'Harmony, Melody, and Composition', credits: 3, department: 'Music' },
  { name: 'Philosophy 101', code: 'PHIL101', description: 'Introduction to Philosophical Thinking', credits: 3, department: 'Philosophy' },
  { name: 'Ethics', code: 'PHIL201', description: 'Moral Philosophy and Applied Ethics', credits: 3, department: 'Philosophy' },
  { name: 'Statistics', code: 'STAT201', description: 'Descriptive and Inferential Statistics', credits: 4, department: 'Mathematics' }
];

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Psychology', 'Business', 'Art', 'Music', 'Philosophy'];

const ASSIGNMENT_TYPES = ['Homework', 'Project', 'Quiz', 'Exam', 'Lab Report', 'Essay', 'Presentation', 'Research Paper'];

const ANNOUNCEMENT_TYPES = ['general', 'academic', 'event', 'urgent', 'reminder'];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline');
    console.log('📊 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Group.deleteMany({});
    await Course.deleteMany({});
    await AcademicYear.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Attendance.deleteMany({});
    await Announcement.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
};

// Create Academic Years
const createAcademicYears = async () => {
  const academicYears = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < CONFIG.ACADEMIC_YEARS; i++) {
    const startYear = currentYear - 1 + i;
    const endYear = startYear + 1;
    
    academicYears.push({
      name: `${startYear}-${endYear}`,
      startDate: new Date(startYear, 8, 1), // September 1st
      endDate: new Date(endYear, 5, 30), // June 30th
      isActive: i === 1, // Middle year is active
      semesters: [
        {
          name: 'Fall Semester',
          startDate: new Date(startYear, 8, 1),
          endDate: new Date(startYear, 11, 20),
          isActive: i === 1
        },
        {
          name: 'Spring Semester',
          startDate: new Date(endYear, 0, 15),
          endDate: new Date(endYear, 4, 15),
          isActive: false
        }
      ]
    });
  }
  
  const createdYears = await AcademicYear.insertMany(academicYears);
  console.log(`✅ Created ${createdYears.length} academic years`);
  return createdYears;
};

// Create Subjects
const createSubjects = async () => {
  const subjects = SUBJECTS_DATA.map(subject => ({
    ...subject,
    isActive: true,
    prerequisites: [],
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  }));
  
  const createdSubjects = await Subject.insertMany(subjects);
  console.log(`✅ Created ${createdSubjects.length} subjects`);
  return createdSubjects;
};

// Create Users (Admins, Teachers, Students)
const createUsers = async () => {
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  // Create Admins
  for (let i = 0; i < CONFIG.ADMIN_COUNT; i++) {
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      phoneNumber: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      isActive: true,
      academicInfo: {
        permissions: ['all'],
        groups: [],
        specialization: [],
        subjects: []
      }
    });
  }
  
  // Create Teachers
  for (let i = 0; i < CONFIG.TEACHER_COUNT; i++) {
    const department = getRandomElement(DEPARTMENTS);
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      role: 'teacher',
      phoneNumber: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 25, max: 60, mode: 'age' }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      isActive: true,
      academicInfo: {
        department,
        specialization: [department, getRandomElement(DEPARTMENTS)],
        qualifications: [
          faker.helpers.arrayElement(['PhD', 'Masters', 'Bachelors']),
          faker.helpers.arrayElement(['Computer Science', 'Mathematics', 'Engineering'])
        ],
        experience: faker.number.int({ min: 1, max: 20 }),
        groups: [],
        subjects: []
      }
    });
  }
  
  // Create Students
  for (let i = 0; i < CONFIG.STUDENT_COUNT; i++) {
    const year = faker.helpers.arrayElement(['Freshman', 'Sophomore', 'Junior', 'Senior']);
    const major = getRandomElement(DEPARTMENTS);
    
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      role: 'student',
      phoneNumber: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 25, mode: 'age' }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      isActive: true,
      academicInfo: {
        studentId: `STU${String(i + 1).padStart(6, '0')}`,
        year,
        major,
        gpa: parseFloat(faker.number.float({ min: 2.0, max: 4.0, fractionDigits: 2 })),
        enrollmentDate: faker.date.past({ years: 4 }),
        groups: [],
        subjects: []
      }
    });
  }
  
  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users (${CONFIG.ADMIN_COUNT} admins, ${CONFIG.TEACHER_COUNT} teachers, ${CONFIG.STUDENT_COUNT} students)`);
  
  return {
    admins: createdUsers.filter(u => u.role === 'admin'),
    teachers: createdUsers.filter(u => u.role === 'teacher'),
    students: createdUsers.filter(u => u.role === 'student')
  };
};

// Create Groups
const createGroups = async (academicYears) => {
  const groups = [];
  const activeYear = academicYears.find(year => year.isActive);
  
  for (let i = 0; i < CONFIG.GROUP_COUNT; i++) {
    const year = faker.helpers.arrayElement(['Freshman', 'Sophomore', 'Junior', 'Senior']);
    const section = faker.helpers.arrayElement(['A', 'B', 'C', 'D']);
    const department = getRandomElement(DEPARTMENTS);
    
    groups.push({
      name: `${department} ${year} - Section ${section}`,
      code: `${department.substring(0, 3).toUpperCase()}${year.substring(0, 1)}${section}`,
      description: `${year} students in ${department} department, Section ${section}`,
      academicYear: activeYear._id,
      capacity: faker.number.int({ min: 20, max: 50 }),
      students: [],
      isActive: true,
      schedule: {
        days: getRandomElements(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], faker.number.int({ min: 2, max: 5 })),
        startTime: faker.helpers.arrayElement(['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']),
        endTime: faker.helpers.arrayElement(['10:00', '11:00', '12:00', '13:00', '15:00', '16:00']),
        room: `Room ${faker.number.int({ min: 101, max: 505 })}`
      }
    });
  }
  
  const createdGroups = await Group.insertMany(groups);
  console.log(`✅ Created ${createdGroups.length} groups`);
  return createdGroups;
};

// Create Courses
const createCourses = async (subjects, teachers, groups, academicYears) => {
  const courses = [];
  const activeYear = academicYears.find(year => year.isActive);
  
  for (let i = 0; i < CONFIG.COURSE_COUNT; i++) {
    const subject = getRandomElement(subjects);
    const teacher = getRandomElement(teachers);
    const courseGroups = getRandomElements(groups, faker.number.int({ min: 1, max: 3 }));
    
    courses.push({
      name: `${subject.name} - ${faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening'])} Section`,
      code: `${subject.code}-${String(i + 1).padStart(3, '0')}`,
      description: `${subject.description} - Advanced course covering comprehensive topics`,
      subject: subject._id,
      teacher: teacher._id,
      groups: courseGroups.map(g => g._id),
      academicYear: activeYear._id,
      semester: faker.helpers.arrayElement(['Fall', 'Spring']),
      credits: subject.credits,
      capacity: faker.number.int({ min: 20, max: 60 }),
      enrolledStudents: [],
      schedule: {
        days: getRandomElements(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], faker.number.int({ min: 2, max: 4 })),
        startTime: faker.helpers.arrayElement(['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00']),
        endTime: faker.helpers.arrayElement(['09:30', '10:30', '11:30', '12:30', '14:30', '15:30', '16:30']),
        room: `Room ${faker.number.int({ min: 101, max: 505 })}`
      },
      isActive: true,
      startDate: faker.date.past(),
      endDate: faker.date.future()
    });
  }
  
  const createdCourses = await Course.insertMany(courses);
  console.log(`✅ Created ${createdCourses.length} courses`);
  return createdCourses;
};

// Assign Students to Groups and Courses
const assignStudentsToGroupsAndCourses = async (students, groups, courses) => {
  console.log('📝 Assigning students to groups and courses...');
  
  // Assign students to groups
  for (const group of groups) {
    const studentsToAssign = getRandomElements(students, faker.number.int({ min: 15, max: group.capacity }));
    group.students = studentsToAssign.map(s => s._id);
    await group.save();
    
    // Update student records
    for (const student of studentsToAssign) {
      student.academicInfo.groups.push(group._id);
      await student.save();
    }
  }
  
  // Assign students to courses
  for (const course of courses) {
    const eligibleStudents = students.filter(student => 
      student.academicInfo.groups.some(groupId => 
        course.groups.includes(groupId)
      )
    );
    
    const studentsToEnroll = getRandomElements(eligibleStudents, 
      Math.min(faker.number.int({ min: 10, max: course.capacity }), eligibleStudents.length)
    );
    
    course.enrolledStudents = studentsToEnroll.map(s => s._id);
    await course.save();
    
    // Update student records
    for (const student of studentsToEnroll) {
      if (!student.academicInfo.subjects.includes(course.subject)) {
        student.academicInfo.subjects.push(course.subject);
        await student.save();
      }
    }
  }
  
  console.log('✅ Students assigned to groups and courses');
};

// Create Assignments
const createAssignments = async (courses, teachers) => {
  const assignments = [];
  
  for (let i = 0; i < CONFIG.ASSIGNMENT_COUNT; i++) {
    const course = getRandomElement(courses);
    const teacher = getRandomElement(teachers);
    const assignedDate = faker.date.past();
    const dueDate = faker.date.future({ refDate: assignedDate });
    
    assignments.push({
      title: `${getRandomElement(ASSIGNMENT_TYPES)}: ${faker.lorem.words(3)}`,
      description: faker.lorem.paragraphs(2),
      course: course._id,
      teacher: teacher._id,
      type: getRandomElement(ASSIGNMENT_TYPES),
      totalPoints: faker.number.int({ min: 50, max: 200 }),
      assignedDate,
      dueDate,
      status: faker.helpers.arrayElement(['draft', 'published', 'closed']),
      instructions: faker.lorem.paragraphs(3),
      resources: [
        {
          name: `${faker.lorem.words(2)}.pdf`,
          url: faker.internet.url(),
          type: 'document'
        },
        {
          name: `Reference: ${faker.lorem.words(3)}`,
          url: faker.internet.url(),
          type: 'link'
        }
      ],
      rubric: [
        {
          criteria: 'Content Quality',
          points: faker.number.int({ min: 20, max: 40 }),
          description: 'Quality and accuracy of content'
        },
        {
          criteria: 'Organization',
          points: faker.number.int({ min: 10, max: 20 }),
          description: 'Structure and flow of presentation'
        },
        {
          criteria: 'Creativity',
          points: faker.number.int({ min: 10, max: 30 }),
          description: 'Original thinking and innovation'
        }
      ]
    });
  }
  
  const createdAssignments = await Assignment.insertMany(assignments);
  console.log(`✅ Created ${createdAssignments.length} assignments`);
  return createdAssignments;
};

// Create Submissions
const createSubmissions = async (assignments, students) => {
  const submissions = [];
  
  for (let i = 0; i < CONFIG.SUBMISSION_COUNT; i++) {
    const assignment = getRandomElement(assignments);
    const student = getRandomElement(students);
    const submittedAt = faker.date.between({ from: assignment.assignedDate, to: assignment.dueDate });
    const isLate = submittedAt > assignment.dueDate;
    
    const status = faker.helpers.arrayElement(['submitted', 'graded', 'returned']);
    const score = status === 'graded' || status === 'returned' ? 
      faker.number.int({ min: Math.floor(assignment.totalPoints * 0.4), max: assignment.totalPoints }) : null;
    
    submissions.push({
      assignment: assignment._id,
      student: student._id,
      submittedAt,
      status,
      content: faker.lorem.paragraphs(4),
      attachments: [
        {
          name: `${student.firstName}_${student.lastName}_Assignment.pdf`,
          url: faker.internet.url(),
          type: 'document',
          size: faker.number.int({ min: 100000, max: 5000000 })
        }
      ],
      score,
      feedback: status === 'graded' || status === 'returned' ? faker.lorem.paragraph() : null,
      isLate,
      gradedAt: status === 'graded' || status === 'returned' ? faker.date.future({ refDate: submittedAt }) : null,
      gradedBy: status === 'graded' || status === 'returned' ? assignment.teacher : null
    });
  }
  
  const createdSubmissions = await Submission.insertMany(submissions);
  console.log(`✅ Created ${createdSubmissions.length} submissions`);
  return createdSubmissions;
};

// Create Attendance Records
const createAttendanceRecords = async (courses, students) => {
  const attendanceRecords = [];
  
  for (let i = 0; i < CONFIG.ATTENDANCE_RECORDS; i++) {
    const course = getRandomElement(courses);
    const student = getRandomElement(students.filter(s => 
      course.enrolledStudents.includes(s._id)
    ));
    
    if (!student) continue;
    
    const date = faker.date.between({ 
      from: course.startDate, 
      to: course.endDate || new Date() 
    });
    
    attendanceRecords.push({
      student: student._id,
      course: course._id,
      date,
      status: faker.helpers.arrayElement(['present', 'absent', 'late', 'excused']),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      markedBy: course.teacher,
      markedAt: faker.date.future({ refDate: date })
    });
  }
  
  const createdRecords = await Attendance.insertMany(attendanceRecords);
  console.log(`✅ Created ${createdRecords.length} attendance records`);
  return createdRecords;
};

// Create Announcements
const createAnnouncements = async (users, courses) => {
  const announcements = [];
  const adminsAndTeachers = users.admins.concat(users.teachers);
  
  for (let i = 0; i < CONFIG.ANNOUNCEMENT_COUNT; i++) {
    const author = getRandomElement(adminsAndTeachers);
    const type = getRandomElement(ANNOUNCEMENT_TYPES);
    const targetAudience = faker.helpers.arrayElement(['all', 'students', 'teachers', 'specific']);
    
    let targetGroups = [];
    let targetCourses = [];
    
    if (targetAudience === 'specific') {
      if (faker.datatype.boolean()) {
        targetCourses = getRandomElements(courses, faker.number.int({ min: 1, max: 3 })).map(c => c._id);
      }
    }
    
    announcements.push({
      title: faker.lorem.words(faker.number.int({ min: 3, max: 8 })),
      content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 4 })),
      type,
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      author: author._id,
      targetAudience,
      targetGroups,
      targetCourses,
      isActive: faker.datatype.boolean(0.9),
      publishDate: faker.date.past(),
      expiryDate: faker.helpers.maybe(() => faker.date.future(), { probability: 0.6 }),
      attachments: faker.helpers.maybe(() => [
        {
          name: `${faker.lorem.words(2)}.pdf`,
          url: faker.internet.url(),
          type: 'document'
        }
      ], { probability: 0.3 }),
      readBy: []
    });
  }
  
  const createdAnnouncements = await Announcement.insertMany(announcements);
  console.log(`✅ Created ${createdAnnouncements.length} announcements`);
  return createdAnnouncements;
};

// Create specific demo users for testing
const createDemoUsers = async () => {
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const demoUsers = [
    {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@droseonline.com',
      password: hashedPassword,
      role: 'admin',
      phoneNumber: '+1-555-0001',
      isActive: true,
      academicInfo: {
        permissions: ['all'],
        groups: [],
        specialization: [],
        subjects: []
      }
    },
    {
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@droseonline.com',
      password: hashedPassword,
      role: 'teacher',
      phoneNumber: '+1-555-0002',
      isActive: true,
      academicInfo: {
        department: 'Computer Science',
        specialization: ['Database Systems', 'Web Development'],
        qualifications: ['PhD in Computer Science'],
        experience: 8,
        groups: [],
        subjects: []
      }
    },
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@student.droseonline.com',
      password: hashedPassword,
      role: 'student',
      phoneNumber: '+1-555-0003',
      isActive: true,
      academicInfo: {
        studentId: 'STU000001',
        year: 'Junior',
        major: 'Computer Science',
        gpa: 3.75,
        enrollmentDate: new Date('2022-09-01'),
        groups: [],
        subjects: []
      }
    }
  ];
  
  const createdDemoUsers = await User.insertMany(demoUsers);
  console.log(`✅ Created ${createdDemoUsers.length} demo users`);
  return createdDemoUsers;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    console.log(`📊 Configuration: ${CONFIG.STUDENT_COUNT} students, ${CONFIG.TEACHER_COUNT} teachers, ${CONFIG.COURSE_COUNT} courses`);
    
    await connectDB();
    await clearDatabase();
    
    // Create data in order of dependencies
    const academicYears = await createAcademicYears();
    const subjects = await createSubjects();
    const users = await createUsers();
    const demoUsers = await createDemoUsers();
    const groups = await createGroups(academicYears);
    const courses = await createCourses(subjects, users.teachers, groups, academicYears);
    
    // Assign relationships
    await assignStudentsToGroupsAndCourses(users.students, groups, courses);
    
    // Create activity data
    const assignments = await createAssignments(courses, users.teachers);
    const submissions = await createSubmissions(assignments, users.students);
    const attendanceRecords = await createAttendanceRecords(courses, users.students);
    const announcements = await createAnnouncements(users, courses);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`   👥 Users: ${users.admins.length + users.teachers.length + users.students.length + demoUsers.length}`);
    console.log(`   📚 Subjects: ${subjects.length}`);
    console.log(`   🏫 Groups: ${groups.length}`);
    console.log(`   📖 Courses: ${courses.length}`);
    console.log(`   📝 Assignments: ${assignments.length}`);
    console.log(`   📄 Submissions: ${submissions.length}`);
    console.log(`   ✅ Attendance Records: ${attendanceRecords.length}`);
    console.log(`   📢 Announcements: ${announcements.length}`);
    console.log(`   🗓️ Academic Years: ${academicYears.length}`);
    
    console.log('\n🔑 Demo Login Credentials:');
    console.log('   Admin: admin@droseonline.com / password123');
    console.log('   Teacher: sarah.johnson@droseonline.com / password123');
    console.log('   Student: emma.wilson@student.droseonline.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
