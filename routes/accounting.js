const express = require('express');
const router = express.Router();
const StudentPayment = require('../models/StudentPayment');
const FinancialTransaction = require('../models/FinancialTransaction');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Course = require('../models/Course');
const Group = require('../models/Group');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware to check teacher access
const checkTeacherAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - teachers only'
      });
    }
    
    next();
  } catch (error) {
    console.error('Check teacher access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking access'
    });
  }
};

// ==================== FINANCIAL SUMMARY ====================

// @route   GET /api/accounting/summary
// @desc    Get financial summary for the teacher
// @access  Private (Teacher/Admin)
router.get('/summary', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    
    // Calculate date range
    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();
    
    if (!startDate) {
      switch (period) {
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(start.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setMonth(start.getMonth() - 1);
      }
    }
    
    // Get financial summary from transactions
    const summary = await FinancialTransaction.getFinancialSummary(req.user._id, start, end);
    
    // Get student payment stats from StudentPayment model (old manual payments)
    const oldPaymentStats = await StudentPayment.getTeacherStats(req.user._id);
    
    // Calculate student payment stats from attendance-based revenue
    const attendancePaymentStats = await StudentPayment.aggregate([
      { 
        $match: { 
          teacher: req.user._id,
          paymentType: 'session_based'
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$remainingAmount' },
          totalOverdue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'overdue'] },
                '$remainingAmount',
                0
              ]
            }
          },
          totalStudents: { $addToSet: '$student' },
          paymentCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalPaid: 1,
          totalPending: 1,
          totalOverdue: 1,
          totalStudents: { $size: '$totalStudents' },
          paymentCount: 1
        }
      }
    ]);
    
    // Get actual attendance-based revenue from groups (more reliable than StudentPayment)
    // Groups don't have teacher field - need to find through courses first
    const teacherCoursesForAggregate = await Course.find({ teacher: req.user._id }).select('_id');
    const courseIdsForAggregate = teacherCoursesForAggregate.map(c => c._id);
    
    const groupRevenueAggregate = await Group.aggregate([
      { $match: { course: { $in: courseIdsForAggregate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' },
          totalSessions: { $sum: '$totalSessionsHeld' }
        }
      }
    ]);
    
    const attendanceBasedRevenue = groupRevenueAggregate[0] || { totalRevenue: 0, totalSessions: 0 };
    
    // Calculate payment stats directly from Groups (attendance-based system)
    // In this system: attendance = payment (when student attends, they pay)
    // Groups don't have teacher directly - they have course.teacher
    const teacherCourses = await Course.find({ teacher: req.user._id }).select('_id');
    const courseIds = teacherCourses.map(c => c._id);
    
    const teacherGroups = await Group.find({ course: { $in: courseIds } })
      .select('totalRevenue totalSessionsHeld pricePerSession students')
      .lean();
    
    // Calculate total expected revenue and sessions info
    let totalExpectedRevenue = 0;
    let totalSessionsHeld = 0;
    let totalStudentsEnrolled = 0;
    
    for (const group of teacherGroups) {
      totalExpectedRevenue += group.totalRevenue || 0;
      totalSessionsHeld += group.totalSessionsHeld || 0;
      totalStudentsEnrolled += group.students?.length || 0;
    }
    
    // In attendance-based system:
    // - Total Revenue = what has been earned through attendance
    // - All revenue is considered "paid" since attendance = payment
    // - Pending/Overdue = 0 (no concept of pending in attendance-based system)
    const paymentStats = {
      totalRevenue: totalExpectedRevenue,
      totalExpected: totalExpectedRevenue,
      totalPaid: totalExpectedRevenue, // All attendance revenue is considered paid
      totalPending: 0, // No pending in attendance-based system
      totalOverdue: 0, // No overdue in attendance-based system
      paidStudents: 0, // Not applicable in attendance-based system
      partiallyPaidStudents: 0,
      pendingStudents: 0,
      overdueStudents: 0,
      totalStudents: totalStudentsEnrolled,
      totalSessions: totalSessionsHeld,
      paymentCount: totalSessionsHeld // Each session is a "payment"
    };
    
    // Get monthly trend
    const trend = await FinancialTransaction.getMonthlyTrend(req.user._id, 6);
    
    // Get revenue by groups (from new revenue tracking system)
    const groupRevenue = await Group.find({
      course: { $in: courseIds },
      totalRevenue: { $gt: 0 }
    })
    .select('name code totalRevenue totalSessionsHeld pricePerSession students')
    .populate('course', 'name code')
    .sort('-totalRevenue')
    .limit(10)
    .lean();
    
    // Get revenue by courses (from new revenue tracking system)
    const courseRevenue = await Course.find({
      teacher: req.user._id,
      totalRevenue: { $gt: 0 }
    })
    .select('name code totalRevenue totalSessionsHeld')
    .populate('subject', 'name')
    .sort('-totalRevenue')
    .limit(10)
    .lean();
    
    // Calculate total from attendance-based revenue
    const totalAttendanceRevenue = await Group.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$totalRevenue' },
        totalSessions: { $sum: '$totalSessionsHeld' }
      }}
    ]);
    
    res.json({
      success: true,
      data: {
        ...summary,
        studentPayments: paymentStats,
        trend,
        // New revenue tracking data
        groupRevenue: groupRevenue.map(g => ({
          _id: g._id,
          name: g.name,
          code: g.code,
          courseName: g.course?.name,
          courseCode: g.course?.code,
          totalRevenue: g.totalRevenue || 0,
          totalSessions: g.totalSessionsHeld || 0,
          pricePerSession: g.pricePerSession || 0,
          studentCount: g.students?.length || 0,
          avgRevenuePerSession: g.totalSessionsHeld > 0 ? (g.totalRevenue / g.totalSessionsHeld) : 0
        })),
        courseRevenue: courseRevenue.map(c => ({
          _id: c._id,
          name: c.name,
          code: c.code,
          subjectName: c.subject?.name,
          totalRevenue: c.totalRevenue || 0,
          totalSessions: c.totalSessionsHeld || 0,
          avgRevenuePerSession: c.totalSessionsHeld > 0 ? (c.totalRevenue / c.totalSessionsHeld) : 0
        })),
        attendanceRevenue: {
          total: totalAttendanceRevenue[0]?.totalRevenue || 0,
          totalSessions: totalAttendanceRevenue[0]?.totalSessions || 0
        }
      }
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching financial summary'
    });
  }
});

