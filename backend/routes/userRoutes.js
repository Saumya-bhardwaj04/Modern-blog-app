const express = require("express");
const { createUser, getAllUsers, getUserById, updateUser, deleteUser, login, verifyEmail, googleAuth, followUser, changeSavedLikedBlog, saveFcmToken } = require("../controllers/userController");
const { getMyNotifications, markAsRead, getUnreadCount, markAllAsRead } = require("../controllers/notificationController");
const verifyUser = require("../middlewares/auth");
const upload = require("../utils/multer");
const route = express.Router();

route.post("/signup", createUser);
route.post("/signin", login);
route.get("/users", getAllUsers);
route.get("/users/:username", getUserById);
route.patch("/users/:id", verifyUser, upload.single("profilePic"), updateUser)
route.delete("/users/:id", verifyUser, deleteUser)

// verify email/token
route.get("/verify-email/:verificationToken", verifyEmail)

// google auth route
route.post("/google-auth", googleAuth);

// follow/unfollow
route.patch("/follow/:id", verifyUser, followUser)

// notifications routes
route.get("/notifications", verifyUser, getMyNotifications);
route.patch("/notifications/:id/mark-as-read", verifyUser, markAsRead);
route.get("/notifications/unread-count", verifyUser, getUnreadCount);
route.patch("/notifications/mark-all-read", verifyUser, markAllAsRead);

// routes/userRoutes.js
route.post("/save-fcm-token", verifyUser, saveFcmToken);

route.patch("/change-saved-liked-blog-visibility", verifyUser, changeSavedLikedBlog)

module.exports = route;