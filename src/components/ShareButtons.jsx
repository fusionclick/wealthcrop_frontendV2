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

  const payload = `${text ? text + " " : ""}${shareUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      toastSuccess("Link copied");
    } catch {
      // Clipboard access is blocked on insecure origins and in some in-app browsers.
      // Silence is the right answer here — the four share links still work.
    }
  };

  /**
   * QA 12.6 — "copy link working, share link not".
   *
   * "Share" was a <span>: it sat next to Copy, looked exactly like the other chips, and did
   * nothing at all when clicked. It is now the native share sheet where the browser has one
   * (every mobile browser, and Edge/Safari on desktop), and falls back to copying where it does
   * not, so the control always does something. The four platform links are unchanged.
   */
  const share = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: "WealthCrop", text: text || "", url: shareUrl });
    } catch {
      // AbortError just means the user dismissed the sheet — not a failure worth a toast.
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={share}
        className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-[#94a3b8] inline-flex items-center gap-1"
      >
        <Share2 size={12} /> Share
      </button>

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
