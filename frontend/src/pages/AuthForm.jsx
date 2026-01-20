import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../utils/userSlice";
import Input from "../components/Input";
import googleIcon from "../assets/google-icon-logo-svgrepo-com.svg";
import { googleAuth, handleRedirectResult } from "../utils/firebase";
import { getMessaging, getToken } from "firebase/messaging";

function AuthForm({ type }) {
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [googleLoading, setGoogleLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handled = useRef(false);
    const toastShown = useRef(false);
    const messaging = getMessaging();

    useEffect(() => {
        if (location.state?.toast) {
            toast.success(location.state.toast);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    async function handleAuthForm(e) {
        e.preventDefault();
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/${type}`,
                userData
            );

            if (type === "signup") {
                toast.success(res.data.message);
                navigate("/signin");
            } else {
                dispatch(login(res.data.user));
                toast.success(res.data.message);
                await registerFcmToken(res.data.user.token);
                const redirectTo =
                    new URLSearchParams(location.search).get("redirect") || "/home";
                navigate(redirectTo);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setUserData({ name: "", email: "", password: "" });
        }
    }
    async function handleGoogleAuth() {
        if (googleLoading) return;
        setGoogleLoading(true);
        try {
            const user = await googleAuth();
            if (!user) return;

            const idToken = await user.getIdToken();
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/google-auth`,
                { accessToken: idToken }
            );

            dispatch(login(res.data.user));
            if (!toastShown.current) {
                toast.success(res.data.message);
                toastShown.current = true;
            }
            await registerFcmToken(res.data.user.token);
            const redirectTo =
                new URLSearchParams(location.search).get("redirect") || "/home";
            navigate(redirectTo);
        } catch (error) {
            toast.error(error.response?.data?.message || "Google authentication failed");
            if (type === "signup") {
                setTimeout(() => {
                    navigate("/signin");
                }, 1200);
            }
        } finally {
            setGoogleLoading(false);
        }
    }
    async function registerFcmToken(authToken) {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const messaging = getMessaging();

            const fcmToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            });

            if (fcmToken) {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/save-fcm-token`,
                    { token: fcmToken },
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );
            }
        } catch (err) {
            console.error("FCM registration failed:", err.message);
        }
    }


    useEffect(() => {
        async function handleRedirect() {
            if (handled.current) return;
            const user = await handleRedirectResult();
            if (!user) return;
            if (handled.current) return;
            handled.current = true;
            try {
                const idToken = await user.getIdToken();
                const res = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/google-auth`,
                    { accessToken: idToken }
                );

                dispatch(login(res.data.user));
                if (!toastShown.current) {
                    toast.success(res.data.message);
                    toastShown.current = true;
                }
                const redirectTo =
                    new URLSearchParams(location.search).get("redirect") || "/home";

                navigate(redirectTo, { replace: true });
            } catch (error) {
                toast.error("Authentication failed");
            }
        }
        handleRedirect();
    }, [dispatch, navigate, location.search]);

    return (
        <div className="w-full h-[calc(100vh_-_100px)] flex items-center p-4 justify-center">
            <div className="bg-gray-200 p-4 rounded-xl mx-auto w-[400px] flex flex-col items-center justify-center gap-5 ">
                <h1 className="text-3xl">
                    {type == "signin" ? "Sign in" : "Sign up"}</h1>
                <form className="w-[100%] flex flex-col items-center gap-5" onSubmit={handleAuthForm}>
                    {type == "signup" && (
                        <Input type={"text"}
                            placeholder={"Enter your name"}
                            field={"name"}
                            value={userData.name}
                            setUserData={setUserData}
                            icon={"fi-sr-user"} />
                    )}
                    <Input type={"email"}
                        placeholder={"Enter your email"}
                        field={"email"}
                        value={userData.email}
                        setUserData={setUserData}
                        icon={"fi-sr-envelope"} />
                    <Input type={"password"}
                        placeholder={"Enter your password"}
                        field={"password"}
                        value={userData.password}
                        setUserData={setUserData}
                        icon={"fi-sr-lock"} />
                    <button
                        className="w-[100px] h-[50px] text-white text-xl p-2 rounded-md focus:outline-none bg-gray-900" >
                        {type == "signin" ? "Login" : "Register"}</button>
                </form>
                <p className="text-xl font-semibold">or</p>

                <div disabled={googleLoading} onClick={handleGoogleAuth} className={`bg-white border cursor-pointer hover:bg-blue-200 w-full flex gap-4 justify-center items-center overflow-hidden py-3 px-4 rounded-full ${googleLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-200"}`}>
                    <p className="text-2xl font-medium">{googleLoading ? "Signing you in..." : "Continue with"}</p>
                    <img className="w-8 h-8" src={googleIcon} alt="" />
                </div>
                {type == "signin" ? <p>Don't have an account? <Link to={"/signup"}>Sign up</Link></p> : <p>Already have a account? <Link to={"/signin"}>Sign in</Link></p>}
            </div>
        </div>

    )
}
export default AuthForm;