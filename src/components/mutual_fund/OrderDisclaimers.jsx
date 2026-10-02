import { useEffect, useId, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { getApi } from "../../api/api";
import { nodeUrl } from "../../utils/nodeApi";
import { schemeDocsFor, selectedSchemeDocuments } from "../../utils/schemeDocs";
import { usePlatformSettings } from "../../hooks/usePlatformSettings";
import { EXEC_KEY, RM_KEY, isAcknowledged, wireAcks } from "../../utils/disclaimerAcks";

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
  // The boxes the investor has ticked. `acked` (below) is what travels with the order.
  const [checked, setChecked] = useState([]);
  const [rmEuin, setRmEuinState] = useState("");
  // AMFI §1.A.1 / §1.B — the distributor identity and the commission-structure link travel
  // with the text so one response defines what a checkout must show. A blank commission URL
  // renders no link at all: a dead link looks like disclosure and is not.
  const [meta, setMeta] = useState({
    distributor: null,
    commissionUrl: "",
    commissionVersion: "",
    commissionPublished: false,
    consentVersion: "",
    rms: [],
  });

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
          commissionPublished: data?.commission_published === true,
          consentVersion: String(data?.consent_text_version || ""),
          rms: Array.isArray(data?.rms) ? data.rms.filter((r) => r?.euin) : [],
        });
      })
      .catch(() => live && setRequired([]));
    return () => {
      live = false;
    };
  }, []);

  const toggle = (key) =>
    setChecked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // Who helped (or that nobody did) IS the statement, so changing it clears the tick.
  const setRmEuin = (euin) => {
    setRmEuinState(String(euin || ""));
    setChecked((prev) => prev.filter((k) => k !== RM_KEY && k !== EXEC_KEY));
  };

  // Audit #33 — execution-only OR assisted-by-<EUIN>, never both (utils/disclaimerAcks.js).
  const acked = wireAcks(checked, rmEuin);
  const ready =
    Array.isArray(required) && required.length > 0 && required.every((k) => isAcknowledged(k, checked, rmEuin));

  return { text, required, checked, acked, toggle, ready, rmEuin, setRmEuin, ...meta };
}

/**
 * Audit #32 — which scheme this checkout is for, without every page having to say so: the
 * page's own `schemeName`, else the route (/mutual_fund/:isin/:code/…), else router state
 * (redeem/switch arrive with the holding's code). The name is only used to pick the fund
 * house whose documents to link — a switch stays inside one AMC, so the source's house is
 * the destination's too. Unknown leaves SEBI's register, which is never wrong.
 */
function useSchemeName(given = "") {
  const { isin, code } = useParams();
  const state = useLocation().state || {};
  const known = given || state.fund?.name || state.scheme_name || state.name || "";
  const lookupIsin = isin || state.isin || state.fund?.scheme_isin || "";
  const lookupCode = code || state.scheme_bse_code || state.code || state.fund?.scheme_bse_code || "";
  const [fetched, setFetched] = useState("");

  useEffect(() => {
    if (known || (!lookupIsin && !lookupCode)) return undefined;
    let live = true;
    // axios, not postApi: a background lookup must not toast. Failing, SEBI's register stands.
    axios
      .post(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), { isin: lookupIsin, scheme_code: lookupCode })
      .then((res) => live && setFetched(String(res?.data?.data?.lists?.[0]?.name || "")))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [known, lookupIsin, lookupCode]);

  return known || fetched;
}

/**
 * The extra links AMFI requires NEXT TO the consent they belong to, rather than buried in a
 * footer: a commission structure the investor is agreeing to pay, and the scheme documents
 * they are confirming they have read.
 *
 * Scheme documents come from ONE maintained map (utils/schemeDocs.js) — BSE's master carries
 * no SID/SAI/KIM URLs and no free feed publishes them per scheme. The label says where the
 * link goes (the fund house's site, or SEBI's register), because promising a direct KIM link
 * that lands on a downloads index is worse than saying so. The `schemeDocsUrl` a page may
 * still pass is ignored on purpose: it was the AMC factsheet URL, not a documents page.
 */
const linkClass =
  "underline underline-offset-2 text-[var(--accent,#ED1C24)] hover:opacity-80";

