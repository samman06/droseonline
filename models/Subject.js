const mongoose = require('mongoose');
const Counter = require('./Counter');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10
  },
  
  // Grade levels moved to Group assignment. No gradeLevels here.
  
  // No total marks on subject; assessment handled elsewhere
  
  // Status and Management
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Statistics
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for active courses count
subjectSchema.virtual('activeCourses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'subject',
  count: true,
  match: { isActive: true }
});

// No grade virtuals; grades assigned via Groups

// Indexes
subjectSchema.index({ code: 1 });
subjectSchema.index({ name: 1 });
// Removed gradeLevels index
subjectSchema.index({ isActive: 1 });
subjectSchema.index({ createdBy: 1 });

// Pre-save middleware to auto-generate code and ensure uppercase
subjectSchema.pre('save', async function(next) {
  try {
    // Auto-generate subject code if not provided
    if (this.isNew && !this.code) {
      const sequence = await Counter.getNextSequence('subject');
      this.code = `SU-${String(sequence).padStart(6, '0')}`;
    }
    
    // Ensure code is uppercase
    if (this.code) {
      this.code = this.code.toUpperCase();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Subject', subjectSchema);
