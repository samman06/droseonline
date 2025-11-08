const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  TEACHER_COUNT: 30,
  STUDENT_COUNT: 200,
  SUBJECT_COUNT: 25,
  GROUP_COUNT: 15,
  COURSE_COUNT: 40,
  ASSIGNMENT_COUNT: 100,
  SUBMISSION_COUNT: 500,
  ATTENDANCE_RECORDS: 1000,
  ANNOUNCEMENT_COUNT: 50
};

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Sample data
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Robert', 'Maria', 'James', 'Anna', 'William', 'Emily', 'Daniel', 'Jessica', 'Matthew', 'Ashley', 'Andrew', 'Amanda', 'Joshua', 'Stephanie', 'Ryan', 'Nicole', 'Brandon', 'Elizabeth', 'Jason', 'Helen', 'Justin', 'Michelle'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const SUBJECTS_DATA = [
  { name: 'Advanced Mathematics', code: 'MATH401', description: 'Calculus and Linear Algebra', credits: 4, department: 'Mathematics' },
  { name: 'Computer Science Fundamentals', code: 'CS101', description: 'Programming and Algorithms', credits: 3, department: 'Computer Science' },
  { name: 'Data Structures', code: 'CS201', description: 'Arrays, Lists, Trees, and Graphs', credits: 4, department: 'Computer Science' },
  { name: 'Database Systems', code: 'CS301', description: 'SQL and Database Design', credits: 3, department: 'Computer Science' },
  { name: 'Web Development', code: 'CS250', description: 'HTML, CSS, JavaScript', credits: 3, department: 'Computer Science' },
  { name: 'Physics I', code: 'PHY101', description: 'Mechanics and Thermodynamics', credits: 4, department: 'Physics' },
  { name: 'Physics II', code: 'PHY201', description: 'Electricity and Magnetism', credits: 4, department: 'Physics' },
  { name: 'Chemistry I', code: 'CHEM101', description: 'General Chemistry', credits: 3, department: 'Chemistry' },
  { name: 'Biology I', code: 'BIO101', description: 'Cell Biology and Genetics', credits: 3, department: 'Biology' },
  { name: 'English Literature', code: 'ENG201', description: 'Classical Literature', credits: 3, department: 'English' },
  { name: 'World History', code: 'HIST101', description: 'Ancient to Modern History', credits: 3, department: 'History' },
  { name: 'Psychology 101', code: 'PSY101', description: 'Introduction to Psychology', credits: 3, department: 'Psychology' },
  { name: 'Business Administration', code: 'BUS101', description: 'Management Principles', credits: 3, department: 'Business' },
  { name: 'Marketing', code: 'BUS201', description: 'Marketing Fundamentals', credits: 3, department: 'Business' },
  { name: 'Statistics', code: 'STAT201', description: 'Statistical Analysis', credits: 4, department: 'Mathematics' },
  { name: 'Calculus I', code: 'MATH201', description: 'Differential Calculus', credits: 4, department: 'Mathematics' },
  { name: 'Calculus II', code: 'MATH301', description: 'Integral Calculus', credits: 4, department: 'Mathematics' },
  { name: 'Software Engineering', code: 'CS401', description: 'Software Development Lifecycle', credits: 4, department: 'Computer Science' },
  { name: 'Network Security', code: 'CS451', description: 'Cybersecurity Fundamentals', credits: 3, department: 'Computer Science' },
  { name: 'Artificial Intelligence', code: 'CS501', description: 'AI and Machine Learning', credits: 4, department: 'Computer Science' },
  { name: 'Economics', code: 'ECON101', description: 'Microeconomics', credits: 3, department: 'Economics' },
  { name: 'Philosophy', code: 'PHIL101', description: 'Introduction to Philosophy', credits: 3, department: 'Philosophy' },
  { name: 'Art History', code: 'ART101', description: 'Western Art History', credits: 3, department: 'Art' },
  { name: 'Music Theory', code: 'MUS101', description: 'Basic Music Theory', credits: 3, department: 'Music' },
  { name: 'Physical Education', code: 'PE101', description: 'Fitness and Wellness', credits: 2, department: 'Physical Education' }
];

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Psychology', 'Business', 'Art', 'Music', 'Philosophy', 'Economics'];

