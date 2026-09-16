import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { nodeUrl, mapXspToSip, xspItems } from "../../utils/nodeApi";
import { ordinal } from "../../utils/sipDates";
import { SXP_LABEL } from "../../utils/sxp";

/**
 * Tickets 17 and 18 — see and stop a running SWP or STP.
 *
 * Deliberately not ManageSipPage with tabs bolted on. That page is a SIP console: top-up,
 * pause, resume and a modify that re-registers, none of which an SWP or an STP has, and its
 * wording is SIP's from top to bottom. A withdrawal plan only ever needs two things — what
 * is running, and a way to stop it — so this is that, and the SIP page stays untouched.
 *
 * ponytail: no pause/modify here. BSE can pause an SWP, but nobody asked for it; add it
 * when someone does.
 */
const ManageSxpPage = ({ type = "swp" }) => {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;
  const what = SXP_LABEL[type] || "Plan";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!ucc) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    // sxp_type sits at the top of `data`, not inside filter_param: /sxp_list rejects every
    // filter_param key, so the server narrows the list by type after BSE answers.
    postApiWithToken(nodeUrl(import.meta.env.VITE_GET_ALL_XSP || "/getAllXsp"), {
      data: { fields: ["ALL"], count_only: false, start: 0, length: 50, sxp_type: type },
    })
      .then((res) => live && setRows(xspItems(res).map((item, i) => mapXspToSip(item, i))))
      .catch(() => live && setRows([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [ucc, type]);

  const cancel = async (row) => {
    setCancelling(row.id);
    // The server owns reason_cd and reads sxp_type off the registration itself, and refuses
    // a reg_no that is not this investor's.
    const res = await postApiWithToken(nodeUrl(import.meta.env.VITE_CANCEL_XSP || "/cancelXsp"), {
      data: { reg_no: row.reg_no || row.id, reason: "" },
    }).catch(() => null);
    setCancelling(null);
    // Only mark it cancelled when BSE says so — a card reading "cancelled" over a plan that
    // is still running is the worse failure.
    if (!res) return toastError(`Could not cancel this ${what}. Nothing has changed.`);
    toastSuccess(`${what} cancelled.`);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "CANCELLED" } : r)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 dark:bg-[var(--app-bg)]">
        Loading {what} plans…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center items-start p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-6 dark:border dark:border-[var(--border-color)]">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-[var(--text-primary)]">Manage {what}</h1>
          <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)] mt-1">
            {type === "swp"
              ? "Withdrawals scheduled out of your holdings."
              : "Transfers scheduled from one fund into another."}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-[var(--text-secondary)]">
            <p>No {what} running.</p>
            <button
              onClick={() => navigate(type === "swp" ? "/mutual_fund/redeem" : "/mutual_fund/switch")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Start a {what}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-gray-200 dark:border-[var(--border-color)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-[var(--text-primary)] text-sm truncate">
                      {row.schemeName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mt-1">
                      ₹{row.sipAmount.toLocaleString("en-IN")} · {row.frequency} · {ordinal(row.sipDay)} · next{" "}
                      {row.nextInstallment}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${
                      row.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                {row.status === "ACTIVE" && (
                  <button
                    onClick={() => cancel(row)}
                    disabled={cancelling === row.id}
                    className="mt-3 text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    {cancelling === row.id ? "Cancelling…" : `Cancel ${what}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSxpPage;
