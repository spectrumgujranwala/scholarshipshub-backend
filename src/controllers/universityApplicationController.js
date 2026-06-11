const asyncHandler = require('express-async-handler');
const UniversityApplication = require('../models/UniversityApplication');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new university application for a student
// @route   POST /api/university-applications
// @access  Private
const createUniversityApplication = asyncHandler(async (req, res) => {
  let { student, universityName, programName, status, appliedDate, portalLink, loginId, password, notes } = req.body;

  // Security: if student is applying (not admin), force student ID to be the logged-in user
  if (req.user.role !== 'admin') {
    student = req.user._id.toString();
    status = 'Pending'; // Students cannot force accepted/rejected status
  }

  const universityApp = await UniversityApplication.create({
    student,
    universityName,
    programName,
    status: status || 'Pending',
    appliedDate: appliedDate || new Date(),
    portalLink,
    loginId,
    password,
    notes,
  });

  // Notify student
  if (req.user.role === 'admin') {
    await Notification.create({
      user: student,
      title: 'New University Application Added',
      message: `An application for ${universityName} has been added to your profile by the admin.`,
      type: 'general'
    });
  } else {
    await Notification.create({
      user: req.user._id,
      title: 'Scholarship Application Submitted',
      message: `You have successfully applied for the scholarship: ${universityName}.`,
      type: 'general'
    });
  }

  res.status(201).json(universityApp);
});

// @desc    Get all university applications for a student
// @route   GET /api/university-applications/student/:studentId
// @access  Private
const getUniversityApplications = asyncHandler(async (req, res) => {
  const applications = await UniversityApplication.find({ student: req.params.studentId })
    .sort({ createdAt: -1 });

  res.json(applications);
});

// @desc    Update a university application
// @route   PUT /api/university-applications/:id
// @access  Private/Admin
const updateUniversityApplication = asyncHandler(async (req, res) => {
  const universityApp = await UniversityApplication.findById(req.params.id);

  if (!universityApp) {
    res.status(404);
    throw new Error('Application not found');
  }

  const updatedApp = await UniversityApplication.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  // Notify student if status changed
  if (req.body.status && req.body.status !== universityApp.status) {
    await Notification.create({
      user: universityApp.student,
      title: 'University Application Status Updated',
      message: `Your application status for ${universityApp.universityName} has been updated to: ${req.body.status}`,
      type: 'status_update'
    });
  }

  res.json(updatedApp);
});

// @desc    Delete a university application
// @route   DELETE /api/university-applications/:id
// @access  Private/Admin
const deleteUniversityApplication = asyncHandler(async (req, res) => {
  const universityApp = await UniversityApplication.findById(req.params.id);

  if (!universityApp) {
    res.status(404);
    throw new Error('Application not found');
  }

  await universityApp.deleteOne();
  res.json({ message: 'Application removed' });
});

module.exports = {
  createUniversityApplication,
  getUniversityApplications,
  updateUniversityApplication,
  deleteUniversityApplication,
};
