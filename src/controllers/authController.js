const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};


/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @returns {string} - JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  // Default role is 'student'. Role can be updated by admin later.
  // For the first user ever, we could conditionally allow 'admin', 
  // but for now let's keep it strictly 'student' to avoid vulnerability.
  const user = await User.create({
    email,
    password,
    role: 'student',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      designation: user.designation,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      designation: user.designation,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Create a new admin user
// @route   POST /api/auth/admin
// @access  Private/Admin
const createAdminUser = asyncHandler(async (req, res) => {
  const { email, password, designation } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    email,
    password,
    role: 'admin',
    designation: designation || 'Admin',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      designation: user.designation,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Use the ID from the protect middleware
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      designation: user.designation,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Google authentication (Login or Register)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential is required');
  }

  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch (error) {
    res.status(400);
    throw new Error('Invalid Google credential: ' + error.message);
  }

  const { sub: googleId, email, email_verified } = payload;

  if (!email_verified) {
    res.status(400);
    throw new Error('Google email is not verified');
  }

  // Check if user already exists by googleId or email
  let user = await User.findOne({
    $or: [{ googleId }, { email }],
  });

  if (user) {
    // If user exists but doesn't have googleId yet, update it
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  } else {
    // Register new user with student role
    user = await User.create({
      email,
      googleId,
      role: 'student',
    });
  }

  if (user) {
    res.status(200).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      designation: user.designation,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Google authentication failed');
  }
});

module.exports = {
  registerUser,
  authUser,
  getMe,
  createAdminUser,
  googleAuth,
};
