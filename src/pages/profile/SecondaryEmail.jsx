import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

/**
 * SRS page 2 — Secondary Email: add one, verify it by OTP, show the verified mark.
 *
 * Self-contained on purpose. The primary email's verify/edit path runs through this page's
 * shared modal and an `editType` string switch, duplicated across the mobile and desktop
 * layouts; threading a second address through that is a bigger change than owning the two
 * calls here.
 *
 * It is a recovery address, never a login identity — the server refuses one that equals
 * the primary, and clears the tick if the address is pointed somewhere new.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

export default function SecondaryEmail({ userData, refetch }) {
  const saved = userData?.secondary_email || "";
  const verified = Boolean(userData?.is_secondary_email_verified);

  const [email, setEmail] = useState(saved);
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("idle"); // idle | otp
  const [busy, setBusy] = useState(false);
  // Local dev only: the server returns the OTP instead of mailing it (never in production).
  const [devOtp, setDevOtp] = useState("");

  // QA 2.2 — the verified tick vanished after a refresh. `saved` and `verified` come straight
  // off userData and update when it loads, but `email` is state and `useState(saved)` only
  // captured the value from the FIRST render — when the parent (BasicDetails has no loading
  // guard) rendered this with userData still undefined, so `saved` was "". After the data
  // arrived, `email` stayed "" while `saved` became the real address, so `email === saved`
  // below was false and the verified branch never rendered. Re-sync when the saved address
  // changes and we are not mid-verify (deps exclude keystrokes, so typing a new one is safe).
  useEffect(() => {
    if (stage === "idle") setEmail(saved);
  }, [saved, stage]);

  const send = async () => {
    if (!email.trim()) return toastError("Enter an email address.");
    setBusy(true);
    try {
      const res = await postApiWithToken(api("/secondary-email/send-otp"), {
        secondary_email: email.trim(),
      });
      if (res?.status) {
        setStage("otp");
        setDevOtp(res?.otp || "");
        toastSuccess(res?.data?.message || "OTP sent");
      } else if (res) {
        // postApiWithToken returns null on an HTTP error and has already toasted the
        // server's own reason. A second generic toast here buried "that is already your
        // primary email" under "Could not send the OTP", so QA reported the wrong cause.
        toastError(res?.data?.message || "Could not send the OTP.");
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (otp.trim().length !== 6) return toastError("Enter the 6-digit OTP.");
    setBusy(true);
    try {
      const res = await postApiWithToken(api("/secondary-email/verify-otp"), { otp: otp.trim() });
      if (res?.status) {
        setStage("idle");
        setOtp("");
        setDevOtp("");
        refetch?.();
        toastSuccess(res?.data?.message || "Secondary email verified");
      } else if (res) {
        toastError(res?.data?.message || "Invalid OTP.");
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const field =
    "border border-slate-200 rounded-md px-2 py-1 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

  return (
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0">
        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">
          Secondary Email <span className="text-xs text-gray-400">· for account recovery</span>
        </p>

        {/* Verified and unchanged: just the address and its mark. */}
        {saved && verified && email === saved && stage === "idle" ? (
          <div className="flex gap-2 items-center">
            <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)] truncate">{saved}</p>
            <ShieldCheck className="fill-green-600 shrink-0" size={20} />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center mt-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Secondary email"
              className={field}
            />
            {stage === "otp" ? (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit OTP"
                  aria-label="Secondary email OTP"
                  className={`${field} w-28`}
                />
                <button
                  type="button"
                  onClick={verify}
                  disabled={busy}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md disabled:opacity-50"
                >
                  {busy ? "…" : "Verify"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={send}
                disabled={busy}
                className="text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md disabled:opacity-50"
              >
                {busy ? "…" : saved ? "Re-verify" : "Add & verify"}
              </button>
            )}
          </div>
        )}

        {stage === "otp" && devOtp && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">Local dev only — no email is sent; your OTP is {devOtp}</p>
        )}

        {saved && !verified && stage === "idle" && (
          <p className="text-[11px] text-amber-600 mt-1">Not verified yet — it cannot recover your account until it is.</p>
        )}
      </div>
    </div>
  );
}
