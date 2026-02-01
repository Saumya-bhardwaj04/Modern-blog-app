import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import logo from "../../public/logo.jpg";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../utils/userSlice.js";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebase.js";
import socket from "../utils/socket";
import { messaging, onMessage } from "../utils/firebase.js";
import NotificationToast from "./NotificationToast.jsx";
import axios from "axios";
import useDebounce from "../hooks/useDebounce.jsx";

function Navbar() {
    const { token, name, profilePic, username, id: userId } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const location = useLocation();
    const [showPopup, setShowPopup] = useState(false);
    // const [searchQuery, setSearchQuery] = useState(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const isStartPage = location.pathname === "/" || location.pathname === "/signin" || location.pathname === "/signup";
    const [hasUnread, setHasUnread] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 400);

    useEffect(() => {
        if (!debouncedSearch || debouncedSearch.length < 2) return;
        navigate(`/search?q=${debouncedSearch}`);
    }, [debouncedSearch]);

    const fetchUnreadCount = async () => {
        if (!token) return;
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/notifications/unread-count`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHasUnread(res.data.count > 0);
        } catch (err) {
            console.error("Unread count error", err);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
    }, [token]);

    //socket connection
    useEffect(() => {
        if (!userId || !token) {
            socket.off("notification");
            socket.disconnect();
            return;
        }
        socket.connect();
        socket.emit("join:user", userId);
        return () => {
            socket.off("notification");
            socket.disconnect();
        };
    }, [userId, token]);
    const showNotificationToast = (rawData, navigate) => {
        if (!rawData) return;

        // Normalize sender
        const sender = rawData.sender || {
            name:
                rawData.senderName ||
                rawData.name ||
                rawData.username ||
                "Someone",
            profilePic:
                rawData.profilePic ||
                rawData.avatar ||
                null,
            username: rawData.username,
        };

        const data = {
            ...rawData,
            sender,
        };

        toast.custom(
            (t) => (
                <div
                    className={t.visible ? "toast-enter" : "toast-leave"}
                    onClick={() => {
                        toast.dismiss(t.id);

                        if (
                            data.type === "comment" ||
                            data.type === "comment_like" ||
                            data.type === "comment_reply"
                        ) {
                            navigate("/notifications");
                        } else if (data.type === "like") {
                            navigate(`/blog/${data.blogSlug
                                }`);
                        } else if (data.type === "follow") {
                            navigate(`/ @${sender.username}`);
                        } else if (data.type === "new_blog") {
                            navigate(`/blog/${data.blogSlug}`);
                        }

                    }}
                >
                    <NotificationToast t={t} data={data} />
                </div>
            ),
            {
                position: "top-center",
                duration: 4000,
            }
        );
    };

    // socket notification listener
    useEffect(() => {
        if (!token) return;

        const handler = (data) => {
            if (!data?.sender?.name) return;
            fetchUnreadCount(); // 🔥 sync badge
            // setHasUnread(true); // 🔵
            if (location.pathname === "/notifications" || "/home") return; // don't show toast if on notifications page
            showNotificationToast(data, navigate);
        };

        socket.on("notification", handler);
        return () => socket.off("notification", handler);
    }, [navigate, token, location.pathname]);

    // fcm forground
    useEffect(() => {
        if (!token) return;
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("🔥 FCM PAYLOAD RECEIVED:", payload);

            const d = payload.data;

            showNotificationToast(
                {
                    type: d.type,
                    blogSlug: d.blogSlug,
                    sender: {
                        name: d.senderName,
                        username: d.senderUsername,
                        profilePic: d.senderProfilePic,
                    },
                },
                navigate
            );
            fetchUnreadCount(); // 🔥 sync badge

        });
        // setHasUnread(true); // 🔵

        return () => unsubscribe();
    }, [navigate, token]);

    async function unregisterFcmToken(authToken) {
        try {
            const lastSentToken = localStorage.getItem("last_fcm_token");
            if (lastSentToken && lastSentToken !== authToken) {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/remove-fcm-token`,
                    { token: lastSentToken },
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
            }
            // remove locally
            localStorage.removeItem("last_fcm_token");
            console.log("FCM token removed successfully");
        } catch (err) {
            console.error("Failed to remove FCM token", err);
        }
    }

    useEffect(() => {
        if (location.pathname === "/notifications") {
            fetchUnreadCount();
        }
    }, [location.pathname]);

    async function handleLogout() {
        await unregisterFcmToken(token);
        await signOut(auth);
        socket.disconnect();
        dispatch(logout())
        localStorage.removeItem("token");
        setShowPopup(false);
        toast.success("Logged out successfully");
        navigate("/")
    }
    // useEffect(() => {
    //     if (window.location.pathname !== "/search") {
    //         setSearchQuery(null);
    //     }
    //     return () => {
    //         if (window.location.pathname !== "/") {
    //             setShowPopup(false);
    //         }
    //     };
    // }, [window.location.pathname]);

    useEffect(() => {
        // clear search input when leaving search page
        if (!location.pathname.startsWith("/search")) {
            setSearchInput("");
        }
    }, [location.pathname]);

    return (
        <>
            <div className="sticky top-0 z-50 bg-white max-w-full flex justify-between items-center h-[70px] px-2 sm:px-[30px]  border-b drop-shadow-sm">
                <div className="flex gap-4 items-center relative">
                    <Link to={token ? "/home" : "/"}>
                        <div className="cursor-pointer">
                            <img src={logo} alt="logo" />
                        </div>
                    </Link>
                    <div
                        className={`relative max-sm:absolute max-sm:z-40 max-sm:top-16 sm:block ${showSearchBar ? " max-sm:block " : " max-sm:hidden "}`}>
                        <i className="fi fi-rr-search absolute text-lg top-1/2 -translate-y-1/2  ml-4 opacity-40 mt-0.5"></i>
                        <input
                            type="text"
                            disabled={isStartPage}
                            className={`bg-gray-100 focus:outline-none max-sm:w-[calc(100vw_-_70px)] rounded-full pl-12 p-2 
                             ${isStartPage ? "cursor-not-allowed opacity-50" : ""}`}
                            placeholder="Search"
                            // value={searchQuery ? searchQuery : ""}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        // onKeyDown={(e) => {
                        //     if (isStartPage) return;
                        //     if (e.code == "Enter" || e.code == "NumpadEnter" || e.keyCode == "13") {
                        //         const value = searchQuery.trim();
                        //         if (!value || value.length < 2) {
                        //             toast.error("Please enter a valid search term");
                        //             return;
                        //         }
                        //         setShowSearchBar(false);
                        //         navigate(`/search?q=${value}`);
                        //     }
                        // }}
                        />
                        {isStartPage && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-sm px-3 py-1 rounded-md whitespace-nowrap z-50">
                                Login to enable search
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-5 justify-center items-center ">
                    {token && (
                        <div className="relative mt-1">
                            <i
                                className="fi fi-rr-bell cursor-pointer text-2xl mt-1"
                                onClick={() => navigate("/notifications")}
                            />
                            {hasUnread && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                            )}
                        </div>
                    )}

                    <i
                        className="fi fi-rr-search text-2xl mt-1 sm:hidden cursor-pointer"
                        onClick={() => setShowSearchBar((prev) => !prev)}
                    ></i>
                    <Link
                        to={token ? "/add-blog" : "/signin?redirect=/add-blog"}
                    >                        <div className=" flex gap-2 items-center">
                            <i className="fi fi-rr-edit text-2xl mt-1"></i>
                            <span className="text-xl hidden sm:inline">write</span>
                        </div>
                    </Link>
                    {
                        token ? (
                            <div className="w-10 h-10 cursor-pointer aspect-square rounded-full overflow-hidden" onClick={() => setShowPopup((prev) => !prev)}>
                                <img src={profilePic ? profilePic : `https://api.dicebear.com/9.x/initials/svg?seed=${name}`} alt="" className="rounded-full w-full h-full object-cover" />
                            </div >
                        ) : (<div className="flex gap-2">
                            <Link to={"/signup"}>
                                <button className="bg-gray-800 px-6 py-3 text-white rounded-full hover:bg-gray-900 transition shadow-md hover:shadow-lg">Signup</button>
                            </Link>
                            <Link to={"/signin"}>
                                <button className="border px-6 py-3 rounded-full border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition shadow-sm hover:shadow-md">Signin</button>
                            </Link>
                        </div>)

                    }
                </div >
                {
                    showPopup ? (
                        <div
                            onMouseLeave={() => setShowPopup(false)}
                            className="w-[150px] bg-gray-50 border absolute z-40 right-2 drop-shadow-md top-14 rounded-xl" >
                            <Link to={`/@${username}`}>
                                <p className="popup rounded-t-xl flex items-center gap-2">
                                    <i className="fi fi-rr-user mt-1"></i>Profile</p>
                            </Link>
                            <Link to={"/setting"}>
                                <p className="popup flex items-center gap-2">
                                    <i className="fi fi-rr-settings mt-1"></i>Setting</p>
                            </Link>
                            <hr className="my-1 border-gray-200" />
                            <p className="popup rounded-b-xl flex items-center gap-2 hover:bg-red-400" onClick={handleLogout}>
                                <i className="fi fi-rr-sign-out-alt mt-1"></i>Logout
                            </p>
                        </div >) : null
                }
            </div >
            <Outlet />
        </>
    )
}
export default Navbar
