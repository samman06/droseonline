const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function createDemoData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Clear existing data
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Cleared existing database');

    // Import models
    const User = require('./models/User');
    const Subject = require('./models/Subject');
    const AcademicYear = require('./models/AcademicYear');
    const Group = require('./models/Group');
    const Course = require('./models/Course');
    const Assignment = require('./models/Assignment');
    const Announcement = require('./models/Announcement');

    console.log('📚 Creating Drose Online Demo Data...\n');

    // Create Academic Year
    const academicYear = new AcademicYear({
      name: 'Academic Year 2024-2025',
      code: 'AY2024-25',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
      isActive: true,
      semesters: [
        {
          name: 'fall',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31'),
          isActive: true
        },
        {
          name: 'spring',
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-06-30'),
          isActive: false
        }
      ],
      createdBy: new mongoose.Types.ObjectId()
    });
    await academicYear.save();
    console.log('✅ Created Academic Year: 2024-2025');

    // Create Admin Users
    const adminUsers = [
      {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@droseonline.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        academicInfo: {
          permissions: ['all']
        }
      },
      {
        firstName: 'John',
        lastName: 'Manager',
        email: 'john.manager@droseonline.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        academicInfo: {
          permissions: ['user_management', 'reports', 'system_settings']
        }
      }
    ];

    const savedAdmins = [];
    for (const admin of adminUsers) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      const newAdmin = new User({ ...admin, password: hashedPassword });
      await newAdmin.save();
      savedAdmins.push(newAdmin);
      console.log(`✅ Created Admin: ${admin.email}`);
    }

    // Create Subjects
    const subjects = [
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Fundamentals of computer science and programming',
        credits: 3,
        type: 'core',
        level: 'beginner',
        isActive: true,
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Advanced Mathematics',
        code: 'MATH201',
        description: 'Advanced mathematics concepts for engineering',
        credits: 4,
        type: 'core',
        level: 'intermediate',
        isActive: true,
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Database Systems',
        code: 'CS301',
        description: 'Design and implementation of database systems',
        credits: 3,
        type: 'core',
        level: 'advanced',
        isActive: true,
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Web Development',
        code: 'CS250',
        description: 'Modern web development with frameworks',
        credits: 3,
        type: 'elective',
        level: 'intermediate',
        isActive: true,
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Data Structures',
        code: 'CS201',
        description: 'Fundamental data structures and algorithms',
        credits: 4,
        type: 'core',
        level: 'intermediate',
        isActive: true,
        createdBy: savedAdmins[0]._id
      }
    ];

    const savedSubjects = [];
    for (const subject of subjects) {
      const newSubject = new Subject(subject);
      await newSubject.save();
      savedSubjects.push(newSubject);
      console.log(`✅ Created Subject: ${subject.name} (${subject.code})`);
    }

    // Create Teacher Users
    const teacherUsers = [
      {
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@droseonline.com',
        password: 'teacher123',
        role: 'teacher',
        isActive: true,
        phoneNumber: '+1-555-0101',
        academicInfo: {
          employeeId: 'EMP001',
          department: 'Computer Science',
          specialization: ['Programming', 'Software Engineering'],
          hireDate: new Date('2020-08-15'),
          subjects: [savedSubjects[0]._id, savedSubjects[2]._id]
        }
      },
      {
        firstName: 'Prof. Michael',
        lastName: 'Davis',
        email: 'michael.davis@droseonline.com',
        password: 'teacher123',
        role: 'teacher',
        isActive: true,
        phoneNumber: '+1-555-0102',
        academicInfo: {
          employeeId: 'EMP002',
          department: 'Mathematics',
          specialization: ['Applied Mathematics', 'Statistics'],
          hireDate: new Date('2019-01-10'),
          subjects: [savedSubjects[1]._id]
        }
      },
      {
        firstName: 'Dr. Emily',
        lastName: 'Wilson',
        email: 'emily.wilson@droseonline.com',
        password: 'teacher123',
        role: 'teacher',
        isActive: true,
        phoneNumber: '+1-555-0103',
        academicInfo: {
          employeeId: 'EMP003',
          department: 'Computer Science',
          specialization: ['Web Development', 'UI/UX Design'],
          hireDate: new Date('2021-03-20'),
          subjects: [savedSubjects[3]._id, savedSubjects[4]._id]
        }
      }
    ];

    const savedTeachers = [];
    for (const teacher of teacherUsers) {
      const hashedPassword = await bcrypt.hash(teacher.password, 12);
      const newTeacher = new User({ ...teacher, password: hashedPassword });
      await newTeacher.save();
      savedTeachers.push(newTeacher);
      console.log(`✅ Created Teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    }

    // Create Groups
    const groups = [
      {
        name: 'Computer Science Group A',
        code: 'CS-A-24',
        description: 'First year computer science students - Group A',
        academicYear: academicYear._id,
        level: 'freshman',
        semester: 'fall',
        capacity: 30,
        currentEnrollment: 0,
        students: [],
        isActive: true,
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Computer Science Group B',
        code: 'CS-B-24',
        description: 'First year computer science students - Group B',
        academicYear: academicYear._id,
        level: 'freshman',
        semester: 'fall',
        capacity: 25,
        currentEnrollment: 0,
        students: [],
        isActive: true,
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Advanced CS Group',
        code: 'CS-ADV-24',
        description: 'Advanced computer science students',
        academicYear: academicYear._id,
        level: 'junior',
        semester: 'fall',
        capacity: 20,
        currentEnrollment: 0,
        students: [],
        isActive: true,
        createdBy: savedAdmins[0]._id
      }
    ];

    const savedGroups = [];
    for (const group of groups) {
      const newGroup = new Group(group);
      await newGroup.save();
      savedGroups.push(newGroup);
      console.log(`✅ Created Group: ${group.name} (${group.code})`);
    }

    // Create Student Users
    const studentUsers = [
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@student.droseonline.com',
        password: 'student123',
        role: 'student',
        isActive: true,
        phoneNumber: '+1-555-1001',
        academicInfo: {
          studentId: 'STU001',
          currentYear: 1,
          enrollmentDate: new Date('2024-09-01'),
          groups: [savedGroups[0]._id]
        }
      },
      {
        firstName: 'James',
        lastName: 'Brown',
        email: 'james.brown@student.droseonline.com',
        password: 'student123',
        role: 'student',
        isActive: true,
        phoneNumber: '+1-555-1002',
        academicInfo: {
          studentId: 'STU002',
          currentYear: 1,
          enrollmentDate: new Date('2024-09-01'),
          groups: [savedGroups[0]._id]
        }
      },
      {
        firstName: 'Sophia',
        lastName: 'Garcia',
        email: 'sophia.garcia@student.droseonline.com',
        password: 'student123',
        role: 'student',
        isActive: true,
        phoneNumber: '+1-555-1003',
        academicInfo: {
          studentId: 'STU003',
          currentYear: 1,
          enrollmentDate: new Date('2024-09-01'),
          groups: [savedGroups[1]._id]
        }
      },
      {
        firstName: 'Alex',
        lastName: 'Rodriguez',
        email: 'alex.rodriguez@student.droseonline.com',
        password: 'student123',
        role: 'student',
        isActive: true,
        phoneNumber: '+1-555-1004',
        academicInfo: {
          studentId: 'STU004',
          currentYear: 3,
          enrollmentDate: new Date('2022-09-01'),
          groups: [savedGroups[2]._id]
        }
      },
      {
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya.patel@student.droseonline.com',
        password: 'student123',
        role: 'student',
        isActive: true,
        phoneNumber: '+1-555-1005',
        academicInfo: {
          studentId: 'STU005',
          currentYear: 1,
          enrollmentDate: new Date('2024-09-01'),
          groups: [savedGroups[1]._id]
        }
      },
      {
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@student.droseonline.com',
        password: 'student123',
        role: 'student',
        isActive: true,
        phoneNumber: '+1-555-1006',
        academicInfo: {
          studentId: 'STU006',
          currentYear: 3,
          enrollmentDate: new Date('2022-09-01'),
          groups: [savedGroups[2]._id]
        }
      }
    ];

    const savedStudents = [];
    for (const student of studentUsers) {
      const hashedPassword = await bcrypt.hash(student.password, 12);
      const newStudent = new User({ ...student, password: hashedPassword });
      await newStudent.save();
      savedStudents.push(newStudent);
      console.log(`✅ Created Student: ${student.firstName} ${student.lastName} (${student.email})`);
    }

    // Update groups with students
    await Group.findByIdAndUpdate(savedGroups[0]._id, {
      $push: {
        students: {
          $each: [
            { student: savedStudents[0]._id, enrollmentDate: new Date(), status: 'active' },
            { student: savedStudents[1]._id, enrollmentDate: new Date(), status: 'active' }
          ]
        }
      },
      currentEnrollment: 2
    });

    await Group.findByIdAndUpdate(savedGroups[1]._id, {
      $push: {
        students: {
          $each: [
            { student: savedStudents[2]._id, enrollmentDate: new Date(), status: 'active' },
            { student: savedStudents[4]._id, enrollmentDate: new Date(), status: 'active' }
          ]
        }
      },
      currentEnrollment: 2
    });

    await Group.findByIdAndUpdate(savedGroups[2]._id, {
      $push: {
        students: {
          $each: [
            { student: savedStudents[3]._id, enrollmentDate: new Date(), status: 'active' },
            { student: savedStudents[5]._id, enrollmentDate: new Date(), status: 'active' }
          ]
        }
      },
      currentEnrollment: 2
    });

    console.log('✅ Updated groups with student enrollments');

    // Create Courses
    const courses = [
      {
        name: 'Introduction to Programming',
        code: 'CS101-F24',
        subject: savedSubjects[0]._id,
        teacher: savedTeachers[0]._id,
        groups: [savedGroups[0]._id, savedGroups[1]._id],
        academicYear: academicYear._id,
        semester: 'fall',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        isPublished: true,
        createdBy: savedAdmins[0]._id,
        schedule: [
          {
            day: 'monday',
            startTime: '09:00',
            endTime: '10:30',
            room: 'CS-101',
            type: 'lecture'
          },
          {
            day: 'wednesday',
            startTime: '09:00',
            endTime: '10:30',
            room: 'CS-101',
            type: 'lecture'
          }
        ]
      },
      {
        name: 'Advanced Mathematics',
        code: 'MATH201-F24',
        subject: savedSubjects[1]._id,
        teacher: savedTeachers[1]._id,
        groups: [savedGroups[0]._id, savedGroups[1]._id],
        academicYear: academicYear._id,
        semester: 'fall',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        isPublished: true,
        createdBy: savedAdmins[0]._id,
        schedule: [
          {
            day: 'tuesday',
            startTime: '10:00',
            endTime: '11:30',
            room: 'MATH-201',
            type: 'lecture'
          },
          {
            day: 'thursday',
            startTime: '10:00',
            endTime: '11:30',
            room: 'MATH-201',
            type: 'lecture'
          }
        ]
      },
      {
        name: 'Database Systems',
        code: 'CS301-F24',
        subject: savedSubjects[2]._id,
        teacher: savedTeachers[0]._id,
        groups: [savedGroups[2]._id],
        academicYear: academicYear._id,
        semester: 'fall',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
        isPublished: true,
        createdBy: savedAdmins[0]._id,
        schedule: [
          {
            day: 'tuesday',
            startTime: '14:00',
            endTime: '15:30',
            room: 'CS-301',
            type: 'lecture'
          },
          {
            day: 'friday',
            startTime: '14:00',
            endTime: '16:00',
            room: 'CS-LAB1',
            type: 'lab'
          }
        ]
      }
    ];

    const savedCourses = [];
    for (const course of courses) {
      const newCourse = new Course(course);
      await newCourse.save();
      savedCourses.push(newCourse);
      console.log(`✅ Created Course: ${course.name} (${course.code})`);
    }

    // Create Sample Assignments
    const assignments = [
      {
        title: 'Programming Basics - Hello World',
        description: 'Create your first program that prints "Hello, World!" to the console',
        instructions: 'Write a simple program in any programming language that outputs "Hello, World!"',
        course: savedCourses[0]._id,
        teacher: savedTeachers[0]._id,
        groups: [savedGroups[0]._id, savedGroups[1]._id],
        type: 'homework',
        category: 'individual',
        maxPoints: 10,
        weightage: 5,
        assignedDate: new Date('2024-10-01'),
        dueDate: new Date('2024-10-15'),
        submissionType: 'file',
        allowedFileTypes: ['py', 'js', 'java', 'cpp', 'txt'],
        status: 'published'
      },
      {
        title: 'Mathematics Quiz 1',
        description: 'Quiz covering basic algebra and calculus concepts',
        instructions: 'Complete the quiz within the time limit. Each question is worth equal points.',
        course: savedCourses[1]._id,
        teacher: savedTeachers[1]._id,
        groups: [savedGroups[0]._id, savedGroups[1]._id],
        type: 'quiz',
        category: 'individual',
        maxPoints: 50,
        weightage: 15,
        assignedDate: new Date('2024-10-05'),
        dueDate: new Date('2024-10-20'),
        submissionType: 'quiz',
        status: 'published',
        quizSettings: {
          timeLimit: 60,
          questionsPerPage: 1,
          randomizeQuestions: true,
          maxAttempts: 1
        },
        questions: [
          {
            type: 'multiple_choice',
            question: 'What is the derivative of x²?',
            options: ['2x', 'x²', '2', 'x'],
            correctAnswer: '2x',
            points: 10
          },
          {
            type: 'multiple_choice',
            question: 'Solve for x: 2x + 5 = 13',
            options: ['4', '3', '5', '6'],
            correctAnswer: '4',
            points: 10
          }
        ]
      },
      {
        title: 'Database Design Project',
        description: 'Design a database schema for a library management system',
        instructions: 'Create an ER diagram and implement the database schema with proper relationships',
        course: savedCourses[2]._id,
        teacher: savedTeachers[0]._id,
        groups: [savedGroups[2]._id],
        type: 'project',
        category: 'group',
        maxPoints: 100,
        weightage: 25,
        assignedDate: new Date('2024-10-10'),
        dueDate: new Date('2024-11-30'),
        submissionType: 'file',
        allowedFileTypes: ['pdf', 'sql', 'docx'],
        status: 'published'
      }
    ];

    for (const assignment of assignments) {
      const newAssignment = new Assignment(assignment);
      await newAssignment.save();
      console.log(`✅ Created Assignment: ${assignment.title}`);
    }

    // Create Sample Announcements
    const announcements = [
      {
        title: 'Welcome to the New Academic Year!',
        content: 'Welcome to Drose Online Educational Management System! We are excited to have you as part of our learning community.',
        summary: 'Welcome message for new academic year',
        author: savedAdmins[0]._id,
        type: 'general',
        priority: 'high',
        audience: 'all',
        status: 'published',
        publishAt: new Date(),
        isPinned: true
      },
      {
        title: 'CS101 - First Assignment Released',
        content: 'The first programming assignment has been released. Please check your assignments section for details.',
        summary: 'New assignment available',
        author: savedTeachers[0]._id,
        type: 'assignment',
        priority: 'normal',
        audience: 'specific_groups',
        targetGroups: [savedGroups[0]._id, savedGroups[1]._id],
        status: 'published',
        publishAt: new Date()
      },
      {
        title: 'Math Quiz Next Week',
        content: 'Don\'t forget about the mathematics quiz scheduled for next week. Review chapters 1-3.',
        summary: 'Upcoming math quiz reminder',
        author: savedTeachers[1]._id,
        type: 'exam',
        priority: 'high',
        audience: 'specific_groups',
        targetGroups: [savedGroups[0]._id, savedGroups[1]._id],
        status: 'published',
        publishAt: new Date()
      }
    ];

    for (const announcement of announcements) {
      const newAnnouncement = new Announcement(announcement);
      await newAnnouncement.save();
      console.log(`✅ Created Announcement: ${announcement.title}`);
    }

    console.log('\n🎉 Demo data creation completed successfully!\n');

    // Display login credentials
    console.log('📋 LOGIN CREDENTIALS:\n');
    
    console.log('👤 ADMINISTRATORS:');
    console.log('   📧 admin@droseonline.com / 🔑 admin123 (System Admin)');
    console.log('   📧 john.manager@droseonline.com / 🔑 admin123 (Manager)\n');
    
    console.log('👨‍🏫 TEACHERS:');
    console.log('   📧 sarah.johnson@droseonline.com / 🔑 teacher123 (CS Professor)');
    console.log('   📧 michael.davis@droseonline.com / 🔑 teacher123 (Math Professor)');
    console.log('   📧 emily.wilson@droseonline.com / 🔑 teacher123 (Web Dev Professor)\n');
    
    console.log('👨‍🎓 STUDENTS:');
    console.log('   📧 emma.wilson@student.droseonline.com / 🔑 student123 (CS Group A)');
    console.log('   📧 james.brown@student.droseonline.com / 🔑 student123 (CS Group A)');
    console.log('   📧 sophia.garcia@student.droseonline.com / 🔑 student123 (CS Group B)');
    console.log('   📧 maya.patel@student.droseonline.com / 🔑 student123 (CS Group B)');
    console.log('   📧 alex.rodriguez@student.droseonline.com / 🔑 student123 (Advanced CS)');
    console.log('   📧 david.kim@student.droseonline.com / 🔑 student123 (Advanced CS)\n');

    console.log('🌐 ACCESS POINTS:');
    console.log('   Frontend: http://localhost:4200');
    console.log('   Backend:  http://localhost:5000');
    console.log('   API Health: http://localhost:5000/api/health\n');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createDemoData();
