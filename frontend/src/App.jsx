import { Routes, Route, useNavigate } from "react-router-dom";
import AuthForm from "./pages/AuthForm";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import AddBlog from "./pages/Add blog";
import BlogPage from "./pages/BlogPage";
import VerifyUser from "./components/VerifyUser";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import SearchBlogs from "./components/SearchBlogs";
import Setting from "./components/Setting";
import StartPage from "./pages/StartPage";
import { useEffect } from "react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "./utils/firebase";
import axios from "axios";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/google-auth`,
            { token: idToken },
            { withCredentials: true }
          );
          navigate("/home");
        }
      } catch (err) {
        console.error("Redirect error:", err);
      }
    };
    checkRedirect();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<StartPage />} />
        <Route path="/home" element={<HomePage />}></Route>
        <Route path="/signin" element={<AuthForm type={"signin"} />}></Route>
        <Route path="/signup" element={<AuthForm type={"signup"} />}></Route>
        <Route path="/add-blog" element={<AddBlog />}></Route>
        <Route path="/blog/:id" element={<BlogPage />}></Route>
        <Route path="/edit/:id" element={<AddBlog />}></Route>
        <Route path="/search" element={<SearchBlogs />}></Route>
        <Route path="/tag/:tag" element={<SearchBlogs />}></Route>
        <Route path="/verify-email/:verificationToken" element={<VerifyUser />}></Route>
        <Route path="/:username" element={<ProfilePage />}></Route>
        <Route path="/:username/saved-blogs" element={<ProfilePage />}></Route>
        <Route path="/:username/liked-blogs" element={<ProfilePage />}></Route>
        <Route path="/:username/draft-blogs" element={<ProfilePage />}></Route>
        <Route path="/edit-profile" element={<EditProfile />}></Route>
        <Route path="/setting" element={<Setting />} />
      </Route>
    </Routes>
  );
}

export default App;