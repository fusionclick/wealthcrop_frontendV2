import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../utils/FormSchema";
import { toastError, toastSuccess } from "../utils/notifyCustom";
import { useDispatch } from "react-redux";
import { login } from "../redux/authenticationSlice";
import { postApi } from "../api/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import LoginPinModal from "../utils/LoginPinModal";

function ForgotPassword() {

    const [loading, setLoading] = useState(false)

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
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
        Enter your Wealthcrop email address
      </p>
    </div>


    {/* Form */}
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {/* Mobile */}
      <div>
        <label className="block text-sm font-medium text-blue-950 dark:text-gray-200 mb-1">
         Enter Your Email
        </label>
        <input
          {...register("email")}
          type="tel"
          placeholder="Enter your mobile number"
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

  </div>
</div>

  );
}

export default ForgotPassword;
