import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import {
    getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult
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
const messaging = getMessaging(app);
export const auth = getAuth(app);
export { messaging, getToken, onMessage };
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