const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const Course = require('./models/Course');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

async function findTeacherWithRevenue() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find the group with revenue
    const groupWithRevenue = await Group.findOne({ totalRevenue: { $gt: 0 } })
      .populate({
        path: 'course',
        populate: {
          path: 'teacher',
          select: 'fullName firstName lastName email role'
        }
      })
      .select('name code totalRevenue totalSessionsHeld');

    if (groupWithRevenue) {
      const teacher = groupWithRevenue.course?.teacher;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 Group with Revenue Found!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log(`📦 Group: ${groupWithRevenue.name} (${groupWithRevenue.code})`);
      console.log(`💰 Total Revenue: ${groupWithRevenue.totalRevenue} EGP`);
      console.log(`📊 Sessions Held: ${groupWithRevenue.totalSessionsHeld}`);
      
      if (teacher) {
        console.log(`\n👨‍🏫 Teacher Details:`);
        console.log(`   Name: ${teacher.fullName || `${teacher.firstName} ${teacher.lastName}`}`);
        console.log(`   Email: ${teacher.email}`);
        console.log(`   Password: Password123! (default for all users)`);
        
        console.log(`\n🔑 Login Credentials:`);
        console.log(`   Email: ${teacher.email}`);
        console.log(`   Password: Password123!`);
        
        console.log(`\n✅ Log in with these credentials to see accounting data in the dashboard.`);
      }

      // Check attendance records for this group
      const attendanceRecords = await Attendance.find({ group: groupWithRevenue._id })
        .select('date sessionRevenue presentCount pricePerSession')
        .sort('-date')
        .limit(5);

      console.log(`\n📋 Recent Attendance Records for this Group:`);
      attendanceRecords.forEach((att, index) => {
        console.log(`   ${index + 1}. Date: ${att.date.toISOString().split('T')[0]}`);
        console.log(`      Revenue: ${att.sessionRevenue || 0} EGP`);
        console.log(`      Present: ${att.presentCount || 0} students`);
        console.log(`      Price: ${att.pricePerSession || 0} EGP/student\n`);
      });

    } else {
      console.log('❌ No groups with revenue found.');
      console.log('\n💡 To see accounting data:');
      console.log('   1. Log in as any teacher (e.g., ahmed.hassan@school.eg)');
      console.log('   2. Go to Attendance → Mark Attendance for a group');
      console.log('   3. Revenue will be automatically calculated');
      console.log('   4. Go to Accounting dashboard to see the data\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed\n');
  }
}

findTeacherWithRevenue();

