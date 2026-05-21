import { useState } from "react";
import { toastSuccess, toastError } from "../utils/notifyCustom";
import { postApi } from "../api/api";

function ResetPin({ onBack }) {
  const [otp, setOTP] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const current = JSON.parse(localStorage.getItem("currentAccount"));
  const phone = current?.phone;

  const handleResetPin = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_RESET_PIN}`;

    try {
      if (!otp || !newPin || !confirmPin) {
        return setError("All fields are required");
      }

      if (newPin !== confirmPin) {
        return setError("Pins do not match");
      }

      const res = await postApi(url, {
        phone,
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

      <h2 className="text-xl font-semibold text-center mb-4">
        Reset PIN 🔑
      </h2>

      <input
        type="text"
        value={otp}
        onChange={(e) => setOTP(e.target.value)}
        placeholder="Enter OTP"
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      <input
        type="password"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
        placeholder="New PIN"
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      <input
        type="password"
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value)}
        placeholder="Confirm PIN"
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