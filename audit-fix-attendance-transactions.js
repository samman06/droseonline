require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const FinancialTransaction = require('./models/FinancialTransaction');
const Group = require('./models/Group');
const Course = require('./models/Course');

async function auditAndFixAttendanceTransactions() {
  try {
    console.log('🔍 Starting audit of attendance records and transactions...\n');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // 1. Get all attendance records that are completed (attendance has been marked)
    const allAttendance = await Attendance.find({ isCompleted: true })
      .populate('group', 'name code pricePerSession course')
      .populate('teacher', 'firstName lastName email')
      .sort({ 'session.date': -1 });

    console.log(`📋 Found ${allAttendance.length} completed attendance records\n`);

    // 2. Check which ones have corresponding transactions
    let missingTransactions = [];
    let existingTransactions = 0;
    let zeroRevenueSkipped = 0;

    for (const attendance of allAttendance) {
      // Check if transaction exists for this attendance
      const transaction = await FinancialTransaction.findOne({
        'relatedTo.modelType': 'Attendance',
        'relatedTo.modelId': attendance._id
      });

      // Calculate expected revenue
      const presentCount = attendance.records.filter(r => r.status === 'present').length;
      const sessionIncome = presentCount * (attendance.group?.pricePerSession || 0);

      if (!transaction) {
        if (sessionIncome > 0) {
          missingTransactions.push({
            attendanceId: attendance._id,
            attendance: attendance,
            sessionIncome: sessionIncome,
            presentCount: presentCount,
            date: attendance.session.date
          });
          console.log(`❌ Missing transaction for attendance:`);
          console.log(`   Group: ${attendance.group?.name || 'Unknown'}`);
          console.log(`   Date: ${new Date(attendance.session.date).toLocaleDateString()}`);
          console.log(`   Present: ${presentCount} students`);
          console.log(`   Expected revenue: ${sessionIncome} EGP`);
          console.log('');
        } else {
          zeroRevenueSkipped++;
        }
      } else {
        existingTransactions++;
      }
    }

    console.log('\n📊 AUDIT SUMMARY:');
    console.log(`   Total attendance records: ${allAttendance.length}`);
    console.log(`   ✅ With transactions: ${existingTransactions}`);
    console.log(`   ❌ Missing transactions: ${missingTransactions.length}`);
    console.log(`   ⏭️  Skipped (zero revenue): ${zeroRevenueSkipped}`);
    console.log('');

    if (missingTransactions.length === 0) {
      console.log('🎉 All attendance records have corresponding transactions!');
      await mongoose.disconnect();
      return;
    }

    // 3. Ask user if they want to create missing transactions
    console.log(`\n⚠️  Found ${missingTransactions.length} attendance records without transactions`);
    console.log('📝 Creating missing transactions...\n');

    let created = 0;
    let failed = 0;

    for (const missing of missingTransactions) {
      try {
        const attendance = missing.attendance;
        const group = attendance.group;

        // Get teacher ID from course if available
        let teacherId = attendance.teacher;
        if (group && group.course) {
          const course = await Course.findById(group.course);
          if (course && course.teacher) {
            teacherId = course.teacher;
          }
        }

        // Create the missing transaction
        const transaction = new FinancialTransaction({
          type: 'income',
          category: 'student_payment',
          teacher: teacherId,
          amount: missing.sessionIncome,
          title: `Session Income - ${group?.name || 'Unknown Group'}`,
          description: `${missing.presentCount} students attended @ ${group?.pricePerSession || 0} EGP each`,
          transactionDate: attendance.session.date || new Date(),
          paymentMethod: 'cash',
          status: 'completed',
          relatedTo: {
            modelType: 'Attendance',
            modelId: attendance._id
          },
          notes: `Auto-generated from attendance audit. Session date: ${attendance.session.date}`,
          createdBy: attendance.createdBy || attendance.teacher
        });

        await transaction.save();
        created++;
        
        console.log(`✅ Created transaction for ${group?.name || 'Unknown'} - ${missing.sessionIncome} EGP`);

        // Update group revenue totals
        if (group) {
          await Group.findByIdAndUpdate(group._id, {
            $inc: {
              totalRevenue: missing.sessionIncome,
              totalSessionsHeld: 1
            }
          });
        }

        // Update course revenue totals
        if (group && group.course) {
          await Course.findByIdAndUpdate(group.course, {
            $inc: {
              totalRevenue: missing.sessionIncome,
              totalSessionsHeld: 1
            }
          });
        }

      } catch (error) {
        failed++;
        console.error(`❌ Failed to create transaction for attendance ${missing.attendanceId}:`, error.message);
      }
    }

    console.log('\n\n✨ RESULTS:');
    console.log(`   ✅ Successfully created: ${created} transactions`);
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed} transactions`);
    }
    console.log(`   💰 Total revenue added: ${missingTransactions.reduce((sum, m) => sum + m.sessionIncome, 0)} EGP`);

    console.log('\n🎉 Audit and fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the audit
auditAndFixAttendanceTransactions();

