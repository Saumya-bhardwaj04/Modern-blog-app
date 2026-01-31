import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import DisplayBlogs from "./DisplayBlogs";
import usePagination from "../hooks/usePagination";
import { Link, Navigate } from "react-router-dom";
import socket from "../utils/socket";

function HomePage() {
    const [page, setPage] = useState(1);
    const { token, id: userId } = useSelector((state) => state.user);
    const { blogs, setBlogs, hasMore, isLoading } = usePagination("blogs", {}, 4, page);

    useEffect(() => {
        if (!token) return;

        const onNewBlog = (blog) => {
            setBlogs(prev => {
                if (prev.some(b => b._id === blog._id)) return prev;
                return [blog, ...prev];
            });
        };

        const onBlogLike = ({ blogId, likes }) => {
            setBlogs(prev =>
                prev.map(b =>
                    b._id === blogId
                        ? { ...b, likes: Array(likes) }
                        : b
                )
            );
        };

        const onBlogComment = ({ blogId }) => {
            setBlogs(prev =>
                prev.map(b =>
                    b._id === blogId
                        ? { ...b, comments: [...b.comments, {}] }
                        : b
                )
            );
        };

        socket.on("blog:new", onNewBlog);
        socket.on("blog-like", onBlogLike);
        socket.on("blog:comment", onBlogComment);

        return () => {
            socket.off("blog:new", onNewBlog);
            socket.off("blog-like", onBlogLike);
            socket.off("blog:comment", onBlogComment);
        };
    }, [token, setBlogs]);


    return token == null ?
        (<Navigate to={"/"} />
        ) : (
            <div className=" w-full lg:w-[80%] 2xl:w-[60%] mx-auto flex px-5 ">
                {!isLoading ? (
                    <>
                        <div className="w-full md:w-[65%] md:pr-10">
                            {blogs.length > 0 && <DisplayBlogs blogs={blogs} />}
                            {hasMore && (
                                <button
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="rounded-3xl mx-auto bg-black text-white px-7 py-2"
                                >
                                    Load more
                                </button>
                            )}
                        </div>
                        <div className=" hidden md:block w-[30%] border-l pl-10 min-h-[calc(100vh_-_70px)] ">
                            <div className="">
                                <h1 className="text-xl font-semibold mb-4">Recommended topics</h1>
                                <div className="flex flex-wrap">
                                    {["Technology", "AI", "ChatGPT", "JavaScript", "Mern", "Programming", "Express", "React"].map(
                                        (tag, index) => (
                                            <Link key={index} to={`/tag/${tag.toLowerCase()}`}>
                                                <div
                                                    key={index}
                                                    className="m-1 cursor-pointer bg-gray-200 text-black  hover:text-white hover:bg-black rounded-full px-5 py-2 flex justify-center items-center"
                                                >
                                                    <p>{tag}</p>
                                                </div>
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center items-center w-full h-[calc(100vh-500px)]">
                        <span className="loader"></span>
                    </div>
                )}
            </div>
        )
}
export default HomePage;