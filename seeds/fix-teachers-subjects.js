const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Subject = require('../models/Subject');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function fixTeachersSubjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get teachers without subjects
    const teachers = await User.find({ role: 'teacher' });
    const teachersWithoutSubject = teachers.filter(t => !t.academicInfo?.subject);
    
    console.log(`📊 Found ${teachersWithoutSubject.length} teachers without subjects\n`);

    if (teachersWithoutSubject.length === 0) {
      console.log('✅ All teachers already have subjects assigned!\n');
      await mongoose.connection.close();
      return;
    }

    // Get available subjects
    const subjects = await Subject.find({ isActive: true });
    
    if (subjects.length === 0) {
      console.log('❌ No active subjects found! Cannot assign subjects to teachers.\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📚 Available subjects: ${subjects.length}\n`);
    console.log('🔧 Assigning subjects to teachers...\n');

    let fixed = 0;
    
    // Assign subjects evenly to teachers
    for (let i = 0; i < teachersWithoutSubject.length; i++) {
      const teacher = teachersWithoutSubject[i];
      const subject = subjects[i % subjects.length]; // Rotate through subjects
      
      if (!teacher.academicInfo) {
        teacher.academicInfo = {};
      }
      
      // Add subject to subjects array (not singular 'subject')
      if (!teacher.academicInfo.subjects) {
        teacher.academicInfo.subjects = [];
      }
      
      teacher.academicInfo.subjects.push(subject._id);
      await teacher.save();
      
      fixed++;
      console.log(`✅ ${teacher.fullName} → ${subject.name}`);
    }

    console.log(`\n🎉 Successfully assigned subjects to ${fixed} teachers!\n`);

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTeachersSubjects();

