import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { fetchNotifications, markNotificationRead } from "../utils/getNotification";

/* ---------------- helpers ---------------- */

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(list) {
  const today = [];
  const lastWeek = [];
  const older = [];

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  list.forEach((n) => {
    const d = new Date(n.createdAt);
    if (d.toDateString() === now.toDateString()) today.push(n);
    else if (d > weekAgo) lastWeek.push(n);
    else older.push(n);
  });

  return { today, lastWeek, older };
}

/* -------- MERGE FOLLOW + LIKE + COMMENT -------- */

function mergeNotifications(notifications) {
  const map = {};
  const result = [];

  notifications.forEach((n) => {
    if (!n.sender) return;

    let key = n.type;

    if (n.type === "like" || n.type === "comment") {
      key = `${n.type}-${n.blog?._id}`;
    }

    if (!map[key]) {
      map[key] = {
        ...n,
        senders: [n.sender],
      };
    } else {
      map[key].senders.push(n.sender);
      map[key].isRead = map[key].isRead && n.isRead;

      if (new Date(n.createdAt) > new Date(map[key].createdAt)) {
        map[key].createdAt = n.createdAt;
      }
    }
  });

  Object.values(map).forEach((n) => result.push(n));

  return result.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/* ---------------- component ---------------- */

function Notifications() {
  const { token } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;

    // fetch last 12 notifications only
    fetchNotifications(token).then((res) => {
      const list = res.notifications || [];
      setNotifications(list.slice(0, 12));
    });
  }, [token]);

  const merged = useMemo(
    () => mergeNotifications(notifications),
    [notifications]
  );

  const { today, lastWeek, older } = useMemo(
    () => groupByDate(merged),
    [merged]
  );

  async function handleClick(id) {
    await markNotificationRead(id, token);
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  }

  if (!token) return <Navigate to="/" />;

  const Section = ({ title, items }) =>
    items.length > 0 && (
      <>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mt-6 mb-3">
          {title}
        </h3>

        <div className="space-y-3">
          {items.map((n) => {
            const firstSender = n.senders?.[0] || n.sender;
            const extra = (n.senders?.length || 1) - 1;

            const link =
              n.type === "follow"
                ? `/@${firstSender.username}`
                : `/blog/${n.blog?.blogId}`;

            return (
              <Link key={n._id} to={link} onClick={() => handleClick(n._id)}>
                <div
                  className={`relative flex gap-3 p-4 rounded-xl border transition
                  ${
                    !n.isRead
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }
                  hover:shadow-md`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                    {firstSender.name[0]}
                  </div>

                  {/* Center message */}
                  <div className="flex-1 flex items-center justify-center text-center text-sm px-2">
                    <span>
                      <strong>{firstSender.name}</strong>
                      {extra > 0 && <> and {extra} others</>}{" "}
                      {n.type === "follow" && "started following you"}
                      {n.type === "like" && "liked your blog"}
                      {n.type === "comment" && "commented on your blog"}
                    </span>
                  </div>

                  {/* Time */}
                  <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                    {formatTime(n.createdAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </>
    );

  return (
    <div className="max-w-[600px] mx-auto p-5">
      <h1 className="text-2xl font-semibold mb-6">Notifications</h1>

      {merged.length === 0 && (
        <p className="text-center text-gray-500">
          No notifications yet
        </p>
      )}

      <Section title="Today" items={today} />
      <Section title="Last week" items={lastWeek} />
      <Section title="Older" items={older} />
    </div>
  );
}

export default Notifications;
