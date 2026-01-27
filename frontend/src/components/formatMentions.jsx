import { Link } from "react-router-dom";

export function formatMentions(text = "") {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const username = part.slice(1);
      return (
        <Link
          key={i}
          to={`/@${username}`}
          className="text-blue-700 font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
