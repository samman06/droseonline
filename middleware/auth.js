const jwt = require('jsonwebtoken');
const User = require('../models/User');




const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return 'droseonline_default_secret_key_2024_development';
  }
  return process.env.JWT_SECRET;
};

const generateToken = (payload) => {
  const secret = getJwtSecret();
  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
  
  return token;
};

const verifyToken = (token) => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
};
// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Extract token from header or cookies
    if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token payload.'
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is inactive.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token.'
    });
  }
};

// Authorization Middleware - Check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}, but you are: ${req.user.role}`
      });
    }

    next();
  };
};

// Permission-based authorization
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has specific permission
    if (req.user.academicInfo.permissions && 
        req.user.academicInfo.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Required permission: ${permission}`
    });
  };
};

// Resource ownership check
const checkResourceOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if the resource belongs to the user
    const resourceUserId = req.params.id || req.body[resourceField] || req.query[resourceField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Teacher access to their courses/groups
const checkTeacherAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Only teachers can proceed
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // For course-related endpoints, check if teacher teaches the course
    if (req.params.courseId) {
      const Course = require('../models/Course');
      const course = await Course.findById(req.params.courseId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found.'
        });
      }

      if (course.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not the teacher of this course.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Teacher access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization check.'
    });
  }
};

// Student access to their enrollments
const checkStudentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Only students can proceed (unless teacher/admin)
    if (req.user.role === 'student') {
      // For course-related endpoints, check if student is enrolled
      if (req.params.courseId) {
        const Group = require('../models/Group');
        const groups = await Group.find({
          'students.student': req.user._id,
          'students.status': 'active'
        });

        const Course = require('../models/Course');
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
          return res.status(404).json({
            success: false,
            message: 'Course not found.'
          });
        }

        // Check if student's groups include this course's groups
        const studentGroupIds = groups.map(g => g._id.toString());
        const courseGroupIds = course.groups.map(g => g.toString());
        const hasAccess = studentGroupIds.some(sgId => courseGroupIds.includes(sgId));

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not enrolled in this course.'
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Student access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization check.'
    });
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Key validation (for external integrations)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required.'
    });
  }

  // In a real application, you would validate this against a database
  const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key.'
    });
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  checkPermission,
  checkResourceOwnership,
  checkTeacherAccess,
  checkStudentAccess,
  sensitiveOperationLimit,
  validateApiKey
};
