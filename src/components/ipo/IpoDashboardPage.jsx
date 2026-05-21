import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const IPO_DUMMY_DATA = [
  {
    id: 1,
    name: "ABC Technologies Ltd",
    symbol: "ABC",
    logoInitial: "A",
    logoBg: "bg-indigo-100",
    marketType: "MAINBOARD",
    status: "OPEN",
    openDate: "10 Dec 2025",
    closeDate: "12 Dec 2025",
    listingDate: "18 Dec 2025",
    issuePrice: "₹95 - ₹100",
    faceValue: "₹10",
    lotSize: 150,
    subscription: "3.25x",
  },
  {
    id: 2,
    name: "Bright Retail India Ltd",
    symbol: "BRIGHT",
    logoInitial: "B",
    logoBg: "bg-emerald-100",
    marketType: "SME",
    status: "OPEN",
    openDate: "9 Dec 2025",
    closeDate: "11 Dec 2025",
    listingDate: "17 Dec 2025",
    issuePrice: "₹55 - ₹60",
    faceValue: "₹10",
    lotSize: 2000,
    subscription: "1.78x",
  },
  {
    id: 3,
    name: "Crown Infra Projects Ltd",
    symbol: "CROWN",
    logoInitial: "C",
    logoBg: "bg-yellow-100",
    marketType: "MAINBOARD",
    status: "CLOSED",
    openDate: "2 Dec 2025",
    closeDate: "5 Dec 2025",
    listingDate: "10 Dec 2025",
    issuePrice: "₹150",
    faceValue: "₹10",
    lotSize: 100,
    subscription: "12.5x",
  },
  {
    id: 4,
    name: "Delta Foods & Beverages Ltd",
    symbol: "DELTA",
    logoInitial: "D",
    logoBg: "bg-red-100",
    marketType: "SME",
    status: "CLOSED",
    openDate: "28 Nov 2025",
    closeDate: "30 Nov 2025",
    listingDate: "6 Dec 2025",
    issuePrice: "₹80",
    faceValue: "₹10",
    lotSize: 1600,
    subscription: "5.2x",
  },
  {
    id: 5,
    name: "Evergreen Logistics Ltd",
    symbol: "EGL",
    logoInitial: "E",
    logoBg: "bg-blue-100",
    marketType: "MAINBOARD",
    status: "UPCOMING",
    openDate: "20 Dec 2025",
    closeDate: "23 Dec 2025",
    listingDate: "30 Dec 2025",
    issuePrice: "₹120 - ₹126",
    faceValue: "₹10",
    lotSize: 120,
    subscription: "--",
  },
  {
    id: 6,
    name: "Future Fintech Services Ltd",
    symbol: "FFS",
    logoInitial: "F",
    logoBg: "bg-pink-100",
    marketType: "SME",
    status: "UPCOMING",
    openDate: "22 Dec 2025",
    closeDate: "24 Dec 2025",
    listingDate: "31 Dec 2025",
    issuePrice: "₹65 - ₹70",
    faceValue: "₹10",
    lotSize: 1000,
    subscription: "--",
  },
];

