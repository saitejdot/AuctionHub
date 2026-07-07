const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read token from the cookie
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token || token === 'none') {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized to access this route');
    }

    // Check if user is blocked
    if (req.user.isBlocked) {
        res.status(403);
        throw new Error('Account suspended');
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};
