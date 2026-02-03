import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import CodeTool from "@editorjs/code";
import Marker from "@editorjs/marker";
import Underline from "@editorjs/underline";
import Embed from "@editorjs/embed";
import RawTool from "@editorjs/raw";
import TextVariantTune from "@editorjs/text-variant-tune";
import SimpleImage from "@editorjs/simple-image";
import ImageTool from "@editorjs/image";
import Table from '@editorjs/table'

import { setIsOpen } from "../utils/commentSlice";
import { removeSelectedBlog } from "../utils/selectedBlogSlice";
import useLoader from "../hooks/useLoader";
import CoachMark from "../components/CoachMark";

function AddBlog() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const editorjsRef = useRef(null);
    const [isLoading, startLoading, stopLoading] = useLoader();
    const [isAI, setIsAI] = useState(false);
    const { token } = useSelector(slice => slice.user);
    const { title, description, image, content, draft, tags } = useSelector(slice => slice.selectedBlog);
    const [showAIGuide, setShowAIGuide] = useState(false);
    const aiButtonRef = useRef(null);
    const [blogData, setBlogData] = useState({
        title: "",
        description: "",
        image: null,
        content: { blocks: [] },
        tags: [],
        draft: false,
    })
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const hydrateEditorContent = async (data) => {
        if (!editorjsRef.current || !data?.blocks?.length) return;
        await editorjsRef.current.clear();
        await editorjsRef.current.render(data);
    };
    useEffect(() => {
        const seen = localStorage.getItem("ai_guide_seen");
        if (!seen) setShowAIGuide(true);
    }, []);
    async function handleAIAssist() {
        try {
            if (!blogData.title || blogData.title.length < 5) {
                return toast.error("Title must contain at least 5 characters");
            }

            setIsAI(true);

            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/ai/blog-assist`,
                { title: blogData.title },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const { description, tags, content } = res.data.data;

            setBlogData(prev => ({
                ...prev,
                description,
                tags,
                content,
            }));
            setTimeout(() => hydrateEditorContent(content), 0);

            toast.success("AI suggestions applied ✨");

        } catch (err) {
            if (err.response?.status === 429) {
                // const type = err.response.data?.type;
                // if (type === "RATE_LIMIT"){
                //     toast.error(err.response.data.message);
                // }else{
                toast.error(err.response.data.message);
                // }
            } else {
                toast.error("AI assist failed");
            }
        } finally {
            setIsAI(false);
        }
    }
    useEffect(() => {
        if (!id && window.location.pathname === "/add-blog") {
            dispatch(removeSelectedBlog());

            setBlogData({
                title: "",
                description: "",
                image: null,
                content: { blocks: [] },
                tags: [],
                draft: false,
            });
        }
    }, [id]);
    async function handlePostBlog() {
        const formData = new FormData();
        formData.append("title", blogData.title);
        formData.append("description", blogData.description);
        formData.append("image", blogData.image);
        formData.append("content", JSON.stringify(blogData.content));
        formData.append("tags", JSON.stringify(blogData.tags));
        formData.append("draft", blogData.draft);
        if (blogData.content?.blocks?.length) {
            blogData.content.blocks.forEach((block) => {
                if (block.type === "image") {
                    formData.append("images", block.data.file.image);
                }
            });
        }
        try {
            startLoading();
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/blogs`, formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            toast.success(res.data.message)
            navigate("/home")
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            stopLoading();
        }
    }
    async function handleUpdateBlog() {
        let formData = new FormData();
        formData.append("title", blogData.title);
        formData.append("description", blogData.description);
        formData.append("image", blogData.image);
        formData.append("content", JSON.stringify(blogData.content));
        formData.append("tags", JSON.stringify(blogData.tags));
        formData.append("draft", blogData.draft);

        let existingImages = [];
        blogData.content.blocks.forEach((block) => {
            if (block.type === "image") {
                if (block.data.file.image) {
                    formData.append("images", block.data.file.image);
                } else {
                    existingImages.push({
                        url: block.data.file.url,
                        imageId: block.data.file.imageId,
                    })
                }
            }
        })
        formData.append("existingImages", JSON.stringify(existingImages));
        try {
            startLoading();

            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/blogs/` + id, formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            toast.success(res.data.message)
            navigate("/home")
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            stopLoading();
        }

    }
    async function fetchBlogById() {
        if (!isEdit) return;

        // ✅ If redux is empty, re-fetch from backend
        if (!content || !content.blocks?.length) {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/blogs/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const blog = res.data.blog;

                setBlogData({
                    title: blog.title,
                    description: blog.description,
                    image: blog.image,
                    content: blog.content,
                    draft: blog.draft,
                    tags: blog.tags,
                });
                setTimeout(() => hydrateEditorContent(blog.content), 0);

            } catch (err) {
                toast.error("Failed to load blog");
            }
            return;
        }
        // ✅ Normal redux → state hydration
        setBlogData({
            title,
            description,
            image,
            content,
            draft,
            tags,
        });
        setTimeout(() => hydrateEditorContent(content), 0);
    }
    function initializeEditorjs() {
        editorjsRef.current = new EditorJS({
            holder: "editorjs",
            placeholder: "write something...",
            data: isEdit && content?.blocks?.length
                ? content
                : { blocks: [] },
            tools: {
                header: {
                    class: Header,
                    inlineToolbar: true,
                    config: {
                        placeholder: "Enter a header",
                        levels: [2, 3, 4],
                        defaultLevel: 3
                    },
                },
                List: {
                    class: List,
                    config: {},
                    inlineToolbar: true,
                },
                Code: CodeTool,
                Marker: Marker,
                Underline: Underline,
                Embed: Embed,
                Raw: RawTool,
                textVariant: TextVariantTune,
                simpleImage: SimpleImage,
                image: {
                    class: ImageTool,
                    config: {
                        uploader: {
                            uploadByFile: async (image) => {
                                return {
                                    success: 1,
                                    file: {
                                        url: URL.createObjectURL(image),
                                        image,
                                    }
                                };
                            }
                        }
                    }
                },
                table: Table,
            },
            tunes: ['textVariant'],
            onChange: async () => {
                let data = await editorjsRef.current.save();
                setBlogData((blogData) => ({ ...blogData, content: data }));
            }
        })
    }
    function handleKeyDown(e) {
        const tag = e.target.value.toLowerCase();

        if (e.code === "Space" || e.keyCode == "32") {
            e.preventDefault();
        }

        if ((e.code == "Enter" || e.keyCode == "13") && tag !== "") {
            if (blogData.tags.length >= 10) {
                e.target.value = "";
                return toast.error("You can add upto maximum 10 tags");
            }
            if (blogData.tags.includes(tag)) {
                e.target.value = "";
                return toast.error("This tag is already added");
            }
            setBlogData((prev) => ({
                ...prev,
                tags: [...prev.tags, tag],
            }));
            e.target.value = "";
        }
    }
    function deleteTag(index) {
        const updatedTags = blogData.tags.filter(
            (_, tagIndex) => tagIndex !== index
        );
        setBlogData((prev) => ({ ...prev, tags: updatedTags }));
    }
    useEffect(() => {
        if (id) {
            fetchBlogById();
        }
    }, [id]);
    useEffect(() => {
        if (editorjsRef.current) {
            editorjsRef.current.destroy();
            editorjsRef.current = null;
        }

        initializeEditorjs();

        return () => {
            if (editorjsRef.current) {
                editorjsRef.current.destroy();
                editorjsRef.current = null;
            }
            dispatch(setIsOpen(false))
        };
    }, [id]);

    return token == null ?
        (<Navigate to={"/"} />
        ) : (
            <div className=" p-5 w-full sm:w-[500px] lg:w-[1000px] mx-auto">
                <div className=" lg:flex lg:justify-between  gap-8">
                    <div className=" lg:w-3/6">
                        <h2 className="text-2xl font-semibold my-2">Image</h2>
                        <label htmlFor="image" className=" ">
                            {blogData.image ? (
                                <img
                                    src={
                                        typeof blogData.image == "string"
                                            ? blogData.image
                                            : URL.createObjectURL(blogData.image)
                                    }
                                    alt=""
                                    className="aspect-video object-cover border rounded-lg"
                                />
                            ) : (
                                <div className=" bg-white border rounded-lg aspect-video opacity-50 flex justify-center items-center text-4xl">
                                    Select Image
                                </div>
                            )}
                        </label>
                        <input
                            className="hidden"
                            id="image"
                            type="file"
                            accept=".png, .jpeg, .jpg"
                            onChange={(e) =>
                                setBlogData((blogData) => ({
                                    ...blogData,
                                    image: e.target.files[0],
                                }))
                            }
                        />
                    </div>

                    <div className=" lg:w-3/6">
                        <div className="my-4">
                            <div className="flex gap-1 my-3">
                                {/* ✨ AI Assist Button */}
                                <button
                                    ref={aiButtonRef}
                                    onClick={() => {
                                        if (!isAI) handleAIAssist();
                                    }}
                                    disabled={isAI}
                                    className="bg-black text-white px-6 py-2 rounded-full font-semibold my-3 flex items-center justify-center gap-2 min-w-[140px] h-[40px] relative">
                                    <span
                                        className={`transition-opacity duration-150 ${isAI ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                            }`}
                                    >
                                        ✨ AI Assist
                                    </span>

                                    {/* Loader (absolute, centered) */}
                                    {isAI && (
                                        <span className="absolute mt-1">
                                            <span className="ai-loader" />
                                        </span>
                                    )}</button>
                                {/* ⓘ Info Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowAIGuide(true)}
                                    className="w-4 h-4 mt-3.5 rounded-full border border-gray-500 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100 transition"
                                    title="How AI Assist works"
                                >
                                    i
                                </button>
                            </div>
                            <CoachMark
                                anchorRef={aiButtonRef}
                                visible={showAIGuide}
                                onClose={() => setShowAIGuide(false)}
                                storageKey="ai_guide_seen"
                            >
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    ✨ AI Assist
                                </h4>

                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Write a <b>title</b> for your blog and click <b>AI Assist</b>.
                                    <br />
                                    It will automatically generate:
                                    <br />• Description
                                    <br />• Tags
                                    <br />• Full blog content
                                </p>
                                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                                    <b>Note :</b>⏳3 AI assists per day (resets daily) </p>
                            </CoachMark>

                            <h2 className="text-2xl font-semibold my-2">Title</h2>
                            <input
                                type="text"
                                placeholder="title"
                                onChange={(e) =>
                                    setBlogData((blogData) => ({
                                        ...blogData,
                                        title: e.target.value,
                                    }))
                                }
                                value={blogData.title}
                                className="border focus:outline-none rounded-lg w-full p-2 placeholder:text-lg"
                            />
                        </div>

                        <div className="my-4">
                            <h2 className="text-2xl font-semibold my-2">Tags</h2>
                            <input
                                type="text"
                                placeholder="tags"
                                className="w-full p-3 rounded-lg border text-lg focus:outline-none"
                                onKeyDown={handleKeyDown}
                            />

                            <div className="flex justify-between my-2">
                                <p className="text-xs my1 opacity-60">
                                    *Click on Enter to add Tag
                                </p>
                                <p className="text-xs my1 opacity-60">
                                    {10 - blogData?.tags?.length} tags remaining
                                </p>
                            </div>

                            <div className="flex flex-wrap">
                                {blogData?.tags?.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="m-2 bg-gray-200 text-black  hover:text-white hover:bg-black rounded-full px-7 py-2 flex gap-3 justify-center items-center"
                                    >
                                        <p>{tag}</p>
                                        <i
                                            className="fi fi-sr-cross-circle mt-1 text-xl cursor-pointer"
                                            onClick={() => deleteTag(index)}
                                        ></i>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="my-4">
                    <h2 className="text-2xl font-semibold my-2">Description</h2>
                    <textarea
                        type="text"
                        placeholder="description"
                        value={blogData.description}
                        className=" h-[100px] resize-none w-full p-3 rounded-lg border text-lg focus:outline-none"
                        onChange={(e) =>
                            setBlogData((blogData) => ({
                                ...blogData,
                                description: e.target.value,
                            }))
                        }
                    />
                </div>

                <div className="my-4">
                    <h2 className="text-2xl font-semibold my-2">Draft</h2>
                    <select
                        value={blogData.draft}
                        name=""
                        id=""
                        className="w-full p-3 rounded-lg border text-lg focus:outline-none"
                        onChange={(e) =>
                            setBlogData((prev) => ({
                                ...prev,
                                draft: e.target.value == "true" ? true : false,
                            }))
                        }
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>

                <div className="my-4">
                    <h2 className="text-2xl font-semibold my-2">Content</h2>
                    <div id="editorjs" className="w-full"></div>
                </div>

                {
                    !isLoading ? (
                        <div>
                            <button
                                className="bg-blue-500 px-7 py-3 rounded-full  font-semibold text-white my-6 "
                                onClick={id ? handleUpdateBlog : handlePostBlog}
                            >
                                {blogData.draft
                                    ? "Save as Draft"
                                    : id
                                        ? "Update blog"
                                        : "Post blog"}
                            </button>
                            <button
                                className={` mx-4 px-7 py-3 rounded-full text-white my-3 bg-black`}
                                onClick={() => navigate(-1)}
                            >
                                Back
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center w-full h-[calc(100vh-500px)]">
                            <span className="loader"></span>
                        </div>
                    )
                }
            </div >
        );
}
export default AddBlog;