const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadFile } = require('../controllers/uploadController');

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res, next) => {
  uploadFile(req, res).catch(next);
});

module.exports = router;
