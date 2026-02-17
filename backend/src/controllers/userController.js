const UserModel = require('../models/userModel');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const user = UserModel.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Remove password from response
  delete user.password;

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { username, email, password } = req.body;
  const userId = req.user.id;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = UserModel.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return next(new AppError('Email already in use', 400));
    }
  }

  // Check if username is already taken by another user
  if (username) {
    const existingUser = UserModel.findByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      return next(new AppError('Username already taken', 400));
    }
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (password) updateData.password = password;

  const updated = UserModel.update(userId, updateData);

  if (!updated) {
    return next(new AppError('Failed to update profile', 500));
  }

  const updatedUser = UserModel.findById(userId);
  delete updatedUser.password;

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

module.exports = {
  getProfile,
  updateProfile
};
