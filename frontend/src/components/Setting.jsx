import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { logout, updateData } from "../utils/userSlice";

function Setting() {
  const {
    token,
    id: userId,
    showLikedBlogs,
    showSavedBlogs,
  } = useSelector((state) => state.user);
  const [data, setData] = useState({
    showLikedBlogs,
    showSavedBlogs,
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  async function handleVisibility() {
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL
        }/change-saved-liked-blog-visibility`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      dispatch(updateData(["visibility", data]));
      toast.success(res.data.message);
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  }
  async function handleDeleteAccount() {
    const confirmText = prompt(
      "Type DELETE to permanently delete your account"
    );
    if (confirmText !== "DELETE") {
      toast.error("Account deletion cancelled. try again.");
      return;
    }
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message);
      localStorage.clear();
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  }

  return token == null ? (
    <Navigate to={"/"} />
  ) : (
    <div className="pt-[72px] min-h-[calc(100vh-72px)] w-full p-5 md:w-[800px] mx-auto flex flex-col items-center md:justify-center ">
      <div className="w-full">
        <h1 className=" mt-4 mb-8 text-2xl font-semibold ">Settings</h1>
      </div>
      <div className="my-4 w-full">
        <h2 className="text-2xl font-semibold my-2">Show Saved Blogs ?</h2>
        <select
          value={data.showSavedBlogs}
          name=""
          id=""
          className="w-full p-3 rounded-lg border text-lg focus:outline-none"
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              showSavedBlogs: e.target.value == "true" ? true : false,
            }))
          }
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>
      <div className="my-4 w-full">
        <h2 className="text-2xl font-semibold my-2">Show Liked Blogs ?</h2>
        <select
          value={data.showLikedBlogs}
          name=""
          id=""
          className="w-full p-3 rounded-lg border text-lg focus:outline-none"
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              showLikedBlogs: e.target.value == "true" ? true : false,
            }))
          }
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>
      <button
        className="bg-blue-500 text-lg py-4 px-7 rounded-full  font-semibold text-white my-6 "
        onClick={handleVisibility}
      >
        Update
      </button>
      <hr className="my-6" />
      <div className="border border-red-500 p-6 rounded-lg">
        <h2 className="text-red-600 text-xl font-bold mb-3">
          Danger Zone
        </h2>
        <p className="text-gray-700 mb-4">
          Deleting your account will permanently remove:
          <br />• Your profile
          <br />• All blogs you created
          <br />• Likes, followers & comments
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Setting;