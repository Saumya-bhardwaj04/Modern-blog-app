import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { handleFollowCreator } from "./BlogPage";
import { useSelector } from "react-redux";
import DisplayBlogs from "../components/DisplayBlogs";

function ProfilePage() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const { token, id: userId, following } = useSelector((state) => state.user);
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    async function fetchUserDetails() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/users/${username.split("@")[1]}`
        );

        if (!cancelled) {
          setUserData(res.data.user);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
          if (error?.response?.status === 404) {
            setNotFound(true);
          } else {
            toast.error(error.response?.data?.message || "Something went wrong");
          }

        }
      }
    }

    fetchUserDetails();

    return () => {
      cancelled = true;
    };
  }, [username]);

  function renderComponent() {
    if (location.pathname === `/${username}`) {
      return (
        <DisplayBlogs blogs={userData.blogs.filter((blog) => !blog.draft)} />
      );
    } else if (location.pathname === `/${username}/saved-blogs`) {
      return (
        <>
          {userData.showSavedBlogs || userData._id === userId ? (
            <DisplayBlogs blogs={userData.saveBlogs} />
          ) : (
            <Navigate to={`/${username}`} />
          )}
        </>
      );
    } else if (location.pathname === `/${username}/draft-blogs`) {
      return (
        <>
          {userData._id === userId ? (
            <DisplayBlogs blogs={userData.blogs.filter((blog) => blog.draft)} />
          ) : (
            <Navigate to={`/${username}`} />
          )}
        </>
      );
    } else {
      return (
        <>
          {userData.showLikedBlogs || userData._id === userId ? (
            <DisplayBlogs blogs={userData.likeBlogs} />
          ) : (
            <Navigate to={`/${username}`} />
          )}
        </>
      );
    }
  }
  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (loading || !userData) {
    return (
      <div className="flex justify-center items-center w-full h-[60vh]">
        <span className="loader"></span>
      </div>
    );
  }
  return (
    <div className="w-full flex justify-center">
      <div className="w-[80%] flex max-lg:flex-col-reverse justify-evenly ">
        <div className=" max-lg:w-full w-[50%] ">
          <div className="hidden sm:flex justify-between my-10 ">
            <p className="text-4xl font-semibold">{userData.name}</p>
            <i className="fi fi-bs-menu-dots cursor-pointer opacity-70"></i>
          </div>
          <div className=" my-4">
            <nav className="my-4">
              <ul className="flex gap-6">
                <li>
                  <Link
                    to={`/${username}`}
                    className={`${location.pathname === `/${username}`
                      ? "border-b-2 border-black"
                      : ""
                      }  pb-1`}
                  >
                    Home
                  </Link>
                </li>
                {userData.showSavedBlogs || userData._id === userId ? (
                  <li>
                    <Link
                      to={`/${username}/saved-blogs`}
                      className={`${location.pathname === `/${username}/saved-blogs`
                        ? "border-b-2 border-black"
                        : ""
                        }  pb-1`}
                    >
                      Saved <span className="hidden sm:inline">Blogs</span>
                    </Link>
                  </li>
                ) : null}

                {userData.showLikedBlogs || userData._id === userId ? (
                  <li>
                    <Link
                      to={`/${username}/liked-blogs`}
                      className={`${location.pathname === `/${username}/liked-blogs`
                        ? "border-b-2 border-black"
                        : ""
                        }  pb-1`}
                    >
                      Liked <span className="hidden sm:inline">Blogs</span>
                    </Link>
                  </li>
                ) : null}

                {userData._id === userId ? (
                  <li>
                    <Link
                      to={`/${username}/draft-blogs`}
                      className={`${location.pathname === `/${username}/draft-blogs`
                        ? "border-b-2 border-black"
                        : ""
                        }  pb-1`}
                    >
                      Draft <span className="hidden sm:inline">Blogs</span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            </nav>
            {userData && renderComponent()}
          </div>
        </div>

        <div className=" max-lg:w-full w-[20%]   lg:border-l max-lg:flex lg:pl-10 lg:min-h-[calc(100vh_-_70px)] ">
          <div className="my-10">
            <div className="w-20 h-20 aspect-square rounded-full overflow-hidden">
              <img
                src={
                  userData.profilePic
                    ? userData.profilePic
                    : `https://api.dicebear.com/9.x/initials/svg?seed=${userData.name}`
                }
                alt={userData.name}
                className="rounded-full w-full h-full object-cover"
              />
            </div>
            <p className="text-base max-md:text-lg font-medium my-3">
              {userData?.name}
            </p>
            <p>{userData?.followers?.length || 0} Followers</p>

            <p className="text-slate-600 text-sm font-normal my-3">
              {userData?.bio}
            </p>

            {userId === userData._id ? (
              <button className="bg-green-600 px-7 py-3  max-lg:w-full rounded-full text-white my-3">
                <Link to="/edit-profile">Edit Profile</Link>
              </button>
            ) : (
              <button
                onClick={async () => {
                  const success = await handleFollowCreator(userData._id, token);
                  if (success) {
                    const res = await axios.get(
                      `${import.meta.env.VITE_BACKEND_URL}/users/${username.split("@")[1]}`
                    );
                    setUserData(res.data.user);
                  }
                }}
                className="bg-green-600 px-7 py-3 rounded-full max-lg:w-full text-white my-3"
              >
                {userData.followers.some((f) => f._id === userId)
                  ? "Following"
                  : "Follow"}
              </button>
            )}

            <div className="my-6 w-full hidden lg:block">
              <h2 className="font-semibold">Following</h2>

              <div className="my-5 ">
                {userData?.following?.length > 0 ? (
                  userData?.following?.map((user) => (
                    <div className="flex justify-between items-center">
                      <Link to={`/@${user.username}`}>
                        <div className="flex gap-2 items-center hover:underline cursor-pointer">
                          <div className="w-4 h-4 aspect-square rounded-full overflow-hidden">
                            <img
                              src={
                                user?.profilePic
                                  ? user?.profilePic
                                  : `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
                              }
                              alt=""
                              className="rounded-full w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-base font-medium my-3">
                            {user.name}
                          </p>
                        </div>
                      </Link>
                      <i className="fi fi-bs-menu-dots cursor-pointer opacity-70"></i>
                    </div>
                  ))
                ) : (
                  <p>No following found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProfilePage;