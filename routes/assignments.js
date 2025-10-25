const express = require('express');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const { authenticate, authorize, checkTeacherAccess, checkTeacherOrAssistantAccess, checkStudentAccess } = require('../middleware/auth');
const { validate, validateQuery, assignmentSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// ==========================================
// ROLE-SPECIFIC ENDPOINTS (Must come before generic routes)
// ==========================================

// @route   GET /api/assignments/my-assignments
// @desc    Get assignments for current student (from enrolled groups/courses)
// @access  Private (Student only)
router.get('/my-assignments', authenticate, authorize('student'), validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    
    // Get student's enrolled groups
    const User = require('../models/User');
    const student = await User.findById(req.user._id).select('academicInfo.groups');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const groupIds = student.academicInfo?.groups || [];
    
    // Build query
    const query = {
      $or: [
        { groups: { $in: groupIds } }, // Assignments for student's groups
      ],
      status: { $in: ['published', 'closed'] } // Students only see published/closed
    };
    
    // Apply additional filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
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
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Assignment.countDocuments(query);
    
    // Include submission status for each assignment
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id
    }).select('assignment status grade submittedAt isLate').lean();
    
    const submissionMap = new Map(submissions.map(s => [s.assignment.toString(), s]));
    
    const assignmentsWithStatus = assignments.map(assignment => ({
      ...assignment,
      submission: submissionMap.get(assignment._id.toString()) || null,
      hasSubmitted: submissionMap.has(assignment._id.toString())
    }));
    
    res.json({
      success: true,
      data: {
        assignments: assignmentsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching your assignments' });
  }
});

// @route   GET /api/assignments/teacher/assignments
// @desc    Get assignments created by current teacher
// @access  Private (Teacher/Assistant)
router.get('/teacher/assignments', authenticate, checkTeacherOrAssistantAccess, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search, courseId } = req.query;
    
    // Build query for teacher's assignments
    const query = {
      teacher: req.user._id
    };
    
    // Apply additional filters
    if (courseId) query.course = courseId;
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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
      .populate('groups', 'name code gradeLevel currentEnrollment')
      .sort({ dueDate: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Assignment.countDocuments(query);
    
    // Add submission statistics for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const [totalSubmissions, gradedSubmissions, averageGrade] = await Promise.all([
          Submission.countDocuments({ assignment: assignment._id }),
          Submission.countDocuments({ assignment: assignment._id, status: 'graded' }),
          Submission.aggregate([
            { $match: { assignment: assignment._id, status: 'graded' } },
            { $group: { _id: null, avg: { $avg: '$grade.percentage' } } }
          ]).then(result => Math.round(result[0]?.avg || 0))
        ]);
        
        return {
          ...assignment,
          stats: {
            totalSubmissions,
            gradedSubmissions,
            pendingGrading: totalSubmissions - gradedSubmissions,
            averageGrade
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        assignments: assignmentsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching teacher assignments' });
  }
});

