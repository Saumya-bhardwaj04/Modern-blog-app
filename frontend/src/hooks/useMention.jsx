import { useEffect, useState } from "react";
import axios from "axios";

export function useMentions(text, token) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentionBox, setShowMentionBox] = useState(false);

  // detect @
  useEffect(() => {
    const match = text.match(/(?:^|\s)@(\w*)$/);
    if (!match) {
      setShowMentionBox(false);
      setMentionQuery("");
      return;
    }
    setMentionQuery(match[1]);
  }, [text]);

  // fetch users
  useEffect(() => {
    if (!mentionQuery) return;

    axios
      .get(
        `${import.meta.env.VITE_BACKEND_URL}/users/search?q=${mentionQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : [];
        setMentionUsers(users);
        setShowMentionBox(users.length > 0);
      });
  }, [mentionQuery, token]);

  return { mentionUsers, showMentionBox };
}
