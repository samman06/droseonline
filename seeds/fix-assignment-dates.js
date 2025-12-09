const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Assignment = require('../models/Assignment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';

async function fixAssignmentDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all assignments
    const assignments = await Assignment.find({});
    const now = new Date();
    
    console.log(`📊 Found ${assignments.length} assignments\n`);
    console.log('🔧 Updating assignment dates...\n');

    let fixed = 0;
    
    for (const assignment of assignments) {
      // Fix missing course/groups first
      if (!assignment.course || !assignment.groups || assignment.groups.length === 0) {
        console.log(`⚠️  Skipping "${assignment.title}" - missing course or groups`);
        continue;
      }

      // Set availableFrom to today if not set or in the past
      if (!assignment.availableFrom || assignment.availableFrom < now) {
        assignment.availableFrom = new Date();
      }

      // Set dueDate to 7-30 days from now
      const daysUntilDue = 7 + Math.floor(Math.random() * 23); // 7-30 days
      assignment.dueDate = new Date(now.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);

      await assignment.save();
      fixed++;
      
      console.log(`✅ ${assignment.title}`);
      console.log(`   Available: ${assignment.availableFrom.toLocaleDateString()}`);
      console.log(`   Due: ${assignment.dueDate.toLocaleDateString()} (in ${daysUntilDue} days)`);
    }

    console.log(`\n🎉 Successfully updated ${fixed} assignments!\n`);

    // Show stats
    const upcoming = await Assignment.find({ dueDate: { $gt: now } });
    console.log(`📈 UPDATED STATS:`);
    console.log(`   Total: ${assignments.length}`);
    console.log(`   Upcoming: ${upcoming.length}`);
    console.log(`   Overdue: ${assignments.length - upcoming.length}\n`);

    await mongoose.connection.close();
    console.log('✅ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAssignmentDates();

