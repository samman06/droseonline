const mongoose = require('mongoose');
const Counter = require('./Counter');

const materialSchema = new mongoose.Schema({
  // Basic Information
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Material Type and Content
  type: {
    type: String,
    enum: ['file', 'link', 'video', 'document', 'presentation', 'image', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['lecture_notes', 'reading', 'video', 'practice', 'syllabus', 'exam_material', 'supplementary', 'other'],
    default: 'other'
  },
  
  // File Information
  fileUrl: {
    type: String, // Cloudinary URL or base64
    required: function() {
      return this.type === 'file' || this.type === 'document' || this.type === 'video' || this.type === 'presentation' || this.type === 'image';
    }
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number, // in bytes
    min: 0
  },
  mimeType: {
    type: String,
    trim: true
  },
  
  // Link Information (for external resources)
  externalUrl: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'link';
    }
  },
  
  // Relationships
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Visibility and Access Control
  visibility: {
    type: String,
    enum: ['all_students', 'specific_groups', 'teachers_only'],
    default: 'all_students'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  
  // Organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  folder: {
    type: String,
    trim: true,
    default: 'General'
  },
  
  // Statistics
  stats: {
    downloadCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    lastAccessedAt: Date
  },
  
  // Metadata
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  // Optional: Attached to specific assignment
  relatedAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file size in readable format
materialSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return '0 KB';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return `${(this.fileSize / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});

// Virtual for material age
materialSchema.virtual('uploadedAgo').get(function() {
  const now = new Date();
  const diff = now - this.uploadDate;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Virtual for icon based on file type
materialSchema.virtual('icon').get(function() {
  const iconMap = {
    'file': 'document',
    'document': 'document-text',
    'link': 'link',
    'video': 'play-circle',
    'presentation': 'presentation-chart-bar',
    'image': 'photograph',
    'other': 'folder'
  };
  return iconMap[this.type] || 'document';
});

// Method to track view
materialSchema.methods.trackView = async function() {
  this.stats.viewCount += 1;
  this.stats.lastAccessedAt = new Date();
  await this.save();
};

// Method to track download
materialSchema.methods.trackDownload = async function() {
  this.stats.downloadCount += 1;
  this.stats.lastAccessedAt = new Date();
  await this.save();
};

// Method to check if user can access this material
materialSchema.methods.canAccess = async function(userId, userRole) {
  // Teachers and admins can always access
  if (userRole === 'teacher' || userRole === 'admin') {
    return true;
  }
  
  // Check if material is published and active
  if (!this.isPublished || !this.isActive) {
    return false;
  }
  
  // If visibility is all_students, allow access
  if (this.visibility === 'all_students') {
    return true;
  }
  
  // If visibility is specific_groups, check if user is in one of those groups
  if (this.visibility === 'specific_groups') {
    const Group = mongoose.model('Group');
    const userGroups = await Group.find({
      'students.student': userId,
      'students.status': 'active',
      '_id': { $in: this.groups }
    });
    return userGroups.length > 0;
  }
  
  return false;
};

// Pre-save hook to generate code
materialSchema.pre('save', async function(next) {
  // Generate code if not exists (for new materials)
  if (this.isNew && !this.code) {
    try {
      const sequence = await Counter.getNextSequence('material');
      this.code = `MT-${String(sequence).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Update lastModified on any change
  this.lastModified = new Date();
  
  // Validate file size (max 100MB)
  if (this.fileSize && this.fileSize > 100 * 1024 * 1024) {
    return next(new Error('File size cannot exceed 100MB'));
  }
  
  next();
});

// Pre-remove hook to clean up file from storage
materialSchema.pre('remove', async function(next) {
  // TODO: Implement file deletion from Cloudinary or storage
  // This would be implemented when Cloudinary is fully configured
  next();
});

// Indexes for better query performance
materialSchema.index({ course: 1, isPublished: 1, isActive: 1 });
materialSchema.index({ uploadedBy: 1 });
materialSchema.index({ type: 1, category: 1 });
materialSchema.index({ groups: 1 });
materialSchema.index({ tags: 1 });
materialSchema.index({ uploadDate: -1 });
materialSchema.index({ 'stats.downloadCount': -1 });
materialSchema.index({ 'stats.viewCount': -1 });

// Text index for search
materialSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Material', materialSchema);

