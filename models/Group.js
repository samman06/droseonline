const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
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
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Academic Information
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  level: {
    type: String,
    enum: ['freshman', 'sophomore', 'junior', 'senior', 'graduate'],
    required: true
  },
  semester: {
    type: String,
    enum: ['fall', 'spring', 'summer'],
    required: true
  },
  
  // Capacity Management
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
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
  
  // Schedule Information
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String, // Format: "HH:MM"
    endTime: String,   // Format: "HH:MM"
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    room: String
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

// Virtual for available spots
groupSchema.virtual('availableSpots').get(function() {
  return this.capacity - this.currentEnrollment;
});

// Virtual for active students count
groupSchema.virtual('activeStudentsCount').get(function() {
  return this.students.filter(s => s.status === 'active').length;
});

// Virtual for full name with level and semester
groupSchema.virtual('fullName').get(function() {
  return `${this.name} - ${this.level} (${this.semester})`;
});

// Method to add student to group
groupSchema.methods.addStudent = function(studentId) {
  if (this.currentEnrollment >= this.capacity) {
    throw new Error('Group is at full capacity');
  }
  
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
groupSchema.pre('save', function(next) {
  this.currentEnrollment = this.students.filter(s => s.status === 'active').length;
  next();
});

// Indexes
groupSchema.index({ code: 1 });
groupSchema.index({ name: 1 });
groupSchema.index({ academicYear: 1 });
groupSchema.index({ level: 1, semester: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ 'students.student': 1 });

module.exports = mongoose.model('Group', groupSchema);
