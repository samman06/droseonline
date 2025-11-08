const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Group = require('./models/Group');
const Course = require('./models/Course');
const AcademicYear = require('./models/AcademicYear');
const Assignment = require('./models/Assignment');
const Announcement = require('./models/Announcement');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function seedCoursesAssignmentsAnnouncements() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing data
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin found. Please run the user creation script first.');
      return;
    }

    const subjects = await Subject.find({ isActive: true }).limit(5);
    const teachers = await User.find({ role: 'teacher', isActive: true }).limit(5);
    const students = await User.find({ role: 'student', isActive: true });
    const groups = await Group.find({ isActive: true });

    if (subjects.length === 0 || teachers.length === 0) {
      console.error('❌ Not enough data. Please run seed-mock-data.js first.');
      return;
    }
    
    console.log(`✓ Found ${subjects.length} subjects, ${teachers.length} teachers, ${groups.length} groups`);

    console.log('\n📅 Creating Academic Year...');
    let academicYear = await AcademicYear.findOne({ isCurrent: true });
    
    if (!academicYear) {
      academicYear = new AcademicYear({
        name: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        semesters: [
          {
            name: 'fall',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-01-15'),
            isActive: true
          },
          {
            name: 'spring',
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-06-30'),
            isActive: false
          }
        ],
        isCurrent: true,
        isActive: true,
        createdBy: admin._id
      });
      await academicYear.save();
      console.log(`✓ Created Academic Year: ${academicYear.name} (${academicYear.code})`);
    } else {
      console.log(`✓ Using existing Academic Year: ${academicYear.name}`);
    }

    console.log('\n📚 Creating Courses...');
    const courses = [];
    const courseData = [
      {
        name: 'Mathematics - Advanced Algebra',
        description: 'Advanced mathematical concepts including quadratic equations, polynomials, and functions',
        creditHours: 4,
        maxStudents: 50
      },
      {
        name: 'Arabic Language & Literature',
        description: 'Comprehensive Arabic language course covering grammar, literature, and composition',
        creditHours: 3,
        maxStudents: 40
      },
      {
        name: 'English Language - Advanced',
        description: 'Advanced English language skills including reading, writing, listening, and speaking',
        creditHours: 3,
        maxStudents: 40
      },
      {
        name: 'Science - Physics & Chemistry',
        description: 'Introduction to physics and chemistry principles and laboratory experiments',
        creditHours: 4,
        maxStudents: 35
      },
      {
        name: 'Social Studies & Egyptian History',
        description: 'Egyptian history, geography, and social studies',
        creditHours: 2,
        maxStudents: 45
      }
    ];

    for (let i = 0; i < Math.min(courseData.length, teachers.length, subjects.length); i++) {
      const data = courseData[i];
      const teacher = teachers[i];
      const subject = subjects[i];
      
      const course = new Course({
        name: data.name,
        subject: subject._id,
        teacher: teacher._id,
        academicYear: academicYear._id,
        creditHours: data.creditHours,
        maxStudents: data.maxStudents,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        syllabus: {
          description: data.description,
          objectives: [
            'Master fundamental concepts',
            'Develop analytical thinking skills',
            'Apply knowledge to real-world problems',
            'Prepare for advanced studies'
          ]
        },
        assessmentStructure: [
          { type: 'midterm', name: 'Midterm Exam', weightage: 30, maxMarks: 100 },
          { type: 'final', name: 'Final Exam', weightage: 40, maxMarks: 100 },
          { type: 'assignment', name: 'Assignments', weightage: 20, maxMarks: 100 },
          { type: 'quiz', name: 'Participation & Quizzes', weightage: 10, maxMarks: 100 }
        ],
        groups: [], // Will be populated when groups are created/updated
        isActive: true,
        isPublished: true,
        createdBy: admin._id
      });

      await course.save();

      courses.push(course);
      console.log(`✓ Created Course: ${course.name} (${course.code})`);
    }

    console.log('\n📝 Creating Assignments...');
    const assignments = [];
    const assignmentTypes = ['homework', 'quiz', 'project', 'midterm', 'final'];
    const assignmentTitles = {
      homework: ['Chapter Review Homework', 'Practice Problems Set', 'Reading Assignment', 'Weekly Homework'],
      quiz: ['Unit Quiz', 'Pop Quiz', 'Chapter Quiz', 'Weekly Quiz'],
      project: ['Semester Project', 'Research Project', 'Group Project', 'Presentation Project'],
      midterm: ['Midterm Examination', 'Mid-Semester Test', 'Progress Evaluation'],
      final: ['Final Examination', 'End of Semester Exam', 'Comprehensive Final']
    };

    let assignmentCount = 0;
    for (const course of courses) {
      // Get groups for this course (may be empty for now)
      const courseGroups = await Group.find({ course: course._id });
      
      // If no groups, still create assignments but with empty group array
      const targetGroups = courseGroups.length > 0 ? courseGroups.map(g => g._id) : [];

      // Create 5-8 assignments per course
      const numAssignments = 5 + Math.floor(Math.random() * 4);
      
      for (let j = 0; j < numAssignments; j++) {
        const type = assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)];
        const titles = assignmentTitles[type];
        const title = titles[Math.floor(Math.random() * titles.length)] + ` ${j + 1}`;
        
        // Calculate dates
        const daysFromStart = 7 + (j * 14); // Spread assignments every 2 weeks
        const assignedDate = new Date('2025-09-01');
        assignedDate.setDate(assignedDate.getDate() + daysFromStart);
        
        const dueDate = new Date(assignedDate);
        dueDate.setDate(dueDate.getDate() + (type === 'quiz' ? 1 : type === 'homework' ? 7 : 14));
        
        const lateDeadline = new Date(dueDate);
        lateDeadline.setDate(lateDeadline.getDate() + 3);

        let maxPoints = 100;
        let weightage = 10;
        
        if (type === 'quiz') {
          maxPoints = 50;
          weightage = 5;
        } else if (type === 'homework') {
          maxPoints = 100;
          weightage = 10;
        } else if (type === 'project') {
          maxPoints = 200;
          weightage = 20;
        } else if (type === 'midterm') {
          maxPoints = 100;
          weightage = 30;
        } else if (type === 'final') {
          maxPoints = 100;
          weightage = 40;
        }

        const assignment = new Assignment({
          title: title,
          description: `This ${type} covers the material from the recent units and chapters. Please complete all questions carefully and submit before the deadline.`,
          instructions: `1. Read all questions carefully\n2. Show your work\n3. Submit in the specified format\n4. Late submissions will incur penalties`,
          course: course._id,
          teacher: course.teacher,
          groups: targetGroups,
          type: type,
          category: type === 'project' ? 'group' : 'individual',
          maxPoints: maxPoints,
          weightage: weightage,
          assignedDate: assignedDate,
          dueDate: dueDate,
          lateSubmissionDeadline: lateDeadline,
          submissionType: type === 'quiz' ? 'quiz' : 'file',
          allowedFileTypes: type === 'quiz' ? [] : ['pdf', 'doc', 'docx'],
          maxFileSize: 10,
          allowLateSubmission: type !== 'midterm' && type !== 'final',
          latePenalty: 10,
          status: dueDate > new Date() ? 'published' : 'closed'
        });

        // Add quiz questions for quiz assignments
        if (type === 'quiz') {
          const numQuestions = 5 + Math.floor(Math.random() * 6); // 5-10 questions
          for (let q = 0; q < numQuestions; q++) {
            assignment.questions.push({
              type: 'multiple_choice',
              question: `Question ${q + 1}: Sample question about the course material?`,
              options: [
                'Option A - First answer',
                'Option B - Second answer',
                'Option C - Third answer',
                'Option D - Fourth answer'
              ],
              correctAnswer: 'Option A - First answer',
              points: Math.ceil(maxPoints / numQuestions),
              explanation: 'This is the correct answer because...'
            });
          }
        }

        await assignment.save();
        assignments.push(assignment);
        assignmentCount++;
      }
      
      console.log(`✓ Created ${numAssignments} assignments for: ${course.name}`);
    }
    console.log(`✓ Total assignments created: ${assignmentCount}`);

    console.log('\n📢 Creating Announcements...');
    const announcements = [];
    
    const announcementData = [
      {
        title: 'Welcome to the New Academic Year 2025-2026',
        content: 'Welcome to all students and teachers! We are excited to start this new academic year. Please review your schedules and ensure all information is correct. If you have any questions, contact your advisor.',
        summary: 'Welcome message for the new academic year',
        type: 'general',
        priority: 'high',
        audience: 'all',
        isPinned: true
      },
      {
        title: 'Midterm Examination Schedule',
        content: 'The midterm examinations will be held from December 15-22, 2025. Please check your course schedules for specific exam times and locations. Study materials will be available on the course pages.',
        summary: 'Midterm exam dates announced',
        type: 'exam',
        priority: 'urgent',
        audience: 'students',
        isUrgent: true
      },
      {
        title: 'Library Hours Extended for Exam Period',
        content: 'During the examination period (December 10-25), the library will be open from 8:00 AM to 10:00 PM daily, including weekends. Additional study rooms are available for group study sessions.',
        summary: 'Extended library hours during exams',
        type: 'general',
        priority: 'normal',
        audience: 'all'
      },
      {
        title: 'Parent-Teacher Conference - November 2025',
        content: 'We will be holding parent-teacher conferences on November 20-21, 2025. Parents can schedule appointments with teachers through the online portal. This is a great opportunity to discuss student progress.',
        summary: 'Parent-teacher conference scheduled',
        type: 'event',
        priority: 'high',
        audience: 'all',
        eventDetails: {
          eventDate: new Date('2025-11-20'),
          startTime: '14:00',
          endTime: '18:00',
          location: 'School Main Building',
          registrationRequired: true,
          registrationDeadline: new Date('2025-11-15')
        }
      },
      {
        title: 'Assignment Submission Guidelines Updated',
        content: 'Please note the updated assignment submission guidelines. All assignments must be submitted through the online portal. Late submissions will be penalized according to the course policy. File formats accepted: PDF, DOC, DOCX.',
        summary: 'Updated assignment submission rules',
        type: 'assignment',
        priority: 'normal',
        audience: 'students'
      },
      {
        title: 'Professional Development Workshop for Teachers',
        content: 'A professional development workshop on modern teaching methodologies will be held on October 15, 2025. All teachers are encouraged to attend. Topics include digital learning tools, student engagement strategies, and assessment techniques.',
        summary: 'Teacher professional development workshop',
        type: 'event',
        priority: 'normal',
        audience: 'teachers',
        eventDetails: {
          eventDate: new Date('2025-10-15'),
          startTime: '10:00',
          endTime: '16:00',
          location: 'Conference Hall A',
          registrationRequired: true,
          registrationDeadline: new Date('2025-10-10')
        }
      },
      {
        title: 'School Closure - National Holiday',
        content: 'The school will be closed on October 6, 2025, in observance of the national holiday. Classes will resume on October 7, 2025. Have a great day off!',
        summary: 'School closure announcement',
        type: 'general',
        priority: 'high',
        audience: 'all',
        isPinned: true
      },
      {
        title: 'New Online Learning Resources Available',
        content: 'We have added new online learning resources to the platform including video tutorials, practice quizzes, and interactive exercises. Check your course pages to access these materials.',
        summary: 'New learning resources added',
        type: 'academic',
        priority: 'normal',
        audience: 'students',
        tags: ['resources', 'online-learning', 'e-learning']
      },
      {
        title: 'Student Achievement Recognition Ceremony',
        content: 'We will be holding a ceremony to recognize outstanding student achievements on December 1, 2025. Students who excelled in academics, sports, and community service will be honored. Parents and family members are invited to attend.',
        summary: 'Student recognition ceremony',
        type: 'event',
        priority: 'normal',
        audience: 'all',
        eventDetails: {
          eventDate: new Date('2025-12-01'),
          startTime: '15:00',
          endTime: '17:00',
          location: 'School Auditorium',
          registrationRequired: false
        }
      },
      {
        title: 'Winter Break Schedule',
        content: 'Winter break will begin on December 23, 2025, and classes will resume on January 6, 2026. Final grades for the fall semester will be published on December 20, 2025. Have a wonderful winter break!',
        summary: 'Winter break dates',
        type: 'general',
        priority: 'high',
        audience: 'all',
        isPinned: true
      }
    ];

    // Create general announcements
    for (const data of announcementData) {
      const announcement = new Announcement({
        title: data.title,
        content: data.content,
        summary: data.summary,
        author: admin._id,
        type: data.type,
        priority: data.priority,
        audience: data.audience,
        status: 'published',
        publishAt: new Date(),
        isUrgent: data.isUrgent || false,
        isPinned: data.isPinned || false,
        allowComments: true,
        tags: data.tags || [],
        eventDetails: data.eventDetails || undefined
      });

      await announcement.save();
      announcements.push(announcement);
      console.log(`✓ Created Announcement: ${announcement.title}`);
    }

    // Create course-specific announcements
    for (const course of courses.slice(0, 3)) { // Create for first 3 courses
      const courseGroups = await Group.find({ course: course._id });
      
      const announcement = new Announcement({
        title: `Important Update for ${course.name}`,
        content: `Dear students, this is an important update regarding ${course.name}. Please review the updated course materials and complete the assigned readings. If you have any questions, please contact your teacher during office hours.`,
        summary: `Course update for ${course.name}`,
        author: course.teacher,
        type: 'academic',
        priority: 'normal',
        audience: courseGroups.length > 0 ? 'specific_groups' : 'specific_courses',
        targetGroups: courseGroups.map(g => g._id),
        targetCourses: [course._id],
        status: 'published',
        publishAt: new Date(),
        allowComments: true,
        tags: ['course-update', course.subject.toString()]
      });

      await announcement.save();
      announcements.push(announcement);
      console.log(`✓ Created Course Announcement: ${announcement.title}`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 1 Academic Year: ${academicYear.name} (${academicYear.code})`);
    console.log(`   - ${courses.length} Courses created`);
    console.log(`   - ${assignments.length} Assignments created`);
    console.log(`   - ${announcements.length} Announcements created`);
    
    console.log('\n📚 Sample Courses:');
    courses.slice(0, 3).forEach(c => {
      console.log(`   ${c.name} (${c.code})`);
    });
    
    console.log('\n📝 Assignment Types Distribution:');
    const assignmentsByType = {};
    assignments.forEach(a => {
      assignmentsByType[a.type] = (assignmentsByType[a.type] || 0) + 1;
    });
    Object.entries(assignmentsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

seedCoursesAssignmentsAnnouncements();

