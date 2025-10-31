const mongoose = require('mongoose');

const financialTransactionSchema = new mongoose.Schema({
  // Transaction Type
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'],
    index: true
  },
  
  // Category
  category: {
    type: String,
    required: true,
    enum: [
      // Income Categories
      'student_payment', 'enrollment_fee', 'material_sale', 'exam_fee', 'other_income',
      // Expense Categories
      'assistant_salary', 'rent', 'utilities', 'materials', 'marketing', 
      'maintenance', 'transportation', 'equipment', 'software', 'other_expense'
    ],
    index: true
  },
  
  // Relationships
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  relatedTo: {
    modelType: {
      type: String,
      enum: ['StudentPayment', 'Course', 'Group', 'User', 'Material', 'Attendance', null]
    },
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.modelType'
    }
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EGP',
    enum: ['EGP', 'USD', 'EUR', 'SAR', 'AED']
  },
  
  // Description
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Date
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'mobile_wallet', 'check', 'other'],
    default: 'cash'
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceNumber: {
    type: String,
    sparse: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed',
    index: true
  },
  
  // Recurring Transaction
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null]
  },
  recurringEndDate: {
    type: Date
  },
  
  // Attachments (receipts, invoices, etc.)
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notes
  notes: {
    type: String,
    maxlength: 2000
  },
  
  // Tags for better organization
  tags: [{
    type: String,
    maxlength: 50
  }],
  
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
financialTransactionSchema.index({ teacher: 1, type: 1 });
financialTransactionSchema.index({ teacher: 1, category: 1 });
financialTransactionSchema.index({ transactionDate: -1 });
financialTransactionSchema.index({ teacher: 1, transactionDate: -1 });

// Static method to generate receipt number
financialTransactionSchema.statics.generateReceiptNumber = async function() {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    receiptNumber: new RegExp(`^TRX-${year}-`)
  });
  return `TRX-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Static method to get financial summary for a teacher
financialTransactionSchema.statics.getFinancialSummary = async function(teacherId, startDate, endDate) {
  const query = {
    teacher: teacherId,
    status: 'completed',
    transactionDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  const [summary] = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        byCategory: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);
  
  // Get category breakdown
  const categoryStats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
  
  // Calculate totals
  const income = await this.aggregate([
    { $match: { ...query, type: 'income' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const expenses = await this.aggregate([
    { $match: { ...query, type: 'expense' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const totalIncome = income[0]?.total || 0;
  const totalExpenses = expenses[0]?.total || 0;
  const netProfit = totalIncome - totalExpenses;
  
  return {
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0,
    categoryBreakdown: categoryStats,
    period: {
      startDate,
      endDate
    }
  };
};

// Static method to get monthly trend
financialTransactionSchema.statics.getMonthlyTrend = async function(teacherId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const trend = await this.aggregate([
    {
      $match: {
        teacher: new mongoose.Types.ObjectId(teacherId),
        status: 'completed',
        transactionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactionDate' },
          month: { $month: '$transactionDate' },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
  
  return trend;
};

module.exports = mongoose.model('FinancialTransaction', financialTransactionSchema);

