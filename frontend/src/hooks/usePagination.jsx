import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useLoader from "./useLoader";

function usePagination(path, queryParams = {}, limit = 1, page = 1) {
  const [hasMore, setHasMore] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();
  const [loading, startLoading, stopLoading] = useLoader();

  useEffect(() => {
    setBlogs([]);
    setHasMore(true);
  }, [path, JSON.stringify(queryParams)]);

  useEffect(() => {
    async function fetchSeachBlogs() {
      try {
        startLoading();
        let res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/${path}`,
          {
            params: { ...queryParams, limit, page },
          }
        );
        setBlogs((prev) => page === 1 ? res.data.blogs : [...prev, ...res.data.blogs]);
        setHasMore(res?.data?.hasMore);
      } catch (error) {
        navigate(-1);
        setBlogs([]);
        toast.error(error?.response?.data?.message || "Something went wrong");
        setHasMore(false);
      } finally {
        stopLoading();
      }
    }
    fetchSeachBlogs();
  }, [page, path, JSON.stringify(queryParams)]);

  return { blogs, setBlogs, hasMore, isLoading: loading };
}

export default usePagination;