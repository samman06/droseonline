const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/assistants
// @desc    Get all assistants for the logged-in teacher
// @access  Private (Teacher/Admin)
router.get('/', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    const assistants = await User.find({
      role: 'assistant',
      'assistantInfo.assignedTeacher': teacherId
    }).select('-password');
    
    res.json({
      success: true,
      data: { assistants }
    });
  } catch (error) {
    console.error('Get assistants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assistants'
    });
  }
});

// @route   POST /api/assistants
// @desc    Create a new assistant or assign existing user as assistant
// @access  Private (Teacher/Admin)
router.post('/', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { email, firstName, lastName, phoneNumber, password, userId } = req.body;
    const teacherId = req.user._id;
    
    // If userId is provided, assign existing user as assistant
    if (userId) {
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (user.role === 'assistant' && user.assistantInfo?.assignedTeacher) {
        return res.status(400).json({
          success: false,
          message: 'User is already an assistant to another teacher'
        });
      }
      
      // Update user to be an assistant
      user.role = 'assistant';
      user.assistantInfo = {
        assignedTeacher: teacherId,
        assignedDate: new Date(),
        permissions: ['view_all', 'edit_all']
      };
      
      await user.save();
      
      const assistant = await User.findById(user._id).select('-password');
      
      return res.status(200).json({
        success: true,
        message: 'User assigned as assistant successfully',
        data: { assistant }
      });
    }
    
    // Create new assistant user
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'Assistant123!', 10);
    
    // Create new assistant
    const assistant = new User({
      email: email.toLowerCase(),
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      role: 'assistant',
      assistantInfo: {
        assignedTeacher: teacherId,
        assignedDate: new Date(),
        permissions: ['view_all', 'edit_all']
      },
      isActive: true
    });
    
    await assistant.save();
    
    const assistantData = await User.findById(assistant._id).select('-password');
    
    res.status(201).json({
      success: true,
      message: 'Assistant created successfully',
      data: { assistant: assistantData }
    });
  } catch (error) {
    console.error('Create assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating assistant'
    });
  }
});

// @route   GET /api/assistants/:id
// @desc    Get assistant details
// @access  Private (Teacher/Admin)
router.get('/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assistant = await User.findById(req.params.id)
      .select('-password')
      .populate('assistantInfo.assignedTeacher', 'firstName lastName fullName email');
    
    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }
    
    // Check if the teacher owns this assistant
    if (req.user.role === 'teacher' && 
        assistant.assistantInfo?.assignedTeacher?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own assistants.'
      });
    }
    
    res.json({
      success: true,
      data: { assistant }
    });
  } catch (error) {
    console.error('Get assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assistant'
    });
  }
});

// @route   PUT /api/assistants/:id
// @desc    Update assistant permissions or info
// @access  Private (Teacher/Admin)
router.put('/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assistant = await User.findById(req.params.id);
    
    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }
    
    // Check if the teacher owns this assistant
    if (req.user.role === 'teacher' && 
        assistant.assistantInfo?.assignedTeacher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own assistants.'
      });
    }
    
    // Update allowed fields
    const { firstName, lastName, email, phoneNumber, avatar, permissions, isActive } = req.body;
    
    // Check if email is being changed and if it's already in use
    if (email && email.toLowerCase() !== assistant.email.toLowerCase()) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: assistant._id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user'
        });
      }
      
      assistant.email = email.toLowerCase();
    }
    
    if (firstName) assistant.firstName = firstName;
    if (lastName) assistant.lastName = lastName;
    if (phoneNumber !== undefined) assistant.phoneNumber = phoneNumber;
    if (avatar !== undefined) assistant.avatar = avatar;
    if (permissions) assistant.assistantInfo.permissions = permissions;
    if (typeof isActive !== 'undefined') assistant.isActive = isActive;
    
    await assistant.save();
    
    const updated = await User.findById(assistant._id).select('-password');
    
    res.json({
      success: true,
      message: 'Assistant updated successfully',
      data: { assistant: updated }
    });
  } catch (error) {
    console.error('Update assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating assistant'
    });
  }
});

// @route   DELETE /api/assistants/:id
// @desc    Remove assistant (unassign from teacher)
// @access  Private (Teacher/Admin)
router.delete('/:id', authenticate, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assistant = await User.findById(req.params.id);
    
    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }
    
    // Check if the teacher owns this assistant
    if (req.user.role === 'teacher' && 
        assistant.assistantInfo?.assignedTeacher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only remove your own assistants.'
      });
    }
    
    // Option 1: Delete the assistant user completely
    // await assistant.deleteOne();
    
    // Option 2: Just unassign the assistant (preferred - keeps user account)
    assistant.role = 'student'; // Or set to a different default role
    assistant.assistantInfo = undefined;
    assistant.isActive = false; // Deactivate the account
    
    await assistant.save();
    
    res.json({
      success: true,
      message: 'Assistant removed successfully'
    });
  } catch (error) {
    console.error('Delete assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing assistant'
    });
  }
});

module.exports = router;

