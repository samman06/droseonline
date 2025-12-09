const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function fixOrphanAssignment() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find assignments without course or groups
    const orphanAssignments = await Assignment.find({
      $or: [
        { course: null },
        { course: { $exists: false } },
        { groups: { $size: 0 } },
        { groups: null },
        { groups: { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${orphanAssignments.length} orphan assignments\n`);

    if (orphanAssignments.length === 0) {
      console.log('✅ No orphan assignments found!\n');
      await mongoose.connection.close();
      return;
    }

    console.log('🔧 Fixing orphan assignments...\n');

    for (const assignment of orphanAssignments) {
      console.log(`⚠️  Orphan: "${assignment.title}"`);
      
      // Try to find a matching course by name
      let matchedCourse = null;
      
      if (assignment.title.includes('Arabic Language')) {
        matchedCourse = await Course.findOne({ name: /Arabic Language/ });
      } else if (assignment.title.includes('Computer Science')) {
        matchedCourse = await Course.findOne({ name: /Computer Science/ });
      } else {
        // Get any course as fallback
        matchedCourse = await Course.findOne({}).populate('groups');
      }

      if (matchedCourse) {
        assignment.course = matchedCourse._id;
        assignment.teacher = matchedCourse.teacher;
        assignment.groups = matchedCourse.groups;
        
        await assignment.save();
        console.log(`✅ Assigned to course: ${matchedCourse.name}`);
        console.log(`   Groups: ${matchedCourse.groups.length}\n`);
      } else {
        console.log(`❌ Could not find suitable course - deleting assignment\n`);
        await Assignment.deleteOne({ _id: assignment._id });
      }
    }

    console.log('🎉 Successfully fixed orphan assignments!\n');

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixOrphanAssignment();

