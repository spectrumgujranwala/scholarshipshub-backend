const asyncHandler = require('express-async-handler');
const Scholarship = require('../models/Scholarship');

// @desc    Create a new scholarship
// @route   POST /api/scholarships
// @access  Private/Admin
const createScholarship = asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.create(req.body);
  res.status(201).json(scholarship);
});

// @desc    Get all scholarships with filters
// @route   GET /api/scholarships
// @access  Private
const getScholarships = asyncHandler(async (req, res) => {
  const { title, country, university, degreeLevels, fundedBy, studyArea } = req.query;
  
  let query = {};
  
  if (title) {
    query.title = { $regex: title, $options: 'i' };
  }
  if (country) {
    query.country = { $regex: country, $options: 'i' };
  }
  if (university) {
    query.university = { $regex: university, $options: 'i' };
  }
  if (fundedBy) {
    query.fundedBy = { $regex: fundedBy, $options: 'i' };
  }
  if (studyArea) {
    query.studyArea = { $regex: studyArea, $options: 'i' };
  }
  if (degreeLevels) {
    const levels = Array.isArray(degreeLevels) ? degreeLevels : degreeLevels.split(',').map(l => l.trim());
    query.degreeLevels = { $in: levels };
  }

  const scholarships = await Scholarship.find(query).sort({ createdAt: -1 });
  res.json(scholarships);
});

// @desc    Update a scholarship
// @route   PUT /api/scholarships/:id
// @access  Private/Admin
const updateScholarship = asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findById(req.params.id);

  if (!scholarship) {
    res.status(404);
    throw new Error('Scholarship not found');
  }

  const updatedScholarship = await Scholarship.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedScholarship);
});

// @desc    Delete a scholarship
// @route   DELETE /api/scholarships/:id
// @access  Private/Admin
const deleteScholarship = asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findById(req.params.id);

  if (!scholarship) {
    res.status(404);
    throw new Error('Scholarship not found');
  }

  await scholarship.deleteOne();
  res.json({ message: 'Scholarship removed' });
});

module.exports = {
  createScholarship,
  getScholarships,
  updateScholarship,
  deleteScholarship,
};
