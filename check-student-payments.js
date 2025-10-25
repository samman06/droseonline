const mongoose = require('mongoose');
require('dotenv').config();

const StudentPayment = require('./models/StudentPayment');
const Group = require('./models/Group');
const Course = require('./models/Course');
const User = require('./models/User');

async function checkStudentPayments() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droseonline';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Count all student payments
    const totalPayments = await StudentPayment.countDocuments();
    console.log(`📊 Total Student Payment Records: ${totalPayments}\n`);

    if (totalPayments === 0) {
      console.log('❌ No student payment records found!');
      console.log('\n💡 This means attendance has been marked but StudentPayment records weren\'t created.');
      console.log('\n🔧 Solutions:');
      console.log('   1. Mark new attendance (it will auto-create payment records)');
      console.log('   2. Or run a migration script to create payment records from existing attendance\n');
    } else {
      // Show payment breakdown
      const sessionBasedPayments = await StudentPayment.countDocuments({ paymentType: 'session_based' });
      const manualPayments = await StudentPayment.countDocuments({ paymentType: { $ne: 'session_based' } });

      console.log(`📋 Payment Breakdown:`);
      console.log(`   - Session-based payments: ${sessionBasedPayments}`);
      console.log(`   - Manual payments: ${manualPayments}\n`);

      // Show payment by teacher
      const paymentsByTeacher = await StudentPayment.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'teacher',
            foreignField: '_id',
            as: 'teacherInfo'
          }
        },
        {
          $unwind: '$teacherInfo'
        },
        {
          $group: {
            _id: '$teacher',
            teacherName: { $first: { $ifNull: ['$teacherInfo.fullName', { $concat: ['$teacherInfo.firstName', ' ', '$teacherInfo.lastName'] }] } },
            teacherEmail: { $first: '$teacherInfo.email' },
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            totalPaid: { $sum: '$paidAmount' },
            totalPending: { $sum: '$remainingAmount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);

      console.log(`👨‍🏫 Payments by Teacher:\n`);
      paymentsByTeacher.forEach((teacher, index) => {
        console.log(`${index + 1}. ${teacher.teacherName} (${teacher.teacherEmail})`);
        console.log(`   - Total Expected: ${teacher.totalAmount} EGP`);
        console.log(`   - Total Paid: ${teacher.totalPaid} EGP`);
        console.log(`   - Total Pending: ${teacher.totalPending} EGP`);
        console.log(`   - Payment Records: ${teacher.totalPayments}\n`);
      });

      // Show recent payments
      const recentPayments = await StudentPayment.find()
        .populate('student', 'fullName firstName lastName email')
        .populate('group', 'name code')
        .sort('-createdAt')
        .limit(5);

      console.log(`\n📝 Recent Payment Records:\n`);
      recentPayments.forEach((payment, index) => {
        const studentName = payment.student?.fullName || 
          `${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`.trim() ||
          payment.student?.email || 'Unknown';
        
        console.log(`${index + 1}. ${studentName}`);
        console.log(`   Group: ${payment.group?.name || 'N/A'} (${payment.group?.code || 'N/A'})`);
        console.log(`   Type: ${payment.paymentType}`);
        console.log(`   Sessions: ${payment.sessionsAttended || 0}`);
        console.log(`   Total: ${payment.totalAmount} EGP | Paid: ${payment.paidAmount} EGP | Pending: ${payment.remainingAmount} EGP`);
        console.log(`   Status: ${payment.status}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
  }
}

checkStudentPayments();

