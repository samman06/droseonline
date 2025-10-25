const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function createTestAssistant() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a teacher to assign the assistant to
    const teacher = await User.findOne({ role: 'teacher', isActive: true });
    
    if (!teacher) {
      console.log('❌ No active teacher found. Please create a teacher first.');
      process.exit(1);
    }

    console.log(`Found teacher: ${teacher.fullName} (${teacher.email})`);

    // Check if assistant already exists
    const existingAssistant = await User.findOne({ email: 'assistant@droseonline.com' });
    if (existingAssistant) {
      console.log('✅ Assistant already exists');
      console.log(`   Email: ${existingAssistant.email}`);
      console.log(`   Name: ${existingAssistant.fullName}`);
      console.log(`   Assigned to: ${teacher.fullName}`);
      
      // Update assignment if needed
      if (!existingAssistant.assistantInfo || 
          existingAssistant.assistantInfo.assignedTeacher?.toString() !== teacher._id.toString()) {
        existingAssistant.role = 'assistant';
        existingAssistant.assistantInfo = {
          assignedTeacher: teacher._id,
          assignedDate: new Date(),
          permissions: ['view_all', 'edit_all']
        };
        await existingAssistant.save();
        console.log('✅ Updated assistant assignment');
      }
      
      process.exit(0);
    }

    // Create new assistant
    const hashedPassword = await bcrypt.hash('Assistant123!', 10);
    
    const assistant = new User({
      email: 'assistant@droseonline.com',
      firstName: 'محمد',
      lastName: 'المساعد',
      password: hashedPassword,
      role: 'assistant',
      phoneNumber: '+201234567890',
      isActive: true,
      assistantInfo: {
        assignedTeacher: teacher._id,
        assignedDate: new Date(),
        permissions: ['view_all', 'edit_all']
      }
    });

    await assistant.save();
    
    console.log('\n✅ Assistant created successfully!');
    console.log(`   Email: ${assistant.email}`);
    console.log(`   Password: Assistant123!`);
    console.log(`   Name: ${assistant.fullName}`);
    console.log(`   Assigned to: ${teacher.fullName} (${teacher.email})`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Email: assistant@droseonline.com`);
    console.log(`   Password: Assistant123!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createTestAssistant();

