const User = require("../models/userSchema");
const Blog = require("../models/blogSchema");
const Comment = require("../models/commentSchema");
const bcrypt = require('bcrypt');
const { generateJWT, verifyJWT } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const ShortUniqueId = require("short-unique-id");
const { randomUUID } = new ShortUniqueId({ length: 5 })
// google auth
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth")
const {
    deleteImagefromCloudinary,
    uploadImage,
} = require("../utils/uploadImage");
const { FIREBASE_TYPE, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_CLIENT_ID, FIREBASE_AUTH_URI, FIREBASE_TOKEN_URI, FIREBASE_AUTH_PROVIDER_X509_CERT_URL, FIREBASE_CLIENT_X509_CERT_URL, FIREBASE_UNIVERSAL_DOMAIN, FRONTEND_URL } = require("../config/dotenv.config");
admin.initializeApp({
    credential: admin.credential.cert(
        {
            type: FIREBASE_TYPE,
            project_id: FIREBASE_PROJECT_ID,
            private_key_id: FIREBASE_PRIVATE_KEY_ID,
            private_key: FIREBASE_PRIVATE_KEY,
            client_email: FIREBASE_CLIENT_EMAIL,
            client_id: FIREBASE_CLIENT_ID,
            auth_uri: FIREBASE_AUTH_URI,
            token_uri: FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: FIREBASE_CLIENT_X509_CERT_URL,
            universe_domain: FIREBASE_UNIVERSAL_DOMAIN,
        }
    ),
});
async function createUser(req, res) {
    const { name, email, password } = req.body
    try {

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            })
        }
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            })
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            })
        }
        const checkForexistingUser = await User.findOne({ email })
        if (checkForexistingUser) {
            if (checkForexistingUser.googleAuth) {
                return res.status(400).json({
                    success: false,
                    message: "This email is already registered with google",
                })
            }
            if (checkForexistingUser.verify) {
                return res.status(400).json({
                    success: false,
                    message: "user already registered with this email. try logging in",
                })
            } else {
                let verificationToken = await generateJWT({
                    email: checkForexistingUser.email,
                    id: checkForexistingUser._id,
                })
                //email logic
                await sendEmail({
                    to: checkForexistingUser.email,
                    subject: "Verify your email",
                    html: `
                    <h2>Welcome to Meloque 🎉</h2>
                    <p>Click below to verify your email:</p>
                    <a href="${FRONTEND_URL}/verify-email/${verificationToken}">Verify Email </a>`,
                });
                return res.status(200).json({
                    success: true,
                    message: "Please check your email to verify your account",
                })
            }
        }
        const hashedPass = await bcrypt.hash(password, 10);
        const username = email.split("@")[0] + randomUUID();
        const newUser = await User.create({
            name,
            email,
            password: hashedPass,
            username,
        });
        let verificationToken = await generateJWT({
            email: newUser.email,
            id: newUser._id,
        })
        await sendEmail({
            to: newUser.email,
            subject: "Verify your email",
            html: `
            <h2>Welcome to Meloque 🎉</h2>
            <p>Click below to verify your email:</p>
            <a href="${FRONTEND_URL}/verify-email/${verificationToken}">Verify Email </a>`,
        });
        return res.status(200).json({
            success: true,
            message: "Please check your email to verify your account",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Please try again",
            error: error.message,
        })
    }
}
async function verifyEmail(req, res) {
    try {
        const { verificationToken } = req.params;
        const verifyToken = await verifyJWT(verificationToken);
        if (!verifyToken) {
            return res.status(400).json({
                success: false,
                message: "Session Expired Try again later",
            })
        }
        const { id } = verifyToken;
        const user = await User.findByIdAndUpdate(id,
            { verify: true },
            { new: true },
        )
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "user does not exist"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Please try again",
            error: error.message,
        })
    }
}
// google auth
async function googleAuth(req, res) {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: "Access token missing",
            });
        }
        const response = await Promise.race([
            getAuth().verifyIdToken(accessToken),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firebase timeout")), 8000)
            )
        ]);
        const { name, email } = response;
        let user = await User.findOne({ email });
        if (user) {
            // already registered
            if (user.googleAuth) {
                let token = await generateJWT({
                    email: user.email,
                    id: user._id,
                })
                return res.status(200).json({
                    success: true,
                    message: "logged in successfully",
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        profilePic: user.profilePic,
                        username: user.username,
                        showLikedBlogs: user.showLikedBlogs,
                        showSavedBlogs: user.showSavedBlogs,
                        bio: user.bio,
                        followers: user.followers,
                        following: user.following,
                        token,
                    },
                })
            } else {
                return res.status(400).json({
                    success: true,
                    message: "This email is already registered. try signing in!",
                })
            }

        }
        const username = email.split("@")[0] + randomUUID();
        let newUser = await User.create({
            name,
            email,
            googleAuth: true,
            verify: true,
            username,
        })
        const token = await generateJWT({
            email: newUser.email,
            id: newUser._id,
        })
        return res.status(200).json({
            success: true,
            message: "Registeration successfull",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                profilePic: newUser.profilePic,
                username: newUser.username,
                showLikedBlogs: newUser.showLikedBlogs,
                showSavedBlogs: newUser.showSavedBlogs,
                bio: newUser.bio,
                followers: newUser.followers,
                following: newUser.following,
                token,
            },
        })

    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(500).json({
            success: false,
            message: "Google authentication failed",
            error: error.message,
        });
    }
}
async function login(req, res) {
    const { email, password } = req.body
    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            })
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            })
        }
        const checkForexistingUser = await User.findOne({ email }).select("password verify name email profilePic username bio showLikedBlogs showSavedBlogs followers following googleAuth")
        if (!checkForexistingUser) {
            return res.status(400).json({
                success: false,
                message: "Create an account first"
            })
        }
        if (checkForexistingUser.googleAuth) {
            return res.status(400).json({
                success: false,
                message: "This email is already registered with google",
            })
        }
        let checkForPass = await bcrypt.compare(password, checkForexistingUser.password);

        if (!checkForPass) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password",
            })
        }
        if (!(checkForexistingUser.verify)) {
            //send verification email
            let verificationToken = await generateJWT({
                email: checkForexistingUser.email,
                id: checkForexistingUser._id,
            })
            await sendEmail({
                to: checkForexistingUser.email,
                subject: "Verify your email",
                html: `
                    <h2>Welcome to Meloque 🎉</h2>
                    <p>Click below to verify your email:</p>
                    <a href="${FRONTEND_URL}/verify-email/${verificationToken}">Verify Email </a>`,
            });
            return res.status(400).json({
                success: false,
                message: "Please verify your email",
            })
        }
        const token = await generateJWT({
            email: checkForexistingUser.email,
            id: checkForexistingUser._id,
        })
        return res.status(200).json({
            success: true,
            message: "logged in successfully",
            user: {
                id: checkForexistingUser._id,
                name: checkForexistingUser.name,
                email: checkForexistingUser.email,
                profilePic: checkForexistingUser.profilePic,
                username: checkForexistingUser.username,
                bio: checkForexistingUser.bio,
                followers: checkForexistingUser.followers || [],
                following: checkForexistingUser.following || [],
                showLikedBlogs: checkForexistingUser.showLikedBlogs ?? true,
                showSavedBlogs: checkForexistingUser.showSavedBlogs ?? false,
                token,
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Please try again",
            error: error.message,
        })

    }
}
async function getAllUsers(req, res) {
    try {
        const users = await User.find();
        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })

    }
}
async function getUserById(req, res) {
    try {
        const username = req.params.username
        const user = await User.findOne({ username }).populate("blogs followers following likeBlogs saveBlogs")
            .populate({
                path: "followers following",
                select: "name username profilePic"
            }).populate({
                path: "blogs likeBlogs saveBlogs",
                populate: {
                    path: "creator",
                    select: "name username profilePic",
                },
            }).select("-password -verify -__v -email -googleAuth")
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found",
                user
            })
        }
        return res.status(200).json({
            success: true,
            message: "User fetched successfully",
            user
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}
async function updateUser(req, res) {
    try {
        const id = req.params.id;
        const { name, username, bio } = req.body;
        const image = req.file;
        const user = await User.findById(id);
        if (!req.body.profilePic) {
            if (user.profilePicId) {
                await deleteImagefromCloudinary(user.profilePicId);
            }
            user.profilePic = null;
            user.profilePicId = null;
        }

        if (image) {
            const { secure_url, public_id } = await uploadImage(
                `data:image/jpeg;base64,${image.buffer.toString("base64")}`
            );

            user.profilePic = secure_url;
            user.profilePicId = public_id;
        }

        if (user.username !== username) {
            const findUser = await User.findOne({ username });

            if (findUser) {
                return res.status(400).json({
                    success: false,
                    message: "Username already taken",
                });
            }
        }
        user.username = username;
        user.bio = bio;
        user.name = name;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                name: user.name,
                profilePic: user.profilePic,
                bio: user.bio,
                username: user.username,
            },
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Please try again"
        })
    }
}
async function deleteUser(req, res) {
    try {
        const userId = req.user;
        const { id } = req.params;

        if (userId !== id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this account",
            });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        if (user.profilePicId) {
            await deleteImagefromCloudinary(user.profilePicId);
        }
        const blogs = await Blog.find({ creator: id });

        for (const blog of blogs) {
            if (blog.imageId) {
                await deleteImagefromCloudinary(blog.imageId);
            }
        }

        await Blog.deleteMany({ creator: id });

        const userComments = await Comment.find({ user: id }).select("_id");

        const commentIds = userComments.map(c => c._id);

        await Blog.updateMany(
            {},
            { $pull: { comments: { $in: commentIds } } }
        );

        await Comment.updateMany(
            {},
            { $pull: { replies: { $in: commentIds } } }
        );

        await Comment.deleteMany({ user: id });
        await Comment.updateMany(
            {},
            { $pull: { likes: id } }
        );
        await Blog.updateMany(
            {},
            { $pull: { likes: id } }
        );
        await User.updateMany(
            {},
            {
                $pull: {
                    followers: id,
                    following: id,
                    saveBlogs: { $in: blogs.map(b => b._id) },
                    likeBlogs: { $in: blogs.map(b => b._id) },
                },
            }
        );
        await User.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });

    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({
            success: false,
            message: "Please try again",
        });
    }
}

async function followUser(req, res) {
    try {
        const followerId = req.user;
        const { id } = req.params;
        if (followerId === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself",
            });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        if (!user.followers.includes(followerId)) {
            await User.findByIdAndUpdate(id, { $push: { followers: followerId } });
            await User.findByIdAndUpdate(followerId, { $push: { following: id } });

            return res.status(200).json({
                success: true,
                message: "Followed",
            })
        } else {
            await User.findByIdAndUpdate(id, { $pull: { followers: followerId } });
            await User.findByIdAndUpdate(followerId, { $pull: { following: id } });

            return res.status(200).json({
                success: true,
                message: "Unfollowed",
            })
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}
async function changeSavedLikedBlog(req, res) {
    try {
        const userId = req.user;
        const { showLikedBlogs, showSavedBlogs } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }
        await User.findByIdAndUpdate(userId, { showLikedBlogs, showSavedBlogs });
        return res.status(200).json({
            success: true,
            message: "Visibility updated",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}
module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, login, verifyEmail, googleAuth, followUser, changeSavedLikedBlog };