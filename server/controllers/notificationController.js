const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/sendResponse');

// @desc    Get notifications for the current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('auction', 'title');

  const total = await Notification.countDocuments({ recipient: req.user._id });
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

  sendResponse(res, 200, 'Notifications fetched', { notifications, unreadCount }, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  notification.isRead = true;
  await notification.save();

  sendResponse(res, 200, 'Notification marked as read', notification);
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  sendResponse(res, 200, 'All notifications marked as read');
});
