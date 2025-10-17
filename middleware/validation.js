const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher', 'admin').required(),
  phoneNumber: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]+$/).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  address: Joi.object({
    street: Joi.string().max(100).optional(),
    city: Joi.string().max(50).optional(),
    state: Joi.string().max(50).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().max(50).optional()
  }).optional(),
  academicInfo: Joi.object({
    studentId: Joi.string().when('$role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() }),
    employeeId: Joi.string().when('$role', { is: 'teacher', then: Joi.required(), otherwise: Joi.optional() }),
    department: Joi.string().max(100).optional(),
    specialization: Joi.array().items(Joi.string().max(100)).optional(),
    currentYear: Joi.number().min(1).max(6).optional()
  }).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  phoneNumber: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]+$/).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  address: Joi.object({
    street: Joi.string().max(100).optional(),
    city: Joi.string().max(50).optional(),
    state: Joi.string().max(50).optional(),
    zipCode: Joi.string().max(20).optional(),
    country: Joi.string().max(50).optional()
  }).optional()
});

// Subject validation schemas (Simplified for Egyptian Education System)
const subjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().max(10).optional() // Auto-generated
});

// Group validation schemas
const groupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().optional(), // Auto-generated
  description: Joi.string().max(500).optional(),
  course: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Reference to Course
  gradeLevel: Joi.string().valid(
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ).required(),
  schedule: Joi.array().items(Joi.object({
    day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    room: Joi.string().max(50).optional()
  })).optional(),
  pricePerSession: Joi.number().min(0).optional(),
  students: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  createdBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

// Course validation schemas
const courseSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  code: Joi.string().trim().optional(), // Auto-generated
  description: Joi.string().max(500).optional(),
  subject: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  teacher: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  groups: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  assessmentStructure: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    weight: Joi.number().min(0).max(100).required(),
    maxMarks: Joi.number().min(0).required()
  })).optional(),
  syllabus: Joi.object({
    overview: Joi.string().optional(),
    objectives: Joi.array().items(Joi.string()).optional(),
    topics: Joi.array().items(Joi.string()).optional(),
    gradingPolicy: Joi.string().optional(),
    materials: Joi.array().optional()
  }).optional(),
  settings: Joi.object({
    allowSelfEnrollment: Joi.boolean().optional(),
    requireApproval: Joi.boolean().optional(),
    isVisible: Joi.boolean().optional()
  }).optional()
});

// Assignment validation schemas
const assignmentSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  instructions: Joi.string().max(5000).optional(),
  course: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  groups: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  type: Joi.string().valid('homework', 'quiz', 'midterm', 'final', 'project', 'presentation', 'lab', 'essay', 'other').required(),
  category: Joi.string().valid('individual', 'group', 'pair').optional(),
  maxPoints: Joi.number().min(1).max(1000).required(),
  weightage: Joi.number().min(0).max(100).required(),
  dueDate: Joi.date().greater('now').required(),
  lateSubmissionDeadline: Joi.date().greater(Joi.ref('dueDate')).optional(),
  submissionType: Joi.string().valid('file', 'text', 'link', 'quiz', 'multiple').optional(),
  allowedFileTypes: Joi.array().items(Joi.string()).optional(),
  maxFileSize: Joi.number().min(1).max(100).optional(),
  allowLateSubmission: Joi.boolean().optional(),
  latePenalty: Joi.number().min(0).max(100).optional()
});

// Academic Year validation schemas
const academicYearSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  code: Joi.string().trim().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  semesters: Joi.array().items(Joi.object({
    name: Joi.string().valid('fall', 'spring', 'summer').required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    isActive: Joi.boolean().optional()
  })).min(1).required(),
  settings: Joi.object({
    maxCreditsPerSemester: Joi.number().min(1).max(30).optional(),
    minCreditsPerSemester: Joi.number().min(1).max(30).optional(),
    lateRegistrationFee: Joi.number().min(0).optional()
  }).optional()
});

// Attendance validation schemas
const attendanceSchema = Joi.object({
  course: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  student: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  group: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  classDate: Joi.date().required(),
  classStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  classEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  classType: Joi.string().valid('lecture', 'lab', 'tutorial', 'seminar', 'exam', 'other').optional(),
  topic: Joi.string().max(200).optional(),
  room: Joi.string().max(50).optional(),
  status: Joi.string().valid('present', 'absent', 'late', 'excused', 'partial').required(),
  arrivalTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  absenceReason: Joi.string().valid('sick', 'family_emergency', 'personal', 'academic', 'medical', 'other').optional(),
  absenceNote: Joi.string().max(500).optional(),
  participationScore: Joi.number().min(0).max(10).optional(),
  teacherNotes: Joi.string().max(1000).optional()
});

// Announcement validation schemas
const announcementSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  content: Joi.string().trim().min(10).max(5000).required(),
  summary: Joi.string().max(300).optional(),
  type: Joi.string().valid('general', 'academic', 'event', 'emergency', 'maintenance', 'policy', 'exam', 'assignment').required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  audience: Joi.string().valid('all', 'students', 'teachers', 'admins', 'specific_groups', 'specific_courses', 'specific_users').required(),
  targetGroups: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  targetCourses: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  targetUsers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  publishAt: Joi.date().optional(),
  expiresAt: Joi.date().greater(Joi.ref('publishAt')).optional(),
  isPinned: Joi.boolean().optional(),
  allowComments: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    req.body = value;
    next();
  };
};

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: errors
      });
    }

    req.query = value;
    next();
  };
};

// Common query schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  search: Joi.string().max(100).optional(),
  // Additional filter parameters for students and teachers
  isActive: Joi.string().valid('true', 'false', '').optional().allow(''),
  year: Joi.string().max(50).optional().allow(''),
  grade: Joi.string().max(50).optional().allow(''),
  currentYear: Joi.number().integer().min(1).max(6).optional(),
  groupId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  department: Joi.string().max(100).optional().allow(''),
  teacherId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  subjectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  courseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
  day: Joi.string().max(20).optional().allow(''),
  gradeLevel: Joi.string().max(50).optional().allow('')
});

const objectIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
});

module.exports = {
  // Validation middleware
  validate,
  validateQuery,

  // User schemas
  registerSchema,
  loginSchema,
  updateProfileSchema,

  // Academic schemas
  subjectSchema,
  groupSchema,
  courseSchema,
  assignmentSchema,
  academicYearSchema,
  attendanceSchema,
  announcementSchema,

  // Common schemas
  paginationSchema,
  objectIdSchema
};
