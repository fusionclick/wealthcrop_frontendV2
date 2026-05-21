import React, { useState, useMemo } from "react";

const BOND_DATA = [
  {
    id: 1,
    name: "RBI Floating Rate Savings Bond 2025",
    issuer: "Government of India",
    interest: 7.15,
    type: "Government Bond",
    rating: "Sovereign",
    tenure: "7 Years",
    minInvestment: "₹1,000",
    ytm: 7.15,
    risk: "Very Low",
  },
  {
    id: 2,
    name: "NHAI Tax-Free Bond",
    issuer: "National Highways Authority of India",
    interest: 5.25,
    type: "Government Bond",
    rating: "AAA",
    tenure: "10 Years",
    minInvestment: "₹5,000",
    ytm: 5.25,
    risk: "Low",
  },
  {
    id: 3,
    name: "Tata Capital NCD 2026",
    issuer: "Tata Capital",
    interest: 8.5,
    type: "Corporate Bond",
    rating: "AA+",
    tenure: "3 Years",
    minInvestment: "₹10,000",
    ytm: 8.5,
    risk: "Moderate",
  },
  {
    id: 4,
    name: "Muthoot Fincorp NCD 2025",
    issuer: "Muthoot Group",
    interest: 9.25,
    type: "Corporate Bond",
    rating: "A+",
    tenure: "2 Years",
    minInvestment: "₹10,000",
    ytm: 9.25,
    risk: "Moderate-High",
  },
];

const FILTERS = ["All", "Government Bonds", "Corporate Bonds", "High Return", "AAA Rated"];

const BondPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  // ---------------------- FILTER LOGIC ----------------------
  const filteredBonds = useMemo(() => {
    switch (activeFilter) {
      case "Government Bonds":
        return BOND_DATA.filter((b) => b.type === "Government Bond");

      case "Corporate Bonds":
        return BOND_DATA.filter((b) => b.type === "Corporate Bond");

      case "High Return":
        return BOND_DATA.filter((b) => b.interest >= 8); // 8%+ = high return

      case "AAA Rated":
        return BOND_DATA.filter((b) => b.rating === "AAA");

      default:
        return BOND_DATA;
    }
  }, [activeFilter]);

  // ----------------------------------------------------------

  return (
    <div
  className="
    max-w-6xl mx-auto px-4 py-10
    bg-transparent
    dark:bg-[var(--app-bg)]
  "
>
  {/* HEADER */}
  <div className="mb-8">
    <h1
      className="
        text-2xl font-semibold
        text-slate-900
        dark:text-[var(--text-primary)]
      "
    >
      Bonds
    </h1>

    <p
      className="
        text-sm mt-1
        text-slate-600
        dark:text-[var(--text-secondary)]
      "
    >
      Stable returns with low-to-moderate risk. Explore top government and
      corporate bonds.
    </p>
  </div>

  {/* FILTER BUTTONS */}
  <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
    {FILTERS.map((f) => (
      <button
        key={f}
        onClick={() => setActiveFilter(f)}
        className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${
          activeFilter === f
            ? "bg-blue-600 text-white shadow"
            : `
              bg-slate-100 text-slate-700 hover:bg-slate-200
              dark:bg-[var(--white-5)]
              dark:text-[var(--text-secondary)]
              dark:hover:bg-blue-500/15
            `
        }`}
      >
        {f}
      </button>
    ))}
  </div>

  {/* BOND LIST */}
  <div className="space-y-5">
    {filteredBonds.map((bond) => (
      <div
        key={bond.id}
        className="
          bg-white rounded-xl shadow-sm border border-slate-200
          p-5 flex flex-col md:flex-row md:items-center
          md:justify-between gap-4 hover:shadow-md transition

          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
      >
        {/* LEFT SECTION */}
        <div className="flex-1">
          <p
            className="
              text-sm font-semibold
              text-slate-900
              dark:text-[var(--text-primary)]
            "
          >
            {bond.name}
          </p>

          <p
            className="
              text-[12px]
              text-slate-500
              dark:text-[var(--text-secondary)]
            "
          >
            {bond.issuer}
          </p>

          <div className="flex gap-2 mt-2 text-[11px] flex-wrap">
            <span
              className="
                px-2 py-0.5 rounded-full
                bg-slate-100 text-slate-600

                dark:bg-[var(--white-5)]
                dark:text-[var(--text-secondary)]
              "
            >
              {bond.type}
            </span>

            <span
              className="
                px-2 py-0.5 rounded-full
                bg-emerald-100 text-emerald-700

                dark:bg-emerald-500/15
                dark:text-emerald-400
              "
            >
              Rating: {bond.rating}
            </span>

            <span
              className="
                px-2 py-0.5 rounded-full
                bg-blue-100 text-blue-700

                dark:bg-blue-500/15
                dark:text-blue-400
              "
            >
              Tenure: {bond.tenure}
            </span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex gap-8 text-xs md:text-left md:gap-12">
          {[
            ["Interest Rate", `${bond.interest}%`],
            ["YTM", `${bond.ytm}%`],
            ["Min Investment", bond.minInvestment],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-slate-500 dark:text-[var(--text-secondary)]">
                {label}
              </p>

              <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ACTION BUTTON */}
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
          Invest
        </button>
      </div>
    ))}

    {filteredBonds.length === 0 && (
      <p className="text-center text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-4">
        No bonds found for selected filter.
      </p>
    )}
  </div>

  {/* INFO SECTION */}
  <div
    className="
      mt-10 rounded-2xl p-6 border
      bg-slate-50 border-slate-200

      dark:bg-[var(--white-5)]
      dark:border-[var(--border-color)]
    "
  >
    <h2
      className="
        text-lg font-semibold
        text-slate-900
        dark:text-[var(--text-primary)]
      "
    >
      Why invest in Bonds?
    </h2>

    <p
      className="
        text-sm mt-2 leading-relaxed
        text-slate-600
        dark:text-[var(--text-secondary)]
      "
    >
      Bonds provide stable and predictable returns compared to equity.
      Government bonds offer the safest investment option, while corporate
      bonds provide higher returns for moderate risk levels. Ideal for
      investors seeking fixed-income stability.
    </p>
  </div>
</div>

  );
};

export default BondPage;
