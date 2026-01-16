import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../utils/userSlice";
import Input from "../components/Input";
import googleIcon from "../assets/google-icon-logo-svgrepo-com.svg";
import { googleAuth } from "../utils/firebase";
import { auth } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

function AuthForm({ type }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authHandled = useRef(false);
  async function handleAuthForm(e) {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/${type}`,
        formData
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
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setFormData({ name: "", email: "", password: "" });
    }
  }
  async function handleGoogleAuth() {
    try {
      await googleAuth();
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Google authentication failed");
    }
  }
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || authHandled.current) return;

      authHandled.current = true;

      try {
        const idToken = await user.getIdToken();

        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/google-auth`,
          { accessToken: idToken }
        );

        dispatch(login(res.data.user));
        toast.success(res.data.message);

        const redirectTo =
          new URLSearchParams(location.search).get("redirect") || "/home";

        navigate(redirectTo, { replace: true });
      } catch (error) {
        console.error("Google redirect error:", error);
        toast.error("Authentication failed");
      }
    });

    return () => unsubscribe();
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
                            setUserData={setUserData}
                            field={"name"}
                            value={userData.name}
                            icon={"fi-sr-user"} />
                    )}
                    <Input type={"email"}
                        placeholder={"Enter your email"}
                        setUserData={setUserData}
                        field={"email"}
                        value={userData.email}
                        icon={"fi-sr-envelope"} />
                    <Input type={"password"}
                        placeholder={"Enter your password"}
                        setUserData={setUserData}
                        field={"password"}
                        value={userData.password}
                        icon={"fi-sr-lock"} />
                    <button
                        className="w-[100px] h-[50px] text-white text-xl p-2 rounded-md focus:outline-none bg-gray-900" >
                        {type == "signin" ? "Login" : "Register"}</button>
                </form>
                <p className="text-xl font-semibold">or</p>
                <div onClick={handleGoogleAuth} className="bg-white border cursor-pointer hover:bg-blue-200 w-full flex gap-4 justify-center items-center overflow-hidden py-3 px-4 rounded-full">
                    <p className="text-2xl font-medium">continue with</p>
                    <div className="">
                        <img className="w-8 h-8" src={googleIcon} alt="" />
                    </div>
                </div>
                {type == "signin" ? <p>Don't have an account? <Link to={"/signup"}>Sign up</Link></p> : <p>Already have a account? <Link to={"/signin"}>Sign in</Link></p>}
            </div>
        </div>

    )
}
export default AuthForm
