const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const Attendance = require('./models/Attendance');
const User = require('./models/User');

async function checkAccountingData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find teachers
    const teachers = await User.find({ role: 'teacher' }).select('_id fullName email');
    console.log(`👨‍🏫 Found ${teachers.length} teachers`);
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found in database');
      await mongoose.connection.close();
      return;
    }

    for (const teacher of teachers) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Checking data for: ${teacher.fullName || teacher.email}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Check groups
      const groups = await Group.find({ teacher: teacher._id })
        .select('name code pricePerSession totalRevenue totalSessionsHeld students');
      
      console.log(`📦 Groups: ${groups.length}`);
      
      if (groups.length === 0) {
        console.log('   ⚠️  No groups assigned to this teacher');
        continue;
      }

      let groupsWithPricing = 0;
      let groupsWithRevenue = 0;
      let totalRevenue = 0;
      let totalSessions = 0;

      for (const group of groups) {
        console.log(`\n   Group: ${group.name} (${group.code})`);
        console.log(`   - Price per session: ${group.pricePerSession || 0} EGP`);
        console.log(`   - Total revenue: ${group.totalRevenue || 0} EGP`);
        console.log(`   - Sessions held: ${group.totalSessionsHeld || 0}`);
        console.log(`   - Students: ${group.students?.length || 0}`);

        if (group.pricePerSession > 0) groupsWithPricing++;
        if (group.totalRevenue > 0) {
          groupsWithRevenue++;
          totalRevenue += group.totalRevenue;
          totalSessions += group.totalSessionsHeld;
        }
      }

      console.log(`\n   Summary:`);
      console.log(`   - Groups with pricing: ${groupsWithPricing}/${groups.length}`);
      console.log(`   - Groups with revenue: ${groupsWithRevenue}/${groups.length}`);
      console.log(`   - Total revenue: ${totalRevenue} EGP`);
      console.log(`   - Total sessions: ${totalSessions}`);

      // Check attendance
      const attendanceCount = await Attendance.countDocuments({ teacher: teacher._id });
      const attendanceWithRevenue = await Attendance.countDocuments({ 
        teacher: teacher._id,
        sessionRevenue: { $gt: 0 }
      });

      console.log(`\n   📋 Attendance Records:`);
      console.log(`   - Total attendance: ${attendanceCount}`);
      console.log(`   - With revenue data: ${attendanceWithRevenue}`);

      // Recommendations
      console.log(`\n   💡 Recommendations:`);
      if (groupsWithPricing === 0) {
        console.log(`   ⚠️  No groups have pricing set. Add pricePerSession to groups.`);
      }
      if (attendanceCount === 0) {
        console.log(`   ⚠️  No attendance marked yet. Mark attendance to generate revenue.`);
      } else if (attendanceWithRevenue === 0) {
        console.log(`   ⚠️  Attendance exists but no revenue. Run: node update-attendance-revenue.js`);
      }
      if (totalRevenue === 0 && attendanceCount > 0 && groupsWithPricing > 0) {
        console.log(`   ⚠️  Groups have pricing and attendance exists, but no revenue calculated.`);
        console.log(`   🔧  Run: node update-attendance-revenue.js`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
  }
}

checkAccountingData();


