import { useState } from "react";
import { Upload } from "lucide-react";

/**
 * Audit #43 — an Aadhaar is uploaded as a pair or not at all: the photo is on the front, the
 * address on the back, and the server refuses one without the other. Each side is held here
 * until both are picked, then `onUpload(front, back)` sends them together. It resolves truthy
 * on success; a refused pair is cleared so it is picked again whole, never half-kept.
 */
export default function AadhaarSides({ onUpload }) {
  const [sides, setSides] = useState({});
  const [busy, setBusy] = useState(false);

  const pick = async (side, file) => {
    if (!file) return;
    const next = { ...sides, [side]: file };
    setSides(next);
    if (!next.front || !next.back) return;

    setBusy(true);
    const ok = await onUpload(next.front, next.back);
    setBusy(false);
    if (!ok) setSides({});
  };

  const box =
    "flex-1 flex items-center justify-between gap-2 border border-dashed rounded-xl p-3 cursor-pointer border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2">
        {["front", "back"].map((side) => (
          <label key={side} className={box}>
            <span className="text-xs text-gray-700 dark:text-white capitalize">
              {side} side
              {sides[side] && (
                <span className="block text-[11px] text-green-600 dark:text-green-400 truncate max-w-[160px]">
                  {sides[side].name}
                </span>
              )}
            </span>
            <Upload size={16} className="text-gray-600 dark:text-white" />
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              aria-label={`Aadhaar ${side} side`}
              disabled={busy}
              onChange={(e) => {
                pick(side, e.target.files[0]);
                // Lets the same file be picked again after a refusal.
                e.target.value = "";
              }}
            />
          </label>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
        {busy
          ? "Uploading both sides…"
          : sides.front || sides.back
          ? "Now pick the other side — an Aadhaar needs both."
          : "Both sides are needed; the upload starts once both are picked."}
      </p>
    </div>
  );
}
