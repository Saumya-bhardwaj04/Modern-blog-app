import axios from "axios";

export async function fetchNotifications(token, page = 1, limit = 5) {
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/notifications`,
    {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
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
