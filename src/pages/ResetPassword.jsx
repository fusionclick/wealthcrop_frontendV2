import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/notifyCustom";
import { postApi } from "../api/api";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../utils/FormSchema";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search)
  const token = params.get("token")
  const email = params.get("email")
  // console.log(token, email);

  const {register, handleSubmit,formState:{errors},} = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {newPassword: ""}
  })

  // Input par pehle `{...register("newPassword")}` phaila hua tha aur uske BAAD apna
  // `onChange` — yaani register wala onChange overwrite ho jata tha. react-hook-form ko
  // value kabhi milti hi nahi thi, zod hamesha khali password dekh kar validation fail
  // karta tha, aur handleSubmit handler ko kabhi call hi nahi karta tha: "Reset Password"
  // dabane par bilkul kuch nahi hota tha. Dono handler chalane hain — RHF ko bhi khabar
  // ho aur local state bhi chale.
  const passwordField = register("newPassword");

  const handleResetPassword = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_RESET_PASSWORD}`; 

    try {
      if (!newPassword || !confirmPassword) {
        setError("All fields are required");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // if (newPassword.length < 6) {
      //   setError("Password must be at least 6 characters");
      //   return;
      // }

      const res = await postApi(url, {
        password: newPassword,
        password_confirmation: newPassword,
        email: email,
        token: token
      });

      console.log("Reset Passsword Response", res);
      

      if (res?.status === 200 || res?.status === true) {
        setError("");
        toastSuccess(res?.message || "Password reset successful");

        navigate("/login");
      } else {
        // Yahan fallback text "Password reset successful" tha — yaani nakami par surkh
        // error toast mein likha aata tha ke password reset ho gaya. Screenshot mein
        // "Something went wrong" aur "Password reset successful" dono ek sath surkh
        // toast ban kar aaye the, aur user ke paas jaanne ka koi zariya nahi tha ke
        // asal mein hua kya.
        const message = res?.message || "Reset link is invalid or has expired. Please request a new one.";
        setError(message);
        toastError(message);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Something went wrong";
      setError(message);
      toastError(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#020617]"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#020617] rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-white/10">

        <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-4 text-center">
          Reset your password 🔑
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center">
          Enter a new password for your account
        </p>

        <form onSubmit={handleSubmit(handleResetPassword)}>

        {/* New Password */}
        <label className="text-sm font-medium text-blue-950 dark:text-gray-200 block mb-2">
          New Password
        </label>

        <input
          {...passwordField}
          type="password"
          value={newPassword}
          onChange={(e) => {
            passwordField.onChange(e);
            setNewPassword(e.target.value);
          }}
          placeholder="Enter new password"
          className="
            w-full mb-4 rounded-lg px-4 py-2 text-sm
            border border-gray-300 dark:border-white/10
            bg-white dark:bg-white/5
            text-blue-950 dark:text-gray-100
            focus:outline-none focus:ring-1 focus:ring-blue-700
            placeholder:text-gray-400
          "
        />
        {errors.newPassword && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {errors.newPassword.message}
          </p>
        )}

        {/* Confirm Password */}
        <label className="text-sm font-medium text-blue-950 dark:text-gray-200 block mb-2">
          Confirm Password
        </label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="
            w-full mb-4 rounded-lg px-4 py-2 text-sm
            border border-gray-300 dark:border-white/10
            bg-white dark:bg-white/5
            text-blue-950 dark:text-gray-100
            focus:outline-none focus:ring-1 focus:ring-blue-700
            placeholder:text-gray-400
          "
        />

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        {/* Button */}
        <button
          className="
            w-full bg-blue-950 dark:bg-blue-600
            text-white rounded-lg py-2 font-medium
            hover:bg-blue-900 dark:hover:bg-blue-500
            transition
          "
        >
          Reset Password
        </button>
        </form>
      </div>
    </motion.div>
  );
}

export default ResetPassword;