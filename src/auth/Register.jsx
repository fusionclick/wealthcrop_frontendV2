import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { formSchema } from "../utils/FormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError } from "../utils/notifyCustom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import { postApi } from "../api/api";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // Send the OTP, then hand the form over to the dedicated /verify-otp screen.
  const submitForm = async (formData) => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_REGISTER_SEND_OTP}`;
    setLoading(true);
    try {
      const res = await postApi(url, formData);
      if (res?.status === 200 || res?.status === true) {
        toastSuccess(res?.message || "OTP sent to your email");
        navigate("/verify-otp", { state: { form: formData } });
      }
    } catch (error) {
      toastError(error?.message || "Failed to send OTP");
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

            <button
              type="submit"
              className="w-full bg-blue-950 dark:bg-blue-600 cursor-pointer text-white rounded-lg py-2 font-medium hover:bg-blue-900 dark:hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Continue"}
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
      </div>
    </div>
  );
}