// @route   GET /api/assignments
// @desc    Get assignments (filtered by user role)
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, status, type, studentId, teacherId, search } = req.query;
    
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
    if (search) {
      // Search in title, code, and description
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
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

// @route   GET /api/assignments/templates
// @desc    Get all assignment templates for the current teacher
// @access  Private (Teacher/Assistant/Admin)
router.get('/templates', authenticate, authorize(['teacher', 'assistant', 'admin']), async (req, res) => {
  try {
    const { type, category, search } = req.query;

    const query = {
      isTemplate: true,
      teacher: req.user._id
    };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { templateDescription: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const templates = await Assignment.find(query)
      .select('templateName templateDescription title type category maxPoints questions usageCount createdAt')
      .sort({ usageCount: -1, createdAt: -1 });

    res.json({
      success: true,
      data: { templates },
      total: templates.length
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching templates'
    });
  }
});

// @route   POST /api/assignments/templates/:id/use
// @desc    Create an assignment from a template
// @access  Private (Teacher/Admin - Owner only)
router.post('/templates/:id/use', authenticate, async (req, res) => {
  try {
    const { course, groups, dueDate, assignedDate } = req.body;
    
    const template = await Assignment.findById(req.params.id);
    if (!template || !template.isTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Verify teacher owns the template
    if (template.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not your template'
      });
    }

    // Create assignment from template
    const assignmentData = {
      title: template.title,
      description: template.description,
      type: template.type,
      category: template.category,
      course,
      teacher: req.user._id,
      groups,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      assignedDate: assignedDate || new Date(),
      instructions: template.instructions,
      rubric: template.rubric,
      maxPoints: template.maxPoints,
      allowLateSubmission: template.allowLateSubmission,
      latePenalty: template.latePenalty,
      submissionType: template.submissionType,
      allowedFileTypes: template.allowedFileTypes,
      maxFileSize: template.maxFileSize,
      maxFiles: template.maxFiles,
      quizSettings: template.quizSettings,
      questions: template.questions,
      attachments: template.attachments,
      status: 'draft'
    };

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    // Increment template usage count
    template.usageCount += 1;
    await template.save();

    // Populate the response
    await assignment.populate([
      { path: 'course', select: 'name code' },
      { path: 'teacher', select: 'firstName lastName fullName' },
      { path: 'groups', select: 'name code gradeLevel' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Assignment created from template',
      data: { assignment }
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating assignment from template'
    });
  }
});

// @route   DELETE /api/assignments/templates/:id
// @desc    Delete a template
// @access  Private (Teacher/Admin - Owner only)
router.delete('/templates/:id', authenticate, async (req, res) => {
  try {
    const template = await Assignment.findById(req.params.id);
    if (!template || !template.isTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Verify teacher owns the template
    if (template.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not your template'
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting template'
    });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'name code groups subject teacher',
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
    } else if (req.user.role === 'teacher') {
      // Check if teacher owns this assignment (via teacher field or course.teacher)
      const teacherId = assignment.teacher?._id || assignment.teacher;
      const courseTeacherId = assignment.course?.teacher?._id || assignment.course?.teacher;
      
      if (teacherId && teacherId.toString() === req.user._id.toString()) {
        hasAccess = true;
      } else if (courseTeacherId && courseTeacherId.toString() === req.user._id.toString()) {
        hasAccess = true;
      }
    } else if (req.user.role === 'student') {
      // Students can only see published or closed assignments
      if (!['published', 'closed', 'graded'].includes(assignment.status)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This assignment is not yet available.'
        });
      }
      
      // Check if student is enrolled in any of the assignment's groups
      const User = require('../models/User');
      const student = await User.findById(req.user._id);
      
      // Get student's group IDs from academicInfo.groups
      const studentGroupIds = (student.academicInfo?.groups || []).map(g => g.toString());
      const assignmentGroupIds = assignment.groups.map(g => g._id.toString());
      
      hasAccess = studentGroupIds.some(sgId => assignmentGroupIds.includes(sgId));
      
      // Debug logging
      console.log('Student access check:', {
        studentId: req.user._id,
        studentGroups: studentGroupIds,
        assignmentGroups: assignmentGroupIds,
        assignmentStatus: assignment.status,
        hasAccess
      });
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

// @route   POST /api/assignments/:id/save-as-template
// @desc    Save an assignment as a reusable template
// @access  Private (Teacher/Admin - Owner only)
router.post('/:id/save-as-template', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const { templateName, templateDescription } = req.body;
    
    const originalAssignment = await Assignment.findById(req.params.id);
    if (!originalAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Create template from assignment (exclude specific instances like course, groups, dates)
    const templateData = {
      title: templateName || originalAssignment.title,
      templateName: templateName || originalAssignment.title,
      templateDescription: templateDescription || originalAssignment.description,
      description: originalAssignment.description,
      type: originalAssignment.type,
      category: originalAssignment.category,
      teacher: req.user._id, // Template belongs to the teacher
      instructions: originalAssignment.instructions,
      rubric: originalAssignment.rubric,
      maxPoints: originalAssignment.maxPoints,
      allowLateSubmission: originalAssignment.allowLateSubmission,
      latePenalty: originalAssignment.latePenalty,
      submissionType: originalAssignment.submissionType,
      allowedFileTypes: originalAssignment.allowedFileTypes,
      maxFileSize: originalAssignment.maxFileSize,
      maxFiles: originalAssignment.maxFiles,
      quizSettings: originalAssignment.quizSettings,
      questions: originalAssignment.questions,
      attachments: originalAssignment.attachments,
      isTemplate: true,
      status: 'draft',
      usageCount: 0
    };

    const template = new Assignment(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving template'
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

// ==================== QUIZ-SPECIFIC ROUTES ====================

// @route   GET /api/assignments/:id/quiz
// @desc    Get quiz for taking (without correct answers for students)
// @access  Private (Students)
router.get('/:id/quiz', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('groups', 'name')
      .populate('course', 'name')
      .populate('teacher', 'firstName lastName fullName');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify this is a quiz
    if (assignment.type !== 'quiz') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not a quiz'
      });
    }

    // Check if assignment is published
    if (assignment.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not yet published'
      });
    }

    // Check if student can still submit
    if (!assignment.canSubmit()) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is no longer accepting submissions'
      });
    }

    // Check if student already submitted (no retakes by default)
    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user.id
    });

    if (existingSubmission) {
      const maxAttempts = assignment.quizSettings?.maxAttempts || 1;
      if (existingSubmission.attemptNumber >= maxAttempts) {
        return res.status(403).json({
          success: false,
          message: 'You have already submitted this quiz',
          data: { submissionId: existingSubmission._id }
        });
      }
    }

    // Prepare quiz data (remove correct answers)
    const quizData = {
      _id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      maxPoints: assignment.maxPoints,
      dueDate: assignment.dueDate,
      course: assignment.course,
      teacher: assignment.teacher,
      quizSettings: {
        timeLimit: assignment.quizSettings?.timeLimit,
        shuffleQuestions: assignment.quizSettings?.shuffleQuestions,
        shuffleOptions: assignment.quizSettings?.shuffleOptions,
        allowBacktrack: assignment.quizSettings?.allowBacktrack,
        questionsPerPage: assignment.quizSettings?.questionsPerPage
      },
      questions: assignment.questions.map((q, index) => {
        let options = q.options ? [...q.options] : [];
        let optionsOrder = options.map((_, i) => i); // [0, 1, 2, 3]

        // Shuffle options if enabled
        if (assignment.quizSettings?.shuffleOptions && q.type === 'multiple_choice') {
          optionsOrder = shuffleArray([...optionsOrder]);
          options = optionsOrder.map(i => q.options[i]);
        }

        return {
          index,
          type: q.type,
          question: q.question,
          options, // Options (possibly shuffled, without marking correct answer)
          points: q.points,
          _optionsOrder: optionsOrder // Hidden metadata for answer mapping
        };
      }),
      attemptNumber: existingSubmission ? existingSubmission.attemptNumber + 1 : 1
    };

    // Shuffle questions if enabled
    if (assignment.quizSettings?.shuffleQuestions) {
      const indices = quizData.questions.map((_, i) => i);
      const shuffledIndices = shuffleArray(indices);
      quizData.questions = shuffledIndices.map(i => quizData.questions[i]);
      quizData._questionsOrder = shuffledIndices; // Hidden metadata for answer mapping
    }

    res.json({
      success: true,
      data: { quiz: quizData }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz'
    });
  }
});

