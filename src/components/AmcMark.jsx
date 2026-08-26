import { useState } from "react";
import { amcLogoUrl, amcInitial } from "../utils/amcLogo";

export default function AmcMark({ name, className = "h-11 w-11" }) {
  const [broken, setBroken] = useState(false);
  const src = amcLogoUrl(name);
  if (!src || broken) {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-800 flex items-center justify-center font-semibold text-sm shrink-0 border border-emerald-100`}
      >
        {amcInitial(name)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      className={`${className} rounded-xl bg-white object-contain p-1.5 shrink-0 border border-slate-200 shadow-sm`}
    />
  );
}
