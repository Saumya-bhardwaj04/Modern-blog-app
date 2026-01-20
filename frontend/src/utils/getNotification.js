import axios from "axios";

export async function fetchNotifications(token) {
  const res = await axios.patch(
    `${import.meta.env.VITE_BACKEND_URL}/notifications/${n._id}/mark-as-read`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data.notifications;
}
