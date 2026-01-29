import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../utils/userSlice";
import Input from "../components/Input";
import googleIcon from "../assets/google-icon-logo-svgrepo-com.svg";
import { googleAuth, handleRedirectResult } from "../utils/firebase";
import { messaging, getToken } from "../utils/firebase";

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
                const redirectTo =
                    new URLSearchParams(location.search).get("redirect") || "/home";
                navigate(redirectTo);
                setTimeout(() => {
                    registerFcmToken(res.data.user.token);
                }, 0);
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
            const redirectTo =
                new URLSearchParams(location.search).get("redirect") || "/home";
            navigate(redirectTo);
            setTimeout(() => {
                registerFcmToken(res.data.user.token);
            }, 0);
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
    // async function registerFcmToken(authToken) {
    //     try {
    //         if (!("Notification" in window)) return;
    //         const permission = await Notification.requestPermission();
    //         if (permission !== "granted") return;

    //         const fcmToken = await getToken(messaging, {
    //             vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    //         });

    //         if (fcmToken) {
    //             await axios.post(
    //                 `${import.meta.env.VITE_BACKEND_URL}/save-fcm-token`,
    //                 { token: fcmToken },
    //                 {
    //                     headers: { Authorization: `Bearer ${authToken}` },
    //                 }
    //             );
    //         }
    //     } catch (err) {
    //         console.error("FCM registration failed:", err.message);
    //     }
    // }

    async function registerFcmToken(authToken) {
        // Bail early if no auth (user not logged in)
        if (!authToken) {
            console.warn('No auth token provided → skipping FCM registration');
            return;
        }

        try {
            // 1. Check if Notifications API is supported
            if (!('Notification' in window)) {
                console.warn('This browser does not support notifications');
                return;
            }

            // 2. Request permission
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            // if (permission !== 'granted') {
            //     console.warn(`Notification permission denied or dismissed (${permission})`);
            //     return;
            // }

            // 3. Refresh FCM token
            const fcmToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            });

            if (!fcmToken) {
                console.warn('No registration token available');
                return;
            }

            //store last sent token in localStorage to avoid duplicate POSTs
            // const lastSentToken = localStorage.getItem('last_fcm_token');
            // if (fcmToken === lastSentToken) {
            //     console.log('FCM token unchanged → skipping send');
            //     return;
            // }

            // 4. Send to backend
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/save-fcm-token`,
                { token: fcmToken },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // helps avoid spamming your backend with duplicate tokens
            localStorage.setItem('last_fcm_token', fcmToken);
            console.log('FCM token registered successfully');

        } catch (err) {
            console.error('FCM registration failed:', err);

            if (err.code) {
                // Common Firebase error codes
                switch (err.code) {
                    case 'messaging/token-unsubscribe-failed':
                    case 'messaging/registration-token-not-registered':
                        // Token expired/invalid → will be regenerated next time
                        localStorage.removeItem('last_fcm_token');
                        break;
                    case 'messaging/permission-blocked':
                        console.warn('User has permanently blocked notifications');
                        break;
                    default:
                    // network, invalid vapidKey, etc.
                }
            }
        }
    }

    useEffect(() => {
        async function handleRedirect() {
            if (handled.current) return;
            const user = await handleRedirectResult();
            if (!user) return;
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