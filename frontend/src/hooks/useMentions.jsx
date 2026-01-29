import { useEffect, useState } from "react";
import axios from "axios";

export function useMentions(text, token) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentionBox, setShowMentionBox] = useState(false);
  const [loading, setLoading] = useState(false);

  // detect @
  useEffect(() => {
    const match = text.match(/(?:^|\s)@(\w*)$/);
    if (!match) {
      setShowMentionBox(false);
      setMentionQuery("");
      return;
    }
    console.log("MENTION QUERY:", match[1]); // 👈 ADD THIS
    setMentionQuery(match[1]);
    setShowMentionBox(true);
  }, [text]);

  // fetch users
  useEffect(() => {
    if (!mentionQuery) return;
    console.log("FETCHING USERS FOR:", mentionQuery);
    setLoading(true);

    axios
      .get(
        `${import.meta.env.VITE_BACKEND_URL}/mention/user?q=${mentionQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        console.log("USERS FOUND:", res.data);

        const users = Array.isArray(res.data)
          ? res.data
          : [];

        setMentionUsers(users);
      })
      .catch(() => setMentionUsers([]))
      .finally(() => setLoading(false));


  }, [mentionQuery, token]);

  return { mentionUsers, showMentionBox, loading };
}
