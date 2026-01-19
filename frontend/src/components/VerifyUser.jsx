import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function VerifyUser() {
  const { verificationToken } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!verificationToken) {
      setStatus("error");
      return;
    }
    async function verifyUser() {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/verify-email/${verificationToken}`);
        setStatus("success");
        setTimeout(() => {
          navigate("/signin", {
            replace: true,
            state: {
              toast: "Email verified successfully. Please sign in.",
            },
          });
        }, 1200);
      } catch (error) {
        setStatus("error");
      }
    }
    verifyUser();
  }, [verificationToken, navigate])
  return (
    <div className="w-full h-[calc(100vh_-_100px)] flex items-center justify-center">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-3">
          <span className="loader"></span>
          <p className="text-lg font-medium text-gray-600">
            Verifying your email…
          </p>
        </div>)}
      {status === "success" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl font-semibold text-green-600">
            ✅ Email verified
          </p>
          <p className="text-gray-500">
            Redirecting to sign in…
          </p>
        </div>)}
      {status === "error" && (
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