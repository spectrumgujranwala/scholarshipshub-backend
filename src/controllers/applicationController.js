const Application = require('../models/Application');
const User = require('../models/User');
const { sendSubmissionEmail } = require('../utils/emailService');

// @desc    Get or create current student application
// @route   GET /api/applications/me
// @access  Private (Student)
const getMyApplication = async (req, res) => {
  let application = await Application.findOne({ user: req.user._id });

  if (!application) {
    application = await Application.create({
      user: req.user._id,
      status: 'draft',
    });
  }

  res.json(application);
};

// @desc    Update application section
// @route   PUT /api/applications/me/section/:section
// @access  Private (Student)
const updateSection = async (req, res) => {
  const { section } = req.params;
  const data = req.body;

  const application = await Application.findOne({ user: req.user._id });

  if (!application) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  // Basic validation that section exists in schema
  if (!application[section] && section !== 'academicBackground' && section !== 'referees') {
     // Allow array types too if they aren't directly children of schema but they are in this case
  }

  application[section] = data;
  
  // Recalculate completion percentage (simple version)
  const sections = [
    'applicantInfo', 'contactDetails', 'guardianInfo', 'academicBackground', 
    'programInfo', 'researchExperience', 'englishProficiency', 'fundingInfo', 
    'referees', 'documents', 'declaration'
  ];
  
  const isSectionComplete = (key, section) => {
    if (!section) return false;

    if (key === 'applicantInfo') {
      return !!(section.firstName && section.firstName.length >= 3 && section.lastName && section.lastName.length >= 3 && section.dob && section.gender && section.nationality);
    }
    if (key === 'contactDetails') {
      return !!(section.phone && section.email && section.address && section.city && section.country);
    }
    if (key === 'guardianInfo') {
      return !!(section.fatherName && section.motherName && section.guardianPhone && section.guardianEmail && section.occupation);
    }
    if (key === 'academicBackground') {
      return Array.isArray(section) && section.length > 0 && section.every(edu => edu.degree && edu.institution && edu.year && edu.cgpa);
    }
    if (key === 'programInfo') {
      return !!(section.programType && section.proposedField && section.intakeYear);
    }
    if (key === 'researchExperience') {
      const hasPublications = Array.isArray(section.publications) && section.publications.length > 0 && section.publications.every(p => p.title && p.journalType);
      return !!(section.workExperience && hasPublications);
    }
    if (key === 'englishProficiency') {
      if (section.testType === 'Not Yet Taken') return true;
      return !!(section.testType && section.score && section.dateOfTest && section.expiryDate);
    }
    if (key === 'fundingInfo') {
      return !!(section.fundingType && section.details);
    }
    if (key === 'referees') {
      return true; // Optional section
    }
    if (key === 'documents') {
      return !!(section.cv);
    }
    if (key === 'declaration') {
      return !!(section.isAgreed && section.signature);
    }

    return false;
  };

  const calculateProfileStrength = (app) => {
    let score = 0;
    const CRITERIA_WEIGHT = 20; // 5 criteria = 100%
    
    // 1. Age Limit (20%)
    if (app.applicantInfo?.dob) {
      const age = new Date().getFullYear() - new Date(app.applicantInfo.dob).getFullYear();
      if (age <= 45) score += CRITERIA_WEIGHT;
    }

    // 2. Publications (20%)
    if (app.researchExperience?.publications) {
      const hasInternational = app.researchExperience.publications.some(p => p.journalType === 'International');
      if (hasInternational) score += CRITERIA_WEIGHT;
    }

    // 3. CGPA (20%)
    if (app.academicBackground && app.academicBackground.length > 0) {
      const lastDegree = app.academicBackground[app.academicBackground.length - 1];
      const cgpa = parseFloat(lastDegree.cgpa);
      if (cgpa >= 3.5) score += CRITERIA_WEIGHT;
      else if (cgpa > 3.0) score += (CRITERIA_WEIGHT * 0.6); // 12 points
    }

    // 4. Study Gap (20%)
    if (app.academicBackground && app.academicBackground.length > 0) {
      const lastDegree = app.academicBackground[app.academicBackground.length - 1];
      const gradYear = parseInt(lastDegree.year);
      const currentYear = new Date().getFullYear();
      const gap = currentYear - gradYear;
      if (gap <= 7) score += CRITERIA_WEIGHT;
    }

    // 5. English Proficiency (20%)
    if (app.englishProficiency) {
      if (app.englishProficiency.testType === 'Not Yet Taken' || !app.englishProficiency.testType) {
        score += (CRITERIA_WEIGHT * 0.9); // 18 points (90%)
      } else {
        const bands = parseFloat(app.englishProficiency.score);
        if (bands >= 7) score += CRITERIA_WEIGHT; // 20 points
        else if (bands >= 6) score += 15;
        else if (bands >= 5) score += 12;
        else if (bands >= 4) score += 10;
        else score += 5;
      }
    } else {
      score += (CRITERIA_WEIGHT * 0.9); // Default if section not started
    }

    return Math.round(score);
  };

  let filledCount = 0;
  sections.forEach(s => {
    if (isSectionComplete(s, application[s])) {
      filledCount++;
    }
  });
  
  application.completionPercentage = Math.round((filledCount / sections.length) * 100);
  application.profileStrength = calculateProfileStrength(application);

  const updatedApplication = await application.save();
  res.json(updatedApplication);
};

// @desc    Submit application
// @route   POST /api/applications/me/submit
// @access  Private (Student)
const submitApplication = async (req, res) => {
  const application = await Application.findOne({ user: req.user._id });

  if (!application) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  if (application.completionPercentage < 100) { // Requirement to be 100% filled
    res.status(400).json({ message: 'Please complete all sections (100%) before submitting. The submission email will not be sent until fully completed.' });
    return;
  }

  application.status = 'submitted';
  application.submittedAt = new Date();
  
  const updatedApplication = await application.save();

  // Send Complete Submission Email Notification
  if (updatedApplication.status === 'submitted') {
    // Non-blocking email send with full application data
    sendSubmissionEmail(updatedApplication);
  }

  res.json(updatedApplication);
};

// Admin Controllers

// @desc    Get all applications
// @route   GET /api/admin/applications
// @access  Private (Admin)
const getAllApplications = async (req, res) => {
  const applications = await Application.find({}).populate({
    path: 'user',
    select: 'email role',
    match: { role: 'student' }
  });
  
  // Filter out any applications where user is null (because they didn't match the student role)
  const filteredApps = applications.filter(app => app.user != null);
  
  res.json(filteredApps);
};

// @desc    Update application status
// @route   PUT /api/admin/applications/:id/status
// @access  Private (Admin)
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const application = await Application.findById(req.params.id);

  if (application) {
    application.status = status;
    const updatedApplication = await application.save();
    res.json(updatedApplication);
  } else {
    res.status(404).json({ message: 'Application not found' });
  }
};

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private (Admin)
const getApplicationById = async (req, res) => {
  const application = await Application.findById(req.params.id).populate('user', 'email');

  if (application) {
    res.json(application);
  } else {
    res.status(404).json({ message: 'Application not found' });
  }
};

module.exports = {
  getMyApplication,
  updateSection,
  submitApplication,
  getAllApplications,
  updateStatus,
  getApplicationById,
};
