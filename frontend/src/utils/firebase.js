import { initializeApp } from "firebase/app";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult
} from "firebase/auth";
import toast from "react-hot-toast";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_APIKEY,
    authDomain: import.meta.env.VITE_AUTHDOMAIN,
    projectId: import.meta.env.VITE_PROJECTID,
    storageBucket: import.meta.env.VITE_STORAGEBUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGINGSENDERID,
    appId: import.meta.env.VITE_APPID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();


export async function googleAuth() {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
        console.error("Authentication error:", error);
        toast.error("Please try again later");
        return null;
    }
}
export async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            return result.user;
        }
        return null;
    } catch (error) {
        console.error("Redirect error:", error);
        toast.error("Authentication failed. Please try again.");
        return null;
    }
}