function ConsentExtra({ consentKey, commissionUrl, commissionPublished, schemeName, documents }) {
  if (consentKey === "regular_plan_commission" && commissionUrl) {
    return (
      <>
        {" "}
        <a href={commissionUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          View our AMC-wise trail commission structure
        </a>
        {/* The page is linked before the AMC-wise rates exist; it says so, and so does this. */}
        {commissionPublished ? null : " (rates not yet published)"}
      </>
    );
  }
  if (consentKey === "scheme_documents") {
    if (documents?.length) return documents.map((doc, i) => (
      <span key={doc.code || doc.isin || i} className="block mt-1">
        {doc.name || "Selected scheme"}: {doc.available ? ["sid", "sai", "kim"].map((kind) => (
          <a key={kind} href={doc[kind]} target="_blank" rel="noopener noreferrer" className={`${linkClass} mr-2`}>{kind.toUpperCase()}</a>
        )) : <span>Direct SID/SAI/KIM links are not published for this scheme yet. <a href={schemeDocsFor(doc.name).url} target="_blank" rel="noopener noreferrer" className={linkClass}>Fund house documents</a></span>}
      </span>
    ));
    const { amc, url } = schemeDocsFor(schemeName);
    return (
      <>
        {" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {amc
            ? `Scheme documents (SID/SAI/KIM) on the ${amc} website`
            : "Find the SID on SEBI's register of Scheme Information Documents (the SAI and KIM are on the fund house's website)"}
        </a>
      </>
    );
  }
  return null;
}

const fill = (template, rm) =>
  String(template || "")
    .split("{rm}").join(rm?.name || "your relationship manager")
    .split("{euin}").join(rm?.euin || "");

/** Audit #33 — "assisted by", offered only when the admin has registered RMs. */
function AssistedBy({ rms, rmEuin, setRmEuin }) {
  const group = useId();
  const field =
    "rounded-md border border-slate-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] text-slate-800 dark:text-[var(--text-primary)] px-2 py-1 text-[13px]";
  return (
    <fieldset className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-[var(--border-color)]">
      <legend className="text-[13px] font-medium text-slate-800 dark:text-[var(--text-primary)] mb-1">
        How are you placing this order?
      </legend>
      <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[var(--text-secondary)] cursor-pointer">
        <input type="radio" name={group} checked={!rmEuin} onChange={() => setRmEuin("")} />
        On my own, without advice from any of our staff (execution-only)
      </label>
      <label className="flex flex-wrap items-center gap-2 text-[13px] text-slate-700 dark:text-[var(--text-secondary)] cursor-pointer">
        <input type="radio" name={group} checked={Boolean(rmEuin)} onChange={() => setRmEuin(rms[0].euin)} />
        With help from a relationship manager
        {rmEuin ? (
          <select value={rmEuin} onChange={(e) => setRmEuin(e.target.value)} aria-label="Relationship manager" className={field}>
            {rms.map((r) => (
              <option key={r.euin} value={r.euin}>
                {r.name || "Relationship manager"} · EUIN {r.euin}
              </option>
            ))}
          </select>
        ) : null}
      </label>
    </fieldset>
  );
}

export default function OrderDisclaimers({
  text,
  required,
  checked,
  acked,
  toggle,
  commissionUrl = "",
  commissionPublished = false,
  rms = [],
  rmEuin = "",
  setRmEuin,
  schemeName = "",
  schemes = [],
  className = "",
}) {
  const scheme = useSchemeName(schemeName);
  const params = useParams();
  const state = useLocation().state || {};
  const { data: settings } = usePlatformSettings();
  const selected = schemes.length ? schemes : [{ name: scheme, code: params.code || state.scheme_bse_code || state.code, isin: params.isin || state.isin }];
  const documents = selectedSchemeDocuments(selected, settings?.scheme_media || []);
  if (!Array.isArray(required)) {
    return <p className={`text-[13px] text-slate-500 dark:text-[var(--text-secondary)] ${className}`}>Loading disclosures…</p>;
  }
  // `checked` from useDisclaimers; a caller passing only `acked` still sees its ticks.
  const ticked = checked || acked || [];
  const offerRm = rms.length > 0 && required.includes(EXEC_KEY) && typeof setRmEuin === "function";
  const rm = offerRm ? rms.find((r) => r.euin === rmEuin) : null;
  // Everything is shown; only the required ones get a checkbox. The RM declaration is not a
  // notice of its own — it takes execution_only's place when the investor was assisted.
  const keys = [...new Set([...required, ...Object.keys(text)])].filter((k) => k !== RM_KEY);
  return (
    <div className={`rounded-lg border border-slate-200 dark:border-[var(--border-color)] p-3 space-y-2 ${className}`}>
      {offerRm ? <AssistedBy rms={rms} rmEuin={rmEuin} setRmEuin={setRmEuin} /> : null}
      {keys.map((key) => {
        const declKey = key === EXEC_KEY && rm ? RM_KEY : key;
        const body = declKey === RM_KEY ? fill(text[RM_KEY], rm) : text[key];
        return required.includes(key) ? (
          <label key={key} className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ticked.includes(declKey)}
              onChange={() => toggle(declKey)}
              className="mt-0.5 shrink-0"
            />
            {/* Audit #32 — 13px, not 11: these are the statements the investor signs. */}
            <span className="text-[13px] leading-snug text-slate-700 dark:text-[var(--text-secondary)]">
              {body}
              <ConsentExtra
                consentKey={key}
                commissionUrl={commissionUrl}
                commissionPublished={commissionPublished}
                schemeName={scheme}
                documents={documents}
              />
            </span>
          </label>
        ) : (
          <p key={key} className="text-[13px] leading-snug text-slate-500 dark:text-[var(--text-secondary)] pl-6">
            {text[key]}
          </p>
        );
      })}
    </div>
  );
}
