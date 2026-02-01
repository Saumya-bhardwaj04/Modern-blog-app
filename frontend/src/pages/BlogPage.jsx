import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom"
import { addSelectedBlog, changeLikes, removeSelectedBlog } from "../utils/selectedBlogSlice";
import Comment from "../components/Comment";
import { setIsOpen } from "../utils/commentSlice";
import formateDate from "../utils/formateDate";
import calculateReadTime from "../components/TimeCalculate";
import socket from "../utils/socket";

export async function handleSaveBlogs(id, token) {
    try {
        let res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/save-blog/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        toast.success(res.data.message);
        return res.data.isSaved;
    }
    catch (error) {
        toast.error(error.response?.data?.message || "Unable to save blog");
    }
}

export async function handleFollowCreator(id, token) {
    try {
        let res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/follow/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        toast.success(res.data.message);
        // dispatch(updateData(["followers", id]));
        return true;
    }
    catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
        return false;
    }
}

function BlogPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isBlogSaved, setIsBlogSaved] = useState(false);
    const { token, email, id: userId, profilePic, following } = useSelector((state) => state.user);
    // const {
    //     likes = [],
    //     comments = [],
    //     content = { blocks: [] },
    //     creator = null,
    // } = useSelector((state) => state.selectedBlog || {});
    const { isOpen } = useSelector((state) => state.comment);
    const [blogData, setBlogData] = useState(null)
    const [loading, setLoading] = useState(true);
    const readTime = calculateReadTime(blogData?.content);
    const [isLike, setIsLike] = useState(false)

    useEffect(() => {
        if (!blogData?._id) return;

        if (!socket.connected) socket.connect();
        socket.emit("join:feed");
        socket.emit("join:blog", blogData._id);

        const onBlogUpdate = ({ blogId, data }) => {
            if (blogId !== blogData._id) return;

            setBlogData(prev => ({
                ...prev,
                ...data, // title, desc, image, content
                creator: data.creator ?? prev.creator,
            }));
        };
        const onUserUpdate = ({ userId, name, profilePic }) => {
            setBlogData(prev =>
                prev?.creator?._id === userId
                    ? {
                        ...prev,
                        creator: {
                            ...prev.creator,
                            name,
                            profilePic,
                        },
                    }
                    : prev
            );
        };
        const onBlogLike = ({ blogId, likesCount }) => {

            if (blogId !== blogData._id) return;

            setBlogData(prev => ({
                ...prev,
                likes: new Array(likesCount).fill("x"),
            }));
        };
        const onBlogComment = ({ blogId, commentsCount }) => {
            if (blogId !== blogData._id) return;

            setBlogData(prev => ({
                ...prev,
                comments: new Array(commentsCount).fill("x"),
            }));
        };
        const onCommentDelete = ({ blogId, commentsCount }) => {
            if (blogId !== blogData._id) return;

            setBlogData(prev => ({
                ...prev,
                comments: new Array(commentsCount).fill("x"),
            }));
        };
        const onBlogDraft = ({ blogId }) => {
            if (blogId !== blogData?._id) return;
            setBlogData(null);
        };

        socket.on("blog:update", onBlogUpdate);
        socket.on("user:update", onUserUpdate);
        socket.on("blog:like", onBlogLike);
        socket.on("blog:comment", onBlogComment);
        socket.on("blog:comment:delete", onCommentDelete);
        socket.on("blog:draft", onBlogDraft);

        return () => {
            socket.off("blog:update", onBlogUpdate);
            socket.off("user:update", onUserUpdate);
            socket.off("blog:like", onBlogLike);
            socket.off("blog:comment", onBlogComment);
            socket.off("blog:comment:delete", onCommentDelete);
            socket.emit("leave:blog", blogData._id);
            socket.off("blog:draft", onBlogDraft);
        };
    }, [blogData?._id]);

    async function fetchBlogById() {
        try {
            setLoading(true);
            let { data: { blog } } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/blogs/${id}`);
            setBlogData(blog);
            setIsBlogSaved(blog?.totalSaves?.includes(userId));
            dispatch(addSelectedBlog(blog));
            if (blog.likes.includes(userId)) {
                setIsLike((prev) => !prev)
            }
        }
        catch (error) {
            if (error.response?.status === 404) {
                // blog deleted
                setBlogData(null);
                dispatch(removeSelectedBlog());
            } else {
                toast.error(
                    creator?.name
                        ? `${creator.name}! deleted this blog`
                        : "This blog has been deleted"
                );

            }
        } finally {
            setLoading(false);
        }

    }
    async function handleLike() {
        if (!token) {
            return toast.error("Please signin to like this blog");
        }
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/like/${blogData._id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setIsLike(res.data.isLiked);
            dispatch(changeLikes({
                userId,
                isLiked: res.data.isLiked
            }));
            toast.success(res.data?.message || "Like updated");
        } catch (error) {
            toast.error("Failed to update like");
        }
    }

    async function handleDeleteBlog() {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this blog?\nThis action cannot be undone."
        );

        if (!confirmDelete) return;

        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/${blogData._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success(res.data.message);
            navigate(-1, { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
        }
    }
    useEffect(() => {
        fetchBlogById()
        return () => {
            dispatch(setIsOpen(false))
            if (window.location.pathname !== `/edit/${id}` && window.location.pathname !== `/blog/${id}`) {
                dispatch(removeSelectedBlog());
            }
        };
    }, [id])
    if (loading) {
        return (
            <div className="flex justify-center items-center w-full h-[calc(100vh-500px)]">
                <span className="loader"></span>
            </div>
        );
    }
    if (!blogData) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <h2 className="text-2xl font-semibold">
                    This blog has been deleted
                    or is no longer available.
                </h2>
                <button
                    onClick={() => navigate("/home", { replace: true })}
                    className="mt-4 px-6 py-2 bg-black text-white rounded"
                >
                    Go Home
                </button>
            </div>
        );
    }
    return (
        <div className="max-w-[700px] mx-auto p-5">
            {
                blogData ? (<div>
                    <h1 className="mt-10 font-bold text-3xl sm:text-4xl lg:text-6xl capitalize">{blogData.title}</h1>
                    <div className="flex items-center my-5 gap-3">
                        <Link to={`/@${blogData.creator.username}`}>
                            <div>
                                <div className="w-10 h-10 cursor-pointer aspect-square rounded-full overflow-hidden">
                                    <img src={blogData?.creator?.profilePic
                                        ? blogData?.creator?.profilePic
                                        : `https://api.dicebear.com/9.x/initials/svg?seed=${blogData.creator.name}`} alt="" className="rounded-full w-full h-full object-cover" />
                                </div>
                            </div>
                        </Link>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <Link to={`/@${blogData.creator.username}`}>
                                    <h2 className="capitalize text-xl hover:underline cursor-pointer">{blogData.creator.name}</h2>
                                </Link>
                                {userId !== blogData.creator._id && (
                                    <p
                                        onClick={async () => {
                                            const success = await handleFollowCreator(blogData.creator._id, token);
                                            if (success) {
                                                const { data } = await axios.get(
                                                    `${import.meta.env.VITE_BACKEND_URL}/blogs/${id}`
                                                );
                                                setBlogData(data.blog);
                                            }
                                        }} className="text-xl my-2 font-medium text-blue-700 cursor-pointer">
                                        {blogData?.creator?.followers?.includes(userId)
                                            ? "following"
                                            : "follow"}
                                    </p>
                                )}
                            </div>
                            <div>
                                <span>{readTime} min read</span>
                                <span className="mx-2">{formateDate(blogData.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <img src={blogData.image} alt="" />
                    {token && email === blogData.creator.email && (
                        <div className="flex gap-3 mt-5">
                            <Link to={"/edit/" + blogData.blogId}>
                                <button className="bg-green-500 px-6 py-2 text-xl rounded transition  hover:bg-green-600">
                                    Edit
                                </button>
                            </Link>
                            <button
                                onClick={handleDeleteBlog}
                                className="bg-red-500 px-6 py-2 text-xl rounded text-white transition hover:bg-red-600">
                                Delete
                            </button>
                        </div>
                    )}
                    <div className="flex gap-7 mt-4">
                        <div className="cursor-pointer flex gap-2" >
                            {isLike ? (
                                <i
                                    onClick={handleLike}
                                    className="fi fi-sr-thumbs-up text-blue-600 text-3xl mt-1"
                                ></i>
                            ) : (
                                <i
                                    onClick={handleLike}
                                    className="fi fi-rr-social-network text-3xl mt-1"
                                ></i>
                            )}
                            <p className="text-2xl">{blogData.likes?.length || 0}</p>
                        </div>
                        <div className="flex gap-2 cursor-pointer">
                            <i onClick={() => dispatch(setIsOpen())} className="fi fi-sr-comment-alt text-3xl mt-1 "></i>
                            <p className="text-2xl ">{blogData.comments?.length || 0}</p>
                        </div>
                        <div className="flex gap-2 cursor-pointer"
                            onClick={
                                (e) => {
                                    e.preventDefault();
                                    handleSaveBlogs(blogData._id, token);
                                    setIsBlogSaved((prev) => !prev);
                                }
                            }>
                            {
                                isBlogSaved ? (<i className="fi fi-sr-bookmark text-3xl mt-1"
                                ></i>) : (<i className="fi fi-rr-bookmark text-3xl mt-1"
                                ></i>)
                            }
                        </div>
                    </div>
                    <div className="my-10">
                        {
                            (blogData.content.blocks || []).map((block, index) => {
                                if (block.type == "header") {
                                    if (block.data.level == 2) {
                                        return <h2 key={index}
                                            className="font-bold text-4xl my-4" dangerouslySetInnerHTML={{ __html: block.data.text }}></h2>
                                    }
                                    else if (block.data.level == 3) {
                                        return <h3 key={index}
                                            className="font-bold text-3xl my-4" dangerouslySetInnerHTML={{ __html: block.data.text }}></h3>
                                    }
                                    else if (block.data.level == 4) {
                                        return <h4 key={index}
                                            className="font-bold text-2xl my-4" dangerouslySetInnerHTML={{ __html: block.data.text }}></h4>
                                    }
                                } else if (block.type == "paragraph") {
                                    return <p key={index}
                                        className="my-4" dangerouslySetInnerHTML={{ __html: block.data.text }}></p>
                                } else if (block.type == "image") {
                                    return (
                                        <div className="my-4" key={index}
                                        >
                                            <img src={block.data.file.url} alt="" />
                                            <p className="text-center my-2">{block.data.caption}</p>
                                        </div>
                                    )
                                } else if (block.type == "list") {
                                    if (block.data.style == "ordered") {
                                        return (
                                            <ol key={index} className="list-decimal my-4">
                                                {block.data.items.map((item, index) => (
                                                    <li key={index}>{item?.content}</li>
                                                ))}
                                            </ol>
                                        );
                                    } else {
                                        return (
                                            <ul key={index} className="list-disc my-4">
                                                {block.data.items.map((item, index) => (
                                                    <li key={index}>{item?.content}</li>
                                                ))}
                                            </ul>
                                        );
                                    }
                                }
                            })}
                    </div>
                </div>) : (<div className="flex justify-center items-center w-full h-[calc(100vh-500px)]">
                    <span className="loader"></span>
                </div>)
            }
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/30 z-30"
                        onClick={() => dispatch(setIsOpen(false))}
                    />
                    <Comment />
                </>
            )}
        </div>
    )
}
export default BlogPage