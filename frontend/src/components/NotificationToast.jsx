function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function NotificationToast({ t, data }) {
  const sender = {
    name:
      data?.sender?.name ||
      data?.senderName ||
      data?.sender?.username ||
      data?.senderUsername ||
      "User",

    username:
      data?.sender?.username ||
      data?.senderUsername ||
      "user",

    profilePic:
      data?.sender?.profilePic &&
      data.sender.profilePic.trim() !== ""
        ? data.sender.profilePic
        : null,
  };

  const initials = getInitials(sender.name);

  const avatarSrc = sender.profilePic
    ? sender.profilePic
    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        sender.name
      )}`;

  return (
    <div className="w-[300px] min-h-[80px] bg-white rounded-2xl shadow-xl border flex items-center gap-4 px-4 py-3 cursor-pointer">
      <img
        src={avatarSrc}
        alt={sender.name}
        className="w-10 h-10 rounded-full object-cover bg-gray-100"
        onError={(e) => {
          e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?seed=${initials}`;
        }}
      />

      <div className="flex flex-col leading-tight">
        <p className="font-semibold text-[15px]">
          {sender.name}
        </p>

        <p className="text-gray-700 text-[14px]">
          {{
            follow: "started following you",
            like: "liked your blog",
            comment: "commented on your blog",
            comment_like: "liked your comment",
            comment_reply: "replied to your comment",
            mention: "mentioned you in a comment",
            new_blog: "posted a new blog",
          }[data.type]}
        </p>

        <span className="text-xs text-gray-400 mt-1">
          just now
        </span>
      </div>
    </div>
  );
}

export default NotificationToast;
