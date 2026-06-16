const asyncHandler = require('express-async-handler');
const Scholarship = require('../models/Scholarship');
const { signSupabaseUrl, unsignDocUrls } = require('../utils/supabaseSigner');

// @desc    Create a new scholarship
// @route   POST /api/scholarships
// @access  Private/Admin
const createScholarship = asyncHandler(async (req, res) => {
  const cleanedBody = unsignDocUrls(req.body);
  const scholarship = await Scholarship.create(cleanedBody);
  const obj = scholarship.toObject();
  if (obj.thumbnail) {
    obj.thumbnail = await signSupabaseUrl(obj.thumbnail);
  }
  res.status(201).json(obj);
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
  const signedScholarships = await Promise.all(scholarships.map(async (s) => {
    const obj = s.toObject();
    if (obj.thumbnail) {
      obj.thumbnail = await signSupabaseUrl(obj.thumbnail);
    }
    return obj;
  }));
  res.json(signedScholarships);
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

  const cleanedBody = unsignDocUrls(req.body);
  const updatedScholarship = await Scholarship.findByIdAndUpdate(
    req.params.id,
    cleanedBody,
    { new: true }
  );

  const obj = updatedScholarship.toObject();
  if (obj.thumbnail) {
    obj.thumbnail = await signSupabaseUrl(obj.thumbnail);
  }
  res.json(obj);
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
