import { useEffect, useState } from "react";
import { getApi } from "../../api/api";
import { nodeUrl } from "../../utils/nodeApi";

/**
 * Ticket 22 — the statutory notices every buying flow shows before confirmation.
 *
 * The text and the list of which ones must be ticked come from the server (/disclaimers),
 * so legal changes wording in one place and every checkout screen follows. The tick itself
 * travels with the order: the backend refuses a purchase, SIP, switch or modification whose
 * payload does not carry it, so this component is the investor's view of that gate rather
 * than the gate itself.
 *
 * Fail-closed on purpose. If /disclaimers cannot be reached there is nothing to show and
 * nothing to tick, so the button stays disabled — the alternative is submitting an order
 * that the server will refuse anyway, with a worse message.
 */

// The shipped wording, used only until the request lands. Not a fallback to submit on: the
// order is gated on the server's own list, not on this.
const FALLBACK = {
  market_risk: "Mutual fund investments are subject to market risks. Read all scheme related documents carefully.",
  past_performance: "Past performance is not indicative of future returns. Returns shown are not guaranteed.",
};

export function useDisclaimers() {
  const [text, setText] = useState(FALLBACK);
  const [required, setRequired] = useState(null); // null = not loaded yet
  const [acked, setAcked] = useState([]);

  useEffect(() => {
    let live = true;
    getApi(nodeUrl("/disclaimers"))
      .then((res) => {
        if (!live) return;
        const data = res?.data?.data || res?.data;
        if (data?.disclaimers) setText(data.disclaimers);
        setRequired(Array.isArray(data?.required) ? data.required : []);
      })
      .catch(() => live && setRequired([]));
    return () => {
      live = false;
    };
  }, []);

  const toggle = (key) =>
    setAcked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const ready = Array.isArray(required) && required.length > 0 && required.every((k) => acked.includes(k));

  return { text, required, acked, toggle, ready };
}

export default function OrderDisclaimers({ text, required, acked, toggle, className = "" }) {
  if (!Array.isArray(required)) {
    return <p className={`text-[11px] text-slate-400 ${className}`}>Loading disclosures…</p>;
  }
  // Everything is shown; only the required ones get a checkbox.
  const keys = [...new Set([...required, ...Object.keys(text)])];
  return (
    <div className={`rounded-lg border border-slate-200 dark:border-[var(--border-color)] p-3 space-y-2 ${className}`}>
      {keys.map((key) =>
        required.includes(key) ? (
          <label key={key} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acked.includes(key)}
              onChange={() => toggle(key)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-[11px] leading-snug text-slate-700 dark:text-[var(--text-secondary)]">
              {text[key]}
            </span>
          </label>
        ) : (
          <p key={key} className="text-[11px] leading-snug text-slate-500 dark:text-[var(--text-secondary)] pl-6">
            {text[key]}
          </p>
        )
      )}
    </div>
  );
}
