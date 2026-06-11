const express = require('express');
const { check, validationResult } = require('express-validator');
const { registerUser, authUser, getMe, createAdminUser, googleAuth } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Handle Validation Results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((err) => err.msg).join(', '));
  }
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    validate
  ],
  registerUser
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 */
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    validate
  ],
  authUser
);

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user via Google
 */
router.post('/google', googleAuth);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/admin
 * @desc    Create a new admin user
 */
router.post(
  '/admin',
  protect,
  admin,
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    validate
  ],
  createAdminUser
);

module.exports = router;
