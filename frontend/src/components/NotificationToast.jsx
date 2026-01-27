
function NotificationToast({ t, data }) {
    return (
        <div className="w-[300px] min-h-[80px] bg-white rounded-2xl shadow-xl border
     flex items-center gap-4 px-4 py-3 cursor-pointer">

            <img
                src={
                    data.sender?.profilePic ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${data.sender?.username || data.sender?.name || "U"}`
                }
                className="w-10 h-10 rounded-full object-cover"
                alt=""
            />

            {/* text */}
            <div className="flex flex-col leading-tight">
                <p className="font-semibold text-[15px]">
                    {data.sender?.name || "Someone"}
                </p>
                <p className="text-gray-700 text-[14px]">
                    {data.type === "follow" && "started following you"}
                    {data.type === "like" && "liked your blog"}
                    {data.type === "comment" && "commented on your blog"}
                    {data.type === "comment_like" && "liked your comment"}
                    {data.type === "comment_reply" && "replied to your comment"}
                </p>
                <span className="text-xs text-gray-400 mt-1">
                    just now
                </span>
            </div>

        </div>
    );
}

export default NotificationToast;
