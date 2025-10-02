const express = require('express');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { authenticate, authorize, checkTeacherAccess } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/grades/:submissionId
// @desc    Grade a submission
// @access  Private (Teacher/Admin)
router.post('/:submissionId', authenticate, async (req, res) => {
  try {
    const { pointsEarned, feedback, rubricGrades } = req.body;

    const submission = await Submission.findById(req.params.submissionId)
      .populate('assignment')
      .populate('student', 'firstName lastName fullName');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user can grade this submission
    if (req.user.role !== 'admin' && 
        submission.assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only grade submissions for your assignments.'
      });
    }

    // Update grade
    submission.grade.pointsEarned = pointsEarned;
    submission.grade.percentage = Math.round((pointsEarned / submission.assignment.maxPoints) * 100);
    submission.grade.feedback = feedback;
    submission.grade.rubricGrades = rubricGrades || [];
    submission.grade.gradedBy = req.user._id;
    submission.grade.gradedAt = new Date();
    submission.status = 'graded';

    await submission.save();

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: { submission }
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while grading submission'
    });
  }
});

module.exports = router;
