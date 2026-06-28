const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { sendOtpEmail } = require('../utils/emailHelper');

// Temporary in-memory OTP store (email -> { otp, expiresAt, name, branch, year, hashedPassword })
const otpStore = new Map();

// Generate JWT Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campushive_super_jwt_secret_phrase', {
    expiresIn: '30d'
  });
};

// Validate college email domain suffix helper
const isValidCollegeEmail = (email) => {
  const normalized = email.toLowerCase().trim();
  return normalized.endsWith('.ac.in') || normalized.endsWith('.edu') || normalized.endsWith('university.in');
};

// @desc    Send verification OTP to college email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  const { name, email, branch, year, password } = req.body;

  if (!name || !email || !branch || !year || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all signup details.' });
  }

  if (!isValidCollegeEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Access restricted. Sign up is only permitted using verified college emails (e.g. @university.ac.in).'
    });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Account already registered with this email.' });
    }

    // Generate 4 digit OTP code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Hash password before saving to memory
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save registration payload to OTP memory map
    otpStore.set(email.toLowerCase(), {
      name,
      otp,
      expiresAt,
      branch,
      year,
      hashedPassword
    });

    // Fire email helper
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during OTP processing.' });
  }
};

// @desc    Verify OTP and register new user account
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide email and verification code.' });
  }

  const record = otpStore.get(email.toLowerCase());

  if (!record) {
    return res.status(400).json({ success: false, message: 'No signup record found or verification expired.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ success: false, message: 'OTP expired. Please request a new code.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP verification code.' });
  }

  try {
    // Create new user in database
    const user = await User.create({
      name: record.name,
      email: email.toLowerCase(),
      branch: record.branch,
      year: record.year,
      password: record.hashedPassword,
      karmaScore: 10, // Initial signup bonus
      followedSubjects: ['DBMS'] // default followed subject
    });

    // Clear otp memory
    otpStore.delete(email.toLowerCase());

    // Register initial audit activity
    await Activity.create({
      userId: user._id,
      type: 'system',
      description: 'Account registered successfully at CampusHive.'
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        karmaScore: user.karmaScore,
        followedSubjects: user.followedSubjects
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create user account.' });
  }
};

// @desc    Authenticate user login
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter email and password.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        karmaScore: user.karmaScore,
        followedSubjects: user.followedSubjects
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Retrieve current verified user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user context.' });
  }
};

module.exports = {
  sendOtp,
  registerUser,
  loginUser,
  getMe
};
