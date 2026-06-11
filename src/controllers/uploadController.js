const { uploadToSupabase } = require('../utils/upload');
const multer = require('multer');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, webp, gif) and PDFs are allowed'));
  },
});

// @desc    Upload file to Supabase Storage
// @route   POST /api/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please upload a file' });
      return;
    }

    const folder = req.body.folder || 'applications';
    const fileUrl = await uploadToSupabase(req.file, folder);

    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  upload,
  uploadFile,
};
