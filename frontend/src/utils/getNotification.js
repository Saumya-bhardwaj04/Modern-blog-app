import axios from "axios";

export async function fetchNotifications(token, page = 1, limit = 5) {
  const API = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;
  const res = await axios.get(
    `${API}/notifications`,
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
  const API = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;
  await axios.patch(
    `${API}/notifications/${id}/mark-as-read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}
