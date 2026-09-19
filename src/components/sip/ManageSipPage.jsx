import React, { useMemo, useState, useEffect } from "react";
import { postApi, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { nodeUrl, mapXspToSip, xspItems } from "../../utils/nodeApi";
import { allowedDays, FALLBACK_SIP_DAYS, nextOccurrence, ordinal, smartDefaultDay } from "../../utils/sipDates";
import OrderDisclaimers, { useDisclaimers } from "../mutual_fund/OrderDisclaimers";

const SIP_HISTORY_PLACEHOLDER = [];

const ManageSipPage = () => {
  const { data: investorData } = useSelector((state) => state.investorData);
  const [sips, setSips] = useState([]);
  const [loadingSips, setLoadingSips] = useState(true);
  const [sipHistory, setSipHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // NEW: modal & page state
  const [selectedSip, setSelectedSip] = useState(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyPage, setShowModifyPage] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  // A modify replaces the registration and a top-up changes it, so both re-read the list
  // from BSE rather than patching a card that no longer describes anything real.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchSips = async () => {
      const ucc = investorData?.kyc?.ucc_code;
      if (!ucc) {
        setLoadingSips(false);
        return;
      }
      try {
        const url = nodeUrl(import.meta.env.VITE_GET_ALL_XSP || "/getAllXsp");
        const payload = {
          data: {
            fields: ["ALL"],
            count_only: false,
            start: 0,
            length: 50,
            filter_param: {
              sxp_type: "SIP",
              ucc,
            },
          },
        };
        const res = await postApiWithToken(url, payload);
        const items = xspItems(res);
        if (Array.isArray(items) && items.length) {
          setSips(items.map((item, i) => mapXspToSip(item, i)));
          // Fetch SIP transaction history for first active SIP
          const active = items.find((i) => (i.status || "").toUpperCase() === "ACTIVE") || items[0];
          if (active?.reg_no || active?.id) {
            const histUrl = nodeUrl("/getXspTrxnHistory");
            const histRes = await postApiWithToken(histUrl, {
              data: { reg_no: active.reg_no || active.id, sxp_type: "SIP" },
            });
            const histItems = xspItems(histRes);
            if (histItems.length) {
              setSipHistory(histItems.map((h) => ({
                id: h.id || h.txn_id,
                date: h.txn_date || h.date || "—",
                schemeName: active.src_scheme_name || active.scheme_name || "SIP",
                amount: Number(h.amount || 0),
                status: h.status || "Success",
              })));
            }
          }
        }
      } catch (_) {
        /* keep empty */
      } finally {
        setLoadingSips(false);
      }
    };
    fetchSips();
  }, [investorData?.kyc?.ucc_code, refreshKey]);

  // ---- Derived summary values ----
  const summary = useMemo(() => {
    const activeSips = sips.filter((s) => s.status === "ACTIVE");
    const totalMonthlyOutgo = activeSips.reduce(
      (acc, sip) => acc + sip.sipAmount,
      0
    );
    const totalInvested = sips.reduce(
      (acc, sip) => acc + sip.investedSoFar,
      0
    );
    const totalCurrent = sips.reduce(
      (acc, sip) => acc + sip.currentValue,
      0
    );
    const profitLoss = totalCurrent - totalInvested;

    return {
      activeCount: activeSips.length,
      totalMonthlyOutgo,
      totalInvested,
      totalCurrent,
      profitLoss,
    };
  }, [sips]);

  // ---- Filtered SIP list ----
  const filteredSips = useMemo(() => {
    if (statusFilter === "ALL") return sips;
    return sips.filter((sip) => sip.status === statusFilter);
  }, [sips, statusFilter]);

  // ---- Helpers ----
  const getReturnPercent = (sip) => {
    if (!sip.investedSoFar) return 0;
    return ((sip.currentValue - sip.investedSoFar) / sip.investedSoFar) * 100;
  };

  const statusBadgeClass = (status) => {
    if (status === "ACTIVE")
      return "bg-emerald-100 text-emerald-700";
    if (status === "PAUSED")
      return "bg-amber-100 text-amber-700";
    if (status === "CANCELLED")
      return "bg-slate-200 text-slate-600";
    return "bg-slate-100 text-slate-600";
  };

  // ---- Actions ----
  // open pause modal (Groww style)
  const handleTogglePause = (id) => {
    const sip = sips.find((s) => s.id === id);
    if (!sip) return;
    setSelectedSip(sip);
    setShowPauseModal(true);
  };

  const confirmPause = async (pauseData) => {
    if (!selectedSip) return;
    const isActive = selectedSip.status === "ACTIVE";
    const payload = isActive
      ? {
          data: {
            reg_no: selectedSip.reg_no || selectedSip.id,
            // The modal offers 1/3/6 months and used to hand back `pauseType: "1M"`, which
            // this read as `pauseData.months` — always undefined, so every "pause 6 months"
            // paused exactly one installment.
            ninstallments: Number(pauseData?.installments) || 1,
            paused_from: new Date().toISOString().split("T")[0],
          },
        }
      : { data: { reg_no: selectedSip.reg_no || selectedSip.id, resume_reason: "Resumed by investor" } };
    const url = nodeUrl(isActive ? (import.meta.env.VITE_PAUSE_XSP || "/pauseXsp") : (import.meta.env.VITE_RESUME_XSP || "/resumeXsp"));
    const res = await postApiWithToken(url, payload);
    // postApiWithToken returns null and toasts the server's own reason on failure. The
    // status was being flipped either way, so a SIP that BSE refused to pause still looked
    // paused — and kept debiting.
    if (!res) {
      setShowPauseModal(false);
      setSelectedSip(null);
      return;
    }
    toastSuccess(isActive ? "SIP paused successfully" : "SIP resumed successfully");
    setSips((prev) =>
      prev.map((sip) => (sip.id === selectedSip.id ? { ...sip, status: isActive ? "PAUSED" : "ACTIVE" } : sip))
    );
    setShowPauseModal(false);
    setSelectedSip(null);
  };

  const handleCancel = (id) => {
    const sip = sips.find((s) => s.id === id);
    if (!sip) return;
    setSelectedSip(sip);
    setShowCancelModal(true);
  };

  const confirmCancel = async ({ reason }) => {
    if (!selectedSip) return;
    const url = nodeUrl(import.meta.env.VITE_CANCEL_XSP || "/cancelXsp");
    // Intent only. The server owns reason_cd and sxp_type now, and refuses a reg_no that is
    // not this investor's — the page used to name all three itself.
    const res = await postApiWithToken(url, {
      data: { reg_no: selectedSip.reg_no || selectedSip.id, reason: reason || "" },
    });
    // Ticket 20: the investor must get the real outcome. This used to mark the SIP
    // CANCELLED even when the call failed, so the debits carried on against a card that
    // said "SIP cancelled. No further debits."
    if (!res) {
      setShowCancelModal(false);
      setSelectedSip(null);
      return;
    }
    toastSuccess("SIP cancelled successfully");
    setSips((prev) =>
      prev.map((s) =>
        s.id === selectedSip.id ? { ...s, status: "CANCELLED", nextInstallment: "-" } : s
      )
    );
    setShowCancelModal(false);
    setSelectedSip(null);
  };

  const handleModify = (id) => {
    const sip = sips.find((s) => s.id === id);
    if (!sip) return;
    setSelectedSip(sip);
    setShowModifyPage(true);
  };

  const handleTopUp = (id) => {
    const sip = sips.find((s) => s.id === id);
    if (!sip) return;
    setSelectedSip(sip);
    setShowTopUpModal(true);
  };

  /**
   * Ticket 21. This used to change local state and toast "updated locally", so the card
   * showed the new amount and BSE kept debiting the old one until the page was reloaded.
   *
   * BSE has no sxp_update, so /modifyXsp registers the replacement and then cancels the
   * original — in that order, server-side. 207 means the new SIP is live but the old one
   * is still running, which the investor has to act on rather than be told "saved".
   */
  const saveModifiedSip = async ({ amount, startDate, frequency, acknowledged }) => {
    if (!selectedSip) return;
    const res = await postApiWithToken(nodeUrl("/modifyXsp"), {
      data: {
        reg_no: selectedSip.reg_no || selectedSip.id,
        amount: Number(amount),
        start_date: startDate,
        freq: frequency,
        // A modify re-registers the SIP, so the server runs it through the same order gate
        // as a fresh purchase — disclaimers included. This form never sent them, so every
        // save came back "Please read and accept the required disclaimers", naming
        // something the screen did not show.
        acknowledged,
      },
    });
    if (!res) return; // the server's reason has already been shown; stay on the form
    if (res.status === "partial") {
      toastError(res.message);
    } else {
      toastSuccess("SIP updated.");
    }
    // The old registration is gone and a new one exists under a new reg_no, so a local
    // patch would be a fiction. Reload the list from BSE.
    setShowModifyPage(false);
    setSelectedSip(null);
    setRefreshKey((k) => k + 1);
  };

  const confirmTopUp = async ({ amount, freq, startDate }) => {
    if (!selectedSip) return;
    const res = await postApiWithToken(nodeUrl("/topupXsp"), {
      data: {
        reg_no: selectedSip.reg_no || selectedSip.id,
        amount: Number(amount),
        freq,
        ...(startDate ? { start_date: startDate } : {}),
      },
    });
    if (!res) return;
    toastSuccess("Top-Up added to this SIP.");
    setShowTopUpModal(false);
    setSelectedSip(null);
    setRefreshKey((k) => k + 1);
  };

  const handleImportExternal = () => {
    window.location.href = "/user/mutual_fund/explore";
  };

  // If modify page is open, show that instead of list (style is simple page)
  if (showModifyPage && selectedSip) {
    return (
      <ModifySipPage
        sip={selectedSip}
        onBack={() => {
          setShowModifyPage(false);
          setSelectedSip(null);
        }}
        onSave={saveModifiedSip}
      />
    );
  }

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 flex justify-center">
      <div className="w-full max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Manage SIPs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View, modify, pause or cancel your SIPs in one place.
            </p>
          </div>
          <button
            onClick={handleImportExternal}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm px-4 py-2 rounded-lg shadow-sm"
          >
            Import External SIPs
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] text-slate-500">Active SIPs</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {summary.activeCount}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] text-slate-500">Monthly SIP outgo</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              ₹{summary.totalMonthlyOutgo.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] text-slate-500">Invested via SIPs</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              ₹{summary.totalInvested.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] text-slate-500">Current value</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              ₹{summary.totalCurrent.toLocaleString()}
            </p>
            <p
              className={`text-[11px] mt-0.5 font-medium ${
                summary.profitLoss >= 0
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              {summary.profitLoss >= 0 ? "+" : "-"}₹
              {Math.abs(summary.profitLoss).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-3 text-xs font-medium border-b border-slate-200">
            {[
              { key: "ALL", label: "All" },
              { key: "ACTIVE", label: "Active" },
              { key: "PAUSED", label: "Paused" },
              { key: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`pb-2 border-b-2 px-1 ${
                  statusFilter === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500">
            Showing {filteredSips.length} SIP
            {filteredSips.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* SIP List */}
        <div className="space-y-3">
          {filteredSips.map((sip) => {
            const ret = getReturnPercent(sip);
            const pnl = sip.currentValue - sip.investedSoFar;
            return (
              <div
                key={sip.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                {/* Left: Scheme Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {sip.schemeName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {sip.category}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(
                        sip.status
                      )}`}
                    >
                      {sip.status === "ACTIVE"
                        ? "Active"
                        : sip.status === "PAUSED"
                        ? "Paused"
                        : "Cancelled"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Mandate: {sip.mandateStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {sip.frequency} • {sip.sipDay.toString().padStart(2, "0")}{" "}
                      of every month
                    </span>
                  </div>
                </div>

                {/* Middle: Numbers */}
                <div className="flex flex-wrap gap-4 text-xs md:text-[11px]">
                  <div className="text-right md:text-left">
                    <p className="text-slate-500">SIP amount</p>
                    <p className="font-semibold text-slate-900">
                      ₹{sip.sipAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Next: {sip.nextInstallment}
                    </p>
                    {/* A registered top-up changed nothing visible on this card, so one
                        that took looked exactly like one that never did. */}
                    {sip.topupAmount ? (
                      <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                        Top-up +₹{sip.topupAmount.toLocaleString()}
                        {sip.topupFrequency ? ` ${sip.topupFrequency.toLowerCase()}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right md:text-left">
                    <p className="text-slate-500">Invested</p>
                    <p className="font-semibold text-slate-900">
                      ₹{sip.investedSoFar.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Since {sip.startDate}
                    </p>
                  </div>
                  <div className="text-right md:text-left">
                    <p className="text-slate-500">Current value</p>
                    <p className="font-semibold text-slate-900">
                      ₹{sip.currentValue.toLocaleString()}
                    </p>
                    <p
                      className={`text-[11px] font-medium mt-0.5 ${
                        pnl >= 0 ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {pnl >= 0 ? "+" : "-"}₹
                      {Math.abs(pnl).toLocaleString()} (
                      {ret >= 0 ? "+" : ""}
                      {ret.toFixed(2)}%)
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap gap-2 justify-end md:flex-col md:items-end">
                  {sip.status !== "CANCELLED" && (
                    <>
                      <button
                        onClick={() => handleTogglePause(sip.id)}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        {sip.status === "ACTIVE" ? "Pause SIP" : "Resume SIP"}
                      </button>
                      <button
                        onClick={() => handleModify(sip.id)}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleTopUp(sip.id)}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        Top-Up
                      </button>
                      <button
                        onClick={() => handleCancel(sip.id)}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        Cancel SIP
                      </button>
                    </>
                  )}

                  {sip.status === "CANCELLED" && (
                    <p className="text-[11px] text-slate-400">
                      SIP cancelled. No further debits.
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSips.length === 0 && (
            <p className="text-center text-xs text-slate-500 mt-4">
              No SIPs in this filter.
            </p>
          )}
        </div>

        {/* SIP Payment History */}
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Recent SIP payments
            </p>
            <button
              className="text-[11px] text-blue-600 hover:underline"
              onClick={() => setSipHistory((h) => [...h])}
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-[11px] text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Scheme</th>
                  <th className="text-right px-4 py-2">Amount</th>
                  <th className="text-right px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(sipHistory.length ? sipHistory : SIP_HISTORY_PLACEHOLDER).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2">
                      <span className="text-[11px] text-slate-900">
                        {row.schemeName}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      ₹{row.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={
                          row.status === "Success"
                            ? "text-emerald-600 font-medium"
                            : "text-amber-600 font-medium"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {sipHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-center text-[11px] text-slate-500"
                    >
                      No SIP installments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPauseModal && selectedSip && (
        <PauseSipModal
          sip={selectedSip}
          onClose={() => {
            setShowPauseModal(false);
            setSelectedSip(null);
          }}
          onConfirm={confirmPause}
        />
      )}

      {showCancelModal && selectedSip && (
        <CancelSipModal
          sip={selectedSip}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedSip(null);
          }}
          onConfirm={confirmCancel}
        />
      )}

      {showTopUpModal && selectedSip && (
        <TopUpSipModal
          sip={selectedSip}
          onClose={() => {
            setShowTopUpModal(false);
            setSelectedSip(null);
          }}
          onConfirm={confirmTopUp}
        />
      )}
    </div>
  );
};

export default ManageSipPage;

/* -------------------------------- */
/*  pause, cancel, modify Modals    */
/* -------------------------------- */

// BSE pauses a count of installments, not a stretch of calendar. For a monthly SIP the two
// coincide; for a quarterly one, "3 months" is a single installment. Convert here so the
// number leaving this modal is the one BSE will act on.
const PER_YEAR = { Monthly: 12, Quarterly: 4, Weekly: 52 };
const pauseInstallments = (months, frequency) =>
  Math.max(1, Math.round((months / 12) * (PER_YEAR[frequency] || 12)));

const PauseSipModal = ({ sip, onClose, onConfirm }) => {
  const [months, setMonths] = useState(1);

  const handleSubmit = () => {
    onConfirm({ installments: pauseInstallments(months, sip.frequency) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          {sip.status === "ACTIVE" ? "Pause SIP" : "Resume SIP"}
        </h2>
        <p className="text-[11px] text-slate-500 mb-3">
          {sip.status === "ACTIVE"
            ? "You can temporarily pause this SIP. Future installments will not be deducted during this period."
            : "Resume this SIP to restart future installments."}
        </p>

        {sip.status === "ACTIVE" && (
          <div className="space-y-2 mb-3 text-xs">
            <p className="text-[11px] text-slate-500">Pause duration</p>
            <div className="flex gap-2">
              {[1, 3, 6].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs ${
                    months === m ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {m} month{m === 1 ? "" : "s"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              {pauseInstallments(months, sip.frequency)} installment
              {pauseInstallments(months, sip.frequency) === 1 ? "" : "s"} will be skipped.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
          >
            {sip.status === "ACTIVE" ? "Confirm Pause" : "Resume SIP"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CancelSipModal = ({ sip, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    onConfirm({ reason });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5">
        <h2 className="text-sm font-semibold text-rose-600 mb-1">
          Cancel SIP?
        </h2>
        <p className="text-[11px] text-slate-500 mb-3">
          Once cancelled, future installments for{" "}
          <span className="font-medium text-slate-800">
            {sip.schemeName}
          </span>{" "}
          will not be deducted. You can always start a new SIP later.
        </p>

        <label className="text-[11px] text-slate-500 mb-1 block">
          Reason (optional)
        </label>
        <textarea
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-rose-300"
          rows={3}
          placeholder="Eg: I don't want to continue this strategy"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="mt-4 flex justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
          >
            Go back
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- */
/*   Top-Up (ticket 19)   */
/* ---------------------- */

/**
 * A BSE top-up is its own recurring instruction layered on the registration — its own
 * amount, its own cadence — not an edit of the SIP's amount. So the parent SIP's amount,
 * dates and frequency are untouched, which is what "existing SIP details must remain
 * unchanged except for the configured Top-Up" asks for.
 */
const TOPUP_FREQ = [
  ["y", "Every year"],
  ["h", "Every 6 months"],
];

const TopUpSipModal = ({ sip, onClose, onConfirm }) => {
  // The scheme's real minimum, from the same /scheme-details the SIP and Modify forms read.
  // The server validates the top-up against exactly this number (sipLimitsFor → minAmount),
  // so not asking for it meant the form opened on ₹500 — a floor invented here, below the
  // ₹1,000 this fund actually takes — and the investor only found out after pressing the
  // button. A form must not pre-fill a value it can know will be rejected.
  const [minTopup, setMinTopup] = useState(0);
  useEffect(() => {
    if (!sip.schemeCode) return;
    let live = true;
    postApi(nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details"), { scheme_code: sip.schemeCode })
      .then((res) => {
        if (!live) return;
        setMinTopup(Number(res?.data?.scheme_info?.transactions?.sip?.minAmount) || 0);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [sip.schemeCode]);

  // 10% of the SIP is a sensible starting suggestion; the scheme's floor overrides it.
  const [amount, setAmount] = useState(Math.round(sip.sipAmount * 0.1) || 0);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    // Only while the investor has not typed — never overwrite a number they chose.
    if (!touched && minTopup > 0 && Number(amount) < minTopup) setAmount(minTopup);
  }, [minTopup, touched, amount]);

  const [freq, setFreq] = useState("y");
  const [saving, setSaving] = useState(false);
  const belowMin = minTopup > 0 && Number(amount) < minTopup;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toastError("Enter a top-up amount");
      return;
    }
    if (belowMin) {
      toastError(`Minimum top-up for this fund is ₹${minTopup.toLocaleString("en-IN")}`);
      return;
    }
    setSaving(true);
    // The scheme's real minimum is checked on the server against BSE's own master — this
    // form does not invent a floor of its own.
    await onConfirm({ amount, freq });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Top up this SIP</h2>
        <p className="text-[11px] text-slate-500 mb-3">
          Increase what you invest in <span className="font-medium text-slate-800">{sip.schemeName}</span> over
          time. Your current SIP of ₹{sip.sipAmount.toLocaleString("en-IN")} stays as it is; the top-up is
          added on top of it.
        </p>

        <label className="text-[11px] text-slate-500 mb-1 block">Top-up amount (₹)</label>
        <input
          type="number"
          value={amount}
          min={minTopup || 1}
          onChange={(e) => {
            setTouched(true);
            setAmount(e.target.value);
          }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
        {minTopup > 0 && (
          <p className={`text-[11px] mt-1 ${belowMin ? "text-red-500" : "text-slate-500"}`}>
            Minimum for this fund: ₹{minTopup.toLocaleString("en-IN")}
          </p>
        )}

        <label className="text-[11px] text-slate-500 mt-3 mb-1 block">How often</label>
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
        >
          {TOPUP_FREQ.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        <div className="mt-4 flex justify-end gap-3 text-xs">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600">
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || belowMin}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Top-Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- */
/*   Modify SIP Page      */
/* ---------------------- */

// BSE's own frequency codes. The select used to offer Half-yearly and Yearly, which
// sxp_register does not accept for a SIP at all (it takes m / q / w), and it sent the
// English word rather than the code — so a frequency change could never have registered.
const FREQ_OPTIONS = [
  ["m", "Monthly"],
  ["q", "Quarterly"],
  ["w", "Weekly"],
];
const FREQ_CODE = { Monthly: "m", Quarterly: "q", Weekly: "w" };

const ModifySipPage = ({ sip, onBack, onSave }) => {
  const [amount, setAmount] = useState(sip.sipAmount);
  const [frequency, setFrequency] = useState(FREQ_CODE[sip.frequency] || "m");
  const [saving, setSaving] = useState(false);

  // The scheme's own accepted SIP dates and minimum, same source the SIP setup page uses.
  // Offering a date this scheme does not take is how an order comes back invalid_txn_date.
  const [sipTxn, setSipTxn] = useState(null);
  const [minSip, setMinSip] = useState(0);
  const disc = useDisclaimers();
  useEffect(() => {
    if (!sip.schemeCode) return;
    let live = true;
    postApi(nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details"), { scheme_code: sip.schemeCode })
      .then((res) => {
        if (!live) return;
        const info = res?.data?.scheme_info;
        setSipTxn(info?.transactions?.sip || null);
        setMinSip(Number(info?.transactions?.sip?.minAmount) || 0);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [sip.schemeCode]);

  const sipDays = useMemo(() => allowedDays(sipTxn, frequency), [sipTxn, frequency]);
  const [sipDate, setSipDate] = useState(() => Number(sip.sipDay) || smartDefaultDay(FALLBACK_SIP_DAYS));
  useEffect(() => {
    if (sipDays.includes(sipDate)) return;
    setSipDate(smartDefaultDay(sipDays));
  }, [sipDays, sipDate]);

  // BSE ties start_date's day-of-month to the SIP date (msgid 3809), so the start date is
  // derived rather than asked for — the next occurrence of the chosen day.
  const startDate = nextOccurrence(sipDate);

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toastError("Please enter a valid amount");
      return;
    }
    if (minSip && Number(amount) < minSip) {
      toastError(`Minimum SIP for this fund is ₹${minSip.toLocaleString("en-IN")}`);
      return;
    }
    setSaving(true);
    await onSave({ amount, startDate, frequency, acknowledged: disc.acked });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 flex justify-center">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-xs text-blue-600 mb-3 hover:underline"
        >
          ← Back to SIPs
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
          <p className="text-[11px] text-slate-500 mb-1">Modifying SIP in</p>
          <p className="text-sm font-semibold text-slate-900">
            {sip.schemeName}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{sip.category}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4 text-xs">
          <div>
            <p className="text-[11px] text-slate-500 mb-1">SIP amount (₹)</p>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <span className="text-[11px] text-slate-500 mr-1">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent text-sm text-slate-900 outline-none py-2"
                min={0}
              />
            </div>
          </div>

          {minSip > 0 && (
            <p className="text-[11px] text-slate-500 -mt-2">
              Minimum for this fund: ₹{minSip.toLocaleString("en-IN")}
            </p>
          )}

          <div>
            <p className="text-[11px] text-slate-500 mb-1">SIP date</p>
            <select
              value={sipDate}
              onChange={(e) => setSipDate(Number(e.target.value))}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs outline-none"
            >
              {sipDays.map((d) => (
                <option key={d} value={d}>
                  {ordinal(d)} of every month
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              The replacement SIP starts on {startDate}.
            </p>
          </div>

          <div>
            <p className="text-[11px] text-slate-500 mb-1">Frequency</p>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs outline-none"
            >
              {FREQ_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* A modify re-registers the SIP, so the server runs it through the same order
              gate as a fresh purchase — disclaimers included. This screen never showed them
              and never sent the acknowledgement, so every save came back "Please read and
              accept the required disclaimers", naming something that was not on the page.
              Same component and hook the SIP and lumpsum checkouts already use. */}
          <OrderDisclaimers {...disc} className="pt-2 border-t border-slate-100 mt-2" />

          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between gap-3">
            {/* Not a euphemism: BSE has no way to edit a SIP, so this really does register a
                new one and cancel this one. The investor should know that before pressing. */}
            <p className="text-[11px] text-slate-500">
              This registers a <span className="font-medium text-slate-800">new SIP</span> and cancels the
              current one — BSE cannot edit an existing registration.
            </p>
            <button
              onClick={handleSubmit}
              disabled={saving || !disc.ready}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
