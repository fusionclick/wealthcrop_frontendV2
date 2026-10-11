import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Clock, Rocket } from "lucide-react";
import { getApi } from "../api/api";
import { fundPath } from "../utils/nodeApi";
import { titleCase } from "../utils/schemeName";
import { daysToClose, groupNfos } from "../utils/nfo";

// Client 2026-10-09 — "the New Fund Offer section does not show anything". It never could:
// no NFO feed exists. NFOs are now entered by operations in Admin → New Fund Offers (Regular
// plans only) and read here, sorted into Open Now / Upcoming / Recently Closed by their dates.
export const fetchNfos = () =>
  // getApi hands back the response body: { status, data: [...] }.
  getApi(`${import.meta.env.VITE_URL}/nfos`).then((body) => (Array.isArray(body?.data) ? body.data : []));

const TABS = [
  ["open", "Open Now"],
  ["upcoming", "Upcoming"],
  ["closed", "Recently Closed"],
];
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmt = (d) => {
  const t = Date.parse(String(d || "").slice(0, 10));
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-") : "—";
};

export function NfoCard({ nfo, status }) {
  const navigate = useNavigate();
  const left = daysToClose(nfo);
  const canApply = status === "open" && (nfo.scheme_isin || nfo.scheme_bse_code);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] p-5 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded border ${
            status === "open"
              ? "text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              : status === "upcoming"
              ? "text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:border-blue-500/30 dark:bg-blue-500/10"
              : "text-slate-600 border-slate-300 bg-slate-50 dark:text-[var(--text-secondary)] dark:border-[var(--border-color)] dark:bg-[var(--white-5)]"
          }`}
        >
          {status === "open" ? "OPEN NOW" : status === "upcoming" ? "UPCOMING" : "CLOSED"}
        </span>
        {status === "open" && (
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock size={13} /> {left === 0 ? "Closes today" : `Closes in ${left} day${left === 1 ? "" : "s"}`}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">{titleCase(nfo.scheme_name)}</h3>
      <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
        {[nfo.category, nfo.sub_category].filter(Boolean).join(" • ")}
        {nfo.risk ? ` | ${nfo.risk} Risk` : ""}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-[var(--white-5)] p-3 text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">Min. Investment</p>
          <p className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">
            {nfo.min_sip ? `${money(nfo.min_sip)} / SIP` : nfo.min_investment ? `${money(nfo.min_investment)} / Lumpsum` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">{status === "upcoming" ? "Opens" : "Close Date"}</p>
          <p className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">{fmt(status === "upcoming" ? nfo.open_date : nfo.close_date)}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-auto pt-4">
        {canApply && (
          <button
            type="button"
            onClick={() => navigate(fundPath(nfo.scheme_isin, nfo.scheme_bse_code), { state: { code: nfo.scheme_bse_code, buy: true } })}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5"
          >
            Apply for NFO
          </button>
        )}
        {nfo.sid_url && (
          <a href={nfo.sid_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center rounded-lg border border-slate-300 dark:border-[var(--border-color)] text-sm font-medium py-2.5 text-slate-700 dark:text-[var(--text-primary)]">
            Scheme documents
          </a>
        )}
      </div>
    </div>
  );
}

const NFO = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("open");
  const { data = [], isLoading, isError } = useQuery({ queryKey: ["nfos"], queryFn: fetchNfos, staleTime: 10 * 60 * 1000 });
  const groups = groupNfos(data);
  const shown = groups[tab];

  return (
    <div className="min-h-screen bg-blue-50 px-4 sm:px-6 py-10 dark:bg-[var(--app-bg)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-200">New Fund Offers (NFOs)</h1>
            <p className="text-gray-600 dark:text-slate-400">Initial subscription offers across Asset Management Companies — Regular plans.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  tab === key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-300 text-slate-700 bg-white dark:bg-[var(--white-5)] dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
                }`}
              >
                {label}
                {key === "open" ? ` (${groups.open.length})` : ""}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-slate-400 py-16">Loading NFOs…</p>
        ) : shown.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shown.map((n) => (
              <NfoCard key={n.id} nfo={n} status={tab} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] p-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Rocket size={24} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-slate-200">
              {isError ? "NFOs could not be loaded" : tab === "open" ? "No Active NFOs Currently Open" : tab === "upcoming" ? "No Upcoming NFOs Announced" : "No NFOs Closed Recently"}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 max-w-xl mx-auto">
              {isError
                ? "Please try again in a little while."
                : "There are no new fund offers in this list right now. Explore newly listed funds with an established NAV history instead."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/user/mutual_fund/explore?sort=age:asc")}
              className="mt-5 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-[var(--border-color)] text-sm font-medium text-slate-700 dark:text-[var(--text-primary)]"
            >
              Browse Newly Listed Funds
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFO;
