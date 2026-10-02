import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

/**
 * Audit #41 — SRS "Primary Phone": verified through OTP, then shown with a verified mark, and
 * from then on usable to sign in (Login → "Email or mobile number").
 *
 * No SMS provider is connected yet. Locally the server hands the OTP back (and 000000 works),
 * like every other OTP here; anywhere else it answers 503 and its message is shown as is.
 * Self-contained for the same reason SecondaryEmail.jsx is.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

export default function PrimaryPhone({ userData, refetch }) {
  const saved = userData?.phone || "";
  const verified = Boolean(Number(userData?.is_phone_verified));

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("idle"); // idle | edit | otp
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    // postApiWithToken toasts the server's own reason (a bad number, 503 "SMS is not set up")
    // and returns null, so only success needs handling here.
    const res = await postApiWithToken(api("/phone/send-otp"), { phone: phone.trim() });
    setBusy(false);
    if (res?.status) {
      setStage("otp");
      setDevOtp(res.otp || "");
      toastSuccess(res.message || "OTP sent");
    }
  };

  const verify = async () => {
    if (otp.trim().length !== 6) return toastError("Enter the 6-digit OTP.");
    setBusy(true);
    const res = await postApiWithToken(api("/phone/verify-otp"), { otp: otp.trim() });
    setBusy(false);
    if (res?.status) {
      setStage("idle");
      setOtp("");
      setDevOtp("");
      refetch?.();
      toastSuccess(res.message || "Mobile number verified");
    }
  };

  const field =
    "border border-slate-200 rounded-md px-2 py-1 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

  return (
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0">
        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Mobile Number</p>

        {stage === "idle" ? (
          <div className="flex gap-2 items-center">
            <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{saved || "--"}</p>
            {saved && verified ? (
              <>
                <ShieldCheck className="fill-green-600 shrink-0" size={20} />
                <button
                  type="button"
                  onClick={() => setStage("edit")}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 underline"
                >
                  Change
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPhone(saved);
                  setStage("edit");
                }}
                className="text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-2 rounded-md"
              >
                {saved ? "Verify" : "Add & verify"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center mt-1">
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              aria-label="Mobile number"
              disabled={stage === "otp"}
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
                  aria-label="Mobile OTP"
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
                disabled={busy || !phone.trim()}
                className="text-xs font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md disabled:opacity-50"
              >
                {busy ? "…" : "Send OTP"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setOtp("");
                setDevOtp("");
              }}
              className="text-[11px] text-gray-500 dark:text-gray-400 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {devOtp && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
            Local dev only — no SMS is sent; your OTP is {devOtp}
          </p>
        )}
        {saved && verified && stage === "idle" && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">You can sign in with this number.</p>
        )}
      </div>
    </div>
  );
}
