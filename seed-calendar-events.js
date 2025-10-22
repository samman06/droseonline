require('dotenv').config();
const mongoose = require('mongoose');
const Assignment = require('./models/Assignment');
const Announcement = require('./models/Announcement');
const Group = require('./models/Group');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

// Helper to get date for calendar events
const getDate = (daysFromNow, hours = 0, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

async function seedCalendarEvents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get ALL teachers
    const teachers = await User.find({ role: 'teacher' });
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found. Please run seed-mock-data.js first');
      process.exit(1);
    }

    console.log(`\n📅 Creating Calendar Events for ${teachers.length} teachers...\n`);
    
    let totalCreated = 0;

    // Loop through each teacher
    for (const teacher of teachers) {
      console.log(`\n👨‍🏫 Processing teacher: ${teacher.firstName} ${teacher.lastName}`);
      
      // Get teacher's courses first
      const Course = require('./models/Course');
      const teacherCourses = await Course.find({ teacher: teacher._id });
      
      if (teacherCourses.length === 0) {
        console.log(`   ⚠️  No courses found for this teacher, skipping...`);
        continue;
      }
      
      const courseIds = teacherCourses.map(c => c._id);
      
      // Get groups for teacher's courses
      const teacherGroups = await Group.find({ course: { $in: courseIds } }).populate('course');
      
      if (teacherGroups.length === 0) {
        console.log(`   ⚠️  No groups found for this teacher's courses, skipping...`);
        continue;
      }
      
      console.log(`   📚 Found ${teacherGroups.length} group(s) across ${teacherCourses.length} course(s)`);

      // Select up to 2 groups for this teacher
      const group1 = teacherGroups[0];
      const group2 = teacherGroups.length > 1 ? teacherGroups[1] : teacherGroups[0];

      // 1. Create Assignments
      const assignments = [
        {
          title: `Chapter 5 Homework - ${group1.name}`,
          description: 'Complete exercises 1-20 from Chapter 5',
          type: 'homework',
          dueDate: getDate(2, 23, 59),
          maxPoints: 50,
          course: group1.course._id,
          groups: [group1._id],
          status: 'published',
          createdBy: teacher._id
        },
        {
          title: `Research Essay Draft - ${group1.name}`,
          description: 'Submit first draft of your research essay',
          type: 'essay',
          dueDate: getDate(5, 23, 59),
          maxPoints: 100,
          course: group1.course._id,
          groups: [group1._id],
          status: 'published',
          createdBy: teacher._id
        },
        {
          title: `Lab Report - ${group2.name}`,
          description: 'Complete lab report for last week\'s experiment',
          type: 'project',
          dueDate: getDate(7, 23, 59),
          maxPoints: 75,
          course: group2.course._id,
          groups: [group2._id],
          status: 'published',
          createdBy: teacher._id
        },
        {
          title: `Weekly Discussion - ${group1.name}`,
          description: 'Respond to weekly prompt and comment on 2 peers',
          type: 'homework',
          dueDate: getDate(3, 23, 59),
          maxPoints: 25,
          course: group1.course._id,
          groups: [group1._id],
          status: 'published',
          createdBy: teacher._id
        }
      ];

      // 2. Create Quizzes
      const quizzes = [
        {
          title: `Quiz: Chapters 4-5 - ${group1.name}`,
          description: 'Multiple choice quiz covering chapters 4 and 5',
          type: 'quiz',
          dueDate: getDate(4, 14, 0),
          maxPoints: 100,
          course: group1.course._id,
          groups: [group1._id],
          status: 'published',
          createdBy: teacher._id,
          questions: [
            {
              question: 'What is the main concept?',
              type: 'multiple_choice',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 'Option A',
              points: 25
            },
            {
              question: 'Explain your understanding.',
              type: 'short_answer',
              points: 25
            }
          ]
        },
        {
          title: `Midterm Exam - ${group1.name}`,
          description: 'Comprehensive midterm covering all topics',
          type: 'quiz',
          dueDate: getDate(10, 10, 0),
          maxPoints: 200,
          course: group1.course._id,
          groups: [group1._id],
          status: 'published',
          createdBy: teacher._id,
          questions: [
            {
              question: 'Sample midterm question',
              type: 'multiple_choice',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 'A',
              points: 50
            }
          ]
        },
        {
          title: `Pop Quiz - ${group2.name}`,
          description: 'Short quiz on recent material',
          type: 'quiz',
          dueDate: getDate(1, 15, 30),
          maxPoints: 50,
          course: group2.course._id,
          groups: [group2._id],
          status: 'published',
          createdBy: teacher._id,
          questions: [
            {
              question: 'Quick check question',
              type: 'short_answer',
              points: 25
            }
          ]
        }
      ];

      // 3. Create Announcements
      const announcements = [
        {
          title: `Important Update - ${teacher.lastName}`,
          content: `This is an important announcement for ${group1.name}. Please review the materials before next class.`,
          type: 'academic',
          priority: 'normal',
          audience: 'students',
          publishAt: getDate(0),
          expiresAt: getDate(7),
          isPublished: true,
          author: teacher._id,
          targetGroups: [group1._id]
        },
        {
          title: `Reminder: Assignment Due Soon - ${teacher.lastName}`,
          content: 'Don\'t forget your upcoming assignment is due this week. Start early!',
          type: 'general',
          priority: 'normal',
          audience: 'students',
          publishAt: getDate(1),
          expiresAt: getDate(5),
          isPublished: true,
          author: teacher._id,
          targetGroups: [group1._id]
        }
      ];

      // Insert assignments
      for (const assignment of assignments) {
        const existing = await Assignment.findOne({ 
          title: assignment.title,
          createdBy: teacher._id 
        });
        if (!existing) {
          await Assignment.create(assignment);
          totalCreated++;
          console.log(`   ✅ Created: ${assignment.title}`);
        }
      }

      // Insert quizzes
      for (const quiz of quizzes) {
        const existing = await Assignment.findOne({ 
          title: quiz.title,
          createdBy: teacher._id 
        });
        if (!existing) {
          await Assignment.create(quiz);
          totalCreated++;
          console.log(`   ✅ Created: ${quiz.title}`);
        }
      }

      // Insert announcements
      for (const announcement of announcements) {
        const existing = await Announcement.findOne({ 
          title: announcement.title,
          author: teacher._id 
        });
        if (!existing) {
          await Announcement.create(announcement);
          totalCreated++;
          console.log(`   ✅ Created: ${announcement.title}`);
        }
      }

      // Ensure groups have schedules
      for (const group of teacherGroups) {
        if (!group.schedule || group.schedule.length === 0) {
          // Assign random days and times
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          const randomDay1 = days[Math.floor(Math.random() * days.length)];
          let randomDay2 = days[Math.floor(Math.random() * days.length)];
          while (randomDay2 === randomDay1) {
            randomDay2 = days[Math.floor(Math.random() * days.length)];
          }

          group.schedule = [
            {
              day: randomDay1,
              startTime: '09:00',
              endTime: '10:30',
              room: `Room ${Math.floor(Math.random() * 300) + 100}`
            },
            {
              day: randomDay2,
              startTime: '14:00',
              endTime: '15:30',
              room: `Room ${Math.floor(Math.random() * 300) + 100}`
            }
          ];
          await group.save();
          console.log(`   ✅ Added schedule to: ${group.name}`);
        }
      }
    }

    console.log(`\n🎉 Successfully created ${totalCreated} calendar events!`);
    console.log(`\n📊 Events distributed across ${teachers.length} teachers`);
    console.log('\n✨ Navigate to /dashboard/calendar to view all events!');

  } catch (error) {
    console.error('❌ Error seeding calendar events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedCalendarEvents();
