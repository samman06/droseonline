const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Subject = require('./models/Subject');
const Group = require('./models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drose-online';
const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function quickSeed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const dayOfWeek = daysOfWeek[today.getDay()];
    console.log(`📅 Today is: ${dayOfWeek.toUpperCase()}\n`);

    // 1. Create Admin
    console.log('1️⃣  Creating Admin...');
    let admin = await User.findOne({ email: 'admin@droseonline.com' });
    if (!admin) {
      admin = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@droseonline.com',
        password: 'password123',  // Plain text - will be hashed by pre-save hook
        role: 'admin',
        isActive: true,
        academicInfo: {
          permissions: ['all']
        }
      });
      console.log('   ✅ Admin created');
    } else {
      console.log('   ℹ️  Admin already exists');
    }

    // 2. Create Teachers
    console.log('\n2️⃣  Creating Teachers...');
    const teacherData = [
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@droseonline.com' },
      { firstName: 'Michael', lastName: 'Davis', email: 'michael.davis@droseonline.com' },
      { firstName: 'Emily', lastName: 'Wilson', email: 'emily.wilson@droseonline.com' },
    ];

    const teachers = [];
    for (const data of teacherData) {
      let teacher = await User.findOne({ email: data.email });
      if (!teacher) {
        teacher = await User.create({
          ...data,
          password: 'password123',  // Plain text - will be hashed by pre-save hook
          role: 'teacher',
          isActive: true,
          academicInfo: {
            subjects: [],
            groups: []
          }
        });
        console.log(`   ✅ Created: ${teacher.firstName} ${teacher.lastName}`);
      } else {
        console.log(`   ℹ️  Exists: ${teacher.firstName} ${teacher.lastName}`);
      }
      teachers.push(teacher);
    }

    // 3. Create Subjects
    console.log('\n3️⃣  Creating Subjects...');
    const subjectData = [
      { name: 'Mathematics', code: 'MATH101', description: 'Advanced Mathematics' },
      { name: 'Arabic Language', code: 'ARAB101', description: 'Arabic Language and Literature' },
      { name: 'English Language', code: 'ENG101', description: 'English Language' },
      { name: 'Science', code: 'SCI101', description: 'General Science' },
      { name: 'Social Studies', code: 'SOC101', description: 'Social Studies' },
    ];

    const subjects = [];
    for (const data of subjectData) {
      let subject = await Subject.findOne({ code: data.code });
      if (!subject) {
        subject = await Subject.create({
          ...data,
          gradeLevel: 'Grade 10',
          isActive: true,
          createdBy: admin._id  // Add required field
        });
        console.log(`   ✅ Created: ${subject.name}`);
      } else {
        console.log(`   ℹ️  Exists: ${subject.name}`);
      }
      subjects.push(subject);
    }

    // 4. Create Students
    console.log('\n4️⃣  Creating Students...');
    const studentNames = [
      'Ahmed Hassan', 'Fatima Ali', 'Mohamed Ibrahim', 'Aisha Khalil',
      'Omar Sayed', 'Nour Mahmoud', 'Youssef Tarek', 'Mariam Samir',
      'Ali Ahmed', 'Sara Mohamed', 'Khaled Omar', 'Heba Youssef',
      'Hassan Ali', 'Mona Ahmed', 'Tarek Said', 'Laila Nasser'
    ];

    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
      const [firstName, lastName] = studentNames[i].split(' ');
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.droseonline.com`;
      
      let student = await User.findOne({ email });
      if (!student) {
        student = await User.create({
          firstName,
          lastName,
          email,
          password: 'password123',  // Plain text - will be hashed by pre-save hook
          role: 'student',
          isActive: true,
          academicInfo: {
            enrollmentDate: new Date('2024-09-01'),
            currentGrade: i % 3 === 0 ? 'Grade 10' : i % 3 === 1 ? 'Grade 11' : 'Grade 12',
            groups: []
          }
        });
      }
      students.push(student);
    }
    console.log(`   ✅ Created/Found ${students.length} students`);

    // 5. Delete existing groups
    console.log('\n5️⃣  Cleaning up existing groups...');
    const deleted = await Group.deleteMany({});
    console.log(`   🗑️  Deleted ${deleted.deletedCount} groups`);

    // 6. Create Groups with TODAY's schedule
    console.log(`\n6️⃣  Creating Groups with ${dayOfWeek} schedules...`);
    const gradeLevels = ['Grade 10', 'Grade 11', 'Grade 12'];
    const rooms = ['Room A101', 'Room B202', 'Room C303', 'Lab 1', 'Lab 2'];
    const groups = [];

    for (let i = 0; i < 5; i++) {
      const teacher = teachers[i % teachers.length];
      const subject = subjects[i % subjects.length];
      const gradeLevel = gradeLevels[i % gradeLevels.length];
      const room = rooms[i % rooms.length];
      
      // Create multiple sessions for today
      const sessionsCount = Math.floor(Math.random() * 2) + 1; // 1-2 sessions
      const schedule = [];
      for (let s = 0; s < sessionsCount; s++) {
        const hour = 9 + (i * 2) + s;
        schedule.push({
          day: dayOfWeek,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:30`,
          room: room
        });
      }

      // Assign students to group
      const numStudents = Math.floor(Math.random() * 5) + 5; // 5-10 students per group
      const groupStudents = [];
      for (let j = 0; j < Math.min(numStudents, students.length); j++) {
        const studentIndex = (i * numStudents + j) % students.length;
        groupStudents.push({
          student: students[studentIndex]._id,
          enrollmentDate: new Date(),
          status: 'active'
        });
      }

      const group = await Group.create({
        name: `${subject.name} - ${gradeLevel} - Group ${i + 1}`,
        code: `GRP${(i + 1).toString().padStart(3, '0')}`,
        subject: subject._id,
        teacher: teacher._id,
        gradeLevel: gradeLevel,
        academicYear: '2024-2025',
        students: groupStudents,
        schedule: schedule,
        capacity: 30,
        isActive: true,
        createdBy: admin._id  // Add required field
      });

      groups.push(group);
      
      console.log(`\n   ✅ Group ${i + 1}: ${group.name}`);
      console.log(`      Teacher: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`      Students: ${groupStudents.length}`);
      console.log(`      Sessions today (${dayOfWeek}):`);
      schedule.forEach((s, idx) => {
        console.log(`         ${idx + 1}. ${s.startTime} - ${s.endTime} (${s.room})`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ SETUP COMPLETE!`);
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   - Admin: 1`);
    console.log(`   - Teachers: ${teachers.length}`);
    console.log(`   - Subjects: ${subjects.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Groups: ${groups.length}`);
    console.log(`   - All groups have sessions TODAY (${dayOfWeek.toUpperCase()})`);
    console.log(`   - All groups are PENDING attendance`);
    
    console.log(`\n🎉 Login Credentials:`);
    console.log(`   - Admin: admin@droseonline.com / password123`);
    console.log(`   - Teacher: sarah.johnson@droseonline.com / password123`);
    console.log(`   - Student: ahmed.hassan0@student.droseonline.com / password123`);

    console.log(`\n✨ Now refresh your app and click "Pending Today" in attendance!\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚀 Quick Seed: Creating data with today\'s schedule...\n');
quickSeed();

