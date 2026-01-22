const Blog = require("../models/blogSchema");
const Comment = require("../models/commentSchema");
const { getIO } = require("../socket");
const Notification = require("../models/notificationSchema");
const sendPush = require("../utils/sendPush");
const User = require("../models/userSchema");

async function addComment(req, res) {
    try {
        const userId = req.user;
        const { id } = req.params;
        const { comment } = req.body;
        if (!comment) {
            return res.status(400).json({
                success: false,
                message: "Please enter the comment",
            })
        }
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(400).json({
                success: false,
                message: "Blog not found",
            })
        }
        // create the comment
        const newComment = await Comment.create({
            comment,
            blog: id,
            user: userId,
        }).then((comment) => {
            return comment.populate({
                path: "user",
                select: "name email username profilePic"
            })
        });
        await Blog.findByIdAndUpdate(id, {
            $push: { comments: newComment._id },
        })
        res.status(200).json({
            success: true,
            message: "comment added successfully",
            newComment,
        });
        // 🔔 notify only if not self
        if (blog.creator.toString() !== userId.toString()) {
            const io = getIO();

            await Notification.create({
                recipient: blog.creator,
                sender: userId,
                type: "comment",
                blog: blog._id,
            });

            const sender = await User.findById(userId).select("name username profilePic");
            const creator = await User.findById(blog.creator).select("fcmTokens");

            io.to(blog.creator.toString()).emit("notification", {
                type: "comment",
                sender,
                blogSlug: blog.blogId,
            });
            io.emit("blog:comment", {
                blogId: blog._id,
            });

            if (creator.fcmTokens?.length) {
                sendPush(
                    creator.fcmTokens,
                    "New comment 💬",
                    `${sender.name} commented on your blog`,
                    { type: "comment", blogSlug: blog.blogId,url : `/blog/${blog.blogId}`, image: sender.profilePic || "", }
                );
            }
        }
    }
    catch (err) {
        console.error("ADD COMMENT ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Please try again"
        })
    }
}
async function deleteComment(req, res) {
    try {
        const userId = req.user;
        const { id } = req.params;
        const comment = await Comment.findById(id).populate({
            path: "blog",
            select: "creator"
        });
        if (!comment) {
            return res.status(200).json({
                success: false,
                message: "Comment not found",
            })
        }
        if (comment.user != userId && comment.blog.creator != userId) {
            return res.status(500).json({
                message: "You are not authorized"
            })
        }
        async function deleteCommentAndReplies(id) {
            let comment = await Comment.findById(id);
            for (let replyId of comment.replies) {

                await deleteCommentAndReplies(replyId)
            }
            if (comment.parentComment) {
                await Comment.findByIdAndUpdate(comment.parentComment, {
                    $pull: { replies: id },
                })
            }
            await Comment.findByIdAndDelete(id)
        }
        await deleteCommentAndReplies(id)

        await Blog.findByIdAndUpdate(comment.blog._id, { $pull: { comments: id } })

        return res.status(200).json({
            success: true,
            message: "comment deleted successfully",
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Please try again"
        })
    }
}
async function editComment(req, res) {
    try {
        const userId = req.user;
        const { id } = req.params;
        const { updateComment } = req.body;
        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(500).json({
                message: "Comment not found",
            })
        }
        if (comment.user != userId) {
            return res.status(400).json({
                success: false,
                message: "You are not a valid user to edit this comment",
            })
        }
        const updatedComment = await Comment.findByIdAndUpdate(id, { comment: updateComment }, { new: true }).then((comment) => {
            return comment.populate({
                path: "user",
                select: "name email"
            })
        });

        return res.status(200).json({
            success: true,
            message: "comment updated successfully",
            updatedComment,
        })
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Please try again"
        })
    }
}
async function likeComment(req, res) {
    try {
        const userId = req.user;
        const { id } = req.params;

        const comment = await Comment.findById(id).populate("blog");
        if (!comment || !comment.blog) {
            return res.status(404).json({
                success: false,
                message: "Comment or blog not found",
            });
        }

        const blog = comment.blog;
        const alreadyLiked = comment.likes.includes(userId);

        if (alreadyLiked) {
            comment.likes.pull(userId);
        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        res.status(200).json({
            success: true,
            isLiked: !alreadyLiked,
        });

        if (
            !alreadyLiked &&
            blog.creator.toString() !== userId.toString()
        ) {
            const io = getIO();

            await Notification.create({
                recipient: blog.creator,
                sender: userId,
                type: "like",
                blog: blog._id,
            });

            const sender = await User.findById(userId).select("name username profilePic");
            const creator = await User.findById(blog.creator).select("fcmTokens");

            io.to(blog.creator.toString()).emit("notification", {
                type: "like",
                sender,
                blogSlug: blog.blogId,
            });

            if (creator.fcmTokens?.length) {
                sendPush(
                    creator.fcmTokens,
                    "New like ❤️",
                    `${sender.name} liked a comment on your blog`,
                    { type: "like", blogSlug: blog.blogId, url : `/blog/${blog.blogId}` , image: sender.profilePic || "",}
                );
            }
        }
    } catch (err) {
        console.error("LIKE COMMENT ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}

async function addNestedComment(req, res) {
    try {
        const userId = req.user;
        const { id: blogId, parentCommentId } = req.params;
        const { reply } = req.body;

        const comment = await Comment.findById(parentCommentId);
        const blog = await Blog.findById(blogId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "parent comment not found",
            })
        }
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "blog not found",
            })
        }
        const newReply = await Comment.create({
            blog: blogId,
            comment: reply,
            parentComment: parentCommentId,
            user: userId,
        })
            .then((reply) => {
                return reply.populate({
                    path: "user",
                    select: "name email"
                })
            });
        await Comment.findByIdAndUpdate(parentCommentId, {
            $push: { replies: newReply._id }
        });
        return res.status(200).json({
            success: true,
            message: "Reply added successfully",
            newReply,
        })
    }
    catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {
    addComment,
    deleteComment,
    editComment,
    likeComment,
    addNestedComment,
};