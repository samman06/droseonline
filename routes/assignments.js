const express = require('express');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const { authenticate, authorize, checkTeacherAccess, checkStudentAccess } = require('../middleware/auth');
const { validate, validateQuery, assignmentSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/assignments
// @desc    Get assignments (filtered by user role)
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, status, type, studentId, teacherId } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'student') {
      // Students see assignments from their enrolled courses
      const User = require('../models/User');
      const student = await User.findById(req.user._id).populate('academicInfo.groups');
      const groupIds = student.academicInfo.groups.map(g => g._id);
      
      const courses = await Course.find({ groups: { $in: groupIds } });
      const courseIds = courses.map(c => c._id);
      
      query.course = { $in: courseIds };
      query.status = { $in: ['published', 'closed'] }; // Students only see published/closed assignments
    } else if (req.user.role === 'teacher') {
      // Teachers see their own assignments
      query.teacher = req.user._id;
    }
    // Admins see all assignments (no additional filters)
    
    // Apply additional filters
    if (courseId) query.course = courseId;
    if (status) query.status = status;
    if (type) query.type = type;
    if (studentId && req.user.role === 'admin') {
      // Only admins can filter by student
      const User = require('../models/User');
      const student = await User.findById(studentId).populate('academicInfo.groups');
      const groupIds = student.academicInfo.groups.map(g => g._id);
      const courses = await Course.find({ groups: { $in: groupIds } });
      const courseIds = courses.map(c => c._id);
      query.course = { $in: courseIds };
    }
    if (teacherId && req.user.role === 'admin') {
      query.teacher = teacherId;
    }

    const assignments = await Assignment.find(query)
      .populate('course', 'name code')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .populate('teacher', 'firstName lastName fullName')
      .populate('groups', 'name code gradeLevel')
      .sort({ dueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assignment.countDocuments(query);

    // For students, include submission status
    let assignmentsWithStatus = assignments;
    if (req.user.role === 'student') {
      const assignmentIds = assignments.map(a => a._id);
      const submissions = await Submission.find({
        assignment: { $in: assignmentIds },
        student: req.user._id
      }).select('assignment status grade submittedAt isLate');

      assignmentsWithStatus = assignments.map(assignment => {
        const submission = submissions.find(s => 
          s.assignment.toString() === assignment._id.toString()
        );
        
        return {
          ...assignment.toObject(),
          submission: submission || null,
          submissionStatus: submission ? submission.status : 'not_submitted',
          isOverdue: !submission && new Date() > assignment.dueDate,
          canSubmit: assignment.acceptingSubmissions
        };
      });
    }

    res.json({
      success: true,
      data: {
        assignments: assignmentsWithStatus,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assignments'
    });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'name code groups')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code credits'
        }
      })
      .populate('teacher', 'firstName lastName fullName email')
      .populate('groups', 'name code gradeLevel');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'teacher' && assignment.teacher._id.toString() === req.user._id.toString()) {
      hasAccess = true;
    } else if (req.user.role === 'student') {
      // Check if student is enrolled in any of the assignment's groups
      const User = require('../models/User');
      const student = await User.findById(req.user._id).populate('academicInfo.groups');
      const studentGroupIds = student.academicInfo.groups.map(g => g._id.toString());
      const assignmentGroupIds = assignment.groups.map(g => g._id.toString());
      hasAccess = studentGroupIds.some(sgId => assignmentGroupIds.includes(sgId));
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this assignment.'
      });
    }

    // For students, include their submission if exists
    let assignmentData = assignment.toObject();
    if (req.user.role === 'student') {
      const submission = await Submission.findOne({
        assignment: req.params.id,
        student: req.user._id
      });

      assignmentData.submission = submission;
      assignmentData.submissionStatus = submission ? submission.status : 'not_submitted';
      assignmentData.isOverdue = !submission && new Date() > assignment.dueDate;
      assignmentData.canSubmit = assignment.acceptingSubmissions;
    }

    res.json({
      success: true,
      data: { assignment: assignmentData }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assignment'
    });
  }
});

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Teacher/Admin)
router.post('/', authenticate, authorize('teacher', 'admin'), validate(assignmentSchema), async (req, res) => {
  try {
    // Verify groups exist
    const Group = require('../models/Group');
    const groups = await Group.find({ _id: { $in: req.body.groups } }).populate('course');
    
    if (!groups || groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid groups found'
      });
    }

    if (groups.length !== req.body.groups.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more groups not found'
      });
    }

    // Get course from first group
    const firstGroup = groups[0];
    if (!firstGroup.course) {
      return res.status(400).json({
        success: false,
        message: 'Selected group does not have an associated course'
      });
    }

    // Verify all groups belong to the same course
    const courseIds = groups.map(g => g.course._id?.toString() || g.course.toString());
    const uniqueCourseIds = [...new Set(courseIds)];
    if (uniqueCourseIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'All groups must belong to the same course'
      });
    }

    const courseId = uniqueCourseIds[0];
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the teacher of this course (or admin)
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the teacher of this course.'
      });
    }

    const assignmentData = {
      ...req.body,
      course: courseId,
      teacher: course.teacher
    };

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('course', 'name code')
      .populate({
        path: 'course',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .populate('teacher', 'firstName lastName fullName')
      .populate('groups', 'name code gradeLevel');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment: populatedAssignment }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Teacher/Admin - Owner only)
