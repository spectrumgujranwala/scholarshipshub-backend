const express = require('express');
const { getMyApplication, updateSection, submitApplication, getAllApplications, updateStatus, getApplicationById } = require('../controllers/applicationController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyApplication);
router.put('/me/section/:section', protect, updateSection);
router.post('/me/submit', protect, submitApplication);

// Admin routes
router.get('/', protect, admin, getAllApplications);
router.get('/:id', protect, admin, getApplicationById);
router.put('/:id/status', protect, admin, updateStatus);

module.exports = router;
