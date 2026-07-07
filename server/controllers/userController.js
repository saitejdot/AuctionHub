const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const sendResponse = require('../utils/sendResponse');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  sendResponse(res, 200, 'Profile fetched', user);
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar },
    { new: true, runValidators: true }
  ).select('-password');

  sendResponse(res, 200, 'Profile updated', user);
});
