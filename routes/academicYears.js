const express = require('express');
const AcademicYear = require('../models/AcademicYear');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, academicYearSchema, paginationSchema } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/academic-years
// @desc    Get all academic years
// @access  Private
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, isCurrent } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isCurrent !== undefined) query.isCurrent = isCurrent === 'true';

    const academicYears = await AcademicYear.find(query)
      .populate('createdBy', 'firstName lastName fullName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: -1 });

    const total = await AcademicYear.countDocuments(query);

    res.json({
      success: true,
      data: {
        academicYears,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get academic years error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching academic years'
    });
  }
});

// @route   POST /api/academic-years
// @desc    Create new academic year
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), validate(academicYearSchema), async (req, res) => {
  try {
    const academicYearData = {
      ...req.body,
      createdBy: req.user._id
    };

    const academicYear = new AcademicYear(academicYearData);
    await academicYear.save();

    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: { academicYear }
    });
  } catch (error) {
    console.error('Create academic year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating academic year'
    });
  }
});

module.exports = router;
