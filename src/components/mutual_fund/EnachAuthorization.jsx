import { useState } from "react";

/**
 * §2 row 5 + §3.A — "Auto-Debit Authorization (e-NACH)".
 *
 * ── What this replaces ───────────────────────────────────────────────────────────────────
 * The SIP page used to register a UPI AutoPay mandate silently, in a `catch {}`, the instant
 * a registration succeeded. The investor authorised a standing debit on their bank account
 * without being asked, without seeing the limit, and without any way to decline. The spec
 * requires an explicit act; so does the bank.
 *
 * ── "Mandate Limit Shock" ────────────────────────────────────────────────────────────────
 * §3.A names the problem this screen exists to solve: an investor setting up a ₹2,000 SIP is
 * shown a ₹1,00,000/day authorisation and reasonably concludes they are about to be charged
 * ₹1,00,000. The limit is a CEILING that lets them step up later without re-authenticating
 * with their bank — so the explanation is not decoration, it is the difference between a
 * completed setup and an abandoned one, and it sits next to the number rather than behind a
 * tooltip.
 *
 * ── Audit #22 ────────────────────────────────────────────────────────────────────────────
 * The investor now chooses HOW to authorise, gives a UPI ID when that is the channel, and is
 * told what BSE actually answered: a mandate is "awaiting your approval" (with BSE's approval
 * page, or the UPI app to look in) until the bank confirms it. "Auto-debit authorised." used
 * to show whatever BSE said, including when it refused.
 */
export const MANDATE_MODES = [
  { value: "upi", label: "UPI AutoPay", hint: "Approve a request in your UPI app." },
  { value: "netbanking", label: "NetBanking", hint: "Approve on your bank's NetBanking page." },
  { value: "debit_card", label: "Debit card", hint: "Approve with your bank's debit card." },
  { value: "aadhaar", label: "Aadhaar eSign", hint: "Approve with an Aadhaar OTP eSign." },
];

// Audit #33 — the consent header names the mandate actually being registered: it said
// "e-NACH" while the UPI flow registered UPI AutoPay. NetBanking / debit card / Aadhaar are
// the e-NACH (e-mandate) channels.
export const mandateLabel = (mode) => (mode === "upi" ? "UPI AutoPay" : "e-NACH");

// Same shape the server checks (Backend/src/mf/mandate.js). Checked here only so the
// investor hears about a typo before a round trip.
const VPA = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
export const validUpiId = (v) => VPA.test(String(v || "").trim());

export default function EnachAuthorization({
  sipAmount,
  maxLimit = 100000,
  onAuthorize,
  onSkip,
  onDone,
  busy = false,
  disclosuresReady = false,
}) {
  const [error, setError] = useState("");
  const [mode, setMode] = useState("upi");
  const [vpa, setVpa] = useState("");
  const [result, setResult] = useState(null);
  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const vpaBad = mode === "upi" && vpa.trim() !== "" && !validUpiId(vpa);
  const ready = disclosuresReady && (mode !== "upi" || validUpiId(vpa));

  const authorize = async () => {
    setError("");
    try {
      // Resolves only on BSE's own success; anything else throws with BSE's reason.
      setResult(await onAuthorize({ mode, vpa: mode === "upi" ? vpa.trim() : undefined }));
    } catch (e) {
      setError(e?.message || "We could not set up the auto-debit. Your SIP is registered; you can try again from Manage SIP.");
    }
  };

  if (result) {
    const approved = result.state === "approved";
    return (
      <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-3">
        <h3 className="font-semibold text-[var(--text-primary)]">Auto-Debit Authorization ({mandateLabel(result.mode || mode)})</h3>
        <p className={`text-sm font-medium ${approved ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-300"}`}>
          {approved ? "Auto-debit is active." : "Registered with BSE — awaiting your approval."}
        </p>
        {!approved && (
          <p className="text-[12px] leading-snug text-[var(--text-secondary)]">
            {result.mode === "upi"
              ? "Open your UPI app and approve the AutoPay request. Until you do, nothing is debited automatically."
              : "Approve the mandate on your bank's page. Until you do, nothing is debited automatically."}
          </p>
        )}
        {!approved && result.approval_link ? (
          <a
            href={result.approval_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-[var(--accent,#ED1C24)] text-white px-4 py-2 text-sm font-semibold"
          >
            Open the approval page
          </a>
        ) : null}
        <p className="text-[11px] text-[var(--text-secondary)]">
          BSE mandate {result.exch_mandate_id || "—"} · We have also sent this to your notifications.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-300 dark:border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-primary)]"
        >
          Go to Manage SIPs
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-3">
      <h3 className="font-semibold text-[var(--text-primary)]">Auto-Debit Authorization ({mandateLabel(mode)})</h3>

      <div className="flex items-baseline justify-between">
        <span className="text-sm text-[var(--text-secondary)]">Max Limit</span>
        <span className="font-semibold text-[var(--text-primary)]">{inr(maxLimit)} / day</span>
      </div>

      {/* The explanatory card §3.A specifies, with this SIP's real amount in it rather than a
          generic example — the number the investor recognises is the one that reassures. */}
      <p className="text-[12px] leading-snug text-[var(--text-secondary)] bg-[var(--white-5)] rounded-lg p-3">
        This limit allows you to step up your SIPs or add new investments in the future without
        re-authenticating with your bank every time. Your bank account will <strong>only</strong> be
        debited for your active SIP amount{sipAmount ? ` (${inr(sipAmount)} per instalment)` : ""}.
      </p>

      <fieldset className="space-y-1.5">
        <legend className="text-sm text-[var(--text-secondary)] mb-1">How do you want to authorise?</legend>
        {MANDATE_MODES.map((m) => (
          <label key={m.value} className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="mandate-mode"
              value={m.value}
              checked={mode === m.value}
              onChange={() => setMode(m.value)}
              className="mt-1"
            />
            <span className="text-sm text-[var(--text-primary)]">
              {m.label}
              <span className="block text-[11px] text-[var(--text-secondary)]">{m.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {mode === "upi" && (
        <label className="block">
          <span className="text-sm text-[var(--text-secondary)]">Your UPI ID</span>
          <input
            type="text"
            value={vpa}
            onChange={(e) => setVpa(e.target.value)}
            placeholder="yourname@okhdfcbank"
            autoComplete="off"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] bg-transparent dark:border-[var(--border-color)]"
          />
          {vpaBad ? <span className="block mt-1 text-[11px] text-red-500">That does not look like a UPI ID — it is name@bank.</span> : null}
        </label>
      )}

      {error ? <p className="text-[12px] text-red-500">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={authorize}
          disabled={busy || !ready}
          className="flex-1 rounded-lg bg-[var(--accent,#ED1C24)] text-white py-2 font-semibold disabled:opacity-60"
        >
          {busy ? "Registering with BSE…" : "Authorise auto-debit"}
        </button>
        {/* Declining has to be possible and has to be safe. The SIP is already registered;
            an investor who would rather pay each instalment by hand is not blocked. */}
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="rounded-lg border border-slate-300 dark:border-[var(--border-color)] px-4 py-2 text-sm"
        >
          Not now
        </button>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)]">
        You will approve this with your bank or UPI app. Your SIP is already registered either way —
        without a mandate you approve each instalment yourself.
      </p>
    </div>
  );
}
