const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function createUsersManual() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the User collection directly (bypasses model hooks)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Delete all users
    const deleted = await usersCollection.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing users\n`);

    const password = 'password123';
    // Hash password ONCE, manually, outside of model
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('🔐 Password hash created:');
    console.log('   ', hashedPassword.substring(0, 40) + '...');
    console.log('   Length:', hashedPassword.length);
    console.log('   Starts with $2a:', hashedPassword.startsWith('$2a'));
    console.log('');

    // Create users with PRE-HASHED password (bypasses model pre-save hook)
    const users = [
      {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@droseonline.com',
        password: hashedPassword,  // Already hashed! Won't be hashed again
        role: 'admin',
        isActive: true,
        academicInfo: { permissions: ['all'], groups: [], specialization: [], subjects: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@droseonline.com',
        password: hashedPassword,
        role: 'teacher',
        isActive: true,
        academicInfo: { subjects: [], groups: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Michael',
        lastName: 'Davis',
        email: 'michael.davis@droseonline.com',
        password: hashedPassword,
        role: 'teacher',
        isActive: true,
        academicInfo: { subjects: [], groups: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Emily',
        lastName: 'Wilson',
        email: 'emily.wilson@droseonline.com',
        password: hashedPassword,
        role: 'teacher',
        isActive: true,
        academicInfo: { subjects: [], groups: [] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed.hassan0@student.droseonline.com',
        password: hashedPassword,
        role: 'student',
        isActive: true,
        academicInfo: { 
          enrollmentDate: new Date('2024-09-01'),
          currentGrade: 'Grade 10',
          groups: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Fatima',
        lastName: 'Ali',
        email: 'fatima.ali1@student.droseonline.com',
        password: hashedPassword,
        role: 'student',
        isActive: true,
        academicInfo: { 
          enrollmentDate: new Date('2024-09-01'),
          currentGrade: 'Grade 11',
          groups: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Mohamed',
        lastName: 'Ibrahim',
        email: 'mohamed.ibrahim2@student.droseonline.com',
        password: hashedPassword,
        role: 'student',
        isActive: true,
        academicInfo: { 
          enrollmentDate: new Date('2024-09-01'),
          currentGrade: 'Grade 12',
          groups: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert users directly (bypasses ALL mongoose hooks)
    const result = await usersCollection.insertMany(users);
    console.log(`✅ Created ${result.insertedCount} users:\n`);

    // Now verify each password works by loading through the model
    const User = require('./models/User');
    
    for (const userData of users) {
      const user = await User.findOne({ email: userData.email });
      if (user) {
        const isValid = await user.comparePassword(password);
        console.log(`   ${user.email}`);
        console.log(`   → ${user.firstName} ${user.lastName} (${user.role})`);
        console.log(`   → Password test: ${isValid ? '✅ WORKS' : '❌ FAILS'}`);
        console.log('');
      }
    }

    console.log('=' .repeat(80));
    console.log('✅ SUCCESS! All users created with working passwords!');
    console.log('=' .repeat(80));
    console.log('\n🎯 You can now login with:');
    console.log('   Email: admin@droseonline.com');
    console.log('   Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚀 Creating users with manual password hashing...\n');
createUsersManual();

