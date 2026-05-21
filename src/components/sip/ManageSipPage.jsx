import React, { useMemo, useState } from "react";

// Dummy SIP data – replace with API later
const INITIAL_SIPS = [
  {
    id: 1,
    schemeName: "Axis Bluechip Fund Direct Growth",
    category: "Equity • Large Cap",
    sipAmount: 3000,
    frequency: "Monthly",
    sipDay: 5,
    nextInstallment: "05 Jan 2026",
    startDate: "05 Jan 2023",
    investedSoFar: 108000,
    currentValue: 122500,
    mandateStatus: "Active",
    status: "ACTIVE", // ACTIVE | PAUSED | CANCELLED
  },
  {
    id: 2,
    schemeName: "Parag Parikh Flexi Cap Fund Direct Growth",
    category: "Equity • Flexi Cap",
    sipAmount: 2000,
    frequency: "Monthly",
    sipDay: 10,
    nextInstallment: "10 Jan 2026",
    startDate: "10 Jun 2022",
    investedSoFar: 84000,
    currentValue: 101200,
    mandateStatus: "Active",
    status: "ACTIVE",
  },
  {
    id: 3,
    schemeName: "HDFC Midcap Opportunities Direct Growth",
    category: "Equity • Mid Cap",
    sipAmount: 1500,
    frequency: "Monthly",
    sipDay: 15,
    nextInstallment: "15 Jan 2026",
    startDate: "15 Mar 2024",
    investedSoFar: 27000,
    currentValue: 25800,
    mandateStatus: "Active",
    status: "PAUSED",
  },
  {
    id: 4,
    schemeName: "ICICI Prudential Balanced Advantage Direct Growth",
    category: "Hybrid • Dynamic Asset Allocation",
    sipAmount: 2500,
    frequency: "Monthly",
    sipDay: 25,
    nextInstallment: "-",
    startDate: "25 Aug 2021",
    investedSoFar: 90000,
    currentValue: 103400,
    mandateStatus: "Stopped",
    status: "CANCELLED",
  },
];

const SIP_HISTORY = [
  {
    id: 101,
    date: "05 Dec 2025",
    schemeName: "Axis Bluechip Fund Direct Growth",
    amount: 3000,
    status: "Success",
  },
  {
    id: 102,
    date: "10 Dec 2025",
    schemeName: "Parag Parikh Flexi Cap Fund Direct Growth",
    amount: 2000,
    status: "Success",
  },
  {
    id: 103,
    date: "15 Nov 2025",
    schemeName: "HDFC Midcap Opportunities Direct Growth",
    amount: 1500,
    status: "Skipped (Paused)",
  },
];

const ManageSipPage = () => {
  const [sips, setSips] = useState(INITIAL_SIPS);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | PAUSED | CANCELLED

  // NEW: modal & page state
  const [selectedSip, setSelectedSip] = useState(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyPage, setShowModifyPage] = useState(false);

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

  const confirmPause = (pauseData) => {
    if (!selectedSip) return;
    // here you can also send pauseData to backend
    setSips((prev) =>
      prev.map((sip) => {
        if (sip.id !== selectedSip.id) return sip;
        if (sip.status === "ACTIVE") return { ...sip, status: "PAUSED" };
        if (sip.status === "PAUSED") return { ...sip, status: "ACTIVE" };
        return sip;
      })
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

  const confirmCancel = ({ reason }) => {
    if (!selectedSip) return;
    // here you can send reason + sipId to backend
    setSips((prev) =>
      prev.map((s) =>
        s.id === selectedSip.id
          ? { ...s, status: "CANCELLED", nextInstallment: "-" }
          : s
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

  const saveModifiedSip = ({ amount, sipDate, frequency }) => {
    if (!selectedSip) return;
    setSips((prev) =>
      prev.map((s) =>
        s.id === selectedSip.id
          ? {
              ...s,
              sipAmount: Number(amount),
              sipDay: Number(sipDate),
              frequency,
            }
          : s
      )
    );
    setShowModifyPage(false);
    setSelectedSip(null);
  };

  const handleImportExternal = () => {
    alert("Redirect to external SIP import flow (dummy).");
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
              onClick={() => alert("Go to full SIP history page (dummy).")}
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
                {SIP_HISTORY.map((row) => (
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

                {SIP_HISTORY.length === 0 && (
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
    </div>
  );
};

export default ManageSipPage;

/* -------------------------------- */
/*  pause, cancel, modify Modals    */
/* -------------------------------- */

const PauseSipModal = ({ sip, onClose, onConfirm }) => {
  const [pauseType, setPauseType] = useState("1M");

  const handleSubmit = () => {
    onConfirm({ pauseType });
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
              {["1M", "3M", "6M"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPauseType(opt)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs ${
                    pauseType === opt
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {opt === "1M"
                    ? "1 month"
                    : opt === "3M"
                    ? "3 months"
                    : "6 months"}
                </button>
              ))}
            </div>
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
/*   Modify SIP Page      */
/* ---------------------- */

const ModifySipPage = ({ sip, onBack, onSave }) => {
  const [amount, setAmount] = useState(sip.sipAmount);
  const [sipDate, setSipDate] = useState(sip.sipDay);
  const [frequency, setFrequency] = useState(sip.frequency || "Monthly");

  const handleSubmit = () => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (sipDate < 1 || sipDate > 28) {
      alert("SIP date must be between 1 and 28");
      return;
    }
    onSave({ amount, sipDate, frequency });
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

          <div>
            <p className="text-[11px] text-slate-500 mb-1">SIP date</p>
            <select
              value={sipDate}
              onChange={(e) => setSipDate(Number(e.target.value))}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs outline-none"
            >
              {[1, 5, 10, 15, 20, 25].map((d) => (
                <option key={d} value={d}>
                  {d.toString().padStart(2, "0")} of every month
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-[11px] text-slate-500 mb-1">Frequency</p>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs outline-none"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-yearly">Half-yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Changes will apply from the{" "}
              <span className="font-medium text-slate-800">
                next SIP installment
              </span>
            </p>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
