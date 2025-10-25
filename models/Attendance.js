const mongoose = require('mongoose');
const Counter = require('./Counter');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present',
    required: true
  },
  minutesLate: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const attendanceSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true // Allows null during creation before pre-save generates it
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  session: {
    date: {
      type: Date,
      required: true,
      index: true
    },
    scheduleIndex: {
      type: Number,
      required: true
    }
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  records: [attendanceRecordSchema],
  sessionNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Financial tracking
  sessionRevenue: {
    type: Number,
    min: 0,
    default: 0
  },
  presentCount: {
    type: Number,
    min: 0,
    default: 0
  },
  pricePerSession: {
    type: Number,
    min: 0,
    default: 0
  },
  
  isCompleted: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per group per session date
attendanceSchema.index({ group: 1, 'session.date': 1 }, { unique: true });

// Virtual for attendance statistics
attendanceSchema.virtual('stats').get(function() {
  const total = this.records.length;
  if (total === 0) return { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0 };

  const present = this.records.filter(r => r.status === 'present').length;
  const absent = this.records.filter(r => r.status === 'absent').length;
  const late = this.records.filter(r => r.status === 'late').length;
  const excused = this.records.filter(r => r.status === 'excused').length;
  const rate = Math.round(((present + late) / total) * 100);

  return { total, present, absent, late, excused, rate };
});

// Method to get student's attendance record in this session
attendanceSchema.methods.getStudentRecord = function(studentId) {
  return this.records.find(r => r.student.toString() === studentId.toString());
};

// Method to update student's attendance status
attendanceSchema.methods.updateStudentStatus = function(studentId, status, notes, markedBy, minutesLate) {
  const record = this.records.find(r => r.student.toString() === studentId.toString());
  if (record) {
    record.status = status;
    record.notes = notes || record.notes;
    record.minutesLate = minutesLate !== undefined ? minutesLate : record.minutesLate;
    record.markedAt = new Date();
    record.markedBy = markedBy;
  }
  return record;
};

// Method to lock session
attendanceSchema.methods.lock = function(userId) {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = userId;
  return this.save();
};

// Method to unlock session (admin only)
attendanceSchema.methods.unlock = function() {
  this.isLocked = false;
  this.lockedAt = null;
  this.lockedBy = null;
  return this.save();
};

// Method to check if session can be edited
attendanceSchema.methods.canEdit = function(userRole) {
  // Admins can always edit
  if (userRole === 'admin') return true;
  // Teachers can only edit if not locked
  return !this.isLocked;
};

// Static method to get attendance statistics for a student
attendanceSchema.statics.getStudentStats = async function(studentId) {
  const attendances = await this.find({ 'records.student': studentId });
  
  let total = 0;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  attendances.forEach(attendance => {
    const record = attendance.records.find(r => r.student.toString() === studentId.toString());
    if (record) {
      total++;
      if (record.status === 'present') present++;
      else if (record.status === 'absent') absent++;
      else if (record.status === 'late') late++;
      else if (record.status === 'excused') excused++;
    }
  });

  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return { total, present, absent, late, excused, rate };
};

// Static method to get attendance statistics for a group
attendanceSchema.statics.getGroupStats = async function(groupId) {
  const attendances = await this.find({ group: groupId });
  
  let totalSessions = attendances.length;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalExcused = 0;
  let totalRecords = 0;

  attendances.forEach(attendance => {
    totalRecords += attendance.records.length;
    totalPresent += attendance.records.filter(r => r.status === 'present').length;
    totalAbsent += attendance.records.filter(r => r.status === 'absent').length;
    totalLate += attendance.records.filter(r => r.status === 'late').length;
    totalExcused += attendance.records.filter(r => r.status === 'excused').length;
  });

  const rate = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0;

  return { 
    totalSessions, 
    totalRecords,
    totalPresent, 
    totalAbsent, 
    totalLate, 
    totalExcused, 
    rate 
  };
};

// Ensure virtuals are included in JSON
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

// Pre-save hook to generate attendance code
attendanceSchema.pre('save', async function(next) {
  if (!this.code) {
    try {
      const counter = await Counter.getNextSequence('attendance');
      this.code = `ATT-${String(counter).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);