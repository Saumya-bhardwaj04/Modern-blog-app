import axios from "axios";

export async function fetchNotifications(token) {
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/notifications`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.notifications;
}

export async function markNotificationRead(id, token) {
  await axios.patch(
    `${import.meta.env.VITE_BACKEND_URL}/notifications/${id}/mark-as-read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}
