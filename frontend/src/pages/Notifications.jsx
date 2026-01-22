import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { markNotificationRead } from "../utils/getNotification";

/* ---------- helpers ---------- */

function formatTime(date) {
  return new Date(date).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isThisWeek(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  return diff < 7 * 24 * 60 * 60 * 1000 && !isToday(date);
}

/* merge same notification */
function mergeNotifications(list) {
  const map = new Map();

  list.forEach((n) => {
    if (!n.sender) return;

    let key = n.type;

    if (n.type === "like" || n.type === "comment") {
      key = `${n.type}-${n.blog?._id}`;
    }
    if (n.type === "follow") {
      key = `follow-${n.sender._id}`;
    }

    if (!map.has(key)) {
      map.set(key, n);
    } else {
      const existing = map.get(key);
      if (new Date(n.createdAt) > new Date(existing.createdAt)) {
        map.set(key, { ...existing, createdAt: n.createdAt });
      }
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/* ---------- component ---------- */

function Notifications() {
  const { token } = useSelector((state) => state.user);

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function fetchNotifications() {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/notifications`,
          {
            params: { limit: 6, page },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setNotifications((prev) => [...prev, ...res.data.notifications]);
        setHasMore(res.data.hasMore);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [page, token]);

  async function handleClick(id) {
    await markNotificationRead(id, token);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  }

  const mergedNotifications = useMemo(
    () => mergeNotifications(notifications),
    [notifications]
  );

  function renderNotification(n) {
    const link =
      n.type === "follow"
        ? `/@${n.sender?.username}`
        : `/blog/${n.blog?.blogId}`;

    return (
      <Link key={n._id} to={link} onClick={() => handleClick(n._id)}>
        <div
          className={`relative flex items-center gap-2 p-4 rounded-xl border
          ${!n.isRead
            ? "bg-blue-50 border-blue-200"
            : "bg-white border-gray-200"}
          hover:shadow-md transition`}
        >
          <img
            src={
              n.sender?.profilePic ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${n.sender?.name || "U"}`
            }
            className="w-10 h-10 rounded-full object-cover"
          />

          <div className="text-sm leading-snug">
            <strong>{n.sender?.name || "Deleted user"}</strong>{" "}
            {n.type === "follow" && "started following you"}
            {n.type === "like" && "liked your blog"}
            {n.type === "comment" && "commented on your blog"}
          </div>

          <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">
            {formatTime(n.createdAt)}
          </span>
        </div>
      </Link>
    );
  }

  if (!token) return <Navigate to="/" />;

  return (
    <div className="max-w-[600px] mx-auto p-5 relative">
      <h1 className="text-2xl font-semibold mb-6">Notifications</h1>

      {mergedNotifications.length === 0 && !loading && (
        <p className="text-gray-500 text-center">No notifications yet</p>
      )}

      {/* TODAY */}
      {mergedNotifications.some((n) => isToday(n.createdAt)) && (
        <p className="text-xs font-semibold text-gray-500 mb-2">TODAY</p>
      )}

      <div className="space-y-3">
        {mergedNotifications
          .filter((n) => isToday(n.createdAt))
          .map(renderNotification)}
      </div>

      {/* THIS WEEK */}
      {mergedNotifications.some((n) => isThisWeek(n.createdAt)) && (
        <p className="text-xs font-semibold text-gray-500 mt-6 mb-2">
          THIS WEEK
        </p>
      )}

      <div className="space-y-3">
        {mergedNotifications
          .filter((n) => isThisWeek(n.createdAt))
          .map(renderNotification)}
      </div>

      {hasMore && (
        <>
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              className="px-6 py-2 rounded-full border text-sm hover:bg-gray-100 transition"
            >
              {loading ? "Loading..." : "Load older notifications"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Notifications;
