const express = require('express');
const router = express.Router();
const {
  createUniversityApplication,
  getUniversityApplications,
  updateUniversityApplication,
  deleteUniversityApplication,
} = require('../controllers/universityApplicationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createUniversityApplication);

router.route('/:id')
  .put(protect, admin, updateUniversityApplication)
  .delete(protect, admin, deleteUniversityApplication);

router.route('/student/:studentId')
  .get(protect, getUniversityApplications);

module.exports = router;
