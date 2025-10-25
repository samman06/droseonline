const mongoose = require('mongoose');

const studentPaymentSchema = new mongoose.Schema({
  // Relationships
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    index: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'EGP',
    enum: ['EGP', 'USD', 'EUR', 'SAR', 'AED']
  },
  
  // Payment Type
  paymentType: {
    type: String,
    required: true,
    enum: ['enrollment', 'monthly', 'installment', 'material', 'exam', 'session_based', 'other'],
    default: 'monthly'
  },
  
  // Session-Based Payment (for attendance-based pricing)
  sessionsAttended: {
    type: Number,
    default: 0,
    min: 0
  },
  pricePerSession: {
    type: Number,
    default: 0,
    min: 0
  },
  attendanceRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }],
  
  // Payment Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  
  // Amounts
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Dates
  dueDate: {
    type: Date,
    index: true
  },
  paidDate: {
    type: Date
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'mobile_wallet', 'check', 'other'],
    default: 'cash'
  },
  
  // Notes and References
  notes: {
    type: String,
    maxlength: 1000
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  transactionReference: {
    type: String,
    maxlength: 200
  },
  
  // Related Financial Transaction
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinancialTransaction'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common queries
studentPaymentSchema.index({ student: 1, course: 1 });
studentPaymentSchema.index({ teacher: 1, status: 1 });
studentPaymentSchema.index({ dueDate: 1, status: 1 });
studentPaymentSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate remaining amount
studentPaymentSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount - this.discount;
  
  // Update status based on payment
  if (this.paidAmount >= this.totalAmount - this.discount) {
    this.status = 'paid';
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (this.dueDate && this.dueDate < new Date() && this.status === 'pending') {
    this.status = 'overdue';
  }
  
  next();
});

// Virtual for payment progress percentage
studentPaymentSchema.virtual('paymentProgress').get(function() {
  if (this.totalAmount === 0) return 100;
  return Math.round((this.paidAmount / (this.totalAmount - this.discount)) * 100);
});

// Static method to generate receipt number
studentPaymentSchema.statics.generateReceiptNumber = async function() {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    receiptNumber: new RegExp(`^REC-${year}-`)
  });
  return `REC-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Static method to get payment statistics for a teacher
studentPaymentSchema.statics.getTeacherStats = async function(teacherId, filters = {}) {
  const query = { teacher: teacherId, ...filters };
  
  const [stats] = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$paidAmount' },
        totalPending: { 
          $sum: { 
            $cond: [
              { $in: ['$status', ['pending', 'partial', 'overdue']] },
              '$remainingAmount',
              0
            ]
          }
        },
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
        totalPending: 1,
        totalOverdue: 1,
        totalStudents: { $size: '$totalStudents' },
        paymentCount: 1
      }
    }
  ]);
  
  return stats || {
    totalRevenue: 0,
    totalPending: 0,
    totalOverdue: 0,
    totalStudents: 0,
    paymentCount: 0
  };
};

module.exports = mongoose.model('StudentPayment', studentPaymentSchema);

