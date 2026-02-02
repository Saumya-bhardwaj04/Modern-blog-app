const Blog = require("../models/blogSchema");
const User = require("../models/userSchema");
const { uploadImage, deleteImagefromCloudinary } = require("../utils/uploadImage");
const Comment = require("../models/commentSchema");
const ShortUniqueId = require("short-unique-id");
const { randomUUID } = new ShortUniqueId({ length: 10 })
const { getIO } = require("../socket");
const Notification = require("../models/notificationSchema");
const sendPush = require("../utils/sendPush");

async function createBlog(req, res) {
    try {
        const creator = req.user
        const { title, description } = req.body;
        const draft = req.body.draft == "false" ? false : true;
        const { image, images } = req.files;
        const content = JSON.parse(req.body.content);
        const tags = JSON.parse(req.body.tags);

        if (!title) {
            return res.status(400).json({
                message: "please fill the title fields"
            })
        }
        if (!description) {
            return res.status(400).json({
                message: "please fill the description fields"
            })
        }
        if (!content) {
            return res.status(400).json({
                message: "please add some content"
            })
        }
        if (!image || image.length === 0) {
            return res.status(400).json({
                message: "please add a cover image"
            })
        }
        const author = await User.findById(creator)
            .select("name username profilePic followers fcmTokens");

        if (!author) {
            return res.status(500).json({ message: "Not a Valid User" });
        }
        //cloudinary
        let imageIndex = 0;
        for (let i = 0; i < content.blocks.length; i++) {
            const block = content.blocks[i];
            if (block.type === "image") {
                const { secure_url, public_id } = await uploadImage(`data:image/jpeg;base64,${images[imageIndex].buffer.toString("base64")}`)
                block.data.file = {
                    url: secure_url,
                    imageId: public_id,
                }
                imageIndex++;
            }
        }
        const { secure_url, public_id } = await uploadImage(`data:image/jpeg;base64,${image[0].buffer.toString("base64")}`);

        const blogId = title.toLowerCase().split(" ").join("-") + "-" + randomUUID()

        const blog = await Blog.create({ title, description, draft, creator, image: secure_url, imageId: public_id, blogId, content, tags });
        await User.findByIdAndUpdate(creator, { $push: { blogs: blog._id } })
        if (draft) {
            return res.status(200).json({
                message: "Blog Saved as Draft. You can public it from your profile",
                blog,
            })
        }
        const io = getIO();
        const populatedBlog = await Blog.findById(blog._id)
            .populate("creator", "name username profilePic");
        io.to("feed").emit("blog:new", populatedBlog);

        const followers = author.followers || [];

        for (const userId of followers) {
            if (userId.toString() === creator.toString()) continue;

            // save notification
            await Notification.create({
                recipient: userId,
                sender: creator,
                type: "new_blog",
                blog: blog._id,
            });

            // socket notification
            io.to(userId.toString()).emit("notification", {
                type: "new_blog",
                blogSlug: blog.blogId,
                sender: {
                    username: author.username,
                    name: author.name,
                    profilePic: author.profilePic,
                },
            });

            // 🔔 OPTIONAL: push notification
            const follower = await User.findById(userId).select("fcmTokens");
            if (follower?.fcmTokens?.length) {
                await sendPush(
                    follower.fcmTokens,
                    "New blog published ✍️",
                    `${author.name} posted a new blog`,
                    {
                        type: "new_blog",
                        blogSlug: blog.blogId,
                        senderName: author.name,
                        senderUsername: author.username,
                        senderProfilePic: author.profilePic,
                        click_action: `/blog/${blog.blogId}`,
                    }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Blog created Successfully",
            blog,
        })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}
async function getBlogs(req, res) {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const skip = (page - 1) * limit;
        const blogs = await Blog.find({ draft: false }).populate({ path: "creator", select: "-password" })
            .populate({ path: "likes", select: "email name" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalBlogs = await Blog.countDocuments({ draft: false });

        return res.status(200).json({
            message: "Blogs fetched Successfully",
            blogs,
            hasMore: skip + limit < totalBlogs,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}
async function getBlog(req, res) {
    try {
        const { blogId } = req.params
        const blog = await Blog.findOne({ blogId }).populate({
            path: "comments",
            populate: {
                path: "user",
                select: "name email username profilePic",
            },
        }).populate({
            path: "creator",
            select: "name email followers username profilePic",
        }).lean();

        async function populateReplies(comments) {
            for (const comment of comments) {
                let populatedComment = await Comment.findById(comment._id).populate({
                    path: "replies",
                    populate: {
                        path: "user",
                        select: "name email username profilePic",
                    },
                }).lean();
                comment.replies = populatedComment.replies;
                if (comment.replies && comment.replies.length > 0) {
                    await populateReplies(comment.replies);
                }
            }
            return comments;
        }
        blog.comments = await populateReplies(blog.comments);

        if (!blog) {
            return res.status(404).json({
                message: "Blog Not Found"
            })
        }
        return res.status(200).json({
            message: "Blog fetched Successfully",
            blog,
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
async function updateBlog(req, res) {
    try {
        const creator = req.user;
        const { id } = req.params;
        const { title, description } = req.body
        const draft = req.body.draft == "false" ? false : true;
        const content = JSON.parse(req.body.content);
        const tags = JSON.parse(req.body.tags);
        const existingImages = JSON.parse(req.body.existingImages)

        const user = await User.findById(creator).select("-password");
        const blog = await Blog.findOne({ blogId: id })
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            })
        }
        if (!(creator == blog.creator)) {
            return res.status(500).json({
                message: "You are not authorized to update this blog",
            })
        }
        let imagesToDelete = blog.content.blocks.filter((block) => block.type == "image").filter((block) => !existingImages.find(({ url }) => url == block.data.file.url)).map((block) => block.data.file.imageId);
        if (imagesToDelete.length > 0) {
            await Promise.all(
                imagesToDelete.map((imageId) =>
                    deleteImagefromCloudinary(imageId)
                )
            );
        }
        if (req.files.images) {
            let imageIndex = 0;
            for (let i = 0; i < content.blocks.length; i++) {
                const block = content.blocks[i];
                if (block.type === "image" && block.data.file.image) {
                    const { secure_url, public_id } = await uploadImage(`data:image/jpeg;base64,${req.files.images[imageIndex].buffer.toString("base64")}`)
                    block.data.file = {
                        url: secure_url,
                        imageId: public_id,
                    }
                    imageIndex++;
                }
            }
        }

        if (req?.files?.image) {
            await deleteImagefromCloudinary(blog.imageId);
            const { secure_url, public_id } = await uploadImage(`data:image/jpeg;base64,${req?.files?.image[0]?.buffer?.toString("base64")}`);
            blog.image = secure_url;
            blog.imageId = public_id;
        }
        const wasDraft = blog.draft;
        blog.title = title || blog.title;
        blog.description = description || blog.description;
        blog.draft = draft;
        blog.content = content || blog.content;
        blog.tags = tags || blog.tags;

        await blog.save();
        const io = getIO();
        if (wasDraft === false && draft === true) {
            io.to("feed").emit("blog:draft", {
                blogId: blog._id.toString(),
            });

            io.to(`blog:${blog._id}`).emit("blog:draft", {
                blogId: blog._id.toString(),
            });

            return res.status(200).json({
                success: true,
                message: "Blog Saved as Draft",
                blog,
            });
        }
        if (wasDraft === true && draft === false) {
            const publishedBlog = await Blog.findById(blog._id)
                .populate("creator", "name username profilePic");

            io.to("feed").emit("blog:new", publishedBlog);

            io.to(`blog:${blog._id}`).emit("blog:update", {
                blogId: blog._id.toString(),
                data: {
                    title: publishedBlog.title,
                    description: publishedBlog.description,
                    image: publishedBlog.image,
                    content: publishedBlog.content,
                    updatedAt: publishedBlog.updatedAt,
                    creator: {
                        _id: publishedBlog.creator._id,
                        name: publishedBlog.creator.name,
                        username: publishedBlog.creator.username,
                        profilePic: publishedBlog.creator.profilePic,
                    },
                },
            });

            return res.status(200).json({
                success: true,
                message: "Blog published successfully",
                blog: publishedBlog,
            });
        }
        const updatedBlog = await Blog.findById(blog._id)
            .populate("creator", "name username profilePic");

        io.to("feed").emit("blog:update", {
            blogId: updatedBlog._id.toString(),
            data: {
                title: updatedBlog.title,
                description: updatedBlog.description,
                image: updatedBlog.image,
                content: updatedBlog.content,
                updatedAt: updatedBlog.updatedAt,
                creator: {
                    _id: updatedBlog.creator._id,
                    name: updatedBlog.creator.name,
                    username: updatedBlog.creator.username,
                    profilePic: updatedBlog.creator.profilePic,
                },
            },
        });
        io.to(`blog:${updatedBlog._id}`).emit("blog:update", {
            blogId: updatedBlog._id.toString(),
            data: {
                title: updatedBlog.title,
                description: updatedBlog.description,
                image: updatedBlog.image,
                content: updatedBlog.content,
                updatedAt: updatedBlog.updatedAt,
                creator: {
                    _id: updatedBlog.creator._id,
                    name: updatedBlog.creator.name,
                    username: updatedBlog.creator.username,
                    profilePic: updatedBlog.creator.profilePic,
                },
            },
        });
        return res.status(200).json({
            success: true,
            message: "Blog updated Successfully",
            blog,
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
async function deleteBlog(req, res) {
    try {
        const creator = req.user;
        const { id } = req.params;
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            })
        }
        if (blog.creator.toString() !== creator.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this blog",
            })
        }
        await deleteImagefromCloudinary(blog.imageId);
        await Blog.findByIdAndDelete(id);
        await User.findByIdAndUpdate(creator, { $pull: { blogs: id } })

        const io = getIO();
        io.to("feed").emit("blog:delete", {
            blogId: id,
        });

        return res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
            blog,
        })
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Please try again"
        })
    }
}
async function likeBlog(req, res) {
    try {
        const userId = req.user;
        const { id } = req.params;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }
        const alreadyLiked = blog.likes.includes(userId);

        let updatedBlog;

        if (!alreadyLiked) {
            updatedBlog = await Blog.findByIdAndUpdate(
                id,
                { $addToSet: { likes: userId } },
                { new: true }
            );
            await User.findByIdAndUpdate(userId, { $addToSet: { likeBlogs: id } });
        } else {
            updatedBlog = await Blog.findByIdAndUpdate(
                id,
                { $pull: { likes: userId } },
                { new: true }
            );
            await User.findByIdAndUpdate(userId, { $pull: { likeBlogs: id } });
        }

        const io = getIO();

        // ✅ emit CORRECT count
        io.to("feed").emit("blog:like", {
            blogId: updatedBlog._id.toString(),
            likesCount: updatedBlog.likes.length,
        });
        io.to(`blog:${updatedBlog._id}`).emit("blog-like", {
            blogId: updatedBlog._id.toString(),
            likesCount: updatedBlog.likes.length,
        });

        res.status(200).json({
            success: true,
            message: alreadyLiked
                ? "Blog Disliked successfully"
                : "Blog Liked successfully",
            isLiked: !alreadyLiked,
        });
        // 🔔 notify only when liked & not self
        if (!alreadyLiked && blog.creator.toString() !== userId.toString()) {
            await Notification.create({
                recipient: blog.creator,
                sender: userId,
                type: "like",
                blog: blog._id,
            });
            const creator = await User.findById(blog.creator).select("fcmTokens");
            const sender = await User.findById(userId).select("name username profilePic");

            io.to(blog.creator.toString()).emit("notification", {
                type: "like",
                sender,
                blogSlug: blog.blogId,
            });

            if (creator.fcmTokens?.length) {
                sendPush(
                    creator.fcmTokens,
                    "New like ❤️",
                    `${sender.name} liked your blog`,
                    {
                        type: "like",
                        blogSlug: blog.blogId,
                        senderName: sender.name,
                        senderUsername: sender.username,
                        senderProfilePic: sender.profilePic,
                    }
                );

            }
        }

    } catch (err) {
        console.error("LIKE BLOG ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}
async function saveBlog(req, res) {
    try {
        const user = req.user;
        const { id } = req.params;
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(200).json({
                success: false,
                message: "Blog not found",
            })
        }
        if (!blog.totalSaves.includes(user)) {
            await Blog.findByIdAndUpdate(id, { $set: { totalSaves: user } });
            await User.findByIdAndUpdate(user, { $set: { saveBlogs: id } });
            return res.status(200).json({
                success: true,
                message: "Blog has been saved ",
                isLiked: true,
            })
        } else {
            await Blog.findByIdAndUpdate(id, { $unset: { totalSaves: user } });
            await User.findByIdAndUpdate(user, { $unset: { saveBlogs: id } });
            return res.status(200).json({
                success: true,
                message: "Blog unsaved ",
                isLiked: false,

            })
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Please try again"
        })
    }
}
async function searchBlogs(req, res) {
    try {
        const { search, tag } = req.query;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const skip = (page - 1) * limit;

        let query;

        if (tag) {
            query = { tags: tag };
        } else if (search) {
            const keywords = search.split(" ");
            query = {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { tags: { $in: keywords } },
                ],
            };
        }

        const blogs = await Blog.find(query, { draft: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: "creator",
                select: "name email followers username profilePic",
            });
        if (blogs.length === 0) {
            return res.status(200).json({
                success: true,
                blogs: [],
                hasMore: false,
            });
        }

        const totalBlogs = await Blog.countDocuments(query, { draft: false });

        return res.status(200).json({
            success: true,
            blogs,
            hasMore: skip + limit < totalBlogs,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}
module.exports = {
    createBlog,
    getBlogs,
    getBlog,
    updateBlog,
    deleteBlog,
    likeBlog,
    saveBlog,
    searchBlogs,
};