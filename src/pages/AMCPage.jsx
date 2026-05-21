// src/pages/AMCPage.jsx
import { useParams } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

export default function AMCPage() {
  const { amcName } = useParams(); // e.g., hdfc, axis, sbi

  // -------------------------------
  // STATIC PLACEHOLDER AMC DATA
  // Replace with API later
  // -------------------------------
  const amcData = {
    hdfc: {
      displayName: amcName,
      logo: "https://via.placeholder.com/80x80?text=HDFC",
      founded: "1999",
      aum: "₹4.9 Lakh Cr",
      website: "https://www.hdfcfund.com",
      categories: {
        equity: 62,
        debt: 28,
        hybrid: 10,
      },
      aumGrowth: [
        { year: "2019", aum: 200000 },
        { year: "2020", aum: 240000 },
        { year: "2021", aum: 300000 },
        { year: "2022", aum: 360000 },
        { year: "2023", aum: 410000 },
      ],
      managers: [
        {
          name: "Ravi Sharma",
          experience: "12 Years",
          qualification: "CFA, MBA",
          funds: ["HDFC Top 100", "HDFC Flexi Cap"],
        },
        {
          name: "Sunita Rao",
          experience: "9 Years",
          qualification: "MBA – Finance",
          funds: ["HDFC Balanced Advantage", "HDFC Midcap"],
        },
      ],
      topFunds: [
        {
          name: "HDFC Flexi Cap Fund",
          category: "Flexi Cap",
          oneY: "18.2%",
          threeY: "16.5%",
          fiveY: "14.8%",
          expense: "1.1%",
          manager: "Ravi Sharma",
        },
        {
          name: "HDFC Top 100 Fund",
          category: "Large Cap",
          oneY: "16.3%",
          threeY: "15.1%",
          fiveY: "13.4%",
          expense: "1.0%",
          manager: "Ravi Sharma",
        },
        {
          name: "HDFC Midcap Opportunities",
          category: "Mid Cap",
          oneY: "21.1%",
          threeY: "18.0%",
          fiveY: "16.9%",
          expense: "1.3%",
          manager: "Sunita Rao",
        },
      ],
    },

    // ------------- Other AMC placeholders ---------------
    axis: {
      displayName: "Axis Mutual Fund",
      logo: "https://via.placeholder.com/80?text=AXIS",
      founded: "2009",
      aum: "₹2.5 Lakh Cr",
      website: "https://www.axismf.com",
      categories: { equity: 70, debt: 20, hybrid: 10 },
      aumGrowth: [
        { year: "2019", aum: 110000 },
        { year: "2020", aum: 140000 },
        { year: "2021", aum: 170000 },
        { year: "2022", aum: 200000 },
        { year: "2023", aum: 250000 },
      ],
      managers: [
        { name: "Amit Shah", experience: "10 Years", qualification: "CFA", funds: ["Axis Bluechip", "Axis ELSS"] },
      ],
      topFunds: [
        { name: "Axis Bluechip", category: "Large Cap", oneY: "14.5%", threeY: "12.2%", fiveY: "11.8%", expense: "0.9%", manager: "Amit Shah" },
      ],
    },
  };

  const data = amcData[amcName] || amcData["hdfc"]; // fallback

  const COLORS = ["#2D70FF", "#7FA6FF", "#BFD3FF"];

  return (
    <div className="w-full min-h-screen bg-white">
      {/* ------------------------------------------------------------- */}
      {/* HEADER SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full border-b bg-white py-8 px-6 md:px-16">
        <div className="flex items-center gap-6">
          <img src={data.logo} alt="AMC Logo" className="w-20 h-20 rounded-lg" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.displayName}</h1>
            <p className="text-gray-600 mt-1">
              Founded: <span className="font-medium">{data.founded}</span> • AUM:{" "}
              <span className="font-medium">{data.aum}</span>
            </p>
            <a href={data.website} target="_blank" className="text-blue-600 mt-2 block underline">
              Visit Website →
            </a>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STATS CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid sm:grid-cols-3 gap-4 p-6 md:px-16">
        <div className="p-5 border rounded-xl bg-blue-50">
          <p className="text-gray-500">Equity Allocation</p>
          <h3 className="text-2xl font-semibold">{data.categories.equity}%</h3>
        </div>
        <div className="p-5 border rounded-xl">
          <p className="text-gray-500">Debt Allocation</p>
          <h3 className="text-2xl font-semibold">{data.categories.debt}%</h3>
        </div>
        <div className="p-5 border rounded-xl">
          <p className="text-gray-500">Hybrid Allocation</p>
          <h3 className="text-2xl font-semibold">{data.categories.hybrid}%</h3>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* AUM GROWTH LINE CHART */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 md:px-16">
        <h2 className="text-2xl font-bold mb-3">AUM Growth Over Years</h2>
        <div className="w-full h-72 border rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.aumGrowth}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="aum" stroke="#2D70FF" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY PIE CHART */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 md:px-16">
        <h2 className="text-2xl font-bold mb-4">Category Allocation</h2>
        <div className="w-full h-72 border rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Equity", value: data.categories.equity },
                  { name: "Debt", value: data.categories.debt },
                  { name: "Hybrid", value: data.categories.hybrid },
                ]}
                cx="50%"
                cy="50%"
                label
                outerRadius={100}
                dataKey="value"
              >
                {COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP FUNDS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 md:px-16">
        <h2 className="text-2xl font-bold mb-4">Top Performing Funds</h2>
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-3">Fund Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">1Y</th>
                <th className="p-3">3Y</th>
                <th className="p-3">5Y</th>
                <th className="p-3">Expense</th>
                <th className="p-3">Manager</th>
              </tr>
            </thead>
            <tbody>
              {data.topFunds.map((f, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{f.name}</td>
                  <td className="p-3">{f.category}</td>
                  <td className="p-3">{f.oneY}</td>
                  <td className="p-3">{f.threeY}</td>
                  <td className="p-3">{f.fiveY}</td>
                  <td className="p-3">{f.expense}</td>
                  <td className="p-3">{f.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FUND MANAGERS */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 md:px-16">
        <h2 className="text-2xl font-bold mb-4">Fund Managers</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {data.managers.map((m, i) => (
            <div key={i} className="p-5 border rounded-xl">
              <h3 className="text-xl font-bold">{m.name}</h3>
              <p className="text-gray-600">{m.experience} experience</p>
              <p className="mt-2 text-gray-800 font-medium">Qualification: {m.qualification}</p>
              <p className="mt-2 text-gray-700">
                Managed Funds:
                <br /> {m.funds.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FAQ SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 md:px-16 mb-10">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>

        <div className="space-y-4">
          <details className="p-4 border rounded-xl">
            <summary className="cursor-pointer font-medium">Is this AMC safe to invest?</summary>
            <p className="mt-2 text-gray-600">Yes, this AMC is regulated by SEBI and follows all compliance norms.</p>
          </details>

          <details className="p-4 border rounded-xl">
            <summary className="cursor-pointer font-medium">How many schemes does this AMC offer?</summary>
            <p className="mt-2 text-gray-600">It offers equity, debt, hybrid, index, and ETF schemes.</p>
          </details>

          <details className="p-4 border rounded-xl">
            <summary className="cursor-pointer font-medium">Where can I find official documents?</summary>
            <p className="mt-2 text-gray-600">Visit the AMC website or check SID/KIM documents section.</p>
          </details>
        </div>
      </div>
    </div>
  );
}
