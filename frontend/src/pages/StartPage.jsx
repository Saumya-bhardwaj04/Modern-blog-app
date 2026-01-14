import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function StartPage() {
  const { token } = useSelector((state) => state.user);
  return (
    <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-white to-gray-100">
      <h1 className="text-4xl md:text-6xl font-bold leading-tight text-gray-900">
        Where <span className="text-blue-600">ideas</span> meet{" "}
        <span className="text-blue-600">words</span>
      </h1>
      <p className="mt-6 text-gray-700 text-lg max-w-2xl">
        Read thoughtful blogs, share your knowledge, and grow with a community
        of curious minds.
      </p>
      <div className="mt-10 flex gap-4 flex-wrap justify-center">
        <Link to={token ? "/home" : "/signup"}>
          <button className="px-8 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            Start Reading
          </button>
          <i className="fa-solid fa-arrow-right-long"></i>
        </Link>
        <Link
          to={token ? "/add-blog" : "/signin?redirect=/add-blog"}
        >
          <button className="px-8 py-3 rounded-full border border-blue-600 text-blue-600 font-medium hover:bg-blue-600 hover:text-white transition shadow-sm hover:shadow-md">
            Start Writing
          </button>
        </Link>
      </div>
    </div>
  );
}

export default StartPage;
