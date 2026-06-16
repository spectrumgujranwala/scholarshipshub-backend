const asyncHandler = require('express-async-handler');
const Remark = require('../models/Remark');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Application = require('../models/Application');
const { sendRemarkNotification } = require('../utils/emailService');
const { signRemarkUrls, unsignDocUrls } = require('../utils/supabaseSigner');

// @desc    Add a new remark to an application
// @route   POST /api/remarks
// @access  Private
const addRemark = asyncHandler(async (req, res) => {
  const cleanedBody = unsignDocUrls(req.body);
  const { applicationId, universityApplicationId, content, attachmentUrl, attachmentName } = cleanedBody;

  let targetUserId;
  let targetTitle = 'New Remark from Admin';
  let targetEmail;
  let targetIdForLink;

  // 1. Identify Target and Context
  if (universityApplicationId && universityApplicationId !== 'null' && universityApplicationId !== 'undefined') {
    const UniversityApplication = require('../models/UniversityApplication');
    const universityApp = await UniversityApplication.findById(universityApplicationId).populate('student');
    if (!universityApp) {
      res.status(404);
      throw new Error('University application not found');
    }
    targetUserId = universityApp.student._id;
    targetEmail = universityApp.student.email;
    targetIdForLink = universityApp._id;
  } else if (applicationId && applicationId !== 'null' && applicationId !== 'undefined') {
    const application = await Application.findById(applicationId).populate('user');
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    targetUserId = application.user?._id;
    targetEmail = application.user?.email;
    targetIdForLink = application._id;
  } else {
    res.status(400);
    throw new Error('No valid application context provided');
  }

  // 2. Create Remark with clean IDs
  const remarkData = {
    sender: req.user._id,
    senderDesignation: req.user.designation || (req.user.role === 'admin' ? 'Admin' : 'Student'),
    content,
    attachmentUrl,
    attachmentName,
  };

  if (universityApplicationId && universityApplicationId !== 'null' && universityApplicationId !== 'undefined') {
    remarkData.universityApplication = universityApplicationId;
  } else {
    remarkData.application = applicationId;
  }

  const remark = await Remark.create(remarkData);

  // 3. Notify
  if (req.user.role === 'admin' && targetUserId) {
    if (targetEmail) {
      sendRemarkNotification(targetEmail, content, targetIdForLink);
    }
    await Notification.create({
      user: targetUserId,
      title: targetTitle,
      message: `${req.user.designation || 'Admin'} left a remark: "${content.substring(0, 30)}..."`,
      type: 'general'
    });
  } else if (req.user.role === 'student') {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'New Student Reply',
        message: `Student replied in remarks: "${content.substring(0, 30)}..."`,
        type: 'general'
      });
    }
  }

  const signedRemark = await signRemarkUrls(remark);
  res.status(201).json(signedRemark);
});

// @desc    Get all remarks for an application (master or university)
// @route   GET /api/remarks/:id
// @access  Private
const getRemarks = asyncHandler(async (req, res) => {
  const id = req.params.applicationId || req.params.id;
  const { type } = req.query;

  if (!id || id === 'undefined' || id === 'null') {
    return res.json([]);
  }

  let query = {};
  if (type === 'university') {
    query = { universityApplication: id };
  } else {
    // Strictly find profile remarks by Application ID
    // Since university remarks don't have this application ID set, they won't overlap.
    query = { application: id };
  }

  const remarks = await Remark.find(query)
    .populate('sender', 'email designation role')
    .sort({ createdAt: 1 });

  const signedRemarks = await Promise.all(remarks.map(rem => signRemarkUrls(rem)));
  res.json(signedRemarks);
});

module.exports = {
  addRemark,
  getRemarks,
};