// ==================== FINANCIAL TRANSACTIONS ====================

// @route   GET /api/accounting/transactions
// @desc    Get all financial transactions (for teacher: their own, for admin: all)
// @access  Private (Teacher/Admin)
router.get('/transactions', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { 
      type, 
      category, 
      status, 
      startDate, 
      endDate,
      search,
      page = 1, 
      limit = 20,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query - Admins see all transactions, teachers see only their own
    const query = {};
    
    // Only filter by teacher if user is NOT an admin
    if (req.user.role !== 'admin') {
      query.teacher = req.user._id;
    }
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [transactions, total] = await Promise.all([
      FinancialTransaction.find(query)
        .populate('teacher', 'firstName lastName fullName email')
        .populate({
          path: 'relatedTo.modelId',
          select: 'firstName lastName fullName name code group session',
          options: { strictPopulate: false }
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FinancialTransaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   POST /api/accounting/transactions
// @desc    Create a new financial transaction
// @access  Private (Teacher/Admin)
router.post('/transactions', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      teacher: req.user._id,
      createdBy: req.user._id
    };
    
    // Generate receipt number if not provided
    if (!transactionData.receiptNumber) {
      transactionData.receiptNumber = await FinancialTransaction.generateReceiptNumber();
    }
    
    const transaction = new FinancialTransaction(transactionData);
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction'
    });
  }
});

// @route   GET /api/accounting/transactions/:id
// @desc    Get single transaction
// @access  Private (Teacher/Admin)
router.get('/transactions/:id', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id)
      .populate('teacher', 'firstName lastName fullName email')
      .populate('relatedTo.modelId')
      .populate('createdBy', 'firstName lastName fullName')
      .populate('updatedBy', 'firstName lastName fullName');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Get teacher ID correctly (handle both populated and unpopulated)
    const transactionTeacherId = transaction.teacher?._id || transaction.teacher;
    
    // Check ownership
    if (req.user.role !== 'admin' && transactionTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   PUT /api/accounting/transactions/:id
// @desc    Update a transaction
// @access  Private (Teacher/Admin - Owner only)
router.put('/transactions/:id', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Check if transaction is auto-generated from attendance (read-only)
    if (transaction.relatedTo?.modelType === 'Attendance') {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit attendance-generated transactions. These are automatically created from attendance records.'
      });
    }
    
    // Check ownership (handle populated teacher field)
    const transactionTeacherId = transaction.teacher?._id || transaction.teacher;
    if (req.user.role !== 'admin' && transactionTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update fields
    Object.assign(transaction, req.body);
    transaction.updatedBy = req.user._id;
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction'
    });
  }
});

