import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchNotifications, markNotificationRead } from "../utils/getNotification";
import { Link } from "react-router-dom";

function Notifications() {
  const { token } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetchNotifications(token).then(setNotifications);
  }, [token]);

  async function handleClick(id) {
    await markNotificationRead(id, token);
  }

  return token == null ? (
    <Navigate to={"/"} />
  ) : (<div className="max-w-[600px] mx-auto p-5">
    <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

    {notifications.length === 0 && <p>No notifications yet</p>}

    {notifications.map((n) => {
      const link =
        n.type === "follow"
          ? `/@${n.sender.username}`
          : `/blog/${n.blog?.blogId}`;

      return (
        <Link key={n._id} to={link} onClick={() => handleClick(n._id)}>
          <div
            className={`p-3 border-b cursor-pointer ${!n.isRead ? "bg-blue-50" : ""
              }`}
          >
            <p className="font-medium">
              <strong>{n.sender?.name}</strong>{" "}
              {n.type === "follow" && "started following you"}
              {n.type === "like" && "liked your blog"}
              {n.type === "comment" && "commented on your blog"}
            </p>
          </div>
        </Link>
      );
    })}
  </div>
  );
}

export default Notifications;
