import React, { useState } from "react";

const ModifySIPPage = ({ sipData, onSubmit, onBack }) => {
  const [amount, setAmount] = useState(sipData.amount);
  const [sipDate, setSipDate] = useState(sipData.sipDate);
  const [frequency, setFrequency] = useState(sipData.frequency);

  const frequencies = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

  const handleSubmit = () => {
    onSubmit({ amount, sipDate, frequency });
  };

  return (
    <div className="p-4 max-w-xl mx-auto min-h-screen bg-white">
      <button onClick={onBack} className="text-sm text-blue-600 mb-3">
        ← Back
      </button>

      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Modify SIP
      </h2>

      <div className="space-y-4">
        {/* Amount */}
        <div>
          <label className="text-sm text-gray-600">SIP Amount (₹)</label>
          <input
            type="number"
            className="w-full border p-2 mt-1 rounded-md text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* SIP Date */}
        <div>
          <label className="text-sm text-gray-600">SIP Date</label>
          <select
            value={sipDate}
            onChange={(e) => setSipDate(e.target.value)}
            className="w-full border p-2 mt-1 rounded-md text-sm"
          >
            {[1, 5, 10, 15, 25].map((d) => (
              <option key={d} value={d}>
                {d} of every month
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="text-sm text-gray-600">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border p-2 mt-1 rounded-md text-sm"
          >
            {frequencies.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded-md mt-4 text-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ModifySIPPage;
