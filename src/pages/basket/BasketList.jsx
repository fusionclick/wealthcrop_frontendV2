import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import basket_dashboard from "../../assets/basket/basket_dashboard.png";
import BasketCard from "./BasketCard";
import BasketBuilderModal from "./BasketBuilderModal";
import { getApiWithToken } from "../../api/api";
import { useDistributorIdentity } from "../../components/DistributorIdentity";

// Client 2026-10-09 — category tabs. Curated baskets carry their `kind` from the server;
// anything an investor built is a Custom basket (older rows have no kind at all).
const TABS = [
  ["all", "All"],
  ["goal_based", "Goal-Based"],
  ["thematic", "Thematic"],
  ["asset_allocation", "Asset Allocation"],
  ["custom", "Custom Baskets"],
];
const kindOf = (b) => (b?.is_curated && b?.kind ? b.kind : "custom");

export default function BasketList({ baskets: initial }) {
  const [tab, setTab] = useState("all");
  const [building, setBuilding] = useState(false);
  const qc = useQueryClient();
  const info = useDistributorIdentity();

  // Read here rather than only from App's one-off fetch, so a basket created in the modal
  // shows up without a reload.
  const { data: baskets = Array.isArray(initial) ? initial : [] } = useQuery({
    queryKey: ["baskets"],
    queryFn: () => getApiWithToken(`${import.meta.env.VITE_URL}/baskets`).then((res) => res?.data?.data ?? []),
    initialData: Array.isArray(initial) && initial.length ? initial : undefined,
  });

  const filtered = baskets.filter((b) => tab === "all" || kindOf(b) === tab);
  const label = TABS.find(([k]) => k === tab)?.[1];

  return (
    <div className="min-h-screen px-4 sm:px-12 py-8 bg-[#f3f7fb] dark:bg-[var(--app-bg)]">
      {/*  LIGHT / DARK BANNER */}
      <div
        className="
      bg-linear-to-r from-[#e8f2ff] to-[#f4faff]
      rounded-2xl p-8 shadow-md border border-[#e0e7ef]
      flex items-center justify-between mb-10

      dark:from-[var(--white-10)] dark:to-[var(--white-10)]
      dark:border-[var(--border-color)]
    "
      >
        <div className="max-w-lg">
          <h1 className="text-3xl font-bold leading-tight text-blue-900 dark:text-[var(--text-primary)]">Mutual Fund Baskets</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-[var(--text-secondary)]">
            Curated Mutual Fund Baskets, or build your own from 2 to 5 schemes.
          </p>
          <button
            type="button"
            onClick={() => setBuilding(true)}
            className="mt-5 px-6 py-2.5 rounded-lg shadow transition bg-blue-500 text-white hover:bg-blue-600"
          >
            + Create Basket
          </button>
        </div>
        <img src={basket_dashboard} className="w-36 opacity-80 hidden sm:block" alt="Investment" />
      </div>

      {/* CATEGORY TABS */}
      <div className="flex gap-3 mb-6 flex-wrap" role="tablist">
        {TABS.map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              tab === key
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-slate-700 border-[#d2dae3] hover:bg-blue-50 dark:bg-[var(--white-5)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)] dark:hover:bg-blue-500/15"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-[#e0e7ef] p-10 text-center max-w-lg mx-auto dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-[var(--text-primary)]">
            {tab === "all" ? "No baskets yet" : `No ${label} baskets yet`}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            {tab === "custom" || tab === "all" ? "Build your own basket from 2 to 5 schemes." : "Curated baskets of this kind will appear here once published."}
          </p>
          <button
            type="button"
            onClick={() => setBuilding(true)}
            className="mt-5 px-6 py-3 rounded-xl shadow transition bg-blue-500 text-white hover:bg-blue-600"
          >
            + Create Basket
          </button>
        </div>
      )}

      {/* BASKET CARD GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((basket) => (
          <BasketCard key={basket.id} basket={basket} />
        ))}
      </div>

      {/* Client 2026-10-09 — mandatory, persistent footnote. The entity and ARN are the
          server's (Admin → Settings), never typed into the bundle. */}
      <p className="mt-10 rounded-xl border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] p-4 text-xs leading-relaxed text-slate-600 dark:text-[var(--text-secondary)]">
        Mutual Fund Baskets are pre-configured execution tools provided solely for user convenience.{" "}
        {info?.entity || "Wealthcrop"}
        {info?.arn ? ` (${info.arn})` : ""} operates as an AMFI-registered Mutual Fund Distributor offering Regular Plans.
      </p>

      {building && <BasketBuilderModal onClose={() => setBuilding(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["baskets"] })} />}
    </div>
  );
}
