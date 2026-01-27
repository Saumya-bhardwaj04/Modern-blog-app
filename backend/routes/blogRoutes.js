const express = require("express");
const route = express.Router();
const { createBlog, getBlog, getBlogs, updateBlog, deleteBlog, likeBlog, saveBlog, searchBlogs } = require("../controllers/blogController")
const verifyUser = require("../middlewares/auth");
const { addComment, deleteComment, editComment, likeComment, addNestedComment, } = require("../controllers/commentController");
const upload = require("../utils/multer");

//blogs
route.post("/Blogs", verifyUser, upload.fields([{ name: "image", maxCount: 1 }, { name: "images" }]), createBlog
)
route.get("/Blogs", getBlogs)
route.get("/Blogs/:blogId", getBlog)
route.patch("/Blogs/:id", verifyUser, upload.fields([{ name: "image", maxCount: 1 }, { name: "images" }]), updateBlog)
route.delete("/Blogs/:id", verifyUser, deleteBlog)
//likes
route.post("/Blogs/like/:id", verifyUser, likeBlog)
// comments
route.post("/Blogs/comment/:id", verifyUser, addComment)
route.delete("/Blogs/comment/:id", verifyUser, deleteComment)
route.patch("/Blogs/edit-comment/:id", verifyUser, editComment)
route.patch("/Blogs/like-comment/:id", verifyUser, likeComment)

// nested comments
route.post("/comment/:parentCommentId/:id", verifyUser, addNestedComment)

// save blog / bookmark blog
route.get("/search-blogs", searchBlogs)

// save blog / bookmark blog
route.patch("/save-blog/:id", verifyUser, saveBlog)

module.exports = route;