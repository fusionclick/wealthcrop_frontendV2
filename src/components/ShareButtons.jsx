import { Link2, Share2 } from "lucide-react";
import { toastSuccess } from "../utils/notifyCustom";

/**
 * SRS §10.2 — Social Media Integration: share an update, an achievement or an insight.
 *
 * Plain share links, not the platforms' SDKs. Facebook's and X's widget scripts load a
 * third-party tracker onto every page that carries a share button, which is a lot of
 * privacy exposure for a link that works fine as a URL.
 */
export default function ShareButtons({ text, url, className = "" }) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "https://wealthcrop.co");
  const encoded = encodeURIComponent(shareUrl);
  const msg = encodeURIComponent(text || "");

  const links = [
    ["X", `https://twitter.com/intent/tweet?text=${msg}&url=${encoded}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${encoded}`],
    ["WhatsApp", `https://wa.me/?text=${msg}%20${encoded}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`],
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text ? text + " " : ""}${shareUrl}`);
      toastSuccess("Link copied");
    } catch {
      // Clipboard access is blocked on insecure origins and in some in-app browsers.
      // Silence is the right answer here — the four share links still work.
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[11px] text-slate-400 flex items-center gap-1">
        <Share2 size={12} /> Share
      </span>

      {links.map(([label, href]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-[#94a3b8]"
        >
          {label}
        </a>
      ))}

      <button
        type="button"
        onClick={copy}
        className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-[#94a3b8] inline-flex items-center gap-1"
      >
        <Link2 size={12} /> Copy
      </button>
    </div>
  );
}
