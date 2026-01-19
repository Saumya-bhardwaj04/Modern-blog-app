import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

function VerifyUser() {
    const { verificationToken } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        if (!verificationToken) {
            setIsLoading(false);
            setStatus("error");
            toast.error("Invalid verification link");
            return;
        }
        async function verifyUser() {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/verify-email/${verificationToken}`);
                toast.success(res.data.message || "Email verified successfully");
                setStatus("success");
                setTimeout(() => {
                    navigate("/signin");
                }, 2000);
            } catch (error) {
                toast.error(error.response?.data?.message || "Verification link is invalid or expired");
                setStatus("error");
            } finally {
                setIsLoading(false);
            }
        }
        verifyUser();
    }, [verificationToken, navigate])
    return (
    <div className="w-full h-[calc(100vh_-_100px)] flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <span className="loader"></span>
          <p className="text-lg font-medium text-gray-600">
            Verifying your email…
          </p>
        </div>
      ) : status === "success" ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl font-semibold text-green-600">
            ✅ Email verified
          </p>
          <p className="text-gray-500">
            Redirecting to sign in…
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl font-semibold text-red-600">
            ❌ Verification failed
          </p>
          <p className="text-gray-500 text-center max-w-[300px]">
            The verification link may be invalid or expired.
          </p>
        </div>
      )}
    </div>
  );
}
export default VerifyUser;
