const mongoose = require('mongoose');
const Counter = require('./Counter');

const courseSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Relationships
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  
  // Course Details
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
                                                                                                                        // Course Content
  syllabus: {
    description: String,
    objectives: [String],
    modules: [{
      title: String,
      description: String,
      duration: Number, // in weeks
      topics: [String],
      learningOutcomes: [String]
    }]
  },
  
  // Assessment Structure
  assessmentStructure: [{
    type: {
      type: String,
      enum: ['quiz', 'midterm', 'final', 'assignment', 'project', 'presentation', 'lab'],
      required: true
    },
    name: String,
    weightage: {
      type: Number,
      required: true,                                                                                       
      min: 0,
      max: 100
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },
    date: Date,
    description: String
  }],
  
  // Course Materials
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['textbook', 'reference', 'slides', 'video', 'document', 'link']
    },
    url: String,
    description: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Grading Policy
  gradingPolicy: {
    gradingScale: {
      type: String,
      enum: ['percentage', 'gpa', 'letter'],
      default: 'percentage'
    },
    passingGrade: {
      type: Number,
      default: 60
    },
    gradeRanges: [{
      grade: String, // A+, A, B+, etc.
      minPercentage: Number,
      maxPercentage: Number,
      gpaValue: Number
    }]
  },
  
  // Course Policies
  policies: {
    attendancePolicy: String,
    lateSubmissionPolicy: String,
    makeupPolicy: String,
    academicIntegrityPolicy: String
  },
  
  // Status and Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  allowSelfEnrollment: {
    type: Boolean,
    default: false
  },
  maxEnrollment: {
    type: Number,
    default: 50
  },
  
  // Statistics
  stats: {
    totalStudents: { type: Number, default: 0 },
    averageAttendance: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    totalClasses: { type: Number, default: 0 },
    classesCompleted: { type: Number, default: 0 }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for course duration in weeks
courseSchema.virtual('durationWeeks').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
});

// Virtual for progress percentage
courseSchema.virtual('progressPercentage').get(function() {
  if (!this.stats.totalClasses || this.stats.totalClasses === 0) return 0;
  return Math.round((this.stats.classesCompleted / this.stats.totalClasses) * 100);
});

// Virtual for enrollment status
courseSchema.virtual('enrollmentStatus').get(function() {
  if (this.stats.totalStudents >= this.maxEnrollment) return 'full';
  if (this.stats.totalStudents > this.maxEnrollment * 0.8) return 'nearly_full';
  return 'open';
});

// Method to calculate total weightage
courseSchema.methods.getTotalWeightage = function() {
  return this.assessmentStructure.reduce((total, assessment) => 
    total + assessment.weightage, 0
  );
};

// Method to validate assessment structure
courseSchema.methods.validateAssessmentStructure = function() {
  const totalWeightage = this.getTotalWeightage();
  return totalWeightage === 100;
};

// Method to get current students count
courseSchema.methods.getCurrentStudentsCount = async function() {
  const Group = mongoose.model('Group');
  let totalStudents = 0;
  
  for (const groupId of this.groups) {
    const group = await Group.findById(groupId);
    if (group) {
      totalStudents += group.activeStudentsCount;
    }
  }
  
  return totalStudents;
};

// Pre-save validation and code generation
courseSchema.pre('save', async function(next) {
  try {
    // Auto-generate course code if not provided
    if (this.isNew && !this.code) {
      const sequence = await Counter.getNextSequence('course');
      this.code = `CO-${String(sequence).padStart(6, '0')}`;
    }
    
    // Ensure code is uppercase
    if (this.code) {
      this.code = this.code.toUpperCase();
    }
    
    // Validate date range
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
      return next(new Error('End date must be after start date'));
    }
    
    // Validate assessment structure if provided
    if (this.assessmentStructure && this.assessmentStructure.length > 0) {
      const totalWeightage = this.getTotalWeightage();
      if (totalWeightage > 100) {
        return next(new Error('Total assessment weightage cannot exceed 100%'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
courseSchema.index({ code: 1 });
courseSchema.index({ subject: 1 });
courseSchema.index({ teacher: 1 });
courseSchema.index({ academicYear: 1 });
courseSchema.index({ isActive: 1, isPublished: 1 });
courseSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Course', courseSchema);
