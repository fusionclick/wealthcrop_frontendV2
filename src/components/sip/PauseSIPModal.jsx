import React, { useState } from "react";

const PauseSIPModal = ({ onClose, onConfirm }) => {
  const [pauseType, setPauseType] = useState("1_month");
  const pauseOptions = [
    { id: "1_month", label: "Pause for 1 Month" },
    { id: "3_month", label: "Pause for 3 Months" },
    { id: "6_month", label: "Pause for 6 Months" },
    { id: "custom", label: "Custom Date Range" },
  ];

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handleSubmit = () => {
    onConfirm({
      pauseType,
      customFrom: pauseType === "custom" ? customFrom : null,
      customTo: pauseType === "custom" ? customTo : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Pause SIP
        </h2>

        <div className="space-y-2">
          {pauseOptions.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-sm"
            >
              <input
                type="radio"
                value={opt.id}
                checked={pauseType === opt.id}
                onChange={() => setPauseType(opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {pauseType === "custom" && (
          <div className="mt-3 space-y-2">
            <input
              type="date"
              className="w-full border rounded-md p-2 text-sm"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <input
              type="date"
              className="w-full border rounded-md p-2 text-sm"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white"
          >
            Confirm Pause
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseSIPModal;
