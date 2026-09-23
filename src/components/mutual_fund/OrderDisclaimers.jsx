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
  // AMFI §1.A.1 / §1.B — the distributor identity and the commission-structure link travel
  // with the text so one response defines what a checkout must show. A blank commission URL
  // renders no link at all: a dead link looks like disclosure and is not.
  const [meta, setMeta] = useState({ distributor: null, commissionUrl: "", commissionVersion: "", consentVersion: "" });

  useEffect(() => {
    let live = true;
    getApi(nodeUrl("/disclaimers"))
      .then((res) => {
        if (!live) return;
        const data = res?.data?.data || res?.data;
        if (data?.disclaimers) setText(data.disclaimers);
        setRequired(Array.isArray(data?.required) ? data.required : []);
        setMeta({
          distributor: data?.distributor || null,
          commissionUrl: String(data?.commission_url || ""),
          commissionVersion: String(data?.commission_structure_version || ""),
          consentVersion: String(data?.consent_text_version || ""),
        });
      })
      .catch(() => live && setRequired([]));
    return () => {
      live = false;
    };
  }, []);

  const toggle = (key) =>
    setAcked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const ready = Array.isArray(required) && required.length > 0 && required.every((k) => acked.includes(k));

  return { text, required, acked, toggle, ready, ...meta };
}

/**
 * The extra links AMFI requires NEXT TO the consent they belong to, rather than buried in a
 * footer: a commission structure the investor is agreeing to pay, and the scheme documents
 * they are confirming they have read.
 *
 * `schemeDocsUrl` is the AMC's own scheme-documents page, which is the only thing this
 * platform holds — BSE's master carries no SID/SAI/KIM URLs and no free feed publishes them
 * per document. It is labelled as the AMC's page rather than as three deep links, because
 * claiming a direct KIM link that actually lands on a downloads index is worse than saying
 * where it goes.
 */
const linkClass =
  "underline underline-offset-2 text-[var(--accent,#ED1C24)] hover:opacity-80";

function ConsentExtra({ consentKey, commissionUrl, schemeDocsUrl, schemeName }) {
  if (consentKey === "regular_plan_commission" && commissionUrl) {
    return (
      <>
        {" "}
        <a href={commissionUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          View our AMC-wise trail commission structure
        </a>
      </>
    );
  }
  if (consentKey === "scheme_documents" && schemeDocsUrl) {
    return (
      <>
        {" "}
        <a href={schemeDocsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Open the SID, SAI and KIM for {schemeName || "this scheme"} on the AMC's site
        </a>
      </>
    );
  }
  return null;
}

export default function OrderDisclaimers({
  text,
  required,
  acked,
  toggle,
  commissionUrl = "",
  schemeDocsUrl = "",
  schemeName = "",
  className = "",
}) {
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
              <ConsentExtra
                consentKey={key}
                commissionUrl={commissionUrl}
                schemeDocsUrl={schemeDocsUrl}
                schemeName={schemeName}
              />
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
