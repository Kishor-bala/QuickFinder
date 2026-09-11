const notificationRepository = require('../repositories/notificationRepository');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationRepository.findByUser(req.user.id);
    const unreadCount = await notificationRepository.getUnreadCount(req.user.id);
    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await notificationRepository.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationRepository.markAllAsRead(req.user.id);
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};
