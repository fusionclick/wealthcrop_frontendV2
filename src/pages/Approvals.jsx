import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiWithToken } from "../api/api";

/**
 * SRS §4 — transactions held for authorisation.
 *
 * Read-only on purpose. Nothing here can be acted on by the investor: an approval is
 * someone else's decision, and the only thing they do with it is place the order again.
 * Saying that plainly is the whole job of this page.
 */

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KIND = { purchase: "Lumpsum", sip: "SIP", stp: "STP", switch: "Switch" };

const STATE = {
  pending: {
    label: "Awaiting approval",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  rejected: {
    label: "Not approved",
    className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
};

export default function Approvals() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["orderApprovals"],
    queryFn: () => getApiWithToken(`${import.meta.env.VITE_URL}/order-approvals`),
    select: (res) => res?.data || [],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-[var(--text-primary)]">Approvals</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            Transactions above a certain amount are checked by our team before they can be
            placed. Nothing below has reached the exchange.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
              Nothing has needed approval. Your transactions have all gone straight through.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const state = STATE[r.status] || STATE.pending;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-[var(--text-primary)]">
                        {r.scheme_name || r.scheme_code}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
                        {KIND[r.kind] || r.kind} · {money(r.amount)}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${state.className}`}>
                      {state.label}
                    </span>
                  </div>

                  {r.review_note && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-[var(--text-secondary)]">{r.review_note}</p>
                  )}

                  {/* The three things an investor actually needs to know, and only the
                      one that applies. */}
                  <p className="mt-2 text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
                    {r.status === "approved" && r.usable && (
                      <>Approved — place this transaction again to complete it. This clearance is for one
                      transaction at this amount{r.expires_at ? `, and lapses ${new Date(r.expires_at).toLocaleString("en-IN")}` : ""}.</>
                    )}
                    {r.status === "approved" && !r.usable && (
                      <>{r.consumed_at ? "This clearance has been used." : "This clearance has lapsed — place the transaction again to request a new one."}</>
                    )}
                    {r.status === "pending" && <>We will notify you as soon as this is reviewed.</>}
                    {r.status === "rejected" && <>Nothing was placed. Contact support if you think this is wrong.</>}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
