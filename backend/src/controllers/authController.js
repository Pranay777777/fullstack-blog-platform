const UserModel = require('../models/userModel');
const { generateToken } = require('../utils/jwtUtils');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { username, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = UserModel.findByEmail(email);
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  const existingUsername = UserModel.findByUsername(username);
  if (existingUsername) {
    return next(new AppError('Username already taken', 400));
  }

  // Create user
  const userId = UserModel.create({ 
    username, 
    email, 
    password,
    role: role || 'user'  // Default to 'user' role
  });

  // Generate token
  const token = generateToken(userId, role || 'user');

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: userId,
      username,
      email,
      role: role || 'user'
    },
    token
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { email, password } = req.body;

  // Find user
  const user = UserModel.findByEmail(email);
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check password
  const isPasswordValid = UserModel.comparePassword(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Generate token
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

module.exports = {
  signup,
  login,
  getMe
};
