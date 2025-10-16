/**
 * Migration Script: Add Parent Contact Information to Existing Students
 * This script adds default/empty parentContact fields to students who don't have them
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function addParentContactToStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/droseonline');
    console.log('✅ Connected to MongoDB\n');

    // Find all students
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students\n`);

    let updated = 0;
    let alreadyHas = 0;

    for (const student of students) {
      // Check if parentContact exists and has data
      if (!student.parentContact || (!student.parentContact.primaryPhone && !student.parentContact.secondaryPhone)) {
        // Initialize parentContact if it doesn't exist
        if (!student.parentContact) {
          student.parentContact = {};
        }
        
        // Set default values if not present
        if (!student.parentContact.primaryPhone) {
          student.parentContact.primaryPhone = ''; // Empty string, can be filled later
        }
        if (!student.parentContact.secondaryPhone) {
          student.parentContact.secondaryPhone = '';
        }
        
        student.markModified('parentContact');
        await student.save({ validateBeforeSave: false });
        
        console.log(`✅ Updated student: ${student.firstName} ${student.lastName} (${student.academicInfo?.studentId || 'No ID'})`);
        updated++;
      } else {
        console.log(`ℹ️  Student already has parent contact: ${student.firstName} ${student.lastName}`);
        alreadyHas++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total students: ${students.length}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Already had data: ${alreadyHas}`);
    console.log(`\n✅ Migration completed successfully!`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addParentContactToStudents();

