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
 */
export default function EnachAuthorization({
  sipAmount,
  maxLimit = 100000,
  onAuthorize,
  onSkip,
  busy = false,
}) {
  const [error, setError] = useState("");
  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const authorize = async () => {
    setError("");
    try {
      await onAuthorize();
    } catch (e) {
      setError(e?.message || "We could not set up the auto-debit. Your SIP is registered; you can try again from Manage SIP.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-3">
      <h3 className="font-semibold text-[var(--text-primary)]">Auto-Debit Authorization (e-NACH)</h3>

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

      {error ? <p className="text-[12px] text-red-500">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={authorize}
          disabled={busy}
          className="flex-1 rounded-lg bg-[var(--accent,#ED1C24)] text-white py-2 font-semibold disabled:opacity-60"
        >
          {busy ? "Opening your bank…" : "Authorise auto-debit"}
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
        You will be taken to your bank to confirm. Your SIP is already registered either way —
        without a mandate you approve each instalment yourself.
      </p>
    </div>
  );
}
