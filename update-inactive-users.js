const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function updateInactiveUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Set 30% of students to inactive
    const allStudents = await User.find({ role: 'student' });
    const totalStudents = allStudents.length;
    const inactiveCount = Math.floor(totalStudents * 0.3);
    
    console.log(`Total students: ${totalStudents}`);
    console.log(`Setting ${inactiveCount} students to inactive...`);

    // Randomly select students to deactivate
    const shuffled = allStudents.sort(() => 0.5 - Math.random());
    const studentsToDeactivate = shuffled.slice(0, inactiveCount);

    for (const student of studentsToDeactivate) {
      await User.findByIdAndUpdate(student._id, { isActive: false });
      console.log(`✓ Deactivated: ${student.firstName} ${student.lastName}`);
    }

    // Set 20% of teachers to inactive
    const allTeachers = await User.find({ role: 'teacher' });
    const totalTeachers = allTeachers.length;
    const inactiveTeacherCount = Math.floor(totalTeachers * 0.2);
    
    console.log(`\nTotal teachers: ${totalTeachers}`);
    console.log(`Setting ${inactiveTeacherCount} teachers to inactive...`);

    const shuffledTeachers = allTeachers.sort(() => 0.5 - Math.random());
    const teachersToDeactivate = shuffledTeachers.slice(0, inactiveTeacherCount);

    for (const teacher of teachersToDeactivate) {
      await User.findByIdAndUpdate(teacher._id, { isActive: false });
      console.log(`✓ Deactivated: ${teacher.firstName} ${teacher.lastName}`);
    }

    // Summary
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const inactiveStudents = await User.countDocuments({ role: 'student', isActive: false });
    const activeTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const inactiveTeachers = await User.countDocuments({ role: 'teacher', isActive: false });

    console.log('\n📊 Summary:');
    console.log(`Students: ${activeStudents} active, ${inactiveStudents} inactive`);
    console.log(`Teachers: ${activeTeachers} active, ${inactiveTeachers} inactive`);

    await mongoose.disconnect();
    console.log('\n✓ Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateInactiveUsers();

