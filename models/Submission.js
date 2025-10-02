const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // Relationships
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Submission Content
  submissionType: {
    type: String,
    enum: ['file', 'text', 'link', 'quiz'],
    required: true
  },
  
  // File Submissions
  files: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Text Submissions
  textContent: {
    type: String,
    maxlength: 10000
  },
  
  // Link Submissions
  links: [{
    url: String,
    title: String,
    description: String
  }],
  
  // Quiz Submissions
  quizAnswers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: String,
    isCorrect: Boolean,
    pointsEarned: {
      type: Number,
      default: 0
    }
  }],
  
  // Submission Details
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 0
  },
  
  // Attempts (for quizzes/tests)
  attemptNumber: {
    type: Number,
    default: 1
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  
  // Grading
  status: {
    type: String,
    enum: ['submitted', 'grading', 'graded', 'returned', 'resubmission_required'],
    default: 'submitted'
  },
  
  // Grade Information
  grade: {
    pointsEarned: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    letterGrade: String,
    
    // Rubric Grading
    rubricGrades: [{
      criteriaId: mongoose.Schema.Types.ObjectId,
      points: Number,
      levelSelected: String,
      comments: String
    }],
    
    // Overall Feedback
    feedback: {
      type: String,
      maxlength: 2000
    },
    privateNotes: {
      type: String,
      maxlength: 1000
    },
    
    // Grading Details
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date,
    
    // Grade History
    gradeHistory: [{
      pointsEarned: Number,
      percentage: Number,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      gradedAt: Date,
      reason: String
    }]
  },
  
  // Plagiarism Check
  plagiarismCheck: {
    checked: {
      type: Boolean,
      default: false
    },
    score: Number, // percentage
    report: String, // URL or report data
    checkedAt: Date,
    sources: [String]
  },
  
  // Peer Review (if applicable)
  peerReviews: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    submittedAt: Date,
    content: String,
    files: [String],
    grade: Number
  }],
  
  // Flags and Notes
  flags: [{
    type: {
      type: String,
      enum: ['plagiarism', 'late', 'extension', 'resubmission', 'technical_issue', 'other']
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  browserInfo: {
    name: String,
    version: String,
    os: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for final grade after penalties
submissionSchema.virtual('finalGrade').get(function() {
  let finalPoints = this.grade.pointsEarned;
  
  // Apply late penalty
  if (this.isLate && this.latePenalty > 0) {
    finalPoints = finalPoints * (1 - this.latePenalty / 100);
  }
  
  return Math.max(0, finalPoints);
});

// Virtual for final percentage
submissionSchema.virtual('finalPercentage').get(function() {
  if (!this.assignment) return 0;
  return Math.round((this.finalGrade / this.assignment.maxPoints) * 100);
});

// Virtual for submission status description
submissionSchema.virtual('statusDescription').get(function() {
  const statusMap = {
    'submitted': 'Submitted - Waiting for grading',
    'grading': 'Currently being graded',
    'graded': 'Graded - Grade available',
    'returned': 'Returned with feedback',
    'resubmission_required': 'Resubmission required'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for total file size
submissionSchema.virtual('totalFileSize').get(function() {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Method to calculate quiz score
submissionSchema.methods.calculateQuizScore = function() {
  if (this.submissionType !== 'quiz' || !this.quizAnswers.length) {
    return { score: 0, total: 0, percentage: 0 };
  }
  
  const totalPoints = this.quizAnswers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
  const maxPoints = this.assignment.maxPoints || this.assignment.totalQuestionPoints;
  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  
  return {
    score: totalPoints,
    total: maxPoints,
    percentage: percentage
  };
};

// Method to auto-grade quiz
submissionSchema.methods.autoGradeQuiz = async function() {
  if (this.submissionType !== 'quiz') {
    throw new Error('Auto-grading is only available for quiz submissions');
  }
  
  const Assignment = mongoose.model('Assignment');
  const assignment = await Assignment.findById(this.assignment);
  
  if (!assignment || !assignment.questions.length) {
    throw new Error('Assignment or questions not found');
  }
  
  let totalPoints = 0;
  
  // Grade each answer
  this.quizAnswers.forEach(answer => {
    const question = assignment.questions.id(answer.questionId);
    if (question) {
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        answer.isCorrect = answer.answer === question.correctAnswer;
        answer.pointsEarned = answer.isCorrect ? question.points : 0;
      } else {
        // For open-ended questions, manual grading required
        answer.isCorrect = null;
        answer.pointsEarned = 0;
      }
      totalPoints += answer.pointsEarned;
    }
  });
  
  // Update grade
  this.grade.pointsEarned = totalPoints;
  this.grade.percentage = Math.round((totalPoints / assignment.maxPoints) * 100);
  this.status = 'graded';
  this.grade.gradedAt = new Date();
  
  return this.save();
};

// Method to add flag
submissionSchema.methods.addFlag = function(type, description, flaggedBy) {
  this.flags.push({
    type,
    description,
    flaggedBy,
    flaggedAt: new Date()
  });
  return this.save();
};

// Method to check if submission is late
submissionSchema.methods.checkIfLate = async function() {
  const Assignment = mongoose.model('Assignment');
  const assignment = await Assignment.findById(this.assignment);
  
  if (assignment && this.submittedAt > assignment.dueDate) {
    this.isLate = true;
    this.latePenalty = assignment.calculateLatePenalty(this.submittedAt);
  }
  
  return this;
};

// Pre-save middleware
submissionSchema.pre('save', async function(next) {
  // Check if submission is late
  if (this.isNew || this.isModified('submittedAt')) {
    await this.checkIfLate();
  }
  
  // Auto-calculate percentage if points are set
  if (this.grade.pointsEarned && this.assignment) {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);
    if (assignment) {
      this.grade.percentage = Math.round((this.grade.pointsEarned / assignment.maxPoints) * 100);
    }
  }
  
  next();
});

// Compound indexes for better performance
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1, course: 1 });
submissionSchema.index({ assignment: 1, status: 1 });
submissionSchema.index({ submittedAt: 1 });
submissionSchema.index({ 'grade.gradedAt': 1 });

module.exports = mongoose.model('Submission', submissionSchema);
