import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordLoginSchema, otpLoginSchema } from "../utils/FormSchema";
import { toastError, toastSuccess } from "../utils/notifyCustom";
import { useDispatch } from "react-redux";
import { login } from "../redux/authenticationSlice";
import { postApi } from "../api/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import LoginPinModal from "../utils/LoginPinModal";
import ForgotPassword from "../components/ForgotPassword";

function LoginPage() {
  const [loginMode, setLoginMode] = useState("password"); // "password" | "otp"
  const [otpSent, setOtpSent] = useState(false);
  const [saveOTP, setSaveOTP] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locked, setLocked] = useState(false);

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // react-hook-form
  const { register, handleSubmit, formState: { errors }, setValue, reset, trigger } = useForm({
    resolver: loginMode === "password"
      ? zodResolver(passwordLoginSchema)
      : zodResolver(otpLoginSchema),
    defaultValues: { email: "", password: "", otp: "" },
  });

  // Handle OTP input changes
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
  if (loginMode === "password") { 
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_LOGIN}`;
    const res = await postApi(url, data)

    if(res?.status === 200 || res?.status === true){
          // localStorage.setItem("token", res?.token)
          localStorage.setItem("pin_set", res?.pin_set ? "true" : "false")
          localStorage.setItem("pin_expiry", Date.now() + 30 * 60 * 1000)
          // localStorage.setItem("username", res?.data?.name)
          // localStorage.setItem("email", res?.data?.email)
          // toastSuccess("Logged in successfully!");
          // dispatch(login(res?.token))


const newAccount = {
  userId: res?.data?.id,
  name: res?.data?.name,
  email: res?.data?.email,
  token: res?.token,
};

// Get existing accounts
let accounts = [];

try {
  accounts = JSON.parse(localStorage.getItem("accounts")) || [];
} catch (e) {
  accounts = [];
}

// Check if account already exists
const existingIndex = accounts.findIndex(
  (acc) => acc.userId === newAccount.userId
);

if (existingIndex !== -1) {
  // Update existing account
  accounts[existingIndex] = newAccount;
} else {
  // Add new account
  accounts.push(newAccount);
}

// Save all accounts
localStorage.setItem("accounts", JSON.stringify(accounts));

// Set current active account
localStorage.setItem("currentAccount", JSON.stringify(newAccount));

toastSuccess(res?.message);

// Redux (store only current token)
dispatch(login(newAccount.token));

    // localStorage.setItem("token","123456kjhhikk111")
    // Dispatch event to update App state
    window.dispatchEvent(new Event("storage"));

    // Instantly redirect without reload. "/" is the public marketing page - a signed-in
    // investor belongs in the dashboard shell, which is where signup -> otp -> kyc -> login
    // is meant to land.
    navigate("/user/mutual_fund");
    // window.location.reload()
reset();
    }else{
      // toastError(res?.message)
    }

  } else {
if (!otpSent) {
  const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_SEND_OTP}`;
  try {
    // 📨 Step 1: Send OTP API call
    const res = await postApi(url, { email: data.email }); // change payload key if API expects something else

    if (res.status === 200 || res.status === true) {
      // ponytail: never trust/store OTP from API body in prod (SMS path)
      if (import.meta.env.DEV && res?.otp) setSaveOTP(res.otp);
      setOtpSent(true);
      setOtp(["", "", "", "", "", ""]);
      toastSuccess(res?.message);
    } else {
      // toastError(res.data.message || "Failed to send OTP ");
    }
  } catch (error) {
    console.error("OTP Send Error:", error);
    toastError(error.response?.data?.message || "Server error while sending OTP ❌");
  }
}
 else {
      
      //  Step 2: Verify OTP
      const enteredOtp = otp.join("");
//       const otpMatch = enteredOtp === String(saveOTP);
// if (!otpMatch) {
//   toastError("Incorrect OTP");
//   return;
// }
      
      if (!enteredOtp || enteredOtp.length !== 6 ) {
        toastError("Please enter the 6-digit OTP");
        return;
      }

      try {
        const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_VERIFY_OTP}`
        const res = await postApi(url, { email: data.email, otp: enteredOtp })
        if(res?.status === 200 || res?.status === true){
          // localStorage.setItem("token", res?.token)
          localStorage.setItem("username", res?.data?.name)
          localStorage.setItem("pin_set", res?.pin_set ? "true" : "false")
          localStorage.setItem("pin_expiry", Date.now() + 30 * 60 * 1000)
          localStorage.setItem("Kstatus", res?.data?.kyc_status)
          localStorage.setItem("email", res?.data?.email)
          
      toastSuccess(res?.message);
      setOtp(["", "", "", "", "", ""]);
      setValue("otp", "");
      dispatch(login(res?.token))
      // Same destination as the password path — the dashboard, not the marketing page.
      navigate("/user/mutual_fund");
        }
      } catch (error) {
        console.error("OTP Send Error:", error);
    toastError(error.response?.data?.message || "Server error while verifying OTP ❌");
      }
      
    }
  }
};


  // Reset form on mode change
  useEffect(() => {
    reset();
    setOtp(["", "", "", "", "", ""]);
    setOtpSent(false);
  }, [loginMode, reset]);

  return (
    
  !forgotPassword ? (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#020617]">
  <div className="w-full max-w-md bg-white dark:bg-[#020617] rounded-2xl shadow-sm dark:shadow-none p-8 border border-gray-100 dark:border-white/10">

        {/* Header */}
    <div className="text-center mb-6">
      <h1 className="text-2xl font-semibold text-blue-950 dark:text-gray-100">
        Welcome Back 👋
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
        Login to continue investing with Wealthcrop
      </p>
    </div>

    {/* Tabs */}
    <div className="flex mb-6 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden ">
      <button
        onClick={() => setLoginMode("password")}
        className={`w-1/2 py-2 text-sm font-medium transition ${
          loginMode === "password"
            ? "bg-blue-950 text-white dark:bg-blue-600"
            : "bg-gray-50 dark:bg-white/5 text-blue-950 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
        }`}
      >
        Login with Password
      </button>
    
      <button
        onClick={() => setLoginMode("otp")}
        className={`w-1/2 py-2 text-sm font-medium transition ${
          loginMode === "otp"
            ? "bg-blue-950 text-white dark:bg-blue-600"
            : "bg-gray-50 dark:bg-white/5 text-blue-950 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
        }`}
      >
        Login with OTP
      </button>
    </div>

    {/* Form */}
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
          required
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      {loginMode === "password" && (
        <>
          <div>
            <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
              Password
            </label>
            <div className="relative">
        <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
              required
            />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
            </div>
            
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                className="rounded accent-blue-700"
              />
              <span>Remember me</span>
            </label>
            <button
            type="button"
              onClick={() => setForgotPassword(true)}
              className="text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 font-medium"
            >
              Forgot Password?
            </button>
          </div>
        </>
      )}

      {/* OTP Inputs */}
      <AnimatePresence>
        {loginMode === "otp" && otpSent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center gap-2 mt-3"
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                ref={(el) => (otpRefs.current[index] = el)}
                className="w-10 h-10 text-center border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-lg focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100"
              />
            ))}
            {errors.otp && (
              <p className="text-red-600 text-sm mt-1 col-span-6">
                {errors.otp.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-950 dark:bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-900 dark:hover:bg-blue-500 transition"
      >
        {loginMode === "password"
          ? "Login"
          : otpSent
          ? "Verify OTP"
          : "Send OTP"}
      </button>
    </form>

    {/* Footer */}
    <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-5">
      Don’t have an account?{" "}
      <Link
        to="/signup"
        className="text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 font-medium"
      >
        Sign up
      </Link>
    </div>
      </div>
</div>
  ) : (
    <ForgotPassword/>
  )

  );
}

export default LoginPage;
