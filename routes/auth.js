const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, updateProfileSchema } = require('../middleware/validation');
const { authenticate, authorize, sensitiveOperationLimit } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (or Admin only for creating teachers/admins)
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      dateOfBirth,
      address,
      academicInfo
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // For teacher/admin registration, require admin authentication
    if (role === 'teacher' || role === 'admin') {
      // This middleware should be applied conditionally
      // For now, we'll allow it but in production you'd want admin auth
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      dateOfBirth,
      address,
      academicInfo: {
        ...academicInfo,
        enrollmentDate: role === 'student' ? new Date() : undefined,
        hireDate: role === 'teacher' ? new Date() : undefined
      }
    });

    await user.save();

    // Generate token
    const token = generateToken({ id: user._id, role: user.role });

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          isActive: user.isActive,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          createdAt: user.createdAt,
          academicInfo: user.academicInfo
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', sensitiveOperationLimit, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
  
    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken({ id: user._id, role: user.role });

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          avatar: user.avatar,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          createdAt: user.createdAt,
          academicInfo: user.academicInfo
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('academicInfo.groups', 'name code level semester')
      .populate('academicInfo.subjects', 'name code credits');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    console.log('📝 Profile update request received');
    console.log('User ID:', req.user._id);
    console.log('Request body:', req.body);
    
    const allowedUpdates = [
      'firstName', 
      'lastName', 
      'email',
      'phone',
      'phoneNumber', 
      'dateOfBirth', 
      'address',
      'department',
      'specialization'
    ];
    const updates = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        // Map 'phone' to 'phoneNumber' for consistency
        if (key === 'phone') {
          updates['phoneNumber'] = req.body[key];
        }
        // Map 'department' and 'specialization' to nested academicInfo paths
        else if (key === 'department') {
          updates['academicInfo.department'] = req.body[key];
        }
        else if (key === 'specialization') {
          updates['academicInfo.specialization'] = req.body[key];
        }
        else {
          updates[key] = req.body[key];
        }
      }
    });

    console.log('Updates to apply:', updates);

    // Check if email is being updated and if it's already taken
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user'
        });
      }
    }

    console.log('Updating user in database...');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('✅ User updated successfully:', user ? 'User found' : 'User NOT found');
    if (user) {
      console.log('Updated user data:', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, sensitiveOperationLimit, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', sensitiveOperationLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (in production, implement proper token generation and email sending)
    const resetToken = generateToken({ id: user._id, type: 'password_reset' });
    
    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing password reset request'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // For enhanced security, you could maintain a token blacklist in Redis or database
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   GET /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.get('/verify-token', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user._id,
        role: req.user.role,
        email: req.user.email,
        fullName: req.user.fullName
      }
    }
  });
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Private
router.post('/refresh-token', authenticate, async (req, res) => {
  try {
    // Generate new token
    const newToken = generateToken({ id: req.user._id, role: req.user.role });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while refreshing token'
    });
  }
});

// Admin Routes

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('academicInfo.groups', 'name code')
      .populate('academicInfo.subjects', 'name code');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/auth/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private/Admin
router.put('/users/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

module.exports = router;
