import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../utils/FormSchema";
import { toastError, toastSuccess } from "../utils/notifyCustom";
import { useDispatch } from "react-redux";
import { login } from "../redux/authenticationSlice";
import { postApi } from "../api/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import LoginPinModal from "../utils/LoginPinModal";

function ForgotPassword({ onBack }) {

    const [loading, setLoading] = useState(false)
    // Local dev only: the server hands the link back instead of mailing it (production never
    // sends this field), so the reset can be walked through without a real inbox.
    const [devLinks, setDevLinks] = useState([])

  // react-hook-form
  const { register, handleSubmit, formState: { errors }, setValue, reset, trigger } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });


  // Submit handler
  const onSubmit =  async (data) => {
    console.log("Forgot", data);
    setLoading(true)
    
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_FORGOT_PASSWORD}`;
    try {
         const res = await postApi(url, data)
    console.log("Login response", res);
    
    if(res?.status === 200 || res?.status === true){

          toastSuccess(res?.message);
          setDevLinks(res?.dev_reset_links || [])
          setLoading(false)
        reset()
    }else{
        setLoading(false)
    }
} catch (error) {
    console.error("OTP Send Error:", error);
    toastError(error.response?.data?.message || "Server error while sending OTP ❌");
    }

};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#020617]">
  <div className="w-full max-w-md bg-white dark:bg-[#020617] rounded-2xl shadow-sm dark:shadow-none p-8 border border-gray-100 dark:border-white/10">

       {/* Header */}
    <div className="text-center mb-6">
      <h1 className="text-2xl font-semibold text-blue-950 dark:text-gray-100">
       Forgot Password 🔑
      </h1>
      {/* Audit #40 — a verified secondary email recovers the account too. */}
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
        Enter your Wealthcrop email, or a secondary email you have verified
      </p>
    </div>


    {/* Form */}
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
         Enter Your Email
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


      {/* Submit Button */}
      <button
        className="w-full bg-blue-950 dark:bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-900 dark:hover:bg-blue-500 transition"
      >
        { loading ? "Sending" : "Send Link" }
      </button>
    </form>

    {devLinks.length > 0 && (
      <div className="mt-5 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 text-sm">
        <p className="font-medium text-amber-800 dark:text-amber-300">Local dev only — the emailed link:</p>
        {devLinks.map((path) => (
          <Link key={path} to={path} className="block mt-1 text-blue-700 dark:text-blue-400 underline">
            Reset the password for {new URLSearchParams(path.split("?")[1]).get("email")}
          </Link>
        ))}
      </div>
    )}

    {/* Is screen se wapas jane ka koi rasta hi nahi tha: forgot-password ek route nahi
        balke Login ki state hai, is liye header ka "Login / Signup" bhi yahan phansa
        chhod deta tha. */}
    <button
      type="button"
      onClick={onBack}
      className="mt-5 w-full text-center text-sm text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 font-medium"
    >
      ← Back to login
    </button>

  </div>
</div>

  );
}

export default ForgotPassword;
