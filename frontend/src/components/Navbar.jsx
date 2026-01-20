import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom"
import logo from "../../public/logo.jpg"
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../utils/userSlice.js";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebase.js";
import socket from "../utils/socket";

function Navbar() {
    const { token, name, profilePic, username, id: userId } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const [searchQuery, setSearchQuery] = useState(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const location = useLocation();
    const isStartPage = location.pathname === "/" || location.pathname === "/signin" || location.pathname === "/signup";

    const dispatch = useDispatch()
    async function handleLogout() {
        await signOut(auth);
        dispatch(logout())
        localStorage.removeItem("token");
        setShowPopup(false);
        toast.success("Logged out successfully");
        navigate("/")
    }
    useEffect(() => {
        if (window.location.pathname !== "/search") {
            setSearchQuery(null);
        }
        return () => {
            if (window.location.pathname !== "/") {
                setShowPopup(false);
            }
        };
    }, [window.location.pathname]);
    useEffect(() => {
        if (!userId || socket.connected) return;
        socket.connect();
        socket.emit("join", userId);
        return () => {
            socket.disconnect();
        };
    }, [userId]);

    // 🔔 listen for notifications
    useEffect(() => {
        const handler = (data) => {
            if (!data?.sender?.name) return;

            toast.success(
                data.type === "follow"
                    ? `${data.sender.name} followed you`
                    : data.type === "like"
                        ? `${data.sender.name} liked your blog`
                        : `${data.sender.name} commented on your blog`
            );
        };
        socket.on("notification", handler);
        return () => socket.off("notification", handler);
    }, []);
    return (
        <>
            <div className="sticky top-0 z-50 bg-white max-w-full flex justify-between items-center h-[70px] px-2 sm:px-[30px]  border-b drop-shadow-sm">
                <div className="flex gap-4 items-center relative">
                    <Link to={token ? "/home" : "/"}>
                        <div className="">
                            <img src={logo} alt="" />
                        </div>
                    </Link>
                    <div
                        className={`relative group  max-sm:absolute max-sm:z-40 max-sm:top-16 sm:block ${showSearchBar ? " max-sm:block " : " max-sm:hidden "
                            }`}>
                        <i className="fi fi-rr-search absolute text-lg top-1/2 -translate-y-1/2  ml-4 opacity-40"></i>
                        <input
                            type="text"
                            disabled={isStartPage}
                            className={`bg-gray-100 focus:outline-none max-sm:w-[calc(100vw_-_70px)] rounded-full pl-12 p-2 
                             ${isStartPage ? "cursor-not-allowed opacity-50" : ""}
                             `}
                            placeholder="Search"
                            value={searchQuery ? searchQuery : ""}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (isStartPage) return;
                                if (e.code == "Enter" || e.code == "NumpadEnter" || e.keyCode == "13") {
                                    if (searchQuery.trim()) {
                                        navigate(`/search?q=${searchQuery.trim()}`);
                                        setShowSearchBar(false);
                                        if (showSearchBar) {
                                            setSearchQuery("");
                                        }
                                    }
                                }
                            }}
                        />
                        {isStartPage && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-sm px-3 py-1 rounded-md whitespace-nowrap z-50">
                                Login to enable search
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-5 justify-center items-center">
                    <i
                        className="fi fi-rr-bell cursor-pointer"
                        onClick={() => navigate("/notifications")}
                    />
                    <i
                        className="fi fi-rr-search text-xl sm:hidden cursor-pointer"
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
                            </div>
                        ) : (<div className="flex gap-2">
                            <Link to={"/signup"}>
                                <button className="bg-gray-800 px-6 py-3 text-white rounded-full hover:bg-gray-900 transition shadow-md hover:shadow-lg">Signup</button>
                            </Link>
                            <Link to={"/signin"}>
                                <button className="border px-6 py-3 rounded-full border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition shadow-sm hover:shadow-md">Signin</button>
                            </Link>
                        </div>)

                    }
                </div>
                {
                    showPopup ? (
                        <div
                            onMouseLeave={() => setShowPopup(false)}
                            className="w-[150px] bg-gray-50 border absolute z-40 right-2 drop-shadow-md top-14 rounded-xl">
                            <Link to={`/@${username}`}>
                                <p className="popup rounded-t-xl">Profile</p>
                            </Link>
                            <Link to={`/edit-profile`}>
                                <p className="popup ">Edit Profile</p>
                            </Link>
                            <Link to={"/setting"}>
                                <p className="popup"> Setting</p>
                            </Link>
                            <p className="popup rounded-b-xl" onClick={handleLogout}>
                                Logout
                            </p>
                        </div>) : null
                }
            </div>
            <Outlet />
        </>
    )
}
export default Navbar