// @route   DELETE /api/accounting/transactions/:id
// @desc    Delete a transaction
// @access  Private (Teacher/Admin - Owner only)
router.delete('/transactions/:id', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Check if transaction is auto-generated from attendance (read-only)
    if (transaction.relatedTo?.modelType === 'Attendance') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete attendance-generated transactions. These are automatically managed by the system.'
      });
    }
    
    // Check ownership (handle populated teacher field)
    const transactionTeacherId = transaction.teacher?._id || transaction.teacher;
    if (req.user.role !== 'admin' && transactionTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await transaction.deleteOne();
    
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

// ==================== STUDENT PAYMENTS ====================

// @route   GET /api/accounting/payments
// @desc    Get all student payments for the teacher
// @access  Private (Teacher/Admin)
router.get('/payments', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const {
      student,
      course,
      group,
      status,
      paymentType,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { teacher: req.user._id };
    
    if (student) query.student = student;
    if (course) query.course = course;
    if (group) query.group = group;
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [payments, total] = await Promise.all([
      StudentPayment.find(query)
        .populate('student', 'firstName lastName fullName email studentCode')
        .populate('course', 'name code')
        .populate('group', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      StudentPayment.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments'
    });
  }
});

// @route   POST /api/accounting/payments
// @desc    Create a new student payment record
// @access  Private (Teacher/Admin)
router.post('/payments', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      teacher: req.user._id,
      createdBy: req.user._id
    };
    
    // Generate receipt number if payment is made
    if (paymentData.status === 'paid' && !paymentData.receiptNumber) {
      paymentData.receiptNumber = await StudentPayment.generateReceiptNumber();
    }
    
    const payment = new StudentPayment(paymentData);
    await payment.save();
    
    // If payment is completed, create a financial transaction
    if (payment.paidAmount > 0) {
      const transaction = new FinancialTransaction({
        type: 'income',
        category: 'student_payment',
        teacher: req.user._id,
        amount: payment.paidAmount,
        title: `Payment from student - ${payment.paymentType}`,
        description: payment.notes,
        transactionDate: payment.paidDate || new Date(),
        paymentMethod: payment.paymentMethod,
        status: 'completed',
        relatedTo: {
          modelType: 'StudentPayment',
          modelId: payment._id
        },
        createdBy: req.user._id
      });
      
      await transaction.save();
      payment.transaction = transaction._id;
      await payment.save();
    }
    
    await payment.populate('student course group');
    
    res.status(201).json({
      success: true,
      message: 'Payment record created successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment'
    });
  }
});

// @route   PUT /api/accounting/payments/:id
// @desc    Update a student payment (add payment, update status, etc.)
// @access  Private (Teacher/Admin - Owner only)
router.put('/payments/:id', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const payment = await StudentPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && payment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const oldPaidAmount = payment.paidAmount;
    
    // Update fields
    Object.assign(payment, req.body);
    payment.updatedBy = req.user._id;
    
    // Generate receipt if newly paid
    if (payment.status === 'paid' && !payment.receiptNumber) {
      payment.receiptNumber = await StudentPayment.generateReceiptNumber();
    }
    
    await payment.save();
    
    // Create transaction for additional payment
    if (req.body.paidAmount && req.body.paidAmount > oldPaidAmount) {
      const additionalPayment = req.body.paidAmount - oldPaidAmount;
      const transaction = new FinancialTransaction({
        type: 'income',
        category: 'student_payment',
        teacher: req.user._id,
        amount: additionalPayment,
        title: `Additional payment from student`,
        description: req.body.notes || payment.notes,
        transactionDate: new Date(),
        paymentMethod: req.body.paymentMethod || payment.paymentMethod,
        status: 'completed',
        relatedTo: {
          modelType: 'StudentPayment',
          modelId: payment._id
        },
        createdBy: req.user._id
      });
      
      await transaction.save();
    }
    
    await payment.populate('student course group');
    
    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment'
    });
  }
});

