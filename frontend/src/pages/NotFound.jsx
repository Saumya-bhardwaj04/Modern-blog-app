import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center">
<div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mb-6">
            <span className="text-2xl font-bold">!</span>
          </div>
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <span className="text-gray-500 mb-6">Page not found</span>

      <button
        onClick={() => navigate(-1)}
        className="rounded-3xl bg-black text-white px-6 py-2"
      >
        Return to home
      </button>
    </div>
  );
}
