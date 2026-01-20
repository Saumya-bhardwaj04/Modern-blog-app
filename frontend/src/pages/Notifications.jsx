import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchNotifications } from "../utils/getNotification";
import { Link } from "react-router-dom";

function Notifications() {
  const { token } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications(token).then(setNotifications);
  }, [token]);

  return (
    <div className="max-w-[600px] mx-auto p-5">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

      {notifications.length === 0 && <p>No notifications yet</p>}

      {notifications.map((n) => (
        <Link
          key={n._id}
          to={n.blog ? `/blog/${n.blog._id}` : `/@${n.sender.username}`}
        >
          <div className={`p-3 border-b ${!n.isRead ? "bg-blue-50" : ""}`}>
            <p className="font-medium">
              {n.sender?.name}{" "}
              {n.type === "follow" && "started following you"}
              {n.type === "like" && "liked your blog"}
              {n.type === "comment" && "commented on your blog"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default Notifications;