router.put('/:id', authenticate, checkTeacherAccess, validate(assignmentSchema), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if there are already submissions
    const submissionCount = await Submission.countDocuments({ assignment: req.params.id });
    
    // Prevent certain changes if submissions exist
    if (submissionCount > 0) {
      const restrictedFields = ['maxPoints', 'submissionType', 'questions'];
      const hasRestrictedChanges = restrictedFields.some(field => 
        req.body[field] !== undefined && 
        JSON.stringify(req.body[field]) !== JSON.stringify(assignment[field])
      );
      
      if (hasRestrictedChanges) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify assignment structure after students have submitted work.'
        });
      }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('course', 'name code')
    .populate({
      path: 'course',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    })
    .populate('teacher', 'firstName lastName fullName')
    .populate('groups', 'name code gradeLevel');

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment: updatedAssignment }
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating assignment'
    });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Teacher/Admin - Owner only)
router.delete('/:id', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if there are submissions
    const submissionCount = await Submission.countDocuments({ assignment: req.params.id });
    
    if (submissionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete assignment. It has ${submissionCount} submission(s). Consider closing it instead.`
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting assignment'
    });
  }
});

// @route   POST /api/assignments/bulk-delete
// @desc    Delete multiple assignments
// @access  Private (Teacher/Admin - Owner only)
router.post('/bulk-delete', authenticate, async (req, res) => {
  try {
    const { assignmentIds } = req.body;

    if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of assignment IDs'
      });
    }

    const results = {
      deleted: [],
      failed: [],
      totalRequested: assignmentIds.length
    };

    for (const assignmentId of assignmentIds) {
      try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
          results.failed.push({
            id: assignmentId,
            reason: 'Assignment not found'
          });
          continue;
        }

        // Check authorization
        if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: 'You do not have permission to delete this assignment'
          });
          continue;
        }

        // Check if there are submissions
        const submissionCount = await Submission.countDocuments({ assignment: assignmentId });
        
        if (submissionCount > 0) {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: `Cannot delete. Has ${submissionCount} submission(s)`
          });
          continue;
        }

        // Delete the assignment
        await Assignment.findByIdAndDelete(assignmentId);
        
        results.deleted.push({
          id: assignmentId,
          code: assignment.code,
          title: assignment.title
        });
      } catch (error) {
        console.error(`Error deleting assignment ${assignmentId}:`, error);
        results.failed.push({
          id: assignmentId,
          reason: 'Error during deletion'
        });
      }
    }

    const message = `Deleted ${results.deleted.length} of ${results.totalRequested} assignment(s)`;
    
    res.json({
      success: true,
      message,
      data: results
    });
  } catch (error) {
    console.error('Bulk delete assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting assignments'
    });
  }
});

// @route   POST /api/assignments/:id/publish
// @desc    Publish assignment
// @access  Private (Teacher/Admin - Owner only)
router.post('/:id/publish', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is already published'
      });
    }

    // Validate assignment before publishing
    if (assignment.type === 'quiz' && assignment.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish quiz assignment without questions'
      });
    }

    assignment.status = 'published';
    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment published successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Publish assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing assignment'
    });
  }
});

// @route   POST /api/assignments/:id/close
// @desc    Close assignment (no more submissions accepted)
// @access  Private (Teacher/Admin - Owner only)
router.post('/:id/close', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is already closed'
      });
    }

    assignment.status = 'closed';
    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment closed successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Close assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while closing assignment'
    });
  }
});

// @route   POST /api/assignments/bulk-publish
// @desc    Publish multiple assignments
// @access  Private (Teacher/Admin - Owner only)
router.post('/bulk-publish', authenticate, async (req, res) => {
  try {
    const { assignmentIds } = req.body;

    if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of assignment IDs'
      });
    }

    const results = {
      published: [],
      failed: [],
      totalRequested: assignmentIds.length
    };

    for (const assignmentId of assignmentIds) {
      try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
          results.failed.push({
            id: assignmentId,
            reason: 'Assignment not found'
          });
          continue;
        }

        // Check authorization
        if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: 'You do not have permission to publish this assignment'
          });
          continue;
        }

        if (assignment.status === 'published') {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: 'Already published'
          });
          continue;
        }

        // Validate assignment before publishing
        if (assignment.type === 'quiz' && assignment.questions.length === 0) {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: 'Cannot publish quiz without questions'
          });
          continue;
        }

        // Publish the assignment
        assignment.status = 'published';
        await assignment.save();
        
        results.published.push({
          id: assignmentId,
          code: assignment.code,
          title: assignment.title
        });
      } catch (error) {
        console.error(`Error publishing assignment ${assignmentId}:`, error);
        results.failed.push({
          id: assignmentId,
          reason: 'Error during publishing'
        });
      }
    }

    const message = `Published ${results.published.length} of ${results.totalRequested} assignment(s)`;
    
    res.json({
      success: true,
      message,
      data: results
    });
  } catch (error) {
    console.error('Bulk publish assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing assignments'
    });
  }
});

// @route   POST /api/assignments/bulk-close
// @desc    Close multiple assignments
// @access  Private (Teacher/Admin - Owner only)
router.post('/bulk-close', authenticate, async (req, res) => {
  try {
    const { assignmentIds } = req.body;

    if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of assignment IDs'
      });
    }

    const results = {
      closed: [],
      failed: [],
      totalRequested: assignmentIds.length
    };

    for (const assignmentId of assignmentIds) {
      try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
          results.failed.push({
            id: assignmentId,
            reason: 'Assignment not found'
          });
          continue;
        }

        // Check authorization
        if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user._id.toString()) {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: 'You do not have permission to close this assignment'
          });
          continue;
        }

        if (assignment.status === 'closed') {
          results.failed.push({
            id: assignmentId,
            code: assignment.code,
            title: assignment.title,
            reason: 'Already closed'
          });
          continue;
        }

        // Close the assignment
        assignment.status = 'closed';
        await assignment.save();
        
        results.closed.push({
          id: assignmentId,
          code: assignment.code,
          title: assignment.title
        });
      } catch (error) {
        console.error(`Error closing assignment ${assignmentId}:`, error);
        results.failed.push({
          id: assignmentId,
          reason: 'Error during closing'
        });
      }
    }

    const message = `Closed ${results.closed.length} of ${results.totalRequested} assignment(s)`;
    
    res.json({
      success: true,
      message,
      data: results
    });
  } catch (error) {
    console.error('Bulk close assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while closing assignments'
    });
  }
});

// @route   POST /api/assignments/:id/clone
// @desc    Clone an assignment (create a duplicate)
// @access  Private (Teacher/Admin - Owner only)
router.post('/:id/clone', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const originalAssignment = await Assignment.findById(req.params.id);
    
    if (!originalAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Create a copy of the assignment (excluding _id, code, status, timestamps)
    const clonedData = {
      title: `${originalAssignment.title} (Copy)`,
      description: originalAssignment.description,
      type: originalAssignment.type,
      course: originalAssignment.course,
      teacher: originalAssignment.teacher,
      groups: originalAssignment.groups,
      dueDate: originalAssignment.dueDate,
      maxPoints: originalAssignment.maxPoints,
      instructions: originalAssignment.instructions,
      rubric: originalAssignment.rubric,
      allowLateSubmissions: originalAssignment.allowLateSubmissions,
      latePenalty: originalAssignment.latePenalty,
      requireFileUpload: originalAssignment.requireFileUpload,
      allowMultipleSubmissions: originalAssignment.allowMultipleSubmissions,
      questions: originalAssignment.questions,
      status: 'draft' // Always start cloned assignments as draft
    };

    const clonedAssignment = new Assignment(clonedData);
    await clonedAssignment.save();

    // Populate the response
    await clonedAssignment.populate([
      { path: 'course', select: 'name code' },
      { path: 'teacher', select: 'firstName lastName fullName' },
      { path: 'groups', select: 'name code gradeLevel' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Assignment cloned successfully',
      data: { assignment: clonedAssignment }
    });
  } catch (error) {
    console.error('Clone assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cloning assignment'
    });
  }
});

// @route   GET /api/assignments/:id/submissions
// @desc    Get all submissions for an assignment
// @access  Private (Teacher/Admin - Owner only)
router.get('/:id/submissions', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const query = { assignment: req.params.id };
    if (status) query.status = status;

    const submissions = await Submission.find(query)
      .populate('student', 'firstName lastName fullName email academicInfo.studentId')
      .populate('course', 'name code')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    // Get submission statistics
    const stats = await Submission.aggregate([
      { $match: { assignment: assignment._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          gradedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
          pendingGrading: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          averageGrade: { $avg: '$grade.percentage' },
          lateSubmissions: { $sum: { $cond: ['$isLate', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        assignment: {
          id: assignment._id,
          title: assignment.title,
          maxPoints: assignment.maxPoints,
          dueDate: assignment.dueDate,
          status: assignment.status
        },
        submissions,
        statistics: stats[0] || {
          totalSubmissions: 0,
          gradedSubmissions: 0,
          pendingGrading: 0,
          averageGrade: 0,
          lateSubmissions: 0
        },
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
});

// @route   GET /api/assignments/:id/statistics
// @desc    Get assignment statistics
// @access  Private (Teacher/Admin - Owner only)
router.get('/:id/statistics', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Get eligible students count
    const eligibleStudents = await assignment.getEligibleStudents();
    const eligibleStudentsCount = eligibleStudents.length;

    // Get detailed submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { assignment: assignment._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          gradedSubmissions: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
          pendingGrading: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          lateSubmissions: { $sum: { $cond: ['$isLate', 1, 0] } },
          averageGrade: { $avg: '$grade.percentage' },
          highestGrade: { $max: '$grade.percentage' },
          lowestGrade: { $min: '$grade.percentage' }
        }
      }
    ]);

    // Get grade distribution
    const gradeDistribution = await Submission.aggregate([
      { $match: { assignment: assignment._id, status: 'graded' } },
      {
        $bucket: {
          groupBy: '$grade.percentage',
          boundaries: [0, 60, 70, 80, 90, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const stats = submissionStats[0] || {};

    res.json({
      success: true,
      data: {
        assignment: {
          id: assignment._id,
          title: assignment.title,
          type: assignment.type,
          maxPoints: assignment.maxPoints,
          dueDate: assignment.dueDate,
          status: assignment.status
        },
        statistics: {
          eligibleStudents: eligibleStudentsCount,
          submissionRate: eligibleStudentsCount > 0 
            ? Math.round(((stats.totalSubmissions || 0) / eligibleStudentsCount) * 100)
            : 0,
          totalSubmissions: stats.totalSubmissions || 0,
          gradedSubmissions: stats.gradedSubmissions || 0,
          pendingGrading: stats.pendingGrading || 0,
          lateSubmissions: stats.lateSubmissions || 0,
          averageGrade: Math.round(stats.averageGrade || 0),
          highestGrade: Math.round(stats.highestGrade || 0),
          lowestGrade: Math.round(stats.lowestGrade || 0),
          gradeDistribution: gradeDistribution
        }
      }
    });
  } catch (error) {
    console.error('Get assignment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assignment statistics'
    });
  }
});

module.exports = router;
