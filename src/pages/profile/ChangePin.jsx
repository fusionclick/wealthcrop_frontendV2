import React, { useState } from 'react'
import { FiEye, FiEyeOff } from "react-icons/fi";
import { postApiWithToken } from '../../api/api';
import { toastError, toastSuccess } from '../../utils/notifyCustom';

const ChangePin = () => {
  const [oldPin, setOldPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = async () => { 
    if (newPin !== confirmPin) {
      alert("Pins do not match!");
      return;
    }

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_CHANGE_PIN}`;
    try {
             const res = await postApiWithToken(url, {old_pin:oldPin ,new_pin: newPin})
        console.log("change pin response", res);
        
        if(res?.status === 200 || res?.status === true){

          setOldPin("")
          setNewPin("")
          setConfirmPin("")
          setShowOld(false)
          setShowNew(false)
          setShowConfirm(false)
    
              toastSuccess(res?.message);
        }else{
            // toastSuccess(res?.message);
        }
    } catch (error) {
        toastError(error.message || "Server error happened");
        }
  };

  return (
    <div
  className="
    relative p-8 overflow-hidden rounded-lg
    bg-white
    dark:bg-[var(--card-bg)]
  "
>
  {/* Decorative blobs (keep light, they work fine in dark too) */}
  <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply opacity-50"></div>
  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-red-200 rounded-full mix-blend-multiply opacity-40"></div>
  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-200 rounded-full mix-blend-multiply opacity-30"></div>

  {/* Content */}
  <h2
    className="
      text-xl font-semibold mb-6 relative z-10
      text-blue-950
      dark:text-[var(--text-primary)]
    "
  >
    Change Wealthcrop PIN
  </h2>

  <div className="mb-6 relative z-10">
    <label
      className="
        block mb-2 font-semibold
        text-gray-600
        dark:text-[var(--text-secondary)]
      "
    >
      Old Pin
    </label>

    <div className="relative">
      <input
        type={showConfirm ? "text" : "password"}
        className="
          w-full border-b rounded-lg px-4 py-2 outline-none
          border-gray-300 bg-transparent text-gray-900
          focus:border-blue-400

          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
          dark:focus:border-blue-500
        "
        value={oldPin}
        onChange={(e) => setOldPin(e.target.value)}
        placeholder="Enter old Pin"
      />

      <button
        type="button"
        className="
          absolute right-3 top-2.5
          text-gray-500
          dark:text-[var(--text-secondary)]
        "
        onClick={() => setShowConfirm(!showConfirm)}
        aria-label="Toggle confirm Pin visibility"
      >
        {showConfirm ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  </div>

  {/* New Pin */}
  <div className="mb-4 relative z-10">
    <label
      className="
        block mb-2 font-semibold
        text-gray-600
        dark:text-[var(--text-secondary)]
      "
    >
      New PIN
    </label>

    <div className="relative">
      <input
        type={showNew ? "text" : "password"}
        className="
          w-full border-b rounded-lg px-4 py-2 outline-none
          border-gray-300 bg-transparent text-gray-900
          focus:border-blue-400

          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
          dark:focus:border-blue-500
        "
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
        placeholder="Enter new Pin"
      />

      <button
        type="button"
        className="
          absolute right-3 top-2.5
          text-gray-500
          dark:text-[var(--text-secondary)]
        "
        onClick={() => setShowNew(!showNew)}
        aria-label="Toggle new Pin visibility"
      >
        {showNew ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  </div>

  {/* Confirm Pin */}
   <div className="mb-4 relative z-10">
    <label
      className="
        block mb-2 font-semibold
        text-gray-600
        dark:text-[var(--text-secondary)]
      "
    >
      Confirm New PIN
    </label>

    <div className="relative">
      <input
        type={showConfirm ? "text" : "password"}
        className="
          w-full border-b rounded-lg px-4 py-2 outline-none
          border-gray-300 bg-transparent text-gray-900
          focus:border-blue-400

          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
          dark:focus:border-blue-500
        "
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value)}
        placeholder="Enter confirm Pin"
      />

      <button
        type="button"
        className="
          absolute right-3 top-2.5
          text-gray-500
          dark:text-[var(--text-secondary)]
        "
        onClick={() => setShowConfirm(!showConfirm)}
        aria-label="Toggle new Pin visibility"
      >
        {showConfirm ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  </div>

  <button
    onClick={handleUpdate}
    className="
      relative z-10 w-full px-6 py-2 rounded-lg font-semibold transition-all
      bg-blue-900 hover:bg-blue-800 text-white

      dark:bg-blue-600
      dark:hover:bg-blue-700
    "
  >
    Update Pin
  </button>
</div>

  )
}

export default ChangePin
