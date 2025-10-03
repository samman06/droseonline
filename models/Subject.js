const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
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

// Pre-save middleware to ensure code is uppercase
subjectSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Subject', subjectSchema);
