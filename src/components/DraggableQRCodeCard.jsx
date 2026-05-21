import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

const DraggableQRCodeCard = ({ value, size }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      style={{
        position: "fixed",
        bottom: 10,
        left: 10,
        zIndex: 1000,
        padding: 20, // extra padding so button fits inside
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: 8,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Close Button */}
      <button
        onClick={() => setVisible(false)}
        className="dark:text-black"
        style={{
          position: "absolute",
          top: 5,       // slightly down from the top
          right: 5,     // slightly in from the right
          background: "transparent",
          border: "none",
          fontSize: 22,
          fontWeight: "bold",
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Close QR Code"
      >
        &times;
      </button>

      <p className="w-28 text-xs text-center text-gray-700 font-semibold mb-2">
        Download Wealthcrop Mobile App
      </p>

      <QRCodeSVG value={value} size={size} fgColor="#000" />
    </motion.div>
  );
};

export default DraggableQRCodeCard;
