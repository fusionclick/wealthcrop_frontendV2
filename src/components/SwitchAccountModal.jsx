import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { postApi, postApiWithToken } from "../api/api";
import { toastError } from "../utils/notifyCustom";

/**
 * SRS "Switch Accounts", main flow steps 3–5: the system asks for re-authentication, the
 * user provides credentials, and only then does the account switch.
 *
 * Switching used to write the new account into localStorage and reload — anyone holding an
 * unlocked phone could move between linked accounts. This is the missing step.
 *
 * The PIN is checked when one is set, because it is the credential this app already asks
 * for on re-entry; otherwise the account's own password is. Neither is stored, and the
 * switch only happens after the server says the credential was right.
 */
export default function SwitchAccountModal({ account, onCancel, onConfirmed }) {
  const hasPin = localStorage.getItem("pin_set") === "true";
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (e) => {
    e.preventDefault();

    if (hasPin && secret.length !== 4) return toastError("Enter your 4-digit PIN.");
    if (!hasPin && secret.length < 6) return toastError("Enter your password.");

    setBusy(true);
    try {
      const res = hasPin
        ? await postApiWithToken(`${import.meta.env.VITE_URL}/login-pin`, { pin: secret }, { silent: true })
        : await postApi(`${import.meta.env.VITE_URL}/login`, {
            email: account?.email || localStorage.getItem("email"),
            password: secret,
          });

      if (res?.status) {
        onConfirmed(account);
      } else {
        toastError(res?.message || (hasPin ? "Wrong PIN." : "Wrong password."));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <form onSubmit={verify} className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0b1220] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 flex items-center justify-center">
              <KeyRound size={16} />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Confirm it's you</p>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                Switching to {account?.name || account?.email || "another account"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cancel" className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <input
          type="password"
          inputMode={hasPin ? "numeric" : "text"}
          maxLength={hasPin ? 4 : undefined}
          value={secret}
          onChange={(e) => setSecret(hasPin ? e.target.value.replace(/\D/g, "") : e.target.value)}
          placeholder={hasPin ? "4-digit PIN" : "Account password"}
          aria-label={hasPin ? "PIN" : "Password"}
          autoFocus
          className="mt-4 w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-white/5 dark:border-white/10 dark:text-white"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-md disabled:opacity-50"
          >
            {busy ? "Checking…" : "Switch account"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 text-sm text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
