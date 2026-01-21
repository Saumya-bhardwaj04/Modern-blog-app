import { useEffect,useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import usePagination from "../hooks/usePagination";
import { fetchNotifications, markNotificationRead } from "../utils/getNotification";

function Notifications() {
  const { token } = useSelector((state) => state.user);
  const [page, setPage] = useState(1);

  const {
    blogs: notifications,
    setBlogs: setNotifications,
    hasMore,
    isLoading,
  } = usePagination("notifications", {}, 5, page,token);

  async function handleClick(id) {
    await markNotificationRead(id, token);
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  }
  useEffect(() => {
    if (!token) return;

    fetchNotifications(token, page, 5).then((res) => {
      setNotifications((prev) => [...prev, ...res.notifications]);
    });
  }, [token, page]);
  if (!token) return <Navigate to="/" />;

  return (
    <div className="max-w-[600px] mx-auto p-5">
      <h1 className="text-2xl font-semibold mb-6">Notifications</h1>

      {notifications.length === 0 && !isLoading && (
        <p className="text-gray-500">No notifications yet</p>
      )}

      <div className="space-y-3 relative">
        {notifications.map((n) => {
          if (!n.sender) return null;

          const link =
            n.type === "follow"
              ? `/@${n.sender.username}`
              : `/blog/${n.blog?.blogId}`;

          return (
            <Link
              key={n._id}
              to={link}
              onClick={() => handleClick(n._id)}
            >
              <div
                className={`flex gap-3 p-4 rounded-xl border transition
                  ${!n.isRead
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200"
                  }
                  hover:shadow-md`}
              >
                <img
                  src={
                    n.sender.profilePic ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${n.sender.name}`
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="text-sm leading-snug">
                  <p>
                    <strong>{n.sender.name}</strong>{" "}
                    {n.type === "follow" && "started following you"}
                    {n.type === "like" && "liked your blog"}
                    {n.type === "comment" && "commented on your blog"}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {hasMore && (
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-sm px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-100 transition"
          >
            Load older notifications
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-4">
          <span className="loader"></span>
        </div>
      )}
    </div>
  );
}

export default Notifications;
