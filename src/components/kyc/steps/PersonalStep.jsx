import { useState } from "react";

export default function PersonalStep({ next, prev, update }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  const save = () => {
    update({ name, dob });
    next();
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Personal Details</h2>

      <input
        placeholder="Full Name"
        className="w-full border px-4 py-2 mb-3 rounded-lg"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="date"
        className="w-full border px-4 py-2 mb-4 rounded-lg"
        onChange={(e) => setDob(e.target.value)}
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
