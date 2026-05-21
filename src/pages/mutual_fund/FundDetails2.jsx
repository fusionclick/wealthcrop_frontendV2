import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { useParams } from "react-router-dom";
import DonutChart from "../../components/DonutChart";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const FundDetails = () => {

    const {name} = useParams();
    const [hideChart, setHideChart] = useState(false);

  // ---------------- Dummy Fund Data ----------------
  const fund = {
    name: "SBI Gold Direct Plan Growth",
    category: "Gold",
    risk: "Very High Risk",
    nav: 37.67,
    fundSize: "₹8,456 Cr",
    expense: "0.35%",
    minSip: 500,
    minLumpsum: 1000,
    // annualRates: expected average annual return (decimal). Replace with real rates.
    annualRates: {
      1: 0.10,   // 10% p.a. for 1 year
      3: 0.27,   // 27% p.a. (annualised) for 3 years
      5: 0.18,   // 18% p.a. for 5 years
    },
    holdings: [{ name: "SBI Gold ETF", sector:"Bank", instrument:"Mutual Fund", asset: 100.18,}],
  };

  // ---------------- Chart (unchanged) ----------------
  const chartData = {
    labels: Array.from({ length: 20 }, (_, i) => i + 1),
    datasets: [
      {
        data: Array.from({ length: 20 }, () => Math.random() * 100 + 100),
        borderColor: "#00A66C",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
    scales: { x: { display: true }, y: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
  };

  // ---------------- Calculator state ----------------
  const [mode, setMode] = useState("sip"); // "sip" or "lumpsum"
  const [sipAmt, setSipAmt] = useState(5000);
  const [lumpAmt, setLumpAmt] = useState(10000);
  const [duration, setDuration] = useState(1); // 1 / 3 / 5 years
  const [hour, setHour] = useState(1)
  const [value, setValue] = useState(null)

  // ---------------- Calculation helpers ----------------

  // Future value of monthly SIP (contributions at month-end, monthly compounding)
  // P = monthly contribution, r = annual rate (decimal), n = months
  function futureValueSIP(P, annualR, years) {
    const i = annualR / 12; // monthly rate
    const n = years * 12;
    if (i === 0) return P * n;
    const fv = P * (Math.pow(1 + i, n) - 1) / i; // ordinary annuity
    return fv;
  }

  // Future value of lumpsum: PV * (1 + r)^years
  function futureValueLumpsum(PV, annualR, years) {
    return PV * Math.pow(1 + annualR, years);
  }

  // percent gain = (FV - invested)/invested * 100
  function percentGain(fv, invested) {
    if (invested === 0) return 0;
    return ((fv - invested) / invested) * 100;
  }

  // ---------------- Compute dynamic results ----------------

  // pick annual rate based on current selected duration
  const annualR_for_duration = fund.annualRates[duration] ?? fund.annualRates[3];

  // SIP results
  const totalSIPInvested = sipAmt * 12 * duration;
  const sipFV = Math.round(futureValueSIP(sipAmt, annualR_for_duration, duration));
  const sipGainPct = percentGain(sipFV, totalSIPInvested);

  // Lumpsum results (we will show 1 / 3 / 5 year breakdown)
  const lumpResults = [1, 3, 5].map((yr) => {
    const r = fund.annualRates[yr] ?? fund.annualRates[3];
    const invested = lumpAmt;
    const fv = Math.round(futureValueLumpsum(lumpAmt, r, yr));
    const gainPct = percentGain(fv, invested);
    return { yr, invested, fv, gainPct, r };
  });

  // Also compute lumpsum current selected duration (for the single-result section)
  const selectedLumpRate = fund.annualRates[duration] ?? fund.annualRates[3];
  const lumpFV_selected = Math.round(futureValueLumpsum(lumpAmt, selectedLumpRate, duration));
  const lumpGainPct_selected = percentGain(lumpFV_selected, lumpAmt);
  const totalCost = percentGain(1,2);
  const totalLoss = 100;

  // ---------------- Donut Chart ----------------
  const data = [
  { label: "Consumer Discretionary", value: 33.3, color: "#C5F7B1" },
  { label: "Technology", value: 30.5, color: "#15B7E6" },
  { label: "Industrials", value: 18.5, color: "#3F61FF" },
  { label: "Others", value: 5.9, color: "#FFB44C" },
  { label: "Healthcare", value: 4.2, color: "#C45A8C" },
  { label: "Financial", value: 3.0, color: "#FF5C73" },
  { label: "Real Estate", value: 2.3, color: "#B8C4FF" },
  { label: "Materials", value: 2.2, color: "#FFE863" }
];

  const data2 = [
  { label: "Commodities", value: 98.6, color: "#C5F7B1" },
  { label: "Cash", value: 1.4, color: "#15B7E6" },
  // { label: "Industrials", value: 18.5, color: "#3F61FF" },
  // { label: "Others", value: 5.9, color: "#FFB44C" },
  // { label: "Healthcare", value: 4.2, color: "#C45A8C" },
  // { label: "Financial", value: 3.0, color: "#FF5C73" },
  // { label: "Real Estate", value: 2.3, color: "#B8C4FF" },
  // { label: "Materials", value: 2.2, color: "#FFE863" }
];

 const [hoverIndex, setHoverIndex] = useState(null);
const [hoverIndex2, setHoverIndex2] = useState(null);  // For second donut



  return (
    <div className="w-full bg-white text-[#1A1A1A] py-10 lg:px-25 px-5 mb-5">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-blue-900">{name}</h1>
      <div className="flex gap-3 mt-2">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{fund.category}</span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{fund.risk}</span>
      </div>
    
      {/* Chart */}
      <div className="mt-6 lg:w-[70%] w-full h-50">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="flex gap-5 mt-5 items-center justify-center">
        {
          Array.from(["1M","6M","1Y","3Y","5Y","ALL"]).map((item) =>(

            <span className="w-10 h-8 rounded-full flex items-center justify-center border border-gray-300 text-xs font-semibold">{item}</span>
          ))
        }
      </div>

      {/* Return calculator (Groww style) */}
      <div className="mt-10 border border-gray-200 rounded-xl p-5 max-w-3xl">
        <h2 className="text-xl font-semibold mb-3">Return calculator</h2>

        {/* Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode("sip")}
            className={`px-4 py-2 rounded-full border ${
              mode === "sip" ? "bg-[#00A66C] text-white border-[#00A66C]" : "bg-white"
            }`}
          >
            Monthly SIP
          </button>

          <button
            onClick={() => setMode("lumpsum")}
            className={`px-4 py-2 rounded-full border ${
              mode === "lumpsum" ? "bg-[#00A66C] text-white border-[#00A66C]" : "bg-white"
            }`}
          >
            One-Time
          </button>
        </div>

        {/* SIP Mode */}
        {mode === "sip" && (
          <>
            <p className="font-semibold">₹{sipAmt.toLocaleString()} per month</p>

            {/* slider with step 500 */}
            <input
              type="range"
              min={fund.minSip}
              max={50000}
              step={500}
              value={sipAmt}
              onChange={(e) => setSipAmt(Number(e.target.value))}
              className="w-full mt-3"
            />

            {/* period buttons */}
            <div className="flex gap-3 mt-6">
              {[1, 3, 5].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setDuration(yr)}
                  className={`px-4 py-2 rounded-full border ${
                    duration === yr ? "border-[#00A66C] bg-[#E6F8F1]" : "bg-white"
                  }`}
                >
                  {yr} year
                </button>
              ))}
            </div>

            {/* result */}
            <div className="mt-6 border-t pt-4 text-sm">
              <p>Total investment of ₹{totalSIPInvested.toLocaleString()}</p>

              <p className="font-semibold mt-2">
                Would have become{" "}
                <span className="text-[#00A66C]">
                  ₹{sipFV.toLocaleString()} ({sipGainPct.toFixed(2)}%)
                </span>
              </p>
            </div>
          </>
        )}

        {/* Lumpsum Mode */}
        {mode === "lumpsum" && (
          <>
            <p className="font-semibold">₹{lumpAmt.toLocaleString()}</p>

            {/* slider */}
            <input
              type="range"
              min={fund.minLumpsum}
              max={200000}
              step={500}
              value={lumpAmt}
              onChange={(e) => setLumpAmt(Number(e.target.value))}
              className="w-full mt-3"
            />

            {/* year buttons */}
            <div className="flex gap-3 mt-6">
              {[1, 3, 5].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setDuration(yr)}
                  className={`px-4 py-2 rounded-full border ${
                    duration === yr ? "border-[#00A66C] bg-[#E6F8F1]" : "bg-white"
                  }`}
                >
                  {yr} years
                </button>
              ))}
            </div>

            {/* selected duration result */}
            <div className="mt-6 border-t pt-4 text-sm">
              <p>Investment of ₹{lumpAmt.toLocaleString()}</p>

              <p className="font-semibold mt-2">
                Would have become{" "}
                <span className="text-[#00A66C]">
                  ₹{lumpFV_selected.toLocaleString()} ({(lumpGainPct_selected * 100).toFixed(2)}%)
                </span>
              </p>

              {/* show 1/3/5 breakdown */}
              <div className="mt-4">
                <p className="text-gray-600 mb-2 font-medium">Breakdown</p>
                {lumpResults.map((res) => (
                  <div key={res.yr} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <div>
                      <div className="font-medium">{res.yr} year</div>
                      <div className="text-gray-500">Annual rate: {(res.r * 100).toFixed(2)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{res.fv.toLocaleString()}</div>
                      <div className="text-green-600">{(res.gainPct * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Additional information (below) */}
      <div className="mt-8 max-w-3xl">
        <h2 className="text-xl font-semibold mb-3">Fund Information</h2>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <p className="text-gray-500">NAV</p>
            <p className="font-semibold">₹{fund.nav}</p>
          </div>

          <div>
            <p className="text-gray-500">Fund Size</p>
            <p className="font-semibold">{fund.fundSize}</p>
          </div>

          <div>
            <p className="text-gray-500">Expense Ratio</p>
            <p className="font-semibold">{fund.expense}</p>
          </div>

          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-semibold">{fund.category}</p>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="mt-8 max-w-4xl">
  <h2 className="text-xl font-semibold mb-4">Holdings</h2>

  <div className="overflow-x-auto border border-gray-400 rounded-md">
    <table className="w-full rounded-md">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
          <th className="py-3 px-4 font-semibold text-sm text-gray-700 hidden lg:table-cell">Sector</th>
          <th className="py-3 px-4 font-semibold text-sm text-gray-700 hidden lg:table-cell">Instrument</th>
          <th className="py-3 px-4 font-semibold text-sm text-gray-700">Assets</th>
        </tr>
      </thead>

      <tbody>
        {fund.holdings.map((h, i) => (
          <tr
            key={i}
            className="border-b border-gray-200 hover:bg-gray-50 transition"
          >
            <td className="py-3 px-4">{h.name}</td>
            <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{h.sector}</td>
            <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{h.instrument}</td>
            <td className="py-3 px-4 text-gray-600">{h.asset}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


      {/* Holdings analysis and donut chart */}
           <div className="lg:flex hidden gap-12 items-center mt-12">

      {/* LEFT LEGEND */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Holding analysis</h2>
        <h2 className="text-md mb-5">Equity/Debt/Cash Split</h2>

        {data2.map((item, index) => {
          const isActive = index === hoverIndex;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 cursor-pointer transition-opacity duration-300 
              ${hoverIndex === null || isActive ? "opacity-100" : "opacity-30"}`}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: item.color }}
              ></span>

              <span className={`${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>

              <span className="text-gray-500">{item.value}%</span>
            </div>
          );
        })}
      </div>

      {/* DONUT CHART */}
     <DonutChart data={data2} hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} />
    </div>

        {/* Equity and donut chart */}
          <div className="lg:flex gap-12 items-center mt-12 hidden">

      {/* LEFT LEGEND */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Equity sector allocation</h2>

        {data.map((item, index) => {
          const isActive = index === hoverIndex2;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 cursor-pointer transition-opacity duration-300 
              ${hoverIndex2 === null || isActive ? "opacity-100" : "opacity-30"}`}
              onMouseEnter={() => setHoverIndex2(index)}
              onMouseLeave={() => setHoverIndex2(null)}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: item.color }}
              ></span>

              <span className={`${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>

              <span className="text-gray-500">{item.value}%</span>
            </div>
          );
        })}
      </div>

      {/* DONUT CHART */}
     <DonutChart data={data} hoverIndex={hoverIndex2} setHoverIndex={setHoverIndex2} />
    </div>

    {/* Advanced ratios */}
    <div className="mt-8 max-w-3xl ">
  <h1 className="text-xl font-semibold mb-4">Advanced Ratios</h1>

  <div className="flex items-start gap-10">

    {/* LEFT COLUMN */}
    <div className="space-y-5">
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Top 5</span>
        <span className="font-semibold">45%</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Top 20</span>
        <span className="font-semibold">87%</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">P/E Ratio</span>
        <span className="font-semibold">66.22</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">P/B Ratio</span>
        <span className="font-semibold">9.00</span>
      </div>
    </div>
    {/* DIVIDER */}
    <div className="h-40 w-px bg-gray-300"></div>

    {/* RIGHT COLUMN */}
    <div className="space-y-5">
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Alpha</span>
        <span className="font-semibold">4.56</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Beta</span>
        <span className="font-semibold">0.92</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Sharpe</span>
        <span className="font-semibold">1.10</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Sortino</span>
        <span className="font-semibold">1.37</span>
      </div>
    </div>

  </div>
</div>

{/* Minimum Investments */}
  <div className="mt-12 max-w-3xl ">
  <h1 className="text-xl font-semibold mb-4">Minimum investment amounts</h1>

  <div className="flex items-start gap-10 mt-10">

    {/* LEFT COLUMN */}
    <div className="space-y-5">
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Min. for 1st investment</span>
        <span className="font-semibold">₹5,000</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Min. for 2nd investment onwards</span>
        <span className="font-semibold">₹1,000</span>
      </div>

    </div>
    {/* DIVIDER */}
    <div className="h-24 w-px bg-gray-300"></div>

    {/* RIGHT COLUMN */}
    <div className="space-y-5">
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Min. for SIP</span>
        <span className="font-semibold">₹500</span>
      </div>

    </div>

  </div>
</div>

{/* Returns & rankings */}
<div className="max-w-4xl">
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Returns and rankings</h2>

        <div className="w-full overflow-x-auto">
  <table className="min-w-full table-auto border-collapse text-sm sm:text-base">
    <thead>
      <tr className="text-left border-b">
        <th className="py-3 px-2 sm:px-4 font-medium text-gray-600" colSpan={1}>
          Category: Commodities Gold
        </th>
        <th className="py-3 px-2 sm:px-4 font-medium text-teal-600">Annualised returns</th>
        <th className="py-3 px-2 sm:px-4 font-medium text-gray-600">Absolute returns</th>
      </tr>
      <tr className="text-gray-500 text-xs sm:text-sm">
        <th className="py-2 px-2 sm:px-4"></th>
        <th className="py-2 px-2 sm:px-4">1Y</th>
        <th className="py-2 px-2 sm:px-4">3Y</th>
        <th className="py-2 px-2 sm:px-4">5Y</th>
        <th className="py-2 px-2 sm:px-4">All</th>
      </tr>
    </thead>

    <tbody>
      <tr className="border-b">
        <td className="py-2 px-2 sm:px-4 font-medium text-gray-700">Fund returns</td>
        <td className="py-2 px-2 sm:px-4">60.3%</td>
        <td className="py-2 px-2 sm:px-4">30.7%</td>
        <td className="py-2 px-2 sm:px-4">18.0%</td>
        <td className="py-2 px-2 sm:px-4">10.1%</td>
      </tr>

      <tr className="border-b">
        <td className="py-2 px-2 sm:px-4 font-medium text-gray-700">Category average</td>
        <td className="py-2 px-2 sm:px-4">60.2%</td>
        <td className="py-2 px-2 sm:px-4">30.3%</td>
        <td className="py-2 px-2 sm:px-4">17.9%</td>
        <td className="py-2 px-2 sm:px-4">NA</td>
      </tr>

      <tr>
        <td className="py-2 px-2 sm:px-4 font-medium text-gray-700">Rank within category</td>
        <td className="py-2 px-2 sm:px-4">7</td>
        <td className="py-2 px-2 sm:px-4">4</td>
        <td className="py-2 px-2 sm:px-4">3</td>
        <td className="py-2 px-2 sm:px-4">NA</td>
      </tr>
    </tbody>
  </table>
</div>

      </div>
    </div>

    {/* Expense Ratio */}
    <div className="space-y-5 mt-10">
      <h1 className="text-xl font-semibold">Expense ratio, exit load and tax</h1>
      <p className="text-md font-semibold">Expense ratio: 0.10%</p>
      <p className="text-sm">Inclusive of GST</p>
      <p className="text-md font-semibold">Exit load</p>
      <p className="text-sm">Exit load of 1% if redeemed within 15 days.</p>
      <p className="text-md font-semibold">Stamp duty</p>
      <p className="text-sm">0.005% (from July 1st, 2020)</p>
      <p className="text-md font-semibold">Tax implication</p>
      <p className="text-sm">If you redeem within two years, returns are taxed as per your Income Tax slab. If you redeem after two years, returns exceeding Rs 1.25 lakh in a financial year are taxed at 12.5%.</p>

    </div>

      
    </div>
  );
};

export default FundDetails;
