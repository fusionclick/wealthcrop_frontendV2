import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { postApi } from "../api/api";
import { toastError } from "../utils/notifyCustom";

/**
 * SRS "Switch Accounts", main flow steps 3–5: the system asks for re-authentication, the
 * user provides credentials, and only then does the account switch.
 *
 * Switching used to write the new account into localStorage and reload — anyone holding an
 * unlocked phone could move between linked accounts. This is the missing step.
 *
 * The credential is the TARGET account's: its PIN, checked with that account's own token, or
 * its password. (The PIN used to be checked with the CURRENT account's token, which proved
 * nothing about the account being opened, and the fresh token a check returns was thrown away
 * in favour of a stored one that may have expired.) Neither is stored.
 */
const PIN_URL = () => `${import.meta.env.VITE_URL}/login-pin`;

// fetch, not axios: the target's stored token may have expired, and an axios 401 on a bearer
// request ends the CURRENT session (api.js interceptor) — the wrong account would be logged out.
const checkPin = async (token, pin) => {
  const r = await fetch(PIN_URL(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pin }),
  });
  const body = await r.json().catch(() => ({}));
  // 401 "Invalid PIN" is a wrong PIN; any other 401 means this account's session is gone.
  return { body, sessionGone: r.status === 401 && body?.message !== "Invalid PIN" };
};

export default function SwitchAccountModal({ account, onCancel, onConfirmed }) {
  const [mode, setMode] = useState(account?.token ? "pin" : "password");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const usingPin = mode === "pin";

  const finish = (token, pinSet) => {
    const fresh = { ...account, token: token || account.token };
    try {
      // Keep the stored list current, so switching back later does not reuse a stale token.
      const list = JSON.parse(localStorage.getItem("accounts")) || [];
      localStorage.setItem("accounts", JSON.stringify(list.map((a) => (a.userId === fresh.userId ? fresh : a))));
      // The PIN gate's flags describe the account being opened, as saveSession sets them.
      localStorage.setItem("pin_set", pinSet ? "true" : "false");
      localStorage.setItem("pin_expiry", Date.now() + 30 * 60 * 1000);
    } catch {
      // Storage can throw in private mode; the switch itself still proceeds.
    }
    onConfirmed(fresh);
  };

  const verify = async (e) => {
    e.preventDefault();

    if (usingPin && secret.length !== 4) return toastError("Enter the 4-digit PIN of that account.");
    if (!usingPin && secret.length < 6) return toastError("Enter that account's password.");

    setBusy(true);
    try {
      if (usingPin) {
        const { body, sessionGone } = await checkPin(account?.token, secret);
        if (body?.status) return finish(body.token, true);
        if (sessionGone) {
          setMode("password");
          setSecret("");
          return toastError("That account's session has expired. Enter its password instead.");
        }
        return toastError(body?.message || "Wrong PIN.");
      }

      // postApi shows the server's reason itself on a wrong password and returns null.
      const res = await postApi(`${import.meta.env.VITE_URL}/login`, { email: account?.email, password: secret });
      if (res?.status) finish(res.token, res.pin_set);
    } catch {
      toastError("Could not check that right now. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    // Above the mobile Profile screen, which is itself a full-screen layer at z-[99999].
    <div className="fixed inset-0 z-[100000] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
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
          key={mode}
          type="password"
          inputMode={usingPin ? "numeric" : "text"}
          maxLength={usingPin ? 4 : undefined}
          value={secret}
          onChange={(e) => setSecret(usingPin ? e.target.value.replace(/\D/g, "") : e.target.value)}
          placeholder={usingPin ? "PIN of that account" : "Password of that account"}
          aria-label={usingPin ? "PIN" : "Password"}
          autoFocus
          className="mt-4 w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-white/5 dark:border-white/10 dark:text-white"
        />

        <button
          type="button"
          onClick={() => {
            setMode(usingPin ? "password" : "pin");
            setSecret("");
          }}
          disabled={!account?.token && !usingPin}
          className="mt-2 text-xs text-blue-600 hover:underline disabled:hidden"
        >
          {usingPin ? "Use password instead" : "Use PIN instead"}
        </button>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-md disabled:opacity-50"
          >
            {busy ? "Checking…" : "Switch account"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 text-sm text-slate-500 hover:text-slate-700 dark:text-[var(--text-primary)]">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
