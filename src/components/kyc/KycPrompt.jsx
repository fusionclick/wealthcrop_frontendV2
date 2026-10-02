import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ShieldAlert, X } from "lucide-react";
import { PROMPT_SEEN_KEY, shouldPromptKyc } from "./kycPromptRule.js";

/**
 * Audit #44 — SRS §2/§3: KYC prompts "through pop-ups". Until now the reminder was a weekly
 * bell entry and static "Complete KYC" buttons. This opens once per browser session for a
 * signed-in investor whose KYC is incomplete; App mounts it only off the onboarding routes and
 * never while the PIN modal is up.
 */
export default function KycPrompt() {
  const investor = useSelector((s) => s.investorData?.data);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = null;
    try {
      seen = sessionStorage.getItem(PROMPT_SEEN_KEY);
    } catch {
      // Storage can throw in private mode; then it shows once per page load instead.
    }
    if (!shouldPromptKyc(investor, seen)) return;
    try {
      sessionStorage.setItem(PROMPT_SEEN_KEY, String(investor.id));
    } catch {
      // As above.
    }
    setOpen(true);
  }, [investor]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    // Above the mobile Profile screen, a full-screen layer at z-[99999].
    <div
      className="fixed inset-0 z-[100000] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-prompt-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 p-6 shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>
        <ShieldAlert className="text-amber-500" size={28} />
        <h2 id="kyc-prompt-title" className="mt-3 text-lg font-semibold text-blue-950 dark:text-gray-100">
          Complete your KYC
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Your account is open, but orders, SIPs and withdrawals stay locked until your KYC is
          done. It takes a few minutes.
        </p>
        <div className="mt-5 flex gap-2">
          <Link
            to="/kyc"
            onClick={close}
            className="flex-1 text-center rounded-lg py-2 text-sm font-semibold text-white bg-blue-950 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Complete KYC
          </Link>
          <button
            type="button"
            onClick={close}
            className="flex-1 rounded-lg py-2 text-sm font-semibold border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-transparent dark:hover:bg-white/5"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
