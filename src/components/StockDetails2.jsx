import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { MdInfo } from "react-icons/md";
import { GrDocumentText } from "react-icons/gr";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, LabelList  } from "recharts";

import { motion } from "framer-motion";


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const StockDetails = () => {

    const {name} = useParams();
    const [isOpen, setIsOpen] = useState(false)

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

   const [activeTab, setActiveTab] = useState("revenue");
  const [period, setPeriod] = useState("quarterly");

  // Quarterly Data
  const quarterlyData = {
    revenue: [
      { name: "Sep '24", value: 7372 },
      { name: "Dec '24", value: 8187 },
      { name: "Mar '25", value: 8770 },
      { name: "Jun '25", value: 9422 },
      { name: "Sep '25", value: 10004 },
    ],
    profit: [
      { name: "Sep '24", value: 1220 },
      { name: "Dec '24", value: 1490 },
      { name: "Mar '25", value: 1580 },
      { name: "Jun '25", value: 1710 },
      { name: "Sep '25", value: 1890 },
    ],
  };

  // Yearly Data
  const yearlyData = {
    revenue: [
      { name: "2021", value: 15000 },
      { name: "2022", value: 25000 },
      { name: "2023", value: 28500 },
      { name: "2024", value: 31200 },
      { name: "2025", value: 34000 },
    ],
    profit: [
      { name: "2021", value: 2500 },
      { name: "2022", value: 4500 },
      { name: "2023", value: 5200 },
      { name: "2024", value: 5800 },
      { name: "2025", value: 6200 },
    ],
    networth: [
      { name: "2021", value: 25000 },
      { name: "2022", value: 95000 },
      { name: "2023", value: 102000 },
      { name: "2024", value: 112000 },
      { name: "2025", value: 124000 },
    ],
  };

  const getData = () => {
    if (period === "quarterly") {
      return quarterlyData[activeTab] || [];
    }
    return yearlyData[activeTab] || [];
  };

   const [expanded, setExpanded] = useState(false);

  const shortText =
    `${name} Limited is a technology company that provides software development, digital transformation, human capital, and IT consulting services to `;
    
  const fullText =
    `${name} Limited is a technology company that provides software development, digital transformation, human capital, and IT consulting services to businesses around the world. The company's goal is to establish a strong global presence in IT Solutions, Human Capital, E-Surveillance, and Drone Solutions offerings.`;


  return (
    <div className="w-full bg-white text-[#1A1A1A] py-10 lg:px-25 px-5 mb-5">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-blue-900">{name}</h1>
      <div className="mt-2">
        <span className="px-1 py-1 text-lg font-medium">{51.64}</span>
        <span className="py-1 text-sm text-red-500">-9.44(15.46%)</span>
      </div>
    
      {/* Chart */}
      <div className="mt-6 lg:w-[70%] w-full h-50">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="flex gap-5 mt-5 items-center justify-center">
        {
          Array.from(["1M","6M","1Y","3Y","5Y","ALL"]).map((item) =>(

            <span key={item} className="w-10 h-8 rounded-full flex items-center justify-center border border-gray-300 text-xs font-semibold">{item}</span>
          ))
        }
      </div>

        {/* Performance */}
       <div className="w-3xl mt-12 ">
  <h1 className="text-2xl font-semibold">Performance</h1>

  <div className="flex flex-col mt-5 space-y-10 border-b border-dotted pb-14">

    {/* Row 1 */}
    <div className="flex justify-between items-center w-full">
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Today's Low</span>
        <span className="font-semibold">21.06</span>
      </div>

      <div className="h-1.5 bg-emerald-500 grow mx-4 rounded"></div>

      <div className="flex flex-col space-y-2 w-32 text-right">
        <span className="text-gray-500 font-medium">Today's High</span>
        <span className="font-semibold">22.79</span>
      </div>
    </div>

    {/* Row 2 */}
    <div className="flex justify-between items-center w-full">
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">52W Low</span>
        <span className="font-semibold">12.36</span>
      </div>

      <div className="h-1.5 bg-emerald-500 grow mx-4 rounded"></div>

      <div className="flex flex-col space-y-2 w-32 text-right">
        <span className="text-gray-500 font-medium">52W High</span>
        <span className="font-semibold">27.70</span>
      </div>
    </div>

  </div>

    <div className="flex space-x-16 space-y-6 flex-wrap mt-8">
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Open</span>
        <span className="font-semibold">21.06</span>
      </div>
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Prev. Close</span>
        <span className="font-semibold">21.06</span>
      </div>
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Volume</span>
        <span className="font-semibold">54,60,41,653</span>
      </div>
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Total traded value</span>
        <span className="font-semibold">21.06</span>
      </div>
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Upper Circuit</span>
        <span className="font-semibold">21.06</span>
      </div>
      <div className="flex flex-col space-y-2 w-32">
        <span className="text-gray-500 font-medium">Lower Circuit</span>
        <span className="font-semibold">21.06</span>
      </div>
    </div>


</div>

{/* Market Depth */}
<MarketDepth
  buyPercent={33.39}
  sellPercent={66.61}
  bids={[
    { price: 1490.30, qty: 2 },
    { price: 1490.20, qty: 58 },
    { price: 1490.10, qty: 50 },
    { price: 1490.00, qty: 4 },
    { price: 1489.90, qty: 161 },
  ]}
  asks={[
    { price: 1490.40, qty: 44 },
    { price: 1490.50, qty: 105 },
    { price: 1490.60, qty: 59 },
    { price: 1490.70, qty: 31 },
    { price: 1490.80, qty: 251 },
  ]}
/>





    {/* Advanced ratios */}
    <div className="mt-12 max-w-3xl ">
  <h1 className="text-xl font-semibold mb-4">Fundamentals</h1>

  <div className="flex items-start gap-10">

    {/* LEFT COLUMN */}
    <div className="space-y-5">
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Market Cap</span>
        <span className="font-semibold">₹13,919Cr</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">P/E Ratio(TTM)</span>
        <span className="font-semibold">18.81</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">P/B Ratio</span>
        <span className="font-semibold">66.22</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Industry P/E</span>
        <span className="font-semibold">9.00</span>
      </div>
      
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Debt to Equity</span>
        <span className="font-semibold">0.28</span>
      </div>
    </div>
    {/* DIVIDER */}
    <div className="h-50 w-px bg-gray-300"></div>

    {/* RIGHT COLUMN */}
    <div className="space-y-5">
      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">ROE</span>
        <span className="font-semibold">5.63%</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">EPS(TTM)</span>
        <span className="font-semibold">0.92</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Dividend Yield</span>
        <span className="font-semibold">1.10</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Book Value</span>
        <span className="font-semibold">18.37</span>
      </div>

      <div className="flex justify-between w-80">
        <span className="text-gray-600 font-semibold">Face Value</span>
        <span className="font-semibold">10</span>
      </div>
    </div>

  </div>

  <p className="mt-4 text-gray-500 font-medium flex items-center gap-2">Understand Fundamentals <button className="cursor-pointer" onClick={() => setIsOpen(true)}><MdInfo size={20} /></button></p>
</div>
{
    isOpen &&(
        <Fundamentals onClose={() => setIsOpen(false)}/>
    )
}

{/* Financials Bar */}
 <div className="mt-12 max-w-3xl ">
  <h1 className="text-xl font-semibold mb-4">Financials</h1>
  <div className="p-6 border border-gray-300 rounded-xl bg-white shadow-sm w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex space-x-6 border-b pb-2">
        {["revenue", "profit", "networth"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-lg font-medium ${
              activeTab === tab
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600"
            } ${
              tab === "networth" && period === "quarterly"
                ? "opacity-30 cursor-not-allowed"
                : ""
            }`}
            disabled={tab === "networth" && period === "quarterly"}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        key={activeTab + period}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6"
      >
       <BarChart
  width={650}
  height={300}
  data={getData()}
  barGap={12}
  barCategoryGap={30}
>
  {/* <CartesianGrid strokeDasharray="3 3" /> */}
  <XAxis dataKey="name" />
  {/* <YAxis /> */}

  <Bar
    dataKey="value"
    fill="#00A66C"
    barSize={18}
    // radius={[10, 10, 0, 0]} 
  >
    <LabelList
      dataKey="value"
      position="top"
      style={{ fill: "#333", fontSize: 14, fontWeight: "600" }}
    />
  </Bar>
</BarChart>

      </motion.div>

      {/* Period Toggle */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-full ${
              period === "quarterly"
                ? "bg-green-100 text-green-600"
                : "text-gray-600"
            }`}
            onClick={() => setPeriod("quarterly")}
          >
            Quarterly
          </button>
          <button
            className={`px-4 py-2 rounded-full ${
              period === "yearly"
                ? "bg-green-100 text-green-600"
                : "text-gray-600"
            }`}
            onClick={() => setPeriod("yearly")}
          >
            Yearly
          </button>
        </div>

        {/* <button className="text-green-600 font-medium underline">
          See Details
        </button> */}
      </div>
    </div>
</div>

{/* About the stock */}
 <div className="mt-12 max-w-3xl ">
  <h1 className="text-xl font-semibold mb-4">About {name} </h1>
  <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow">

      <p className="text-gray-700 leading-relaxed">
        {expanded ? fullText : shortText}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 font-medium hover:underline"
        >
          {expanded ? "Read less" : "...Read more"}
        </button>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 border-t pt-6">
        <div>
          <p className="text-gray-500 text-sm">Parent Organisation</p>
          <p className="font-semibold">{name}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">NSE Symbol</p>
          <p className="font-semibold">MCLOUD</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Managing Director</p>
          <p className="font-semibold">Mr. Joseph Thumma</p>
        </div>
      </div>
    </div>
    </div>
      
    </div>
  );
};

const Fundamentals = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn"
    >
      <div className="bg-white w-full lg:w-[60vw] max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-8 relative pb-15">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-3xl cursor-pointer"
        >
          ×
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-emerald-100 p-3 rounded-full text-green-600 center">
           <GrDocumentText size={25} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-xl font-bold mt-4 bg-green-300">
          FUNDAMENTALS
        </h1>
        

        {/* Subtitle */}
        <p className="text-center text-white mt-2 bg-sky-400">
          It is financial information that is reported quarterly or annually.
        </p>

        {/* Grid content */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">

          {/* Item */}
          <div>
            <h3 className="font-semibold">Market Cap</h3>
            <p className="text-gray-600 text-sm">
              Market cap is the total market value of all of a company's outstanding shares.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">ROE</h3>
            <p className="text-gray-600 text-sm">
              Return on equity (ROE) is a measure of financial performance, calculated by dividing net income by shareholders' equity.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">P/E Ratio (TTM)</h3>
            <p className="text-gray-600 text-sm">
              P/E (price-to-earnings) ratio is the ratio of a company's share price to its earnings per share (EPS). P/E ratio is used to determine whether a company is overvalued or undervalued.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">Book Value</h3>
            <p className="text-gray-600 text-sm">
              The amount of money that a company's shareholders would earn if it is liquidated and has paid off all liabilities.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">P/B Ratio</h3>
            <p className="text-gray-600 text-sm">
              P/B (price-to-book) ratio is the ratio of a company's share price to its book value. Any value under 1.0 is considered a good P/B value.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">Dividend Yield</h3>
            <p className="text-gray-600 text-sm">
              Dividend yield percentage is the amount of money a company pays its shareholders for owning a share of its stock divided by its current stock price.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">Industry P/E</h3>
            <p className="text-gray-600 text-sm">
             The average P/E ratio of all the stocks in any sector. Different sectors consider different P/E ratios as healthy.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">EPS(TTM)</h3>
            <p className="text-gray-600 text-sm">
              Earnings per share (EPS) is a company's net profit divided by the number of its common outstanding shares. It indicates how much money a company makes for each share of its stock.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">Face Value</h3>
            <p className="text-gray-600 text-sm">
             The original value of a company's stock as written in its books of accounts and its share certificates. Also known as par value, it is fixed when the stock is first issued.
            </p>
          </div>

          {/* Item */}
          <div>
            <h3 className="font-semibold">Debt to Equity</h3>
            <p className="text-gray-600 text-sm">
              Debt to Equity is the percentage of the total liabilities of a company (debt) to its shareholders' equity. A higher debt to equity means the company is using more debt funds than equity funds, and a lower debt to equity means more equity than debt funds.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

const MarketDepth = ({ buyPercent, sellPercent, bids, asks }) => {
  // Find largest qty to scale bar widths
  const maxQty = Math.max(
    ...bids.map(b => b.qty),
    ...asks.map(a => a.qty)
  );

  return (
    <div className="w-full max-w-4xl p-4 bg-white mt-8 ">

        <h1 className="text-2xl font-semibold mb-5">Market Depth</h1>

      {/* Market Depth Bar */}
      <div className="w-full">
        <div className="flex justify-between text-md text-gray-600 font-medium">
          <span>Buy order quantity</span>
          <span>Sell order quantity</span>
        </div>

        <div className="flex w-full h-2 rounded-full overflow-hidden mt-2 bg-gray-200">
          <div
            className="bg-emerald-500"
            style={{ width: `${buyPercent}%` }}
          ></div>
          <div
            className="bg-red-500"
            style={{ width: `${sellPercent}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-1 text-sm font-medium">
          <span className="text-emerald-600">{buyPercent}%</span>
          <span className="text-red-500">{sellPercent}%</span>
        </div>
      </div>

      {/* Market Depth Table */}
      <div className="grid grid-cols-2 gap-4 divide-x mt-6 rounded-xl shadow p-8">

        {/* Left: Bid Side */}
        <div className="pr-4 ">
          <div className="grid grid-cols-2 text-sm text-gray-600 mb-2">
            <span className="text-gray-500 font-medium">Bid Price</span>
            <span className="text-right text-gray-500 font-medium">Qty</span>
          </div>

          {bids.map((item, i) => (
            <div key={i} className="grid grid-cols-2 items-center text-sm mb-1 relative space-y-4">
              <span>{item.price.toLocaleString()}</span>

              <div className="relative text-right">
                <span className="text-emerald-600 font-medium relative z-10">
                  {item.qty.toLocaleString()}
                </span>

                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-full bg-emerald-100 rounded"
                  style={{ width: `${(item.qty / maxQty) * 100}%` }}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-2 font-semibold">
            <span>Bid Total</span>
            <span>{bids.reduce((acc, cur) => acc + cur.qty, 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Right: Ask Side */}
        <div className="pl-4">
          <div className="grid grid-cols-2 text-sm text-gray-600 mb-2">
            <span className="text-gray-500 font-medium">Ask Price</span>
            <span className="text-right text-gray-500 font-medium">Qty</span>
          </div>

          {asks.map((item, i) => (
            <div key={i} className="grid grid-cols-2 items-center text-sm mb-1 relative space-y-4">
              <span>{item.price.toLocaleString()}</span>

              <div className="relative text-right">
                <span className="text-red-500 font-medium relative z-10">
                  {item.qty.toLocaleString()}
                </span>

                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-full bg-red-100 rounded"
                  style={{ width: `${(item.qty / maxQty) * 100}%` }}
                />
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-2 font-semibold">
            <span>Ask Total</span>
            <span>{asks.reduce((acc, cur) => acc + cur.qty, 0).toLocaleString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};




export default StockDetails;
