const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./models/Attendance');
const Group = require('./models/Group');
const Course = require('./models/Course');

async function updateAttendanceRevenue() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all attendance records
    const attendances = await Attendance.find({}).populate('group');
    console.log(`\n📊 Found ${attendances.length} attendance records to process\n`);

    let updatedCount = 0;
    const groupRevenue = new Map(); // Track revenue per group
    const courseRevenue = new Map(); // Track revenue per course

    for (const attendance of attendances) {
      if (!attendance.group) {
        console.log(`⚠️  Skipping attendance ${attendance._id} - no group found`);
        continue;
      }

      const group = attendance.group;
      
      // Skip if group has no pricing
      if (!group.pricePerSession || group.pricePerSession === 0) {
        console.log(`⚠️  Skipping attendance ${attendance._id} - group has no pricing`);
        continue;
      }

      // Count present students
      const presentCount = attendance.records.filter(r => r.status === 'present').length;
      
      if (presentCount === 0) {
        console.log(`⚠️  Skipping attendance ${attendance._id} - no present students`);
        continue;
      }

      // Calculate session revenue
      const sessionRevenue = presentCount * group.pricePerSession;

      // Update attendance record
      await Attendance.findByIdAndUpdate(attendance._id, {
        sessionRevenue: sessionRevenue,
        presentCount: presentCount,
        pricePerSession: group.pricePerSession
      });

      // Track revenue by group
      const groupId = group._id.toString();
      if (!groupRevenue.has(groupId)) {
        groupRevenue.set(groupId, { revenue: 0, sessions: 0, courseId: group.course });
      }
      const groupData = groupRevenue.get(groupId);
      groupData.revenue += sessionRevenue;
      groupData.sessions += 1;
      groupRevenue.set(groupId, groupData);

      // Track revenue by course
      if (group.course) {
        const courseId = group.course.toString();
        if (!courseRevenue.has(courseId)) {
          courseRevenue.set(courseId, { revenue: 0, sessions: 0 });
        }
        const courseData = courseRevenue.get(courseId);
        courseData.revenue += sessionRevenue;
        courseData.sessions += 1;
        courseRevenue.set(courseId, courseData);
      }

      updatedCount++;
      console.log(`✅ Updated attendance ${attendance._id}: ${presentCount} students × ${group.pricePerSession} EGP = ${sessionRevenue} EGP`);
    }

    console.log(`\n📊 ATTENDANCE UPDATE SUMMARY:`);
    console.log(`   Total attendance records processed: ${attendances.length}`);
    console.log(`   Records updated with revenue: ${updatedCount}`);
    console.log(`\n💰 UPDATING GROUP TOTALS...\n`);

    // Update all groups with their totals
    for (const [groupId, data] of groupRevenue.entries()) {
      await Group.findByIdAndUpdate(groupId, {
        totalRevenue: data.revenue,
        totalSessionsHeld: data.sessions
      });
      console.log(`✅ Group ${groupId}: ${data.revenue} EGP revenue from ${data.sessions} sessions`);
    }

    console.log(`\n💰 UPDATING COURSE TOTALS...\n`);

    // Update all courses with their totals
    for (const [courseId, data] of courseRevenue.entries()) {
      await Course.findByIdAndUpdate(courseId, {
        totalRevenue: data.revenue,
        totalSessionsHeld: data.sessions
      });
      console.log(`✅ Course ${courseId}: ${data.revenue} EGP revenue from ${data.sessions} sessions`);
    }

    console.log(`\n🎉 MIGRATION COMPLETE!`);
    console.log(`   Attendance records updated: ${updatedCount}`);
    console.log(`   Groups updated: ${groupRevenue.size}`);
    console.log(`   Courses updated: ${courseRevenue.size}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the update
updateAttendanceRevenue();

