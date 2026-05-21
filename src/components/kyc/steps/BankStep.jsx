import { useState } from "react";

export default function BankStep({ next, prev, update }) {
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");

  const save = () => {
    update({ account, ifsc });
    next();
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Bank Details</h2>

      <input
        placeholder="Account Number"
        className="w-full border px-4 py-2 mb-3 rounded-lg"
        onChange={(e) => setAccount(e.target.value)}
      />

      <input
        placeholder="IFSC Code"
        className="w-full border px-4 py-2 mb-4 rounded-lg"
        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
      />

      <div className="flex gap-3">
        <button onClick={prev} className="w-1/2 border rounded-lg py-2">
          Back
        </button>
        <button onClick={save} className="w-1/2 bg-blue-950 text-white rounded-lg py-2">
          Continue
        </button>
      </div>
    </>
  );
}
