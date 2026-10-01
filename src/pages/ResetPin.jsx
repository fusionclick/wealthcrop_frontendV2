import { useState } from "react";
import { toastSuccess, toastError } from "../utils/notifyCustom";
import { postApi } from "../api/api";

// Digits only, and never more than the field takes.
const digits = (v, max) => v.replace(/\D/g, "").slice(0, max);

function ResetPin({ email, onBack }) {
  const [otp, setOTP] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleResetPin = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_RESET_PIN}`;

    try {
      // "The otp field must be 6 digits." — a 4-digit PIN had gone into the OTP box: nothing
      // said an OTP had been emailed or how long it is, and the box took any text. Checked
      // here first, in words that name the box that is wrong.
      if (otp.length !== 6) {
        return setError("Enter the 6-digit OTP we emailed you.");
      }

      if (newPin.length !== 4) {
        return setError("Your new PIN must be 4 digits.");
      }

      if (newPin !== confirmPin) {
        return setError("Pins do not match");
      }

      const res = await postApi(url, {
        email,
        otp,
        pin: newPin,
      });

      if (res?.status === 200 || res?.status === true) {
        toastSuccess(res?.message || "Pin reset successful");
        setError("");
        onBack(); // 🔥 go back to PIN screen
      }
    } catch (err) {
      toastError(err?.message || "Something went wrong");
    }
  };

  return (
    <div>
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        className="text-sm text-blue-600 underline mb-4"
      >
        ← Back
      </button>

      <h2 className="text-xl font-semibold text-center mb-2">
        Reset PIN 🔑
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
        We have emailed a 6-digit OTP to{" "}
        <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>.
      </p>

      <label htmlFor="reset-otp" className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
        OTP from your email
      </label>
      <input
        id="reset-otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={otp}
        onChange={(e) => setOTP(digits(e.target.value, 6))}
        placeholder="6-digit OTP"
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      <label htmlFor="reset-new-pin" className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
        New PIN
      </label>
      <input
        id="reset-new-pin"
        type="password"
        inputMode="numeric"
        value={newPin}
        onChange={(e) => setNewPin(digits(e.target.value, 4))}
        placeholder="4 digits"
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      <label htmlFor="reset-confirm-pin" className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
        Confirm new PIN
      </label>
      <input
        id="reset-confirm-pin"
        type="password"
        inputMode="numeric"
        value={confirmPin}
        onChange={(e) => setConfirmPin(digits(e.target.value, 4))}
        placeholder="4 digits"
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      {error && (
        <p className="text-red-500 text-sm mb-3 text-center">
          {error}
        </p>
      )}

      <button
        onClick={handleResetPin}
        className="w-full bg-blue-950 text-white py-2 rounded-lg"
      >
        Reset PIN
      </button>
    </div>
  );
}

export default ResetPin;