const ASSIGNMENT_TYPES = ['homework', 'quiz', 'midterm', 'final', 'project', 'presentation', 'lab', 'essay', 'other'];

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];

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
const createAcademicYears = async (createdBy) => {
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  
  for (let i = 0; i < 3; i++) {
    const startYear = currentYear - 1 + i;
    const endYear = startYear + 1;
    
    academicYears.push({
      name: `Academic Year ${startYear}-${endYear}`,
      code: `AY${startYear}-${endYear.toString().slice(-2)}`,
      startDate: new Date(startYear, 8, 1), // September 1st
      endDate: new Date(endYear, 5, 30), // June 30th
      isCurrent: i === 1, // Middle year is current
      isActive: true,
      createdBy: createdBy, // Add the required createdBy field
      semesters: [
        {
          name: 'fall',
          startDate: new Date(startYear, 8, 1),
          endDate: new Date(startYear, 11, 20),
          isActive: i === 1
        },
        {
          name: 'spring',
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
const createSubjects = async (createdBy) => {
  const subjects = SUBJECTS_DATA.map(subject => ({
    ...subject,
    type: 'core', // Add required type field
    level: 'intermediate', // Add level field
    isActive: true,
    prerequisites: [],
    createdBy: createdBy // Add required createdBy field
  }));
  
  const createdSubjects = await Subject.insertMany(subjects);
  console.log(`✅ Created ${createdSubjects.length} subjects`);
  return createdSubjects;
};

// Create Users
const createUsers = async () => {
  const users = [];
  
  // Create Admins
  for (let i = 0; i < CONFIG.ADMIN_COUNT; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@admin.droseonline.com`;
    
    // Hash password properly
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'admin',
      phoneNumber: `+1-555-${String(getRandomInt(1000, 9999))}`,
      dateOfBirth: getRandomDate(new Date(1970, 0, 1), new Date(1990, 11, 31)),
      address: {
        street: `${getRandomInt(100, 9999)} Main St`,
        city: getRandomElement(CITIES),
        state: 'NY',
        zipCode: String(getRandomInt(10000, 99999)),
        country: 'USA'
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
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@teacher.droseonline.com`;
    const department = getRandomElement(DEPARTMENTS);
    
    // Hash password properly
    const hashedPassword = await bcrypt.hash('teacher123', 12);
    
    users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'teacher',
      phoneNumber: `+1-555-${String(getRandomInt(1000, 9999))}`,
      dateOfBirth: getRandomDate(new Date(1970, 0, 1), new Date(1990, 11, 31)),
      address: {
        street: `${getRandomInt(100, 9999)} Academic Ave`,
        city: getRandomElement(CITIES),
        state: 'NY',
        zipCode: String(getRandomInt(10000, 99999)),
        country: 'USA'
      },
      isActive: true,
      academicInfo: {
        department,
        specialization: [department],
        qualifications: ['PhD', 'Masters'],
        experience: getRandomInt(1, 15),
        groups: [],
        subjects: []
      }
    });
  }
  
  // Create Students
  for (let i = 0; i < CONFIG.STUDENT_COUNT; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.droseonline.com`;
    const year = getRandomElement(['Freshman', 'Sophomore', 'Junior', 'Senior']);
    const major = getRandomElement(DEPARTMENTS);
    
    // Hash password properly
    const hashedPassword = await bcrypt.hash('student123', 12);
    
    users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'student',
      phoneNumber: `+1-555-${String(getRandomInt(1000, 9999))}`,
      dateOfBirth: getRandomDate(new Date(1995, 0, 1), new Date(2005, 11, 31)),
      address: {
        street: `${getRandomInt(100, 9999)} Student Blvd`,
        city: getRandomElement(CITIES),
        state: 'NY',
        zipCode: String(getRandomInt(10000, 99999)),
        country: 'USA'
      },
      isActive: true,
      academicInfo: {
        studentId: `STU${String(i + 1).padStart(6, '0')}`,
        year,
        major,
        gpa: parseFloat((Math.random() * 2 + 2).toFixed(2)), // GPA between 2.0 and 4.0
        enrollmentDate: getRandomDate(new Date(2020, 8, 1), new Date(2024, 8, 1)),
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
const createGroups = async (academicYears, createdBy) => {
  const groups = [];
  const activeYear = academicYears.find(year => year.isCurrent);
  
  for (let i = 0; i < CONFIG.GROUP_COUNT; i++) {
    const year = getRandomElement(['Freshman', 'Sophomore', 'Junior', 'Senior']);
    const section = getRandomElement(['A', 'B', 'C']);
    const department = getRandomElement(DEPARTMENTS);
    
    groups.push({
      name: `${department} ${year} - Section ${section}`,
      code: `${department.substring(0, 3).toUpperCase()}${year.substring(0, 1)}${section}${i}`,
      description: `${year} students in ${department} department`,
      academicYear: activeYear._id,
      level: year.toLowerCase(), // Add required level field
      semester: 'fall', // Add required semester field
      capacity: getRandomInt(25, 40),
      students: [],
      isActive: true,
      createdBy: createdBy, // Add required createdBy field
      schedule: {
        days: getRandomElements(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], getRandomInt(2, 4)),
        startTime: getRandomElement(['08:00', '09:00', '10:00', '11:00']),
        endTime: getRandomElement(['12:00', '13:00', '14:00', '15:00']),
        room: `Room ${getRandomInt(101, 505)}`
      }
    });
  }
  
  const createdGroups = await Group.insertMany(groups);
  console.log(`✅ Created ${createdGroups.length} groups`);
  return createdGroups;
};

// Create Courses and assign students
const createCoursesAndAssignments = async (subjects, teachers, groups, students, academicYears, createdBy) => {
  const courses = [];
  const activeYear = academicYears.find(year => year.isCurrent);
  
  for (let i = 0; i < CONFIG.COURSE_COUNT; i++) {
    const subject = getRandomElement(subjects);
    const teacher = getRandomElement(teachers);
    const courseGroups = getRandomElements(groups, getRandomInt(1, 2));
    
    // Get students from the assigned groups
    const enrolledStudents = getRandomElements(students, getRandomInt(15, 30));
    
    const course = {
      name: `${subject.name} - Section ${String.fromCharCode(65 + i % 26)}`,
      code: `${subject.code}-${String(i + 1).padStart(3, '0')}`,
      description: subject.description,
      subject: subject._id,
      teacher: teacher._id,
      groups: courseGroups.map(g => g._id),
      academicYear: activeYear._id,
      semester: getRandomElement(['fall', 'spring']),
      credits: subject.credits,
      capacity: 35,
      enrolledStudents: enrolledStudents.map(s => s._id),
      schedule: {
        days: getRandomElements(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], getRandomInt(2, 3)),
        startTime: getRandomElement(['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']),
        endTime: getRandomElement(['09:30', '10:30', '11:30', '12:30', '14:30', '15:30']),
        room: `Room ${getRandomInt(101, 505)}`
      },
      isActive: true,
      startDate: new Date(2024, 8, 1),
      endDate: new Date(2025, 4, 30),
      createdBy: createdBy // Add required createdBy field
    };
    
    courses.push(course);
  }
  
  const createdCourses = await Course.insertMany(courses);
  console.log(`✅ Created ${createdCourses.length} courses`);
  return createdCourses;
};

// Create Assignments
const createAssignments = async (courses, teachers) => {
  const assignments = [];
  
  for (let i = 0; i < CONFIG.ASSIGNMENT_COUNT; i++) {
    const course = getRandomElement(courses);
    const teacher = getRandomElement(teachers);
    const assignedDate = getRandomDate(new Date(2024, 8, 1), new Date());
    const dueDate = new Date(assignedDate.getTime() + getRandomInt(7, 30) * 24 * 60 * 60 * 1000);
    
    assignments.push({
      title: `${getRandomElement(ASSIGNMENT_TYPES)}: ${getRandomElement(['Data Analysis', 'Research Project', 'Problem Set', 'Case Study', 'Lab Exercise'])}`,
      description: 'Complete the assigned tasks according to the provided instructions.',
      course: course._id,
      teacher: teacher._id,
      type: getRandomElement(ASSIGNMENT_TYPES),
      maxPoints: getRandomInt(50, 100), // Use maxPoints instead of totalPoints
      assignedDate,
      dueDate,
      status: getRandomElement(['published', 'draft']),
      instructions: 'Follow the guidelines provided in class and submit your work on time.',
      resources: []
    });
  }
  
  const createdAssignments = await Assignment.insertMany(assignments);
  console.log(`✅ Created ${createdAssignments.length} assignments`);
  return createdAssignments;
};

// Create demo users with known credentials
const createDemoUsers = async () => {
  const demoUsers = [
    {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@droseonline.com',
      password: await bcrypt.hash('admin123', 12),
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
      password: await bcrypt.hash('teacher123', 12),
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
      password: await bcrypt.hash('student123', 12),
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
  console.log(`✅ Created ${createdDemoUsers.length} demo users with known credentials`);
  return createdDemoUsers;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    console.log(`📊 Configuration: ${CONFIG.STUDENT_COUNT} students, ${CONFIG.TEACHER_COUNT} teachers, ${CONFIG.COURSE_COUNT} courses`);
    
    await connectDB();
    await clearDatabase();
    
    // Create demo users first (including admin for createdBy field)
    const demoUsers = await createDemoUsers();
    const adminUser = demoUsers.find(user => user.role === 'admin');
    
    // Create data in order of dependencies
    const academicYears = await createAcademicYears(adminUser._id);
    const subjects = await createSubjects(adminUser._id);
    const users = await createUsers();
    const groups = await createGroups(academicYears, adminUser._id);
    const courses = await createCoursesAndAssignments(subjects, users.teachers, groups, users.students, academicYears, adminUser._id);
    const assignments = await createAssignments(courses, users.teachers);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`   👥 Users: ${users.admins.length + users.teachers.length + users.students.length + demoUsers.length}`);
    console.log(`   📚 Subjects: ${subjects.length}`);
    console.log(`   🏫 Groups: ${groups.length}`);
    console.log(`   📖 Courses: ${courses.length}`);
    console.log(`   📝 Assignments: ${assignments.length}`);
    console.log(`   🗓️ Academic Years: ${academicYears.length}`);
    
    console.log('\n🔑 Demo Login Credentials:');
    console.log('   Admin: admin@droseonline.com / admin123');
    console.log('   Teacher: sarah.johnson@droseonline.com / teacher123');
    console.log('   Student: emma.wilson@student.droseonline.com / student123');
    
    console.log('\n🔑 Generated User Credentials:');
    console.log('   Admins: [firstname.lastname][0-4]@admin.droseonline.com / admin123');
    console.log('   Teachers: [firstname.lastname][0-29]@teacher.droseonline.com / teacher123');
    console.log('   Students: [firstname.lastname][0-199]@student.droseonline.com / student123');
    
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
