import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { calculateDistribution } from "../../utils/distribution";
import { getApiWithToken } from "../../api/api";
import { MF_EXPLORE_PATH } from "../../utils/nodeApi";
import { FaArrowLeft } from 'react-icons/fa';

export default function Invest({ baskets }) {
  const { id } = useParams();
  const basket = Array.isArray(baskets) ? baskets.find((b) => String(b.id) === String(id)) : null;
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const url = `${import.meta.env.VITE_URL}/baskets/${id}`;
    getApiWithToken(url).then((res) => {
      setDetails(res?.data?.data ?? res?.data ?? null);
    }).catch(() => setDetails(null));
  }, [id]);

  const [mode, setMode] = useState("sip");
  const [amount, setAmount] = useState(1000);
  const [sipDate, setSipDate] = useState(5);

  if (!details?.funds) {
    return <div className="p-10 text-center">Loading basket...</div>;
  }

  const distribution = calculateDistribution(amount, details.funds);

  return (
    <div className="min-h-screen p-6 bg-[#f3f7fb] dark:bg-[var(--app-bg)]">
      <div className="max-w-3xl mx-auto mb-4">
        <Link to={`/basket/${id}`} className="flex items-center font-medium text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2 transition shadow-lg">
          <FaArrowLeft className="mr-2" /> Back to Basket
        </Link>
        <h1 className="text-2xl font-bold mt-4 text-blue-950 dark:text-[var(--text-primary)]">
          {basket?.name || details.name}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto bg-white dark:bg-[var(--card-bg)] rounded-xl p-6 shadow">
        <div className="flex gap-3 mb-6">
          {["sip", "lumpsum"].map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === m ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-[var(--white-10)]"}`}>
              {m === "sip" ? "SIP" : "Lumpsum"}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium mb-1">Amount (₹)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mb-4 dark:bg-[var(--white-5)] dark:border-[var(--border-color)]" />

        {mode === "sip" && (
          <>
            <label className="block text-sm font-medium mb-1">SIP date (day of month)</label>
            <input type="number" min={1} max={28} value={sipDate} onChange={(e) => setSipDate(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 mb-4 dark:bg-[var(--white-5)] dark:border-[var(--border-color)]" />
          </>
        )}

        <h3 className="font-semibold mb-2">Allocation preview</h3>
        <ul className="space-y-2 mb-6">
          {distribution.map((d) => (
            <li key={d.name} className="flex justify-between text-sm border-b pb-1 dark:border-[var(--border-color)]">
              <span>{d.name}</span>
              <span>₹{d.amount} ({d.weight}%)</span>
            </li>
          ))}
        </ul>

        {/* Is button par koi onClick tha hi nahi, aur post karne ko koi endpoint bhi
            nahi: baskets ke liye sirf create/fetch/get hain (Laravel), aur Node/BSE
            backend basket orders jaanta hi nahi. Ek basket SIP ka matlab hai har fund
            par alag asli order — wo abhi bana nahi. Chalta hua dikhne wala button jo
            paison ka kaam na kare, na dikhaana behtar hai. */}
        <button
          type="button"
          disabled
          className="w-full py-3 bg-gray-300 text-gray-600 rounded-xl font-medium cursor-not-allowed
                     dark:bg-white/10 dark:text-[var(--text-secondary)]"
        >
          Basket investing isn’t available yet
        </button>
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-[var(--text-secondary)]">
          You can still start a SIP on any individual fund from{" "}
          <Link to={MF_EXPLORE_PATH} className="text-blue-600 hover:underline dark:text-blue-400">
            Mutual Funds
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
