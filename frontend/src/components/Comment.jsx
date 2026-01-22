import { useDispatch, useSelector } from "react-redux";
import { setIsOpen } from "../utils/commentSlice";
import { useState } from "react";
import axios from "axios";
import { deleteCommentAndReply, setCommentLikes, setComments, setReplies, setUpdatedComments } from "../utils/selectedBlogSlice";
import formateDate from "../utils/formateDate"
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

function Comment() {
  const dispatch = useDispatch()
  const [comment, setComment] = useState("")
  const [activeReply, setActieReply] = useState(null);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [currentEditComment, setCurrentEditComment] = useState(null);
  const { _id: blogId, comments, creator: { _id: creatorId } } = useSelector((state) => state.selectedBlog);
  const { token, id: userId } = useSelector((state) => state.user);
  async function handleComment() {
    try {
      let res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/blogs/comment/${blogId}`,
        {
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setComment("");
      dispatch(setComments(res.data.newComment));
      toast.success(res.data.message);
    } catch (error) {
      console.log(error.response.data.message);

    }
  }

  return (
    <div className="bg-white h-[calc(100vh-70px)] p-5 fixed top-[70px] right-0 w-[400px] border-l drop-shadow-xl overflow-y-scroll z-40">
      <div className="flex justify-between">
        <h1 className="text-xl font-medium">
          Comment ({comments?.length || 0})
        </h1>
        <i onClick={() => dispatch(setIsOpen(false))} className="fi fi-br-cross text-lg mt-1 cursor-pointer"></i>
      </div>
      <div className="my-4">
        <textarea value={comment} type="text" placeholder="Comment..." className="h-[150px] resize-none drop-shadow w-full p-3 text-lg focus:outline-none"
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleComment} className="bg-green-500 px-7 py-3 my-2 rounded-md">Add</button>
      </div>
      <div className="mt-4">
        <DisplayComments comments={comments || []} userId={userId} blogId={blogId} token={token} activeReply={activeReply} setActieReply={setActieReply} currentPopup={currentPopup} setCurrentPopup={setCurrentPopup} currentEditComment={currentEditComment} setCurrentEditComment={setCurrentEditComment} creatorId={creatorId} />
      </div>
    </div>
  )
}
function DisplayComments({ comments, userId, blogId, token, activeReply, setActieReply, currentPopup, setCurrentPopup, currentEditComment, setCurrentEditComment, creatorId }) {
  const loggedInUser = useSelector((state) => state.user);
  const [reply, setReply] = useState("");
  const [updateComment, setUpdateComment] = useState("");
  const dispatch = useDispatch();
  async function handleReply(parentCommentId) {
    try {
      let res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/comment/${parentCommentId}/${blogId}`,
        {
          reply,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setReply("");
      setActieReply(null);
      dispatch(setReplies(res.data.newReply));
      toast.success(res.data.message);
    } catch (error) {
      console.log(error.response.data.message);

    }
  }
  async function handleCommentLike(commentId) {
    try {
      let res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/blogs/like-comment/${commentId}`, {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message || "Like updated");
      dispatch(setCommentLikes({ commentId, userId }))
    } catch (error) {
      console.log(error);

    }
  }
  function handleActiveReply(id) {
    setActieReply((prev) => (prev === id ? null : id))
  }
  async function handleCommentUpdate(id) {
    try {
      let res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/blogs/edit-comment/${id}`,
        {
          updateComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      dispatch(setUpdatedComments(res.data.updatedComment));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setUpdateComment("");
      setCurrentEditComment(null);
    }
  }
  async function handleCommentDelete(id) {
    try {
      let res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/blogs/comment/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      dispatch(deleteCommentAndReply(id));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setUpdateComment("");
      setCurrentEditComment(null);
    }
  }
  return (
    <>
      {(comments || []).map((comment) => {
        const isOwnComment = comment?.user?._id === loggedInUser.id;

        const displayName = isOwnComment
          ? loggedInUser.name
          : comment.user.name;

        const displayProfilePic = isOwnComment
          ? loggedInUser.profilePic
          : comment.user.profilePic;

        return (
          <div key={comment._id}>
            <hr className="my-2" />

            <div className="flex flex-col gap-2 my-4">
              <div className="flex w-full justify-between">
                <Link to={`/@${comment.user.username}`} className="flex gap-2">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 aspect-square rounded-full overflow-hidden">
                      <img
                        src={
                          displayProfilePic
                            ? displayProfilePic
                            : `https://api.dicebear.com/9.x/initials/svg?seed=${displayName}`
                        }
                        alt=""
                        className="rounded-full w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <p className="capitalize font-medium">{displayName}</p>
                      <p>{formateDate(comment.createdAt)}</p>
                    </div>
                  </div>
                </Link>

                {comment.user._id === userId || userId === creatorId ? (
                  currentPopup === comment._id ? (
                    <div className="bg-gray-200 w-[70px] rounded-lg">
                      <i
                        onClick={() =>
                          setCurrentPopup((prev) =>
                            prev === comment._id ? null : comment._id
                          )
                        }
                        className="fi fi-br-cross relative left-12 text-sm mt-1 cursor-pointer"
                      ></i>

                      {comment.user._id === userId && (
                        <p
                          className="p-2 py-1 hover:bg-blue-300"
                          onClick={() => {
                            setCurrentEditComment(comment._id);
                            setUpdateComment(comment.comment);
                            setCurrentPopup(null);
                          }}
                        >
                          Edit
                        </p>
                      )}

                      <p
                        className="p-2 py-1 hover:bg-red-300"
                        onClick={() => {
                          handleCommentDelete(comment._id);
                          setCurrentPopup(null);
                        }}
                      >
                        Delete
                      </p>
                    </div>
                  ) : (
                    <i
                      className="fi fi-bs-menu-dots cursor-pointer"
                      onClick={() => setCurrentPopup(comment._id)}
                    ></i>
                  )
                ) : null}
              </div>

              {currentEditComment === comment._id ? (
                <div>
                  <textarea
                    type="text"
                    placeholder="Update Comment..."
                    className="h-[150px] resize-none drop-shadow w-full p-3 text-lg focus:outline-none"
                    value={updateComment}
                    onChange={(e) => setUpdateComment(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleCommentUpdate(comment._id)}
                      className="bg-green-500 px-5 py-2 my-2 rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setCurrentEditComment(null);
                        setUpdateComment("");
                      }}
                      className="bg-gray-300 px-5 py-2 my-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="font-medium text-lg">{comment.comment}</p>
              )}

              <div className="flex justify-between">
                <div className="flex gap-4">
                  <div className="cursor-pointer flex gap-2">
                    {comment.likes.includes(userId) ? (
                      <i
                        onClick={() => handleCommentLike(comment._id)}
                        className="fi fi-sr-thumbs-up text-blue-600 text-lg mt-1"
                      ></i>
                    ) : (
                      <i
                        onClick={() => handleCommentLike(comment._id)}
                        className="fi fi-rr-social-network text-xl mt-1"
                      ></i>
                    )}
                    <p className="text-lg">{comment.likes.length}</p>
                  </div>

                  <div className="flex gap-2 cursor-pointer">
                    <i className="fi fi-sr-comment-alt text-lg mt-1"></i>
                    <p className="text-lg">
                      replies({comment.replies?.length || 0})
                    </p>
                  </div>
                </div>

                <p
                  onClick={() => setActieReply(comment._id)}
                  className="text-lg hover:underline cursor-pointer"
                >
                  reply
                </p>
              </div>

              {activeReply === comment._id && (
                <div className="my-4">
                  <textarea
                    type="text"
                    placeholder="Reply..."
                    className="h-[150px] resize-none drop-shadow w-full p-3 text-lg focus:outline-none"
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    onClick={() => handleReply(comment._id)}
                    className="bg-green-500 px-7 py-3 my-2 rounded-md"
                  >
                    Add
                  </button>
                </div>
              )}

              {comment.replies.length > 0 && (
                <div className="pl-6 border-l">
                  <DisplayComments
                    comments={comment.replies}
                    userId={userId}
                    blogId={blogId}
                    token={token}
                    activeReply={activeReply}
                    setActieReply={setActieReply}
                    currentPopup={currentPopup}
                    setCurrentPopup={setCurrentPopup}
                    currentEditComment={currentEditComment}
                    setCurrentEditComment={setCurrentEditComment}
                    creatorId={creatorId}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
export default Comment;