import { useState } from "react";

export default function AddFundsModal({ onConfirm, onClose }) {
  const [amount, setAmount] = useState("");

  return (
    <div
  className="
    fixed inset-0 flex items-center justify-center
    bg-black/40
  "
>
  <div
    className="
      bg-white p-6 rounded-xl w-96 shadow-xl

      dark:bg-[var(--white-10)]
      dark:border dark:border-[var(--border-color)]
      dark:backdrop-blur-md
    "
  >
    <h2
      className="
        text-xl font-bold mb-3
        text-blue-950 dark:text-[var(--text-primary)]
      "
    >
      Add Funds
    </h2>

    <input
      type="number"
      className="
        border p-3 rounded-xl w-full mb-4 outline-none

        border-gray-300 bg-white text-gray-900
        dark:border-[var(--border-color)]
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:placeholder:text-[var(--text-secondary)]
      "
      placeholder="Enter Amount (₹)"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
    />

    <button
      onClick={() => onConfirm(Number(amount))}
      className="
        w-full py-3 rounded-xl font-semibold

        bg-blue-950 text-white
        hover:bg-blue-900

        dark:bg-blue-600 dark:hover:bg-blue-500
      "
    >
      Continue
    </button>

    <button
      onClick={onClose}
      className="
        w-full mt-3 text-gray-500

        dark:text-[var(--text-secondary)]
        hover:underline
      "
    >
      Cancel
    </button>
  </div>
</div>

  );
}
    