// @route   POST /api/assignments/:id/submit-quiz
// @desc    Submit quiz answers and auto-grade
// @access  Private (Students)
router.post('/:id/submit-quiz', authenticate, async (req, res) => {
  try {
    const { answers, startTime, endTime, questionsOrder, optionsOrder } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify this is a quiz
    if (assignment.type !== 'quiz') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not a quiz'
      });
    }

    // Check if can still submit
    if (!assignment.canSubmit()) {
      return res.status(403).json({
        success: false,
        message: 'Quiz submission deadline has passed'
      });
    }

    // Check for existing submission
    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user.id
    });

    if (existingSubmission) {
      const maxAttempts = assignment.quizSettings?.maxAttempts || 1;
      if (existingSubmission.attemptNumber >= maxAttempts) {
        return res.status(403).json({
          success: false,
          message: 'You have already submitted this quiz'
        });
      }
    }

    // Validate time limit
    const timeSpentSeconds = startTime && endTime ? Math.floor((new Date(endTime) - new Date(startTime)) / 1000) : 0;
    const timeLimitSeconds = assignment.quizSettings?.timeLimit ? assignment.quizSettings.timeLimit * 60 : null;
    const timeLimitExceeded = timeLimitSeconds && timeSpentSeconds > timeLimitSeconds;

    // Prepare quiz answers for grading
    const quizAnswers = answers.map(answer => ({
      questionIndex: answer.questionIndex,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect: false, // Will be set by auto-grade
      pointsEarned: 0 // Will be set by auto-grade
    }));

    // Create submission
    const submission = new Submission({
      assignment: assignment._id,
      student: req.user.id,
      course: assignment.course,
      submissionType: 'quiz',
      quizAnswers,
      quizMetadata: {
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(),
        timeSpent: timeSpentSeconds,
        timeLimitExceeded,
        questionsOrder: questionsOrder || [],
        optionsOrder: optionsOrder || []
      },
      attemptNumber: existingSubmission ? existingSubmission.attemptNumber + 1 : 1,
      status: 'submitted'
    });

    // Auto-grade the quiz
    await submission.autoGradeQuiz();

    // Populate before sending
    await submission.populate([
      { path: 'assignment', select: 'title maxPoints quizSettings' },
      { path: 'student', select: 'firstName lastName fullName' }
    ]);

    // Determine what to return based on resultsVisibility
    const canView = assignment.canViewResults();
    
    const responseData = {
      submission: {
        _id: submission._id,
        submittedAt: submission.submittedAt,
        attemptNumber: submission.attemptNumber,
        status: submission.status
      }
    };

    if (canView) {
      responseData.submission.grade = {
        pointsEarned: submission.grade.pointsEarned,
        percentage: submission.grade.percentage
      };
      responseData.submission.quizAnswers = submission.quizAnswers;
      responseData.canViewResults = true;
    } else {
      responseData.message = 'Quiz submitted successfully. Results will be available based on teacher settings.';
      responseData.canViewResults = false;
    }

    res.status(201).json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/assignments/:id/quiz-results/:submissionId
