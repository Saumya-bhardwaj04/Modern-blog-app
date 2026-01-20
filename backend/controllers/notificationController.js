const Notification = require("../models/notificationSchema");

async function getMyNotifications(req, res) {
  const userId = req.user;

  const notifications = await Notification.find({ recipient: userId })
    .populate("sender", "name username profilePic")
    .populate("blog", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    notifications,
  });
}

async function markAsRead(req, res) {
  const { id } = req.params;
  const userId = req.user;

  await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true }
  );

  res.sendStatus(200);
}

module.exports = { getMyNotifications, markAsRead };
