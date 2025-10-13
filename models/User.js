const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    city: String
  },
  
  // Parent Contact Information (for students)
  parentContact: {
    primaryPhone: {
      type: String,
      trim: true
    },
    secondaryPhone: {
      type: String,
      trim: true
    }
  },
  
  // System Information
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  
  // Academic Information (varies by role)
  academicInfo: {
    // For Students
    studentId: String,
    enrollmentDate: Date,
    currentGrade: {
      type: String,
      enum: [
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', // Primary
        'Grade 7', 'Grade 8', 'Grade 9', // Preparatory
        'Grade 10', 'Grade 11', 'Grade 12' // Secondary
      ]
    },
    year: {
      type: String,
      enum: [
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', // Primary
        'Grade 7', 'Grade 8', 'Grade 9', // Preparatory
        'Grade 10', 'Grade 11', 'Grade 12' // Secondary
      ]
    },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    
    // For Teachers
    employeeId: String,
    hireDate: Date,
    department: String,
    specialization: [String],
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    
    // For Admins
    permissions: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Auto-generate codes and hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Generate student ID for students
    if (this.isNew && this.role === 'student' && !this.academicInfo.studentId) {
      const sequence = await Counter.getNextSequence('student');
      this.academicInfo.studentId = `ST-${String(sequence).padStart(6, '0')}`;
    }
    
    // Generate employee ID for teachers
    if (this.isNew && this.role === 'teacher' && !this.academicInfo.employeeId) {
      const sequence = await Counter.getNextSequence('teacher');
      this.academicInfo.employeeId = `TE-${String(sequence).padStart(6, '0')}`;
    }
    
    // Generate employee ID for admins
    if (this.isNew && this.role === 'admin' && !this.academicInfo.employeeId) {
      const sequence = await Counter.getNextSequence('admin');
      this.academicInfo.employeeId = `AD-${String(sequence).padStart(6, '0')}`;
    }
    
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'academicInfo.studentId': 1 });
userSchema.index({ 'academicInfo.employeeId': 1 });

module.exports = mongoose.model('User', userSchema);
