import { useState, useRef } from "react";
import { postApi, postApiWithToken } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authenticationSlice";
import ResetPin from "../pages/ResetPin";

function LoginPinModal({ onSuccess }) {
  const [mode, setMode] = useState("pin"); // "pin" | "reset"
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const pinRefs = useRef([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const current = JSON.parse(localStorage.getItem("currentAccount"));
  const username = current?.name;
  const email = current?.email;
  const phone = current?.phone;

  // ================= PIN INPUT =================
  const handlePinChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      pinRefs.current[index + 1].focus();
    }

    if (newPin.every((d) => d !== "")) {
      handleVerifyPin(newPin);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1].focus();
    }
  };

  // ================= VERIFY PIN =================
  const handleVerifyPin = async (pinArray = pin) => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_VERIFY_PIN}`;
    const rawPin = pinArray.join("");

    try {
      const res = await postApiWithToken(url, {
        pin: Number(rawPin),
        phone,
      });

      if (res?.status === 200 || res?.status) {
        setError("");
        const expiryTime = Date.now() + 10 * 60 * 5000;
        localStorage.setItem("pin_expiry", expiryTime);

        onSuccess(); // close modal
      }
    } catch (error) {
      setError("Invalid PIN");
      toastError(error?.response?.data?.message);
    }
  };

  // ================= FORGOT PIN =================
  const handleSendOtp = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_FORGET_PIN}`;

    try {
      const res = await postApi(url, { phone });

      if (res?.status === 200 || res?.status === true) {
        toastSuccess(res?.message);
        setMode("reset"); // 🔥 switch UI
      }
    } catch (error) {
      toastError(error?.message);
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("currentAccount");
    localStorage.removeItem("pin_expiry");
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#020617] rounded-2xl p-6 w-[90%] max-w-sm relative">

        {/* ================= PIN VIEW ================= */}
        {mode === "pin" && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100">
                Hi, {username}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your 4-digit PIN 🔒
              </p>

              <div className="mt-3 text-sm">
                <span className="font-medium text-blue-900">
                  {email}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-blue-600 underline"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* PIN INPUT */}
            <div className="flex justify-center gap-3 mb-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  type="password"
                  maxLength="1"
                  value={digit}
                  onChange={(e) =>
                    handlePinChange(e.target.value, index)
                  }
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (pinRefs.current[index] = el)}
                  className="w-12 h-12 text-center rounded-lg text-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-1 focus:ring-blue-700"
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-center mb-3">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              className="w-full text-sm text-blue-600 underline"
            >
              Forgot PIN?
            </button>
          </>
        )}

        {/* ================= RESET VIEW ================= */}
        {mode === "reset" && (
          <ResetPin onBack={() => setMode("pin")} />
        )}
      </div>
    </div>
  );
}

export default LoginPinModal;