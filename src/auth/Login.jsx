import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
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
    defaultValues: { email_or_mobile: "", password: "", otp: "" },
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
    console.log("Login response", res);
    
    if(res?.status === 200 || res?.status === true){
          // localStorage.setItem("token", res?.token)
          const expiryTime = Date.now() +  5000 //30 mint
          localStorage.setItem("pin_expiry", expiryTime) 
          // localStorage.setItem("username", res?.data?.name)
          // localStorage.setItem("phone", res?.data?.phone)
          // localStorage.setItem("email", res?.data?.email)
          // toastSuccess("Logged in successfully!");
          // dispatch(login(res?.token))


const newAccount = {
  userId: res?.data?.id,
  name: res?.data?.name,
  phone: res?.data?.phone,
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
    
    console.log("Password Login:", data);
    // localStorage.setItem("token","123456kjhhikk111")
    // ✅ Dispatch event to update App state
    window.dispatchEvent(new Event("storage"));

    // ✅ Instantly redirect without reload
    navigate("/");
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
    const res = await postApi(url, { phone: data.email_or_mobile }); // change payload key if API expects something else
console.log("Otp response", res);

    if (res.status === 200 || res.status === true) {
      setSaveOTP(res?.otp)
      console.log("otp",res?.otp);
      
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
      
      // ✅ Step 2: Verify OTP
      const enteredOtp = otp.join("");
      console.log(enteredOtp);
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
        const res = await postApi(url, {phone: data.email_or_mobile, otp: enteredOtp })
        if(res?.status === 200 || res?.status === true){
        console.log("OTP entered:", enteredOtp);
        console.log("Verify otp response", res);

          // localStorage.setItem("token", res?.token)
          localStorage.setItem("username", res?.data?.name)
          localStorage.setItem("Kstatus", res?.data?.kyc_status)
          localStorage.setItem("phone", res?.data?.phone)
          localStorage.setItem("email", res?.data?.email)
          
      toastSuccess(res?.message);
      setOtp(["", "", "", "", "", ""]);
      setValue("otp", "");
      dispatch(login(res?.token))
      navigate("/");
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
      {/* Mobile */}
      <div>
        <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
          Mobile or Email
        </label>
        <input
          {...register("email_or_mobile")}
          type="tel"
          placeholder="Enter your mobile number"
          className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
          required
        />
        {errors.email_or_mobile && (
          <p className="text-red-600 text-sm mt-1">
            {errors.email_or_mobile.message}
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


function LoginPin({setPinOpen}) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const pinRefs = useRef([]);
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handlePinChange = (value, index, type) => {
    if (!/^\d?$/.test(value)) return;

    if (type === "pin") {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      if (value && index < 3) pinRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index, type) => { 
    const refArr = type === "pin" ? pin : "";
    const focusArr = type === "pin" ? pinRefs : "";
    if (e.key === "Backspace" && !refArr[index] && index > 0) {
      focusArr.current[index - 1].focus();

        //! optional: clear previous value
  // const updated = [...refArr];
  // updated[index - 1] = "";
  // type === "pin" ? setPin(updated) : "";

    }
  };

  const handleSavePin = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_SET_PIN}`
    const url2 = `${import.meta.env.VITE_URL}${import.meta.env.VITE_CONFIRM_PIN}`
    const rawPin = pin.join("")
    try {
      if (pin.join("") !== confirmPin.join("")) {
        setError("Pins do not match. Please try again.");
        return;
      }
      const res = postApiWithToken(url, {pin : Number(rawPin)})
      console.log("Pin Response", res);
      
      if(res?.status === 200 || res?.status){

        setError("");
        toastSuccess(res?.message);
        navigate("/")
      }
    } catch (error) {
      toastError(error.res?.data?.message)
    }
    // setError("");
    //     toastSuccess("Pin set successfully!");
    //     // dispatch(login("temporary-token-pin-user"))
    //     navigate("/")
 
  };

  return (
 <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3 }}
  className="text-center"
>
<div className="flex flex-col ">
    <span className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-1">
    Hi, Fusion TechLab
  </span>
  <span className="text-sm font-semibold text-blue-600 dark:text-gray-100 mb-4">
    Enter your 4-digit PIN 🔒
  </span>
  <div className="space-x-5 mb-8">
    <span className="text-md text-blue-900 font-semibold dark:text-gray-100">fusion@gmail.com</span> <button className="text-sm font-semibold text-blue-600 underline cursor-pointer hover:text-blue-950 dark:hover:text-blue-300">Logout</button>
  </div>
</div>

  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
     Use this PIN to access your account securely
  </p>

  {/* Enter PIN */}
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
        className="
          w-12 h-12 text-center rounded-lg text-lg
          border border-gray-300 dark:border-white/10
          bg-white dark:bg-white/5
          text-blue-950 dark:text-gray-100
          focus:outline-none focus:ring-1 focus:ring-blue-700
        "
      />
    ))}
  </div>


  {error && (
    <p className="text-red-500 text-sm mb-4">
      {error}
    </p>
  )}

  <button
    className="
      w-full bg-blue-950 dark:bg-blue-600
      text-white rounded-lg py-2 font-medium
      hover:bg-blue-900 dark:hover:bg-blue-500
      transition
    "
    onClick={handleSavePin}
  >
    Login
  </button>

  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-5 flex justify-evenly">
      <button
        onClick={() => setPinOpen(false)}
        className="text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 font-medium cursor-pointer"
      >
        Login with otp
      </button>
      <button
        onClick={() => setPinOpen(false)}
        className="text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 font-medium cursor-pointer"
      >
        Login with password
      </button>
    </div>
</motion.div>

  );
}
