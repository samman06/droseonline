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
  
  // Grade levels this subject is taught in (Egyptian education system)
  gradeLevels: [{
    type: String,
    enum: [
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', // Primary
      'Grade 7', 'Grade 8', 'Grade 9', // Preparatory
      'Grade 10', 'Grade 11', 'Grade 12' // Secondary
    ]
  }],
  
  // Total marks/points for this subject
  totalMarks: {
    type: Number,
    min: 10,
    max: 200,
    default: 100
  },
  
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

// Virtual for grade level range display
subjectSchema.virtual('gradeLevelRange').get(function() {
  if (!this.gradeLevels || this.gradeLevels.length === 0) return 'All Grades';
  if (this.gradeLevels.length === 1) return this.gradeLevels[0];
  return `${this.gradeLevels[0]} - ${this.gradeLevels[this.gradeLevels.length - 1]}`;
});

// Indexes
subjectSchema.index({ code: 1 });
subjectSchema.index({ name: 1 });
subjectSchema.index({ gradeLevels: 1 });
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
