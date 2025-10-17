const mongoose = require('mongoose');
const Counter = require('./Counter');

const assignmentSchema = new mongoose.Schema({
  // Basic Information
  code: {
    type: String,
    unique: true,
    sparse: true // Allows null during creation before pre-save generates it
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  instructions: {
    type: String,
    maxlength: 5000
  },
  
  // Relationships
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
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
  
  // Assignment Details
  type: {
    type: String,
    enum: ['homework', 'quiz', 'midterm', 'final', 'project', 'presentation', 'lab', 'essay', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['individual', 'group', 'pair'],
    default: 'individual'
  },
  
  // Scoring
  maxPoints: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  weightage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10
  },
  
  // Timeline
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  lateSubmissionDeadline: {
    type: Date
  },
  
  // Submission Settings
  submissionType: {
    type: String,
    enum: ['file', 'text', 'link', 'quiz', 'multiple'],
    default: 'file'
  },
  allowedFileTypes: [String], // ['pdf', 'doc', 'docx', 'txt']
  maxFileSize: {
    type: Number,
    default: 10 // in MB
  },
  maxFiles: {
    type: Number,
    default: 1
  },
  allowLateSubmission: {
    type: Boolean,
    default: true
  },
  latePenalty: {
    type: Number,
    default: 10 // percentage deduction per day
  },
  
  // Quiz/Test Specific Settings
  quizSettings: {
    timeLimit: Number, // in minutes
    questionsPerPage: {
      type: Number,
      default: 1
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    allowBacktrack: {
      type: Boolean,
      default: true
    },
    showResultsImmediately: {
      type: Boolean,
      default: false
    },
    maxAttempts: {
      type: Number,
      default: 1
    }
  },
  
  // Questions (for quiz/test assignments)
  questions: [{
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank']
    },
    question: String,
    options: [String], // for multiple choice
    correctAnswer: String,
    points: {
      type: Number,
      default: 1
    },
    explanation: String
  }],
  
  // Rubric for grading
  rubric: [{
    criteria: String,
    description: String,
    points: Number,
    levels: [{
      name: String, // Excellent, Good, Fair, Poor
      description: String,
      points: Number
    }]
  }],
  
  // Resources and Materials
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['file', 'link', 'video', 'document']
    },
    url: String,
    description: String
  }],
  
  // Status and Settings
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'graded'],
    default: 'draft'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Plagiarism Settings
  plagiarismCheck: {
    enabled: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 20 // percentage
    }
  },
  
  // Statistics
  stats: {
    totalSubmissions: { type: Number, default: 0 },
    gradedSubmissions: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    highestGrade: { type: Number, default: 0 },
    lowestGrade: { type: Number, default: 0 },
    submissionRate: { type: Number, default: 0 },
    lateSubmissions: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days until due
assignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Virtual for accepting submissions
assignmentSchema.virtual('acceptingSubmissions').get(function() {
  const now = new Date();
  if (this.status !== 'published') return false;
  if (this.allowLateSubmission && this.lateSubmissionDeadline) {
    return now <= this.lateSubmissionDeadline;
  }
  return now <= this.dueDate;
});

// Virtual for total questions points
assignmentSchema.virtual('totalQuestionPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for submission status
assignmentSchema.virtual('submissionStatus').get(function() {
  const now = new Date();
  if (this.status === 'draft') return 'draft';
  if (this.status === 'closed' || this.status === 'graded') return 'closed';
  if (now > this.dueDate) {
    if (this.allowLateSubmission && this.lateSubmissionDeadline && now <= this.lateSubmissionDeadline) {
      return 'late_submission';
    }
    return 'overdue';
  }
  return 'open';
});

// Method to calculate late penalty
assignmentSchema.methods.calculateLatePenalty = function(submissionDate) {
  if (!this.allowLateSubmission || submissionDate <= this.dueDate) {
    return 0;
  }
  
  const daysLate = Math.ceil((submissionDate - this.dueDate) / (1000 * 60 * 60 * 24));
  return Math.min(this.latePenalty * daysLate, 100); // Cap at 100%
};

// Method to check if student can submit
assignmentSchema.methods.canSubmit = function() {
  return this.acceptingSubmissions;
};

// Method to get students who can access this assignment
assignmentSchema.methods.getEligibleStudents = async function() {
  const Group = mongoose.model('Group');
  let students = [];
  
  for (const groupId of this.groups) {
    const group = await Group.findById(groupId).populate('students.student');
    if (group) {
      const activeStudents = group.students
        .filter(s => s.status === 'active')
        .map(s => s.student);
      students = students.concat(activeStudents);
    }
  }
  
  // Remove duplicates
  const uniqueStudents = students.filter((student, index, self) =>
    index === self.findIndex(s => s._id.toString() === student._id.toString())
  );
  
  return uniqueStudents;
};

// Pre-save validation
assignmentSchema.pre('save', async function(next) {
  // Generate code if not exists (for new assignments)
  if (this.isNew && !this.code) {
    try {
      const sequence = await Counter.getNextSequence('assignment');
      this.code = `AS-${String(sequence).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Validate due date
  if (this.dueDate <= this.assignedDate) {
    return next(new Error('Due date must be after assigned date'));
  }
  
  // Validate late submission deadline
  if (this.lateSubmissionDeadline && this.lateSubmissionDeadline <= this.dueDate) {
    return next(new Error('Late submission deadline must be after due date'));
  }
  
  // Validate quiz settings
  if (this.type === 'quiz' && this.questions.length === 0) {
    return next(new Error('Quiz assignments must have at least one question'));
  }
  
  // Validate rubric total points
  if (this.rubric.length > 0) {
    const rubricTotal = this.rubric.reduce((total, item) => total + item.points, 0);
    if (rubricTotal !== this.maxPoints) {
      return next(new Error('Rubric total points must equal assignment max points'));
    }
  }
  
  next();
});

// Indexes
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ type: 1 });
assignmentSchema.index({ assignedDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
