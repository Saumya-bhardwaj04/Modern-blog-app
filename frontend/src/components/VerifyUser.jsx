import axios from "axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

function VerifyUser() {
    const { verificationToken } = useParams();
    const navigate = useNavigate();
    useEffect(() => {
        if (!verificationToken) return;
        async function verifyUser() {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/verify-email/${verificationToken}`);
                toast.success(res.data.message || "Email verified successfully");
                setTimeout(() => {
                    navigate("/signin");
                }, 1500);
            } catch (error) {
                toast.error(error.response?.data?.message || "Verification failed");
            }
        }
        verifyUser();
    }, [verificationToken, navigate])
    return (
        <div className="h-screen flex items-center justify-center text-xl">
            Verifying your email…
        </div>
    )
}
export default VerifyUser;
