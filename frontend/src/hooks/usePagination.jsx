import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useLoader from "./useLoader";

function usePagination(path, queryParams = {}, limit = 1, page = 1,options = {}) {
  const [hasMore, setHasMore] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();
  const [isLoading, startLoading, stopLoading] = useLoader();
  useEffect(() => {
    async function fetchSeachBlogs() {
      try {
        startLoading();
        let res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/${path}`,
          {
            params: { ...queryParams, limit, page },
            ...options,
          }
        );
        const items = res.data.notifications || res.data.blogs || [];

        setBlogs((prev) => [...prev, ...items]);
        setHasMore(res?.data?.hasMore);
      } catch (error) {
        navigate(-1);
        setBlogs([]);
        toast.error(error?.response?.data?.message);
        setHasMore(false);
      } finally {
        stopLoading();
      }
    }
    fetchSeachBlogs();
  }, [page]);

  return { blogs, setBlogs, hasMore, isLoading };
}

export default usePagination;