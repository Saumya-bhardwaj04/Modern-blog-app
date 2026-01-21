const Notification = require("../models/notificationSchema");

async function getMyNotifications(req, res) {
  try {
    const userId = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate({
        path: "sender",
        select: "name username profilePic",
        options: { retainNullValues: true },
      })
      .populate("blog", "title blogId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({
      recipient: userId,
    });

    res.status(200).json({
      success: true,
      notifications,
      hasMore: skip + notifications.length < total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
