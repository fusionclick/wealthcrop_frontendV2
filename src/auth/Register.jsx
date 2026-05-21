import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { formSchema } from "../utils/FormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError } from "../utils/notifyCustom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { postApi, postApiWithToken } from "../api/api";
import { useDispatch } from "react-redux";
import { login } from "../redux/authenticationSlice";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
    },
  });

  const submitForm = async (formData) => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_REGISTER}`
    console.log("Form Data:", formData);
    setLoading(true);
    try {
      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await postApi(url, formData)
      console.log("Response data:", res);
        if(res?.status === 200 || res?.status === true){

          const expiryTime = Date.now() + 30 * 60 * 1000;
          localStorage.setItem("pin_expiry", expiryTime)
          localStorage.setItem("token", res?.token)
          localStorage.setItem("username", res?.data?.name)
          localStorage.setItem("phone", res?.data?.phone)
          localStorage.setItem("email", res?.data?.email)
          
          // toastSuccess("Form submitted successfully! ");
          toastSuccess(res?.message);
          setPinOpen(true);
        } else {
      // toastError(res?.message || "Registration failed");  
    }
      
    } catch (error) {
      // toastError("Something went wrong. Please try again.");
      toastError(error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#020617]">
  <div className="w-full max-w-md bg-white dark:bg-[#020617] rounded-2xl shadow-sm dark:shadow-none p-8 border border-gray-100 dark:border-white/10">
    <AnimatePresence mode="wait">
      {!pinOpen ? (
        <motion.div
          key="registerForm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-blue-950 dark:text-gray-100">
              Create your account ✨
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Start investing smarter with Wealthcrop
            </p>
          </div>

          {/* Register Form */}
          <form
            className="space-y-5"
            noValidate
            onSubmit={handleSubmit(submitForm)}
          >
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
                Username
              </label>
              <input
                {...register("username")}
                type="text"
                placeholder="Enter your username"
                className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 text-sm 
                focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 text-sm 
                focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                {...register("mobile")}
                placeholder="Enter your mobile number"
                className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 text-sm 
                focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
              />
              {errors.mobile && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.mobile.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Create a password"
                  className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg px-4 py-2 pr-10 text-sm 
                  focus:outline-none focus:ring-1 focus:ring-blue-700 text-blue-950 dark:text-gray-100 placeholder:text-gray-400"
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
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full bg-blue-950 dark:bg-blue-600 cursor-pointer text-white rounded-lg py-2 font-medium hover:bg-blue-900 dark:hover:bg-blue-500 transition"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Create Account"}
            </button>

            {/* Google Sign Up */}
            <button
              type="button"
              className="w-full border border-gray-300 dark:border-white/10 text-blue-950 dark:text-gray-200 rounded-lg py-2 font-medium 
              hover:bg-gray-50 dark:hover:bg-white/10 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Sign up with Google
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 font-medium"
            >
              Login
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
// 🔐 SET PIN COMPONENT (with confirm PIN)
// -------------------------
function SetPin() {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const pinRefs = useRef([]);
  const confirmRefs = useRef([]);
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handlePinChange = (value, index, type) => {
    if (!/^\d?$/.test(value)) return;

    if (type === "pin") {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      if (value && index < 3) pinRefs.current[index + 1].focus();
    } else {
      const newConfirm = [...confirmPin];
      newConfirm[index] = value;
      setConfirmPin(newConfirm);
      if (value && index < 3) confirmRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index, type) => { 
    const refArr = type === "pin" ? pin : confirmPin;
    const focusArr = type === "pin" ? pinRefs : confirmRefs;
    if (e.key === "Backspace" && !refArr[index] && index > 0) {
      focusArr.current[index - 1].focus();

        //! optional: clear previous value
  // const updated = [...refArr];
  // updated[index - 1] = "";
  // type === "pin" ? setPin(updated) : setConfirmPin(updated);

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
      const res = await postApiWithToken(url, {pin : Number(rawPin)})
      console.log("Pin Response", res);
      
      if(res?.status === 200 || res?.status){

        setError("");
        toastSuccess(res?.message);
        navigate("/user/stocks/explore")
        window.location.reload()
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
  <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-4">
    Set your 4-digit PIN 🔒
  </h2>

  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
    You’ll use this PIN to access your account securely
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

  {/* Confirm PIN */}
  <label className="text-sm font-medium text-blue-950 dark:text-gray-200 block mb-2">
    Confirm PIN
  </label>

  <div className="flex justify-center gap-3 mb-4">
    {confirmPin.map((digit, index) => (
      <input
        key={index}
        type="text"
        inputMode="numeric"
        maxLength="1"
        value={digit}
        onChange={(e) =>
          handlePinChange(e.target.value, index, "confirm")
        }
        onKeyDown={(e) => handleKeyDown(e, index, "confirm")}
        ref={(el) => (confirmRefs.current[index] = el)}
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
    Save PIN
  </button>
</motion.div>

  );
}
