import React, { useState } from "react";
import logoUrl from '../assets/mutualFund/motilal.webp'
import logoUrl2 from '../assets/mutualFund/ppfas.webp'
import { Link } from "react-router-dom";

// const logoUrl = "../assets/motilal.webp";

const NFO = () => {
  const fundList = [
    { name: "Groww Nifty Capital Markets ETF FOF Direct-Growth", risk: "Very High Risk", category: "Equity", launch: "14 Nov '25", close: "28 Nov '25",},
    { name: "SIF Diviniti Equity Long Short Fund - Direct Plan - Growth", risk: "High Risk", category: "Equity", launch: "10 Nov '25", close: "24 Nov '25",  },
    { name: "Franklin India Multi-Factor Fund Direct - Growth", risk: "Very High Risk", category: "Equity", launch: "10 Nov '25", close: "24 Nov '25",  },
    { name: "Bajaj Finserv Banking And Financial Services Fund Direct-Growth", risk: "Very High Risk", category: "Equity", launch: "10 Nov '25", close: "24 Nov '25", },
    { name: "Bandhan Healthcare Fund Direct - Growth", risk: "Very High Risk", category: "Equity", launch: "10 Nov '25", close: "24 Nov '25",},
    { name: "HDFC Equity Fund - Direct Plan - Growth", risk: "Moderate Risk", category: "Equity", launch: "12 Nov '25", close: "26 Nov '25",  },
    { name: "ICICI Prudential Bluechip Fund Direct Plan-Growth", risk: "Moderate Risk", category: "Equity", launch: "15 Nov '25", close: "29 Nov '25",  },
    { name: "SBI Small Cap Fund Direct - Growth", risk: "High Risk", category: "Equity", launch: "18 Nov '25", close: "2 Dec '25", },
    { name: "SBI Small Cap Fund Direct - Growth", risk: "High Risk", category: "Equity", launch: "18 Nov '25", close: "2 Dec '25", },
    { name: "SBI Small Cap Fund Direct - Growth", risk: "High Risk", category: "Equity", launch: "18 Nov '25", close: "2 Dec '25", },
    { name: "SBI Small Cap Fund Direct - Growth", risk: "High Risk", category: "Equity", launch: "18 Nov '25", close: "2 Dec '25", },
    { name: "SBI Small Cap Fund Direct - Growth", risk: "High Risk", category: "Equity", launch: "18 Nov '25", close: "2 Dec '25", },
    { name: "SBI Small Cap Fund Direct - Growth", risk: "High Risk", category: "Equity", launch: "18 Nov '25", close: "2 Dec '25", },
  ];

  const [showOpenOnly, setShowOpenOnly] = useState(true);

//   const displayedFunds = showOpenOnly
//     ? fundList.filter(fund => fund.status === "open")
//     : fundList;

  return (
    <div className="min-h-screen bg-blue-50 px-6 py-12 dark:bg-[var(--app-bg)] ">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-200 mb-2">New Fund Offerings</h1>
        <div className="h-1 w-16 bg-green-500 mx-auto rounded-full mb-4"></div>
        <p className="text-gray-600 dark:text-slate-400">Subscribe to the latest NFOs from top investment companies.</p>
      </div>

      {/* Filter */}
      <div className="max-w-6xl mx-auto flex justify-end mb-4">
        <button
          className={`px-4 py-2 rounded-full font-medium text-sm ${
            showOpenOnly ? "bg-green-500 dark:bg-green-600 text-white" : "bg-white dark:bg-slate-800 text-gray-700 text-slate-400 border"
          }`}
        //   onClick={() => setShowOpenOnly(!showOpenOnly)}
        >
          {/* {showOpenOnly ? "Showing Open Now" : "Show All"} */}
          Open now({fundList.length})
        </button>
      </div>

      {/* Fund List */}
      <div className="max-w-6xl mx-auto space-y-4">
        {fundList.map((fund, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow dark:shadow-white/10 hover:shadow-lg transition"
          >
            <img
              src={index % 2 === 0 ? logoUrl : logoUrl2}
              alt={fund.name}
              className="w-16 h-16 rounded-full border border-gray-200 object-cover flex-shrink-0"
            />

            <div className="flex-1">
              <Link to={`/mutual_fund/${fund.name}`} className="text-gray-800 dark:text-gray-300 font-semibold hover:text-blue-600 hover:underline">{fund.name}</Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fund.risk} • {fund.category}</p>
            </div>

            <div className="flex gap-6 mt-2 md:mt-0 flex-shrink-0">
              <div className="text-right">
                <p className="font-medium text-gray-700 dark:text-gray-300">{fund.launch}</p>
                <p className="text-xs text-gray-400">Launch Date</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-700 dark:text-gray-300">{fund.close}</p>
                <p className="text-xs text-gray-400">Closing Date</p>
              </div>
            </div>
          </div>
        ))}

        {fundList.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No open funds available.</p>
        )}
      </div>
    </div>
  );
};

export default NFO;
