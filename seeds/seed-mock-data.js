const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Group = require('./models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

// Egyptian names
const firstNames = {
  male: ['Ahmed', 'Mohamed', 'Omar', 'Ali', 'Hassan', 'Mahmoud', 'Youssef', 'Khaled', 'Amr', 'Tarek', 'Karim', 'Hossam', 'Mostafa', 'Sherif', 'Waleed'],
  female: ['Fatma', 'Aisha', 'Maryam', 'Nour', 'Sara', 'Hana', 'Layla', 'Yasmin', 'Salma', 'Dina', 'Rana', 'Nada', 'Heba', 'Mai', 'Noha']
};
const lastNames = ['Hassan', 'Ibrahim', 'Mohamed', 'Ali', 'Mahmoud', 'Abdel Rahman', 'Sayed', 'Khalil', 'Farouk', 'Nasser', 'Shawky', 'Zaki', 'Amin', 'Kamal', 'Samir'];

// Egyptian subjects
const egyptianSubjects = [
  { name: 'Mathematics', code: 'MATH101' },
  { name: 'Arabic Language', code: 'ARAB101' },
  { name: 'English Language', code: 'ENG101' },
  { name: 'Science', code: 'SCI101' },
  { name: 'Social Studies', code: 'SOC101' }
];

// Grade levels
const gradeLevels = ['Grade 10', 'Grade 11', 'Grade 12'];

// Days of week (lowercase to match Group model enum)
const daysOfWeek = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomName(gender) {
  const firstName = getRandomElement(firstNames[gender]);
  const lastName = getRandomElement(lastNames);
  return { firstName, lastName };
}

async function seedMockData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const password = 'password123';

    // Get existing admin
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin found. Please run the user creation script first.');
      return;
    }

    console.log('\n📚 Creating/Loading 5 subjects...');
    const subjects = [];
    for (const subjectData of egyptianSubjects) {
      let subject = await Subject.findOne({ code: subjectData.code });
      if (!subject) {
        subject = new Subject({
          name: subjectData.name,
          code: subjectData.code,
          isActive: true,
          createdBy: admin._id
        });
        await subject.save();
        console.log(`✓ Created subject: ${subject.name}`);
      } else {
        console.log(`✓ Loaded existing subject: ${subject.name}`);
      }
      subjects.push(subject);
    }

    console.log('\n👨‍🏫 Creating 5 teachers...');
    const teachers = [];
    const teacherSpecializations = ['Mathematics', 'Languages', 'Sciences', 'Social Studies', 'Arts'];
    
    for (let i = 0; i < 5; i++) {
      const gender = i % 2 === 0 ? 'male' : 'female';
      const { firstName, lastName } = getRandomName(gender);
      const timestamp = Date.now();
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}.${timestamp}.${i}@teacher.droseonline.com`;
      
      const teacher = new User({
        firstName: `Dr. ${firstName}`,
        lastName,
        email,
        password,
        role: 'teacher',
        isActive: true,
        phoneNumber: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
        academicInfo: {
          specialization: [teacherSpecializations[i]],
          subjects: [subjects[i]._id]
        }
      });
      await teacher.save();
      teachers.push(teacher);
      console.log(`✓ Created teacher: ${teacher.fullName} (${email})`);
    }

    console.log('\n👨‍🎓 Creating 100 students...');
    const students = [];
    const baseTimestamp = Date.now();
    
    for (let i = 0; i < 100; i++) {
      const gender = i % 2 === 0 ? 'male' : 'female';
      const { firstName, lastName } = getRandomName(gender);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}.${baseTimestamp + i}@student.droseonline.com`;
      const grade = getRandomElement(gradeLevels);
      
      const student = new User({
        firstName,
        lastName,
        email,
        password,
        role: 'student',
        isActive: Math.random() > 0.1, // 90% active
        phoneNumber: `011${Math.floor(10000000 + Math.random() * 90000000)}`,
        academicInfo: {
          currentGrade: grade,
          enrollmentDate: new Date('2025-09-01'),
          groups: []
        }
      });
      await student.save();
      students.push(student);
      
      if ((i + 1) % 20 === 0) {
        console.log(`✓ Created ${i + 1} students...`);
      }
    }
    console.log(`✓ Created all 100 students`);

    console.log('\n👥 Creating 5 groups...');
    const groups = [];
    
    for (let i = 0; i < 5; i++) {
      const teacher = teachers[i];
      const subject = subjects[i];
      const gradeLevel = getRandomElement(gradeLevels);
      const day = daysOfWeek[i];
      
      // Get 15-20 random students of the same grade
      const gradeStudents = students.filter(s => s.academicInfo.currentGrade === gradeLevel);
      const groupStudents = gradeStudents.slice(0, 15 + Math.floor(Math.random() * 6));
      
      const group = new Group({
        name: `${subject.name} - ${gradeLevel} - Group ${i + 1}`,
        code: `GRP${String(i + 1).padStart(3, '0')}`,
        teacher: teacher._id,
        subject: subject._id,
        gradeLevel,
        students: groupStudents.map(s => ({
          student: s._id,
          enrollmentDate: new Date('2025-09-01'),
          status: 'active'
        })),
        schedule: [{
          day,
          startTime: `${14 + i}:00`,
          endTime: `${16 + i}:00`
        }],
        pricePerSession: 100 + (i * 50),
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        isActive: true,
        createdBy: admin._id
      });
      
      await group.save();
      groups.push(group);
      
      // Update students with group reference
      await User.updateMany(
        { _id: { $in: groupStudents.map(s => s._id) } },
        { $addToSet: { 'academicInfo.groups': group._id } }
      );
      
      console.log(`✓ Created group: ${group.name} (${groupStudents.length} students)`);
    }

    console.log('\n✅ Mock data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 5 Subjects created`);
    console.log(`   - 5 Teachers created`);
    console.log(`   - 100 Students created`);
    console.log(`   - 5 Groups created`);
    console.log('\n📧 All users can login with password: password123');
    console.log('\nSample teacher credentials:');
    teachers.slice(0, 2).forEach(t => {
      console.log(`   ${t.email} / password123`);
    });
    console.log('\nSample student credentials:');
    students.slice(0, 2).forEach(s => {
      console.log(`   ${s.email} / password123`);
    });

  } catch (error) {
    console.error('❌ Error seeding mock data:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

seedMockData();
