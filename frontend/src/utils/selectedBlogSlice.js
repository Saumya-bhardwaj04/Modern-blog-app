import { createSlice } from "@reduxjs/toolkit";
function normalizeComment(comment) {
    return {
        ...comment,
        likes: Array.isArray(comment.likes) ? comment.likes : [],
        replies: Array.isArray(comment.replies)
            ? comment.replies.map(normalizeComment)
            : [],
    };
}
const selectedBlogSlice = createSlice({
    name: "selectedBlogSlice",
    initialState: JSON.parse(localStorage.getItem("selectedBlog")) || {
        creator: { _id: "" },
        likes: [],
        comments: [],
    },
    reducers: {
        addSelectedBlog(state, action) {
            localStorage.setItem("selectedBlog", JSON.stringify(action.payload));
            return action.payload;
        },
        removeSelectedBlog() {
            localStorage.removeItem("selectedBlog");
            return {
            };
        },
        changeLikes(state, action) {
            const { userId, isLiked } = action.payload;

            if (isLiked) {
                if (!state.likes.includes(userId)) {
                    state.likes.push(userId);
                }
            } else {
                state.likes = state.likes.filter(id => id !== userId);
            }
        },
        setComments(state, action) {
            state.comments.push(normalizeComment(action.payload));
        },
        setCommentLikes(state, action) {
            const { commentId, userId } = action.payload;

            function toggle(comments) {
                return comments.map(comment => {
                    if (comment._id === commentId) {
                        const likes = comment.likes || [];
                        return {
                            ...comment,
                            likes: likes.includes(userId)
                                ? likes.filter(id => id !== userId)
                                : [...likes, userId],
                        };
                    }

                    if (comment.replies?.length) {
                        return { ...comment, replies: toggle(comment.replies) };
                    }

                    return comment;
                });
            }

            state.comments = toggle(state.comments || []);
        }
        ,
        setReplies(state, action) {
            const { parentId, reply } = action.payload;

            function addReply(comments) {
                return comments.map(comment => {
                    if (comment._id === parentId) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), normalizeComment(reply)],
                        };
                    }

                    if (comment.replies?.length) {
                        return { ...comment, replies: addReply(comment.replies) };
                    }

                    return comment;
                });
            }

            state.comments = addReply(state.comments || []);
        }
        ,
        setUpdatedComments(state, action) {
            const { _id, comment, userId, name, profilePic } = action.payload;

            function update(comments) {
                return comments.map(c => {
                    let updated = c;

                    // 🔹 CASE 1: comment text edit
                    if (_id && c._id === _id) {
                        updated = {
                            ...updated,
                            comment,
                        };
                    }

                    // 🔹 CASE 2: user profile update (name / profilePic)
                    if (userId && c.user?._id === userId) {
                        updated = {
                            ...updated,
                            user: {
                                ...updated.user,
                                ...(name && { name }),
                                ...(profilePic && { profilePic }),
                            },
                        };
                    }

                    // 🔁 recurse into replies
                    if (c.replies?.length) {
                        updated = {
                            ...updated,
                            replies: update(c.replies),
                        };
                    }

                    return updated;
                });
            }

            state.comments = update(state.comments || []);
        }
        ,
        deleteCommentAndReply(state, action) {
            const id = action.payload;

            function remove(comments) {
                return comments
                    .filter(c => c._id !== id)
                    .map(c => ({
                        ...c,
                        replies: c.replies ? remove(c.replies) : [],
                    }));
            }

            state.comments = remove(state.comments || []);
        }

    },
});

export const { addSelectedBlog, removeSelectedBlog, changeLikes, setComments, setCommentLikes, setReplies, setUpdatedComments, deleteCommentAndReply } =
    selectedBlogSlice.actions;
export default selectedBlogSlice.reducer;
