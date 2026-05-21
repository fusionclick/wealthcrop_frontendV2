import React, { useState } from "react";

const CancelSIPModal = ({ onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Cancel SIP
        </h2>

        <p className="text-sm text-slate-700 mb-3">
          Are you sure you want to cancel this SIP? You can restart it anytime.
        </p>

        <textarea
          className="w-full border p-2 rounded-md text-sm"
          rows="3"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border"
          >
            Close
          </button>

          <button
            onClick={() => onConfirm({ reason })}
            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelSIPModal;
