import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DisplayBlogs from "./DisplayBlogs";
import usePagination from "../hooks/usePagination";
import useDebounce from "../hooks/useDebounce";

function SearchBlogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tag } = useParams();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // const q = searchParams.get("q")?.trim() || "";
  const rawQuery = searchParams.get("q") || "";
  const q = useDebounce(rawQuery, 400);

  useEffect(() => {
    setPage(1);
  }, [q, tag]);

  const query = tag
    ? { tag: tag.toLowerCase().replace(" ", "-") }
    : q
      ? { search: q }
      : null;

  const paginationKey = "search-blogs";

  const { blogs, hasMore, loading } = usePagination(paginationKey, query, 1, page);
  return (
    <div className="w-full p-5 sm:w-[80%] md:w-[60%] lg:w-[55%] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 rounded-3xl bg-black text-white px-4 py-2 mb-4 hover:bg-gray-900 transition
"
      >
        <i className="fi-sr-arrow-circle-left text-base mt-1"></i>
        <span className="leading-none">Go Back</span>
      </button>
      <h1 className="my-10 text-4xl text-gray-500 font-bold ">
        Results for <span className="text-black">{tag ? tag : q}</span>
      </h1>
      {loading && page === 1 && (
        <p className="text-gray-400 text-center mt-10">Searching…</p>
      )}

      {/* results */}
      {!loading && blogs.length > 0 && <DisplayBlogs blogs={blogs} />}

      {/* no results */}
      {!loading && blogs.length === 0 && (
        <p className="text-gray-500 text-xl mt-10 text-center">
          No results found
        </p>
      )}
      {hasMore && !loading && (
        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="rounded-3xl mx-auto bg-black text-white px-7 py-2"
        >
          Load more
        </button>
      )}
    </div>
  );
}

export default SearchBlogs;