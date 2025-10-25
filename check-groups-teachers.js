const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const Course = require('./models/Course');
const User = require('./models/User');

async function checkGroupsAndTeachers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check all groups
    const allGroups = await Group.find({})
      .populate({
        path: 'course',
        populate: {
          path: 'teacher',
          select: 'fullName firstName lastName email'
        }
      })
      .select('name code course pricePerSession totalRevenue students');
    
    console.log(`📦 Total Groups in Database: ${allGroups.length}\n`);

    if (allGroups.length === 0) {
      console.log('❌ No groups found in database. You need to create groups first.');
      console.log('💡 Suggestion: Run seed-mock-data.js to generate test data\n');
    } else {
      let groupsWithTeacher = 0;
      let groupsWithoutTeacher = 0;
      let groupsWithPricing = 0;
      let groupsWithRevenue = 0;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      for (const group of allGroups) {
        console.log(`Group: ${group.name} (${group.code})`);
        
        const teacher = group.course?.teacher;
        if (teacher) {
          groupsWithTeacher++;
          const teacherName = teacher.fullName || 
            `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 
            teacher.email;
          console.log(`  ✅ Teacher: ${teacherName}`);
        } else {
          groupsWithoutTeacher++;
          console.log(`  ⚠️  No teacher assigned (course: ${group.course?._id || 'none'})`);
        }
        
        console.log(`  💰 Price per session: ${group.pricePerSession || 0} EGP`);
        console.log(`  📊 Total revenue: ${group.totalRevenue || 0} EGP`);
        console.log(`  👥 Students: ${group.students?.length || 0}`);
        console.log('');

        if (group.pricePerSession > 0) groupsWithPricing++;
        if (group.totalRevenue > 0) groupsWithRevenue++;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📊 Summary:');
      console.log(`  - Groups with teacher: ${groupsWithTeacher}/${allGroups.length}`);
      console.log(`  - Groups without teacher: ${groupsWithoutTeacher}/${allGroups.length}`);
      console.log(`  - Groups with pricing: ${groupsWithPricing}/${allGroups.length}`);
      console.log(`  - Groups with revenue: ${groupsWithRevenue}/${allGroups.length}\n`);

      if (groupsWithoutTeacher > 0) {
        console.log('⚠️  Some groups have no teacher assigned.');
        console.log('💡 You need to assign teachers to groups for accounting to work.\n');
      }

      if (groupsWithPricing === 0) {
        console.log('⚠️  No groups have pricing set.');
        console.log('💡 Set pricePerSession for groups to enable revenue tracking.\n');
      }
    }

    // Check teachers
    const teachers = await User.find({ role: 'teacher' })
      .select('fullName firstName lastName email');
    
    console.log(`👨‍🏫 Total Teachers: ${teachers.length}`);
    
    if (teachers.length > 0) {
      console.log('\nTeacher List:');
      for (const teacher of teachers) {
        const name = teacher.fullName || 
          `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 
          teacher.email;
        console.log(`  - ${name} (${teacher.email})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed\n');
  }
}

checkGroupsAndTeachers();

