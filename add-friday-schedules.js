const mongoose = require('mongoose');
require('dotenv').config();
const Group = require('./models/Group');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drose-online';

// Days of week mapping
const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function addFridaySchedules() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get today's day of week
    const today = new Date();
    const dayOfWeek = daysOfWeek[today.getDay()];
    console.log(`📅 Today is: ${dayOfWeek}`);

    // Get all active groups
    const groups = await Group.find({ isActive: true }).populate('teacher subject');
    console.log(`📊 Found ${groups.length} active groups`);

    if (groups.length === 0) {
      console.log('❌ No active groups found. Please run seed data first.');
      process.exit(1);
    }

    // Add today's schedule to groups that don't have it
    let updatedCount = 0;
    
    for (const group of groups) {
      // Check if group already has a schedule for today
      const hasToday = group.schedule.some(s => s.day === dayOfWeek);
      
      if (!hasToday) {
        // Generate random time slots for today
        const sessionCount = Math.floor(Math.random() * 2) + 1; // 1-2 sessions
        const newSessions = [];
        
        for (let i = 0; i < sessionCount; i++) {
          const hour = 9 + i * 2; // 9 AM, 11 AM, etc.
          newSessions.push({
            day: dayOfWeek,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:30`,
            room: `Room ${Math.floor(Math.random() * 10) + 1}`
          });
        }
        
        // Add new sessions to schedule
        group.schedule.push(...newSessions);
        await group.save();
        
        updatedCount++;
        console.log(`✅ Added ${dayOfWeek} schedule to group: ${group.name}`);
        newSessions.forEach(s => {
          console.log(`   - ${s.startTime} - ${s.endTime} in ${s.room}`);
        });
      } else {
        console.log(`⏭️  Group already has ${dayOfWeek} schedule: ${group.name}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Successfully updated ${updatedCount} groups with ${dayOfWeek} schedules`);
    console.log('='.repeat(80));
    
    // Show summary
    const groupsWithToday = await Group.find({ 
      isActive: true,
      'schedule.day': dayOfWeek 
    }).populate('teacher subject');
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total active groups: ${groups.length}`);
    console.log(`   - Groups with ${dayOfWeek} schedule: ${groupsWithToday.length}`);
    console.log(`   - Groups updated: ${updatedCount}`);
    
    console.log(`\n📋 Groups scheduled for ${dayOfWeek}:`);
    groupsWithToday.forEach(group => {
      const todaySessions = group.schedule.filter(s => s.day === dayOfWeek);
      console.log(`\n   ${group.name}`);
      console.log(`   Teacher: ${group.teacher?.firstName} ${group.teacher?.lastName}`);
      console.log(`   Subject: ${group.subject?.name}`);
      console.log(`   Grade: ${group.gradeLevel}`);
      console.log(`   Students: ${group.students?.length || 0}`);
      console.log(`   Sessions today:`);
      todaySessions.forEach((session, idx) => {
        console.log(`      ${idx + 1}. ${session.startTime} - ${session.endTime} (${session.room})`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Adding schedules for today...\n');
addFridaySchedules();

