import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../redux/authenticationSlice";
import { motion } from "framer-motion";
import { MdMarkEmailRead } from "react-icons/md";
import { postApi } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";

const RESEND_SECONDS = 30;

export default function VerifyOtp() {
  const { state } = useLocation();
  const form = state?.form;

  // Landed here directly (refresh / deep link) — nothing to verify.
  if (!form) return <Navigate to="/signup" replace />;

  return <VerifyOtpScreen form={form} initialOtp={state?.otp} />;
}

function VerifyOtpScreen({ form, initialOtp }) {
  const dispatch = useDispatch();
  // ponytail: local Laravel OTP response me bhejta hai. Inbox par depend mat karo —
  // temp-mail domains transactional mail chupchap drop kar dete hain.
  const [devOtp, setDevOtp] = useState(initialOtp);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const refs = useRef([]);
  const navigate = useNavigate();

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
        setDevOtp(res?.otp);
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
        localStorage.setItem("token", res?.token);
        localStorage.setItem("pin_set", "false");
        localStorage.removeItem("pin_expiry");
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
        dispatch(login(res?.token));
        navigate("/kyc", { replace: true });
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
        <motion.div
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

              {import.meta.env.DEV && devOtp && (
                <p className="text-center text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg py-2 mb-4">
                  dev only — OTP: <span className="font-mono font-semibold tracking-widest">{devOtp}</span>
                </p>
              )}

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
      </div>
    </div>
  );
}