// @route   GET /api/accounting/payments/stats
// @desc    Get payment statistics for teacher
// @access  Private (Teacher/Admin)
router.get('/payments/stats', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { course, group, academicYear } = req.query;
    
    const filters = {};
    if (course) filters.course = course;
    if (group) filters.group = group;
    if (academicYear) filters.academicYear = academicYear;
    
    const stats = await StudentPayment.getTeacherStats(req.user._id, filters);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics'
    });
  }
});

// @route   GET /api/accounting/reports/profit-loss
// @desc    Get profit & loss report
// @access  Private (Teacher/Admin)
router.get('/reports/profit-loss', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const summary = await FinancialTransaction.getFinancialSummary(req.user._id, start, end);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get profit-loss report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating report'
    });
  }
});

// ==================== ATTENDANCE-BASED PAYMENT CALCULATION ====================

// @route   GET /api/accounting/attendance/calculate/:groupId
// @desc    Calculate payments based on attendance for a specific group
// @access  Private (Teacher/Admin)
router.get('/attendance/calculate/:groupId', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get group with price per session
    const group = await Group.findById(groupId)
      .populate('course', 'name code')
      .populate('students.student', 'firstName lastName fullName email studentCode');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check teacher access
    if (req.user.role !== 'admin' && group.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Build attendance query
    const attendanceQuery = {
      group: groupId
    };
    
    if (startDate || endDate) {
      attendanceQuery['session.date'] = {};
      if (startDate) attendanceQuery['session.date'].$gte = new Date(startDate);
      if (endDate) attendanceQuery['session.date'].$lte = new Date(endDate);
    }
    
    // Get all attendance records for this group
    const attendances = await Attendance.find(attendanceQuery).sort({ 'session.date': 1 });
    
    // Calculate attendance count per student
    const studentAttendance = {};
    
    attendances.forEach(attendance => {
      attendance.records.forEach(record => {
        if (record.status === 'present') {
          const studentId = record.student.toString();
          if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {
              count: 0,
              attendanceIds: []
            };
          }
          studentAttendance[studentId].count++;
          studentAttendance[studentId].attendanceIds.push(attendance._id);
        }
      });
    });
    
    // Calculate payment for each student
    const calculations = [];
    
    for (const student of group.students) {
      const studentId = student.student._id.toString();
      const attendanceData = studentAttendance[studentId] || { count: 0, attendanceIds: [] };
      
      const calculation = {
        student: {
          _id: student.student._id,
          fullName: student.student.fullName,
          email: student.student.email,
          studentCode: student.student.studentCode
        },
        sessionsAttended: attendanceData.count,
        pricePerSession: group.pricePerSession || 0,
        totalAmount: (attendanceData.count * (group.pricePerSession || 0)),
        attendanceRecords: attendanceData.attendanceIds,
        enrollmentDate: student.enrollmentDate,
        status: student.status
      };
      
      // Check if payment record already exists
      const existingPayment = await StudentPayment.findOne({
        student: studentId,
        group: groupId,
        paymentType: 'session_based'
      });
      
      if (existingPayment) {
        calculation.existingPayment = {
          _id: existingPayment._id,
          paidAmount: existingPayment.paidAmount,
          remainingAmount: existingPayment.remainingAmount,
          status: existingPayment.status
        };
      }
      
      calculations.push(calculation);
    }
    
    // Summary
    const summary = {
      totalSessions: attendances.length,
      totalStudents: group.students.length,
      activeStudents: calculations.filter(c => c.status === 'active').length,
      totalRevenue: calculations.reduce((sum, c) => sum + c.totalAmount, 0),
      pricePerSession: group.pricePerSession || 0
    };
    
    res.json({
      success: true,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          code: group.code,
          course: group.course,
          pricePerSession: group.pricePerSession
        },
        period: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null
        },
        summary,
        calculations
      }
    });
  } catch (error) {
    console.error('Calculate attendance payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating payments'
    });
  }
});

