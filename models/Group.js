const mongoose = require('mongoose');
const Counter = require('./Counter');

const groupSchema = new mongoose.Schema({
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
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Course Assignment (Required - groups inherit teacher and subject from course)
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // Grade filter for enrollment (Egyptian grades)
  gradeLevel: {
    type: String,
    enum: [
      'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
      'Grade 7','Grade 8','Grade 9',
      'Grade 10','Grade 11','Grade 12'
    ],
    required: true
  },
  
  currentEnrollment: {
    type: Number,
    default: 0
  },
  
  // Students in this group
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'dropped', 'completed', 'transferred'],
      default: 'active'
    }
  }],
  
  // Group Leader/Monitor
  classMonitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Weekly schedule (simple recurrence)
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String, // "HH:MM"
    endTime: String    // "HH:MM"
  }],

  // Pricing
  pricePerSession: {
    type: Number,
    min: 0,
    default: 0
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
    averageAttendance: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    completedAssignments: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// No available spots (no max capacity)

// Virtual for active students count
groupSchema.virtual('activeStudentsCount').get(function() {
  return this.students ? this.students.filter(s => s.status === 'active').length : 0;
});

// Optional composite name
groupSchema.virtual('fullName').get(function() {
  return `${this.name} - ${this.gradeLevel}`;
});

// Method to add student to group
groupSchema.methods.addStudent = function(studentId) {
  const existingStudent = this.students.find(s => 
    s.student.toString() === studentId.toString() && s.status === 'active'
  );
  
  if (existingStudent) {
    throw new Error('Student is already enrolled in this group');
  }
  
  this.students.push({
    student: studentId,
    enrollmentDate: new Date(),
    status: 'active'
  });
  
  this.currentEnrollment += 1;
  return this.save();
};

// Method to remove student from group
groupSchema.methods.removeStudent = function(studentId, status = 'dropped') {
  const studentIndex = this.students.findIndex(s => 
    s.student.toString() === studentId.toString() && s.status === 'active'
  );
  
  if (studentIndex === -1) {
    throw new Error('Student not found in this group');
  }
  
  this.students[studentIndex].status = status;
  this.currentEnrollment = Math.max(0, this.currentEnrollment - 1);
  return this.save();
};

// Update enrollment count before saving
groupSchema.pre('save', async function(next) {
  try {
    // Auto-generate group code if not provided
    if (this.isNew && !this.code) {
      const sequence = await Counter.getNextSequence('group');
      this.code = `GR-${String(sequence).padStart(6, '0')}`;
    }
    
    // Update enrollment count
    this.currentEnrollment = this.students.filter(s => s.status === 'active').length;
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
groupSchema.index({ code: 1 });
groupSchema.index({ name: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ 'students.student': 1 });
groupSchema.index({ teacher: 1 });
groupSchema.index({ subject: 1 });
groupSchema.index({ gradeLevel: 1 });

module.exports = mongoose.model('Group', groupSchema);
