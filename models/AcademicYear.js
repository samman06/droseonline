const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 50
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Academic Year Timeline
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Semester Information
  semesters: [{
    name: {
      type: String,
      enum: ['fall', 'spring', 'summer'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    
    // Important Dates for this semester
    importantDates: [{
      event: String,
      date: Date,
      description: String,
      type: {
        type: String,
        enum: ['registration', 'classes_start', 'classes_end', 'exams_start', 'exams_end', 'grades_due', 'holiday', 'other']
      }
    }]
  }],
  
  // Academic Calendar Events
  holidays: [{
    name: String,
    startDate: Date,
    endDate: Date,
    description: String,
    type: {
      type: String,
      enum: ['national', 'religious', 'academic', 'other'],
      default: 'other'
    }
  }],
  
  // Registration Periods
  registrationPeriods: [{
    name: String,
    startDate: Date,
    endDate: Date,
    semester: {
      type: String,
      enum: ['fall', 'spring', 'summer']
    },
    type: {
      type: String,
      enum: ['early', 'regular', 'late', 'add_drop'],
      default: 'regular'
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: false
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  
  // Settings
  settings: {
    maxCreditsPerSemester: {
      type: Number,
      default: 18
    },
    minCreditsPerSemester: {
      type: Number,
      default: 12
    },
    lateRegistrationFee: {
      type: Number,
      default: 0
    },
    dropDeadline: Date,
    withdrawDeadline: Date
  },
  
  // Statistics
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    totalGroups: { type: Number, default: 0 }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current semester
academicYearSchema.virtual('currentSemester').get(function() {
  const now = new Date();
  return this.semesters.find(semester => 
    semester.startDate <= now && semester.endDate >= now
  );
});

// Virtual for active semesters
academicYearSchema.virtual('activeSemesters').get(function() {
  return this.semesters.filter(semester => semester.isActive);
});

// Virtual for duration in days
academicYearSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to get semester by name
academicYearSchema.methods.getSemester = function(semesterName) {
  return this.semesters.find(semester => semester.name === semesterName);
};

// Method to activate semester
academicYearSchema.methods.activateSemester = function(semesterName) {
  const semester = this.getSemester(semesterName);
  if (!semester) {
    throw new Error('Semester not found');
  }
  
  // Deactivate all other semesters
  this.semesters.forEach(s => s.isActive = false);
  
  // Activate the specified semester
  semester.isActive = true;
  
  return this.save();
};

// Method to check if registration is open
academicYearSchema.methods.isRegistrationOpen = function(semester) {
  const now = new Date();
  return this.registrationPeriods.some(period => 
    period.semester === semester &&
    period.isOpen &&
    period.startDate <= now &&
    period.endDate >= now
  );
};

// Method to get upcoming events
academicYearSchema.methods.getUpcomingEvents = function(days = 30) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  const events = [];
  
  // Add semester important dates
  this.semesters.forEach(semester => {
    semester.importantDates.forEach(event => {
      if (event.date >= now && event.date <= futureDate) {
        events.push({
          ...event.toObject(),
          semester: semester.name,
          source: 'semester'
        });
      }
    });
  });
  
  // Add holidays
  this.holidays.forEach(holiday => {
    if (holiday.startDate >= now && holiday.startDate <= futureDate) {
      events.push({
        ...holiday.toObject(),
        source: 'holiday'
      });
    }
  });
  
  // Sort by date
  return events.sort((a, b) => a.date || a.startDate - b.date || b.startDate);
};

// Pre-save validation
academicYearSchema.pre('save', function(next) {
  // Validate date range
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate semester dates
  for (const semester of this.semesters) {
    if (semester.startDate >= semester.endDate) {
      return next(new Error(`Semester ${semester.name}: End date must be after start date`));
    }
    
    if (semester.startDate < this.startDate || semester.endDate > this.endDate) {
      return next(new Error(`Semester ${semester.name}: Dates must be within academic year range`));
    }
  }
  
  next();
});

// Ensure only one academic year is current at a time
academicYearSchema.pre('save', async function(next) {
  if (this.isCurrent && this.isModified('isCurrent')) {
    await mongoose.model('AcademicYear').updateMany(
      { _id: { $ne: this._id } },
      { isCurrent: false }
    );
  }
  next();
});

// Indexes
academicYearSchema.index({ code: 1 });
academicYearSchema.index({ name: 1 });
academicYearSchema.index({ isActive: 1 });
academicYearSchema.index({ isCurrent: 1 });
academicYearSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
