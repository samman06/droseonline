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
  description: {
    type: String,
    maxlength: 500
  },
  
  // Academic Details
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  type: {
    type: String,
    enum: ['core', 'elective', 'practical', 'theory'],
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Syllabus and Content
  syllabus: {
    objectives: [String],
    topics: [{
      title: String,
      description: String,
      duration: Number, // in hours
      resources: [String]
    }],
    assessmentCriteria: [String]
  },
  
  // Assignment Templates
  assignmentTypes: [{
    name: String,
    description: String,
    maxMarks: Number,
    weightage: Number // percentage towards final grade
  }],
  
  // Resources
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['book', 'article', 'video', 'website', 'document']
    },
    url: String,
    description: String
  }],
  
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
    totalTeachers: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total syllabus duration
subjectSchema.virtual('totalDuration').get(function() {
  if (!this.syllabus || !this.syllabus.topics) return 0;
  return this.syllabus.topics.reduce((total, topic) => total + (topic.duration || 0), 0);
});

// Virtual for active courses count
subjectSchema.virtual('activeCourses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'subject',
  count: true,
  match: { isActive: true }
});

// Indexes
subjectSchema.index({ code: 1 });
subjectSchema.index({ name: 1 });
subjectSchema.index({ type: 1 });
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
