import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MdMarkEmailRead } from "react-icons/md";
import { postApi, postApiWithToken } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";

const RESEND_SECONDS = 30;

export default function VerifyOtp() {
  const { state } = useLocation();
  const form = state?.form;

  // Landed here directly (refresh / deep link) — nothing to verify.
  if (!form) return <Navigate to="/signup" replace />;

  return <VerifyOtpScreen form={form} />;
}

function VerifyOtpScreen({ form }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // Paste the whole code at once — the usual way people move it out of an email.
  const handlePaste = (e) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const filled = Array.from({ length: 6 }, (_, i) => digits[i] || "");
    setOtp(filled);
    const next = filled.findIndex((d) => !d);
    refs.current[next === -1 ? 5 : next]?.focus();
  };

  const resend = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_REGISTER_SEND_OTP}`;
    setLoading(true);
    try {
      const res = await postApi(url, form);
      if (res?.status === 200 || res?.status === true) {
        setOtp(["", "", "", "", "", ""]);
        setCooldown(RESEND_SECONDS);
        refs.current[0]?.focus();
        toastSuccess(res?.message || "OTP sent again");
      }
    } catch (error) {
      toastError(error?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toastError("Please enter the 6-digit code");
      return;
    }

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_REGISTER}`;
    setLoading(true);
    try {
      const res = await postApi(url, { ...form, otp: code });
      if (res?.status === 200 || res?.status === true) {
        localStorage.setItem("pin_expiry", Date.now() + 30 * 60 * 1000);
        localStorage.setItem("token", res?.token);
        localStorage.setItem("username", res?.data?.name);
        localStorage.setItem("email", res?.data?.email);

        const newAccount = {
          userId: res?.data?.id,
          name: res?.data?.name,
          email: res?.data?.email,
          token: res?.token,
        };

        let accounts = [];
        try {
          accounts = JSON.parse(localStorage.getItem("accounts")) || [];
        } catch {
          accounts = [];
        }

        const existing = accounts.findIndex((a) => a.userId === newAccount.userId);
        if (existing !== -1) accounts[existing] = newAccount;
        else accounts.push(newAccount);

        localStorage.setItem("accounts", JSON.stringify(accounts));
        localStorage.setItem("currentAccount", JSON.stringify(newAccount));

        toastSuccess(res?.message || "Email verified");
        setPinOpen(true);
      }
    } catch (error) {
      toastError(error?.message || "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#020617] px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#020617] rounded-2xl shadow-sm dark:shadow-none p-8 border border-gray-100 dark:border-white/10">
        <AnimatePresence mode="wait">
          {!pinOpen ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-7">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <MdMarkEmailRead className="text-blue-700 dark:text-blue-400" size={26} />
                </div>
                <h1 className="text-2xl font-semibold text-blue-950 dark:text-gray-100">
                  Verify your email
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-medium text-blue-950 dark:text-gray-200 break-all">
                  {form.email}
                </p>
              </div>

              <form onSubmit={verify} noValidate>
                <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleChange(e.target.value, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      ref={(el) => (refs.current[i] = el)}
                      aria-label={`Digit ${i + 1}`}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center rounded-xl text-xl font-semibold
                      border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5
                      text-blue-950 dark:text-gray-100
                      focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 transition"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-950 dark:bg-blue-600 text-white rounded-lg py-2.5 font-medium
                  hover:bg-blue-900 dark:hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-5">
                Didn&apos;t get the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-gray-400">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={resend}
                    disabled={loading}
                    className="text-blue-800 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Resend
                  </button>
                )}
              </div>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Wrong email?{" "}
                <Link
                  to="/signup"
                  className="text-blue-800 dark:text-blue-400 hover:underline font-medium"
                >
                  Go back
                </Link>
              </div>
            </motion.div>
          ) : (
            <SetPin key="setPin" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// -------------------------
//  SET PIN (last signup step, then straight to KYC)
// -------------------------
function SetPin() {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pinRefs = useRef([]);
  const confirmRefs = useRef([]);
  const navigate = useNavigate();

  const handlePinChange = (value, index, type) => {
    if (!/^\d?$/.test(value)) return;

    if (type === "pin") {
      const next = [...pin];
      next[index] = value;
      setPin(next);
      if (value && index < 3) pinRefs.current[index + 1]?.focus();
    } else {
      const next = [...confirmPin];
      next[index] = value;
      setConfirmPin(next);
      if (value && index < 3) confirmRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index, type) => {
    const arr = type === "pin" ? pin : confirmPin;
    const refs = type === "pin" ? pinRefs : confirmRefs;
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleSavePin = async () => {
    if (pin.join("").length !== 4) {
      setError("Enter a 4-digit PIN.");
      return;
    }
    if (pin.join("") !== confirmPin.join("")) {
      setError("PINs do not match. Please try again.");
      return;
    }

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_SET_PIN}`;
    setSaving(true);
    try {
      const res = await postApiWithToken(url, { pin: Number(pin.join("")) });
      if (res?.status === 200 || res?.status) {
        setError("");
        toastSuccess(res?.message || "PIN set");
        navigate("/kyc", { replace: true });
      }
    } catch (err) {
      toastError(err?.response?.data?.message || err?.message || "Could not save PIN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
        Set your 4-digit PIN 🔒
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        You&apos;ll use this PIN to access your account securely
      </p>

      <label className="text-sm font-medium text-blue-950 dark:text-gray-200 block mb-2">
        Enter PIN
      </label>
      <div className="flex justify-center gap-3 mb-5">
        {pin.map((digit, index) => (
          <input
            key={index}
            type="password"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handlePinChange(e.target.value, index, "pin")}
            onKeyDown={(e) => handleKeyDown(e, index, "pin")}
            ref={(el) => (pinRefs.current[index] = el)}
            className="w-12 h-12 text-center rounded-lg text-lg border border-gray-300 dark:border-white/10
            bg-white dark:bg-white/5 text-blue-950 dark:text-gray-100
            focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 transition"
          />
        ))}
      </div>

      <label className="text-sm font-medium text-blue-950 dark:text-gray-200 block mb-2">
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
            className="w-12 h-12 text-center rounded-lg text-lg border border-gray-300 dark:border-white/10
            bg-white dark:bg-white/5 text-blue-950 dark:text-gray-100
            focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 transition"
          />
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSavePin}
        disabled={saving}
        className="w-full bg-blue-950 dark:bg-blue-600 text-white rounded-lg py-2.5 font-medium
        hover:bg-blue-900 dark:hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
      >
        {saving ? "Saving..." : "Save PIN & Start KYC"}
      </button>
    </motion.div>
  );
}