// @route   POST /api/accounting/attendance/generate-payments
// @desc    Generate/update payment records based on attendance
// @access  Private (Teacher/Admin)
router.post('/attendance/generate-payments', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { groupId, startDate, endDate, updateExisting = false } = req.body;
    
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }
    
    // Get group
    const group = await Group.findById(groupId).populate('course');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check teacher access
    if (req.user.role !== 'admin' && group.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Build attendance query
    const attendanceQuery = {
      group: groupId
    };
    
    if (startDate || endDate) {
      attendanceQuery['session.date'] = {};
      if (startDate) attendanceQuery['session.date'].$gte = new Date(startDate);
      if (endDate) attendanceQuery['session.date'].$lte = new Date(endDate);
    }
    
    // Get attendance records
    const attendances = await Attendance.find(attendanceQuery);
    
    // Calculate attendance per student
    const studentAttendance = {};
    
    attendances.forEach(attendance => {
      attendance.records.forEach(record => {
        if (record.status === 'present') {
          const studentId = record.student.toString();
          if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {
              count: 0,
              attendanceIds: []
            };
          }
          studentAttendance[studentId].count++;
          studentAttendance[studentId].attendanceIds.push(attendance._id);
        }
      });
    });
    
    const created = [];
    const updated = [];
    const skipped = [];
    
    // Generate/update payments
    for (const [studentId, data] of Object.entries(studentAttendance)) {
      const totalAmount = data.count * (group.pricePerSession || 0);
      
      // Check if payment exists
      let payment = await StudentPayment.findOne({
        student: studentId,
        group: groupId,
        paymentType: 'session_based'
      });
      
      if (payment) {
        if (updateExisting) {
          // Update existing payment
          payment.sessionsAttended = data.count;
          payment.pricePerSession = group.pricePerSession;
          payment.totalAmount = totalAmount;
          payment.remainingAmount = totalAmount - payment.paidAmount - payment.discount;
          payment.attendanceRecords = data.attendanceIds;
          payment.updatedBy = req.user._id;
          
          await payment.save();
          await payment.populate('student', 'firstName lastName fullName');
          updated.push(payment);
        } else {
          skipped.push({ studentId, reason: 'Payment already exists' });
        }
      } else {
        // Create new payment
        payment = new StudentPayment({
          student: studentId,
          course: group.course._id,
          group: groupId,
          teacher: req.user._id,
          paymentType: 'session_based',
          sessionsAttended: data.count,
          pricePerSession: group.pricePerSession,
          totalAmount: totalAmount,
          paidAmount: 0,
          status: 'pending',
          attendanceRecords: data.attendanceIds,
          notes: `Auto-generated from ${data.count} attended session(s)`,
          createdBy: req.user._id
        });
        
        await payment.save();
        await payment.populate('student', 'firstName lastName fullName');
        created.push(payment);
      }
    }
    
    res.json({
      success: true,
      message: `Generated ${created.length} new payments, updated ${updated.length}, skipped ${skipped.length}`,
      data: {
        created,
        updated,
        skipped,
        summary: {
          totalCreated: created.length,
          totalUpdated: updated.length,
          totalSkipped: skipped.length
        }
      }
    });
  } catch (error) {
    console.error('Generate attendance payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating payments'
    });
  }
});

// @route   GET /api/accounting/groups/:groupId/revenue
// @desc    Get revenue summary for a specific group
// @access  Private (Teacher/Admin)
router.get('/groups/:groupId/revenue', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId).populate('course', 'name');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check access
    if (req.user.role !== 'admin' && group.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get all payments for this group
    const payments = await StudentPayment.find({ group: groupId })
      .populate('student', 'firstName lastName fullName');
    
    // Calculate statistics
    const stats = {
      totalStudents: group.students.length,
      pricePerSession: group.pricePerSession,
      payments: {
        total: payments.length,
        pending: payments.filter(p => p.status === 'pending').length,
        paid: payments.filter(p => p.status === 'paid').length,
        partial: payments.filter(p => p.status === 'partial').length,
        overdue: payments.filter(p => p.status === 'overdue').length
      },
      revenue: {
        expected: payments.reduce((sum, p) => sum + p.totalAmount, 0),
        collected: payments.reduce((sum, p) => sum + p.paidAmount, 0),
        pending: payments.reduce((sum, p) => sum + p.remainingAmount, 0)
      },
      sessions: {
        total: payments.reduce((sum, p) => sum + (p.sessionsAttended || 0), 0)
      }
    };
    
    res.json({
      success: true,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          code: group.code,
          course: group.course
        },
        stats,
        payments
      }
    });
  } catch (error) {
    console.error('Get group revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group revenue'
    });
  }
});

module.exports = router;

