
function NotificationToast({ t, data }) {
    return (
        <div
            className="w-[320px] bg-white rounded-2xl shadow-xl border
                 flex items-start gap-3 p-3 cursor-pointer"
        >
            <img
                src={
                    data.sender?.profilePic ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${data.sender?.name || "U"}`
                }
                className="w-10 h-10 rounded-full object-cover"
                alt=""
            />

            {/* text */}
            <div className="flex flex-col text-sm leading-snug">
                <p className="font-medium">
                    {data.sender?.name || "Someone"}
                </p>
                <p className="text-gray-600">
                    {data.type === "follow" && "started following you"}
                    {data.type === "like" && "liked your blog"}
                    {data.type === "comment" && "commented on your blog"}
                </p>
                <span className="text-xs text-gray-400 mt-1">
                    just now
                </span>
            </div>
        </div>
    );
}

export default NotificationToast;
