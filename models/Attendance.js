const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Relationships
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  
  // Class/Session Information
  classDate: {
    type: Date,
    required: true
  },
  classStartTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  classEndTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  classType: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar', 'exam', 'other'],
    default: 'lecture'
  },
  topic: {
    type: String,
    maxlength: 200
  },
  room: String,
  
  // Attendance Details
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'partial'],
    required: true
  },
  arrivalTime: String, // Format: "HH:MM"
  departureTime: String, // Format: "HH:MM"
  
  // Late/Early Leave Details
  minutesLate: {
    type: Number,
    default: 0
  },
  minutesEarlyLeave: {
    type: Number,
    default: 0
  },
  
  // Absence Information
  absenceReason: {
    type: String,
    enum: ['sick', 'family_emergency', 'personal', 'academic', 'medical', 'other'],
    required: function() {
      return this.status === 'absent' || this.status === 'excused';
    }
  },
  absenceNote: {
    type: String,
    maxlength: 500
  },
  isExcused: {
    type: Boolean,
    default: false
  },
  excusedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  excuseDocument: {
    filename: String,
    path: String,
    uploadDate: Date
  },
  
  // Participation and Behavior
  participationScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  behaviorNotes: {
    type: String,
    maxlength: 500
  },
  
  // Recording Method
  recordingMethod: {
    type: String,
    enum: ['manual', 'biometric', 'qr_code', 'mobile_app', 'rfid', 'facial_recognition'],
    default: 'manual'
  },
  
  // Digital Verification
  verificationData: {
    ipAddress: String,
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    deviceInfo: String,
    timestamp: Date
  },
  
  // Make-up Class Information
  isMakeupClass: {
    type: Boolean,
    default: false
  },
  originalClassDate: Date,
  makeupReason: String,
  
  // Notes and Comments
  teacherNotes: {
    type: String,
    maxlength: 1000
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  
  // Metadata
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  
  // Modification History
  modificationHistory: [{
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    previousStatus: String,
    newStatus: String,
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for attendance percentage calculation
attendanceSchema.virtual('attendanceValue').get(function() {
  switch (this.status) {
    case 'present':
      return 1.0;
    case 'late':
      return this.minutesLate <= 15 ? 0.8 : 0.5; // Partial credit for being late
    case 'partial':
      return 0.5;
    case 'excused':
      return 1.0; // Excused absences count as present
    case 'absent':
    default:
      return 0.0;
  }
});

// Virtual for class duration in minutes
attendanceSchema.virtual('classDurationMinutes').get(function() {
  if (!this.classStartTime || !this.classEndTime) return 0;
  
  const [startHour, startMin] = this.classStartTime.split(':').map(Number);
  const [endHour, endMin] = this.classEndTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
});

// Virtual for actual attendance time
attendanceSchema.virtual('actualAttendanceMinutes').get(function() {
  if (this.status === 'absent') return 0;
  
  const classDuration = this.classDurationMinutes;
  const deductions = this.minutesLate + this.minutesEarlyLeave;
  
  return Math.max(0, classDuration - deductions);
});

// Virtual for attendance percentage for this class
attendanceSchema.virtual('classAttendancePercentage').get(function() {
  if (this.classDurationMinutes === 0) return 0;
  return Math.round((this.actualAttendanceMinutes / this.classDurationMinutes) * 100);
});

// Static method to calculate student attendance percentage for a course
attendanceSchema.statics.calculateCourseAttendance = async function(studentId, courseId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        course: new mongoose.Types.ObjectId(courseId),
        ...(startDate && endDate && {
          classDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        })
      }
    },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: {
            $cond: [
              { $in: ['$status', ['present', 'excused']] },
              1,
              0
            ]
          }
        },
        lateClasses: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        },
        absentClasses: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        totalAttendanceValue: { $sum: '$attendanceValue' }
      }
    },
    {
      $project: {
        totalClasses: 1,
        presentClasses: 1,
        lateClasses: 1,
        absentClasses: 1,
        attendancePercentage: {
          $multiply: [
            { $divide: ['$totalAttendanceValue', '$totalClasses'] },
            100
          ]
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalClasses: 0,
    presentClasses: 0,
    lateClasses: 0,
    absentClasses: 0,
    attendancePercentage: 0
  };
};

// Method to mark as late
attendanceSchema.methods.markAsLate = function(arrivalTime) {
  this.status = 'late';
  this.arrivalTime = arrivalTime;
  
  // Calculate minutes late
  const [classHour, classMin] = this.classStartTime.split(':').map(Number);
  const [arrivalHour, arrivalMin] = arrivalTime.split(':').map(Number);
  
  const classStartMinutes = classHour * 60 + classMin;
  const arrivalMinutes = arrivalHour * 60 + arrivalMin;
  
  this.minutesLate = Math.max(0, arrivalMinutes - classStartMinutes);
  
  return this.save();
};

// Method to excuse absence
attendanceSchema.methods.excuseAbsence = function(excusedBy, reason, note) {
  if (this.status !== 'absent') {
    throw new Error('Can only excuse absent students');
  }
  
  this.status = 'excused';
  this.isExcused = true;
  this.excusedBy = excusedBy;
  this.absenceReason = reason;
  this.absenceNote = note;
  
  // Add to modification history
  this.modificationHistory.push({
    modifiedBy: excusedBy,
    modifiedAt: new Date(),
    previousStatus: 'absent',
    newStatus: 'excused',
    reason: `Absence excused: ${reason}`
  });
  
  return this.save();
};

// Pre-save middleware to auto-calculate attendance value
attendanceSchema.pre('save', function(next) {
  // Auto-calculate minutes late if arrival time is provided
  if (this.arrivalTime && this.classStartTime && this.status === 'late') {
    const [classHour, classMin] = this.classStartTime.split(':').map(Number);
    const [arrivalHour, arrivalMin] = this.arrivalTime.split(':').map(Number);
    
    const classStartMinutes = classHour * 60 + classMin;
    const arrivalMinutes = arrivalHour * 60 + arrivalMin;
    
    this.minutesLate = Math.max(0, arrivalMinutes - classStartMinutes);
  }
  
  next();
});

// Indexes for better performance
attendanceSchema.index({ student: 1, course: 1, classDate: 1 });
attendanceSchema.index({ course: 1, classDate: 1 });
attendanceSchema.index({ teacher: 1, classDate: 1 });
attendanceSchema.index({ group: 1, classDate: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ classDate: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