const IpoDashboardPage = () => {
  const [marketFilter, setMarketFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [search, setSearch] = useState("");

  // APPLY MODAL STATES
  const [showApply, setShowApply] = useState(false);
  const [selectedIPO, setSelectedIPO] = useState(null);
  const [lotCount, setLotCount] = useState(1);

  const navigate = useNavigate();

  // FILTERS
  const filteredIpos = useMemo(() => {
    return IPO_DUMMY_DATA.filter((ipo) => {
      const marketMatch =
        marketFilter === "ALL" ? true : ipo.marketType === marketFilter;
      const statusMatch = ipo.status === statusFilter;
      const searchMatch =
        ipo.name.toLowerCase().includes(search.toLowerCase()) ||
        ipo.symbol.toLowerCase().includes(search.toLowerCase());

      return marketMatch && statusMatch && searchMatch;
    });
  }, [marketFilter, statusFilter, search]);

  // SUMMARY
  const summary = useMemo(() => {
    return {
      openCount: IPO_DUMMY_DATA.filter((i) => i.status === "OPEN").length,
      closedCount: IPO_DUMMY_DATA.filter((i) => i.status === "CLOSED").length,
      upcomingCount: IPO_DUMMY_DATA.filter((i) => i.status === "UPCOMING")
        .length,
    };
  }, []);

  const statusLabelMap = {
    OPEN: "Open IPOs",
    CLOSED: "Closed IPOs",
    UPCOMING: "Upcoming IPOs",
  };

  const statusBadgeClass = (status) => {
    if (status === "OPEN") return "bg-emerald-100 text-emerald-700";
    if (status === "CLOSED") return "bg-slate-100 text-slate-700";
    if (status === "UPCOMING") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
   <div className="min-h-screen bg-slate-100 dark:bg-[#020617] flex justify-center px-4 py-6">
  <div className="w-full max-w-6xl">

    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
        IPO Dashboard
      </h1>
    </div>

    {/* SEARCH */}
    <div className="mb-3">
      <input
        type="text"
        placeholder="Search IPO by name or symbol..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 w-full max-w-xs rounded-xl
        border border-slate-300 dark:border-white/10
        text-xs
        bg-white dark:bg-white/5
        text-slate-900 dark:text-gray-100
        outline-none"
      />
    </div>

    {/* MARKET FILTERS */}
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex gap-2 text-xs font-medium bg-slate-100 dark:bg-white/5 rounded-2xl p-1">
        {["ALL", "MAINBOARD", "SME"].map((item) => (
          <button
            key={item}
            onClick={() => setMarketFilter(item)}
            className={`px-3 py-1.5 rounded-xl transition ${
              marketFilter === item
                ? "bg-slate-900 dark:bg-blue-600 text-white"
                : "text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        <SummaryTag color="bg-emerald-500" label="Open IPOs" count={summary.openCount} />
        <SummaryTag color="bg-slate-500" label="Closed" count={summary.closedCount} />
        <SummaryTag color="bg-blue-500" label="Upcoming" count={summary.upcomingCount} />
      </div>
    </div>

    {/* STATUS TABS */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex gap-2 text-xs font-medium border-b border-slate-200 dark:border-white/10">
        {["OPEN", "CLOSED", "UPCOMING"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`pb-2 px-1 mr-3 border-b-2 transition ${
              statusFilter === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 dark:text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-500 dark:text-gray-400">
        Showing {filteredIpos.length} {statusLabelMap[statusFilter]}
      </p>
    </div>

    {/* TABLE */}
    <div className="bg-white dark:bg-[var(--white-5)] rounded-2xl
    border border-slate-200 dark:border-white/10
    shadow-sm dark:shadow-none overflow-hidden">

      <table className="w-full text-xs text-blue-900 dark:text-gray-100">
        <thead className="bg-slate-50 dark:bg-white/10 text-[11px] font-medium text-slate-500 dark:text-gray-400">
          <tr>
            <th className="text-left px-4 py-2">Company</th>

            {statusFilter === "CLOSED" ? (
              <>
                <th className="text-right px-4 py-2">Close date</th>
                <th className="text-right px-4 py-2">Listing date</th>
                <th className="text-right px-4 py-2">Issue price</th>
                <th className="text-right px-4 py-2">Subscription</th>
                <th className="text-right px-4 py-2"></th>
              </>
            ) : statusFilter === "OPEN" ? (
              <>
                <th className="text-right px-4 py-2">Open - Close</th>
                <th className="text-right px-4 py-2">Issue price</th>
                <th className="text-right px-4 py-2">Lot size</th>
                <th className="text-right px-4 py-2">Subscription</th>
                <th className="text-right px-4 py-2">Action</th>
              </>
            ) : (
              <>
                <th className="text-right px-4 py-2">Open - Close</th>
                <th className="text-right px-4 py-2">Listing date</th>
                <th className="text-right px-4 py-2">Issue price</th>
                <th className="text-right px-4 py-2">Type</th>
                <th className="text-right px-4 py-2"></th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {filteredIpos.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-gray-400">
                No IPOs match your search.
              </td>
            </tr>
          ) : (
            filteredIpos.map((ipo) => (
              <tr
                key={ipo.id}
                className="border-t border-slate-100 dark:border-white/10
                hover:bg-slate-50 dark:hover:bg-white/10 transition"
              >
                {/* Company */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg dark:text-[var(--app-bg)] flex items-center justify-center text-[11px] font-bold ${ipo.logoBg}`}>
                      {ipo.logoInitial}
                    </div>

                    <div>
                      <p
                        onClick={() => navigate(`/ipo/${ipo.name.replace(/\s+/g, "-")}`)}
                        className="text-sm font-medium hover:underline cursor-pointer hover:text-blue-500"
                      >
                        {ipo.name}
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-gray-400">
                        {ipo.symbol} • {ipo.marketType}
                      </p>

                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] ${statusBadgeClass(ipo.status)}`}>
                        {ipo.status === "OPEN"
                          ? "Open for subscription"
                          : ipo.status === "CLOSED"
                          ? "Closed"
                          : "Upcoming"}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Dynamic columns (UNCHANGED) */}
                {statusFilter === "OPEN" && (
                  <>
                    <td className="text-right px-4 py-3 font-medium">{ipo.openDate} - {ipo.closeDate}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.issuePrice}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.lotSize}</td>
                    <td className="text-right px-4 py-3 text-emerald-600 font-medium">{ipo.subscription}</td>
                  </>
                )}

                {statusFilter === "CLOSED" && (
                  <>
                    <td className="text-right px-4 py-3 font-medium">{ipo.closeDate}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.listingDate}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.issuePrice}</td>
                    <td className="text-right px-4 py-3 text-emerald-600 font-medium">{ipo.subscription}</td>
                  </>
                )}

                {statusFilter === "UPCOMING" && (
                  <>
                    <td className="text-right px-4 py-3 font-medium">{ipo.openDate} - {ipo.closeDate}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.listingDate}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.issuePrice}</td>
                    <td className="text-right px-4 py-3 font-medium">{ipo.marketType}</td>
                  </>
                )}

                <td className="px-4 py-3 text-right">
                  {ipo.status === "OPEN" && (
                    <button
                      onClick={() => {
                        setSelectedIPO(ipo);
                        setLotCount(1);
                        setShowApply(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] hover:bg-blue-700 transition"
                    >
                      Apply
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

{/* Apply ipo modal */}
    {showApply && selectedIPO && (
  <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div
      className="
        bg-white dark:bg-[#020617]
        w-full max-w-md rounded-2xl shadow-xl
        border border-slate-200 dark:border-white/10
        p-6 animate-fadeIn
        text-slate-900 dark:text-gray-100
      "
    >
      {/* Header */}
      <h2 className="text-lg font-semibold mb-1">
        Apply for {selectedIPO.name}
      </h2>
      <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
        {selectedIPO.symbol}
      </p>

      {/* Price & Lot Info */}
      <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 mb-4">
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Price Band
        </p>
        <p className="font-medium mb-3">
          {selectedIPO.issuePrice}
        </p>

        <p className="text-xs text-slate-500 dark:text-gray-400">
          Lot Size
        </p>
        <p className="font-medium">
          {selectedIPO.lotSize} Shares
        </p>
      </div>

      {/* Lot Counter */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl mb-4">
        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
          Lots
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLotCount((prev) => Math.max(1, prev - 1))}
            className="
              h-8 w-8 flex items-center justify-center
              rounded-lg bg-slate-200 dark:bg-white/10
              text-slate-800 dark:text-gray-100 text-lg
            "
          >
            –
          </button>

          <span className="text-sm font-semibold">
            {lotCount}
          </span>

          <button
            onClick={() => setLotCount((prev) => prev + 1)}
            className="
              h-8 w-8 flex items-center justify-center
              rounded-lg bg-slate-200 dark:bg-white/10
              text-slate-800 dark:text-gray-100 text-lg
            "
          >
            +
          </button>
        </div>
      </div>

      {/* Calculations */}
      {(() => {
        const minPrice = parseInt(
          selectedIPO.issuePrice.replace(/\D/g, "")
        );
        const shares = lotCount * selectedIPO.lotSize;
        const total = shares * (isNaN(minPrice) ? 0 : minPrice);

        return (
          <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-600 dark:text-gray-400">
              Total Shares
            </p>
            <p className="font-semibold mb-3">
              {shares}
            </p>

            <p className="text-xs text-slate-600 dark:text-gray-400">
              Total Amount
            </p>
            <p className="font-semibold">
              ₹{total.toLocaleString()}
            </p>
          </div>
        );
      })()}

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setShowApply(false)}
          className="
            px-4 py-2 text-xs rounded-lg
            bg-slate-200 dark:bg-white/10
            text-slate-700 dark:text-gray-300
          "
        >
          Cancel
        </button>

        <button
          className="
            px-4 py-2 text-xs rounded-lg
            bg-blue-600 text-white hover:bg-blue-700
          "
        >
          Proceed to Apply
        </button>
      </div>
    </div>
  </div>
)}


  </div>
</div>

  );
};

/* Summary Tag Component */
function SummaryTag({ color, label, count }) {
  return (
    <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}

export default IpoDashboardPage;