// @desc    Get quiz results based on visibility settings
// @access  Private (Students - own submission, Teachers - all)
router.get('/:id/quiz-results/:submissionId', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const submission = await Submission.findById(req.params.submissionId)
      .populate('student', 'firstName lastName fullName email academicInfo')
      .populate('assignment', 'title questions maxPoints quizSettings');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check access: students can only view their own, teachers can view all
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own quiz results'
      });
    }

    // Check if results should be visible (students only)
    if (req.user.role === 'student' && !assignment.canViewResults()) {
      return res.status(403).json({
        success: false,
        message: 'Quiz results are not yet available',
        data: {
          submittedAt: submission.submittedAt,
          status: 'Results pending'
        }
      });
    }

    // Prepare detailed results
    const results = {
      submission: {
        _id: submission._id,
        submittedAt: submission.submittedAt,
        attemptNumber: submission.attemptNumber,
        timeSpent: submission.quizMetadata?.timeSpent,
        timeLimitExceeded: submission.quizMetadata?.timeLimitExceeded
      },
      grade: {
        pointsEarned: submission.grade.pointsEarned,
        maxPoints: assignment.maxPoints,
        percentage: submission.grade.percentage,
        status: submission.status
      },
      answers: submission.quizAnswers.map((answer, index) => {
        const question = assignment.questions[answer.questionIndex];
        return {
          questionNumber: index + 1,
          question: question?.question,
          selectedOptionIndex: answer.selectedOptionIndex,
          selectedOption: question?.options?.[answer.selectedOptionIndex],
          correctAnswerIndex: question?.correctAnswerIndex,
          correctAnswer: question?.options?.[question.correctAnswerIndex],
          isCorrect: answer.isCorrect,
          pointsEarned: answer.pointsEarned,
          pointsPossible: question?.points,
          explanation: question?.explanation
        };
      })
    };

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz results'
    });
  }
});

// @route   POST /api/assignments/:id/release-results
// @desc    Manually release quiz results (for manual visibility mode)
// @access  Private (Teacher/Admin - Owner only)
router.post('/:id/release-results', authenticate, checkTeacherAccess, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.type !== 'quiz') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not a quiz'
      });
    }

    if (assignment.quizSettings.resultsVisibility !== 'manual') {
      return res.status(400).json({
        success: false,
        message: 'This quiz is not set to manual result release'
      });
    }

    // Release results
    assignment.quizSettings.resultsReleased = true;
    await assignment.save();

    res.json({
      success: true,
      message: 'Quiz results released successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Release quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while releasing quiz results'
    });
  }
});

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = router;
