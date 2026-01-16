import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "userSlice",
    initialState: JSON.parse(localStorage.getItem("user")) || {
        token: null,
        name: null,
        username: null,
        email: null,
        id: null,
        profilePic: null,
        followers: [],
        following: [],
    },
    reducers: {
        login(state, action) {
            const user = {
                followers: [],
                following: [],
                ...action.payload,
            };
            localStorage.setItem("user", JSON.stringify(user));
            if (user.token) {
                localStorage.setItem("token", user.token);
            }
            state.id = user.id;
            state.name = user.name;
            state.email = user.email;
            state.profilePic = user.profilePic;
            state.username = user.username;
            state.bio = user.bio;
            state.followers = user.followers || [];
            state.following = user.following || [];
            state.token = user.token;
        }
        ,
        logout(state, action) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");

            return {
                id: null,
                name: null,
                email: null,
                profilePic: null,
                username: null,
                bio: null,
                followers: [],
                following: [],
                token: null,
            };
        }
        ,
        updateData(state, action) {
            const data = action.payload;
            if (data[0] === "visibility") {
                localStorage.setItem("user", JSON.stringify({ ...state, ...data[1] }));
                return { ...state, ...data };
            } else if (data[0] === "followers") {
                const finalData = {
                    ...state,
                    following: state?.following?.includes(data[1])
                        ? state?.following?.filter((id) => id !== data[1])
                        : [...state.following, data[1]],
                };

                localStorage.setItem("user", JSON.stringify(finalData));
                return finalData;
            }
        },
    },
});

export const { login, logout, updateData } = userSlice.actions;
export default userSlice.reducer;