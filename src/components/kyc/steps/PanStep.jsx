import { motion } from "framer-motion";
import { useState } from "react";

export default function PanStep({ next, update }) {
  const [pan, setPan] = useState("");

  const verifyPan = () => {
    if (pan.length !== 10) return alert("Invalid PAN");
    update({ pan });
    next();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">
        PAN Verification
      </h2>

      <input
        value={pan}
        onChange={(e) => setPan(e.target.value.toUpperCase())}
        placeholder="ABCDE1234F"
        className="w-full border rounded-lg px-4 py-2 mb-4"
      />

      <button
        onClick={verifyPan}
        className="w-full bg-blue-950 text-white rounded-lg py-2"
      >
        Verify PAN
      </button>
    </motion.div>
  );
}
