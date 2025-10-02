const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  summary: {
    type: String,
    maxlength: 300
  },
  
  // Author Information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Announcement Type and Priority
  type: {
    type: String,
    enum: ['general', 'academic', 'event', 'emergency', 'maintenance', 'policy', 'exam', 'assignment'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Targeting and Audience
  audience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'admins', 'specific_groups', 'specific_courses', 'specific_users'],
    required: true
  },
  
  // Specific Targeting
  targetGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  targetCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Scheduling
  publishAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'expired', 'archived'],
    default: 'draft'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  
  // Media and Attachments
  attachments: [{
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
  
  images: [{
    filename: String,
    path: String,
    caption: String,
    altText: String
  }],
  
  // Event Information (if type is 'event')
  eventDetails: {
    eventDate: Date,
    startTime: String,
    endTime: String,
    location: String,
    maxParticipants: Number,
    registrationRequired: {
      type: Boolean,
      default: false
    },
    registrationDeadline: Date,
    contactPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    additionalInfo: String
  },
  
  // Notification Settings
  notificationSettings: {
    sendEmail: {
      type: Boolean,
      default: false
    },
    sendPush: {
      type: Boolean,
      default: false
    },
    sendSMS: {
      type: Boolean,
      default: false
    },
    notifyImmediately: {
      type: Boolean,
      default: false
    }
  },
  
  // Engagement Tracking
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Tags for categorization
  tags: [String],
  
  // Analytics
  stats: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 }
  },
  
  // Approval Workflow
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for read percentage
announcementSchema.virtual('readPercentage').get(function() {
  if (!this.targetAudience || this.targetAudience.length === 0) return 0;
  return Math.round((this.readBy.length / this.targetAudience.length) * 100);
});

// Virtual for engagement score
announcementSchema.virtual('engagementScore').get(function() {
  const views = this.stats.views || 0;
  const likes = this.stats.likes || 0;
  const comments = this.stats.comments || 0;
  
  if (views === 0) return 0;
  return Math.round(((likes + comments * 2) / views) * 100);
});

// Virtual for is active
announcementSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         this.publishAt <= now && 
         (!this.expiresAt || this.expiresAt > now);
});

// Virtual for days until expiry
announcementSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to mark as read by user
announcementSchema.methods.markAsRead = function(userId, ipAddress) {
  const existingRead = this.readBy.find(read => 
    read.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
      ipAddress: ipAddress
    });
    
    this.stats.views += 1;
    this.stats.uniqueViews += 1;
  } else {
    this.stats.views += 1;
  }
  
  return this.save();
};

// Method to toggle like
announcementSchema.methods.toggleLike = function(userId) {
  const existingLikeIndex = this.likes.findIndex(like => 
    like.user.toString() === userId.toString()
  );
  
  if (existingLikeIndex > -1) {
    // Unlike
    this.likes.splice(existingLikeIndex, 1);
    this.stats.likes = Math.max(0, this.stats.likes - 1);
  } else {
    // Like
    this.likes.push({
      user: userId,
      likedAt: new Date()
    });
    this.stats.likes += 1;
  }
  
  return this.save();
};

// Method to add comment
announcementSchema.methods.addComment = function(userId, content) {
  if (!this.allowComments) {
    throw new Error('Comments are not allowed on this announcement');
  }
  
  this.comments.push({
    user: userId,
    content: content,
    createdAt: new Date()
  });
  
  this.stats.comments += 1;
  
  return this.save();
};

// Method to get target audience
announcementSchema.methods.getTargetAudience = async function() {
  const User = mongoose.model('User');
  const Group = mongoose.model('Group');
  const Course = mongoose.model('Course');
  
  let audience = [];
  
  switch (this.audience) {
    case 'all':
      audience = await User.find({ isActive: true });
      break;
      
    case 'students':
      audience = await User.find({ role: 'student', isActive: true });
      break;
      
    case 'teachers':
      audience = await User.find({ role: 'teacher', isActive: true });
      break;
      
    case 'admins':
      audience = await User.find({ role: 'admin', isActive: true });
      break;
      
    case 'specific_groups':
      for (const groupId of this.targetGroups) {
        const group = await Group.findById(groupId).populate('students.student');
        if (group) {
          const students = group.students
            .filter(s => s.status === 'active')
            .map(s => s.student);
          audience = audience.concat(students);
        }
      }
      break;
      
    case 'specific_courses':
      for (const courseId of this.targetCourses) {
        const course = await Course.findById(courseId).populate('groups');
        if (course) {
          for (const group of course.groups) {
            const fullGroup = await Group.findById(group._id).populate('students.student');
            if (fullGroup) {
              const students = fullGroup.students
                .filter(s => s.status === 'active')
                .map(s => s.student);
              audience = audience.concat(students);
            }
          }
        }
      }
      break;
      
    case 'specific_users':
      audience = await User.find({ 
        _id: { $in: this.targetUsers },
        isActive: true 
      });
      break;
  }
  
  // Remove duplicates
  const uniqueAudience = audience.filter((user, index, self) =>
    index === self.findIndex(u => u._id.toString() === user._id.toString())
  );
  
  return uniqueAudience;
};

// Pre-save middleware to update status based on dates
announcementSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'scheduled' && this.publishAt <= now) {
    this.status = 'published';
  }
  
  if (this.status === 'published' && this.expiresAt && this.expiresAt <= now) {
    this.status = 'expired';
  }
  
  // Update stats
  this.stats.likes = this.likes.length;
  this.stats.comments = this.comments.length;
  
  next();
});

// Indexes
announcementSchema.index({ author: 1 });
announcementSchema.index({ status: 1, publishAt: 1 });
announcementSchema.index({ type: 1, priority: 1 });
announcementSchema.index({ audience: 1 });
announcementSchema.index({ publishAt: 1, expiresAt: 1 });
announcementSchema.index({ isPinned: 1, priority: 1 });
announcementSchema.index({ tags: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
