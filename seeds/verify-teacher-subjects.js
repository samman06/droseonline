const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Subject = require('../models/Subject');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function verifyTeacherSubjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const teachers = await User.find({ role: 'teacher' }).populate('academicInfo.subject');
    
    console.log('📊 TEACHER SUBJECTS:\n');
    
    for (const teacher of teachers) {
      const subjectId = teacher.academicInfo?.subject;
      const hasSubject = !!subjectId;
      
      console.log(`${hasSubject ? '✅' : '❌'} ${teacher.fullName}`);
      console.log(`   academicInfo: ${teacher.academicInfo ? 'exists' : 'missing'}`);
      console.log(`   subject ID: ${subjectId || 'none'}`);
      
      if (subjectId && typeof subjectId === 'object') {
        console.log(`   subject name: ${subjectId.name}`);
      }
      console.log('');
    }

    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyTeacherSubjects();

