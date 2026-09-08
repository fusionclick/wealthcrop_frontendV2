import { useState, useRef } from "react";
import { postApi, postApiWithToken } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authenticationSlice";
import ResetPin from "../pages/ResetPin";

// PIN gate: jiska PIN nahi hai usay pehle set karwao, warna verify karo.
const PIN_IS_SET = () => localStorage.getItem("pin_set") === "true";
const armPinExpiry = () =>
  localStorage.setItem("pin_expiry", Date.now() + 30 * 60 * 1000);

function LoginPinModal({ onSuccess }) {
  const [mode, setMode] = useState(PIN_IS_SET() ? "pin" : "set"); // "set" | "pin" | "reset"
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pinRefs = useRef([]);
  const confirmRefs = useRef([]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const current = JSON.parse(localStorage.getItem("currentAccount"));
  const username = current?.name;
  const email = current?.email;

  // ================= PIN INPUT =================
  const handlePinChange = (value, index, which = "pin") => {
    if (!/^\d?$/.test(value)) return;

    const isConfirm = which === "confirm";
    const next = [...(isConfirm ? confirmPin : pin)];
    next[index] = value;
    (isConfirm ? setConfirmPin : setPin)(next);

    const refs = isConfirm ? confirmRefs : pinRefs;
    if (value && index < 3) refs.current[index + 1]?.focus();

    // verify mode me 4th digit par khud submit; set mode me user confirm bharega
    if (mode === "pin" && !isConfirm && next.every((d) => d !== "")) {
      handleVerifyPin(next);
    }
  };

  const handleKeyDown = (e, index, which = "pin") => {
    const arr = which === "confirm" ? confirmPin : pin;
    const refs = which === "confirm" ? confirmRefs : pinRefs;
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // ================= SET PIN (pehli baar) =================
  const handleSavePin = async () => {
    if (pin.join("").length !== 4) return setError("Enter a 4-digit PIN.");
    if (pin.join("") !== confirmPin.join("")) return setError("PINs do not match.");

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_SET_PIN}`;
    setSaving(true);
    try {
      const res = await postApiWithToken(url, { pin: Number(pin.join("")) });
      if (res?.status === 200 || res?.status) {
        setError("");
        localStorage.setItem("pin_set", "true");
        armPinExpiry();
        toastSuccess(res?.message || "PIN set");
        onSuccess();
      }
    } catch (err) {
      toastError(err?.response?.data?.message || err?.message || "Could not save PIN");
    } finally {
      setSaving(false);
    }
  };

  // ================= VERIFY PIN =================
  const handleVerifyPin = async (pinArray = pin) => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_VERIFY_PIN}`;
    const rawPin = pinArray.join("");

    try {
      const res = await postApiWithToken(url, { pin: Number(rawPin) });

      if (res?.status === 200 || res?.status) {
        setError("");
        localStorage.setItem("pin_set", "true");
        armPinExpiry();

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
      const res = await postApi(url, { email });

      if (res?.status === 200 || res?.status === true) {
        if (res?.auto_reset && res?.pin) {
          toastSuccess(`New PIN: ${res.pin}`);
          setPin(["", "", "", ""]);
          setError("");
          return;
        }
        toastSuccess(res?.message);
        setMode("reset");
      }
    } catch (error) {
      toastError(error?.message);
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("currentAccount");
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
                  inputMode="numeric"
                  aria-label={`PIN digit ${index + 1}`}
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

        {/* ================= SET PIN VIEW (pehli baar) ================= */}
        {mode === "set" && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100">
                Secure your account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Set a 4-digit PIN to continue 🔒
              </p>
              <div className="mt-3 text-sm">
                <span className="font-medium text-blue-900 dark:text-blue-300">{email}</span>
                <button onClick={handleLogout} className="ml-2 text-blue-600 underline">
                  Logout
                </button>
              </div>
            </div>

            <label className="block text-sm text-gray-600 dark:text-gray-300 text-center mb-2">
              Enter PIN
            </label>
            <div className="flex justify-center gap-3 mb-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  type="password"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handlePinChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (pinRefs.current[index] = el)}
                  aria-label={`PIN digit ${index + 1}`}
                  className="w-12 h-12 text-center rounded-lg text-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-1 focus:ring-blue-700"
                />
              ))}
            </div>

            <label className="block text-sm text-gray-600 dark:text-gray-300 text-center mb-2">
              Confirm PIN
            </label>
            <div className="flex justify-center gap-3 mb-4">
              {confirmPin.map((digit, index) => (
                <input
                  key={index}
                  type="password"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handlePinChange(e.target.value, index, "confirm")}
                  onKeyDown={(e) => handleKeyDown(e, index, "confirm")}
                  ref={(el) => (confirmRefs.current[index] = el)}
                  aria-label={`Confirm PIN digit ${index + 1}`}
                  className="w-12 h-12 text-center rounded-lg text-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-1 focus:ring-blue-700"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-center mb-3">{error}</p>}

            <button
              onClick={handleSavePin}
              disabled={saving}
              className="w-full bg-blue-950 dark:bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-900 dark:hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {saving ? "Saving..." : "Set PIN & Continue"}
            </button>
          </>
        )}

        {/* ================= RESET VIEW ================= */}
        {mode === "reset" && (
          <ResetPin email={email} onBack={() => setMode("pin")} />
        )}
      </div>
    </div>
  );
}

export default LoginPinModal;