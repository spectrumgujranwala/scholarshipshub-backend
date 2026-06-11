const express = require('express');
const router = express.Router();
const { addRemark, getRemarks } = require('../controllers/remarkController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, addRemark);

router.route('/:applicationId')
  .get(protect, getRemarks);

module.exports = router;
