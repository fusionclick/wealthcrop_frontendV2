import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rentVsBuy } from "../../utils/calculators";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const RentCalculator = () => {
  const navigate = useNavigate();

  const [price, setPrice] = useState("10000000");
  const [rent, setRent] = useState("30000");
  const [downPct, setDownPct] = useState("20");
  const [rate, setRate] = useState("8.5");
  const [years, setYears] = useState("20");
  const [rentHike, setRentHike] = useState("5");
  const [appreciation, setAppreciation] = useState("6");
  const [invReturn, setInvReturn] = useState("12");
  const [openFAQ, setOpenFAQ] = useState(null);

  const result = useMemo(() => {
    if (!(Number(price) > 0) || !(Number(rent) > 0) || !(Number(years) > 0)) return null;
    return rentVsBuy({
      price: Number(price), rent: Number(rent), downPct: Number(downPct),
      rate: Number(rate), years: Number(years), rentHike: Number(rentHike),
      appreciation: Number(appreciation), invReturn: Number(invReturn),
    });
  }, [price, rent, downPct, rate, years, rentHike, appreciation, invReturn]);

  const faqs = [
    { q: "Ye calculator kya compare karta hai?", a: "Dono taraf mahine ka kharcha barabar rakha jata hai. Kharidne wala EMI + maintenance deta hai; kiraye wala rent deta hai aur bacha hua paisa (down payment + har mahine ka farq) invest karta hai. Aakhir mein kharidne wale ke paas ghar hai, kiraye wale ke paas corpus." },
    { q: "Kiraya kabhi behtar kaise ho sakta hai?", a: "Jab kiraya EMI ke muqable bohat kam ho aur market return property appreciation se zyada ho. Bacha hua paisa compound ho kar ghar ki value se aage nikal jata hai." },
    { q: "Rent har saal barhta hai?", a: "Haan, aap ka diya hua annual hike har 12 mahine baad lagta hai." },
    { q: "Home loan ka tax benefit shamil hai?", a: "Nahi. Section 24(b) ka ₹2 lakh interest deduction aur 80C ka principal shamil nahi — inhe milane par kharidna thora aur behtar lagega." },
    { q: "Aur kya shamil nahi?", a: "Registration, stamp duty, brokerage, aur ghar bechne ka capital gains tax. Ye estimate hai, financial advice nahi." },
  ];

  const Input = ({ label, value, onChange, placeholder, suffix }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
        {label} {suffix && <span className="opacity-60">({suffix})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full border p-2 rounded-lg outline-none
          border-purple-300 bg-white/80
          focus:ring-2 focus:ring-purple-500
          dark:bg-slate-800 dark:border-slate-600 dark:text-white
        "
      />
    </div>
  );

  const Row = ({ label, value, strong }) => (
    <div className={`flex justify-between py-1 ${strong ? "font-bold text-base" : "text-sm opacity-90"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div
      className="
        min-h-screen
        bg-linear-to-r from-blue-100 to-green-100
        dark:from-slate-900 dark:to-slate-800
      "
    >
      {/* HEADER */}
      <div className="py-14 px-6 text-center">
        <h1 className="text-4xl font-extrabold text-purple-700 drop-shadow dark:text-purple-400">
          Rent vs Buy Calculator 🏠
        </h1>
        <p className="max-w-3xl mx-auto mt-4 text-gray-700 text-lg dark:text-slate-300">
          Ghar khareedna behtar hai ya kiraye par reh kar invest karna — numbers se faisla.
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="flex justify-center items-center p-6">
        <div
          className="
            w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden
            grid md:grid-cols-2 border
            bg-white border-gray-200
            dark:bg-slate-900 dark:border-slate-700
          "
        >
          {/* LEFT INPUTS */}
          <div
            className="
              p-8 bg-linear-to-br from-purple-50 to-indigo-100
              dark:from-slate-800 dark:to-slate-900
            "
          >
            <h2 className="text-2xl font-bold text-purple-700 mb-6 dark:text-purple-400">
              Enter Details
            </h2>

            <div className="space-y-3">
              <Input label="Property Price" suffix="₹" value={price} onChange={setPrice} placeholder="Ex: 10000000" />
              <Input label="Monthly Rent" suffix="₹" value={rent} onChange={setRent} placeholder="Ex: 30000" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Down Payment" suffix="%" value={downPct} onChange={setDownPct} placeholder="20" />
                <Input label="Loan Rate" suffix="%" value={rate} onChange={setRate} placeholder="8.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Tenure" suffix="years" value={years} onChange={setYears} placeholder="20" />
                <Input label="Rent Hike" suffix="%/yr" value={rentHike} onChange={setRentHike} placeholder="5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Property Growth" suffix="%/yr" value={appreciation} onChange={setAppreciation} placeholder="6" />
                <Input label="Investment Return" suffix="%/yr" value={invReturn} onChange={setInvReturn} placeholder="12" />
              </div>
            </div>
          </div>

          {/* RIGHT RESULT */}
          <div
            className="
              p-8 bg-linear-to-br from-purple-500 to-indigo-500
              text-white flex flex-col justify-center
              dark:from-gray-800 dark:to-gray-800
            "
          >
            <h3 className="text-xl font-bold mb-4">🏦 {years} Saal Baad</h3>

            {result ? (
              <>
                <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm mb-3">
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-2">Agar Khareedein</p>
                  <Row label="Down payment" value={money(result.down)} />
                  <Row label="Monthly EMI" value={money(result.emi)} />
                  <Row label="EMI + maintenance" value={`${money(result.buyerMonthly)}/mo`} />
                  <Row label="Total EMI diya" value={money(result.totalEmi)} />
                  <div className="border-t border-white/30 mt-2 pt-2">
                    <Row label="Ghar ki value" value={money(result.homeValue)} strong />
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm mb-3">
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-2">Agar Kiraye Par Rahein</p>
                  <Row label="Shuru ka kiraya" value={`${money(rent)}/mo`} />
                  <Row label="Aakhri saal ka kiraya" value={`${money(result.lastRent)}/mo`} />
                  <Row label="Total kiraya diya" value={money(result.rentPaid)} />
                  <div className="border-t border-white/30 mt-2 pt-2">
                    <Row label="Investment corpus" value={money(result.rentCorpus)} strong />
                  </div>
                </div>

                <div className="bg-emerald-500/90 rounded-xl p-4 shadow-lg text-center">
                  <p className="text-sm opacity-90">Behtar faisla</p>
                  <p className="text-2xl font-extrabold uppercase">
                    {result.better === "buy" ? "Ghar Khareedein" : "Kiraye Par Rahein"}
                  </p>
                  <p className="text-sm mt-1">{money(result.gap)} ka faida</p>
                </div>
              </>
            ) : (
              <p className="opacity-95">Property price, kiraya aur tenure daaliye.</p>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div
        className="
          max-w-4xl mx-auto mt-10 p-6 rounded-2xl shadow
          bg-linear-to-r from-blue-200 to-green-100
          dark:from-slate-800 dark:to-slate-700
        "
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">
          FAQ — Rent vs Buy
        </h2>

        {faqs.map((f, i) => (
          <div key={i} className="border-b py-3 dark:border-slate-600">
            <button
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              className="
                w-full flex justify-between items-center text-left
                text-gray-700 font-medium
                dark:text-slate-200
              "
            >
              {f.q}
              <span>{openFAQ === i ? "−" : "+"}</span>
            </button>

            {openFAQ === i && (
              <p className="mt-2 text-gray-700 dark:text-slate-300">{f.a}</p>
            )}
          </div>
        ))}
      </div>

      {/* RELATED CALCULATORS */}
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-white">
          Related Calculators
        </h2>

        <div className="flex gap-4 flex-wrap">
          <button onClick={() => navigate("/calculator/emi-calculator")} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
            EMI Calculator
          </button>
          <button onClick={() => navigate("/calculator/hra-calculator")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow">
            HRA Calculator
          </button>
          <button onClick={() => navigate("/calculator/sip-calculator")} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow">
            SIP Calculator
          </button>
          <button onClick={() => navigate("/calculator/inflation-calculator")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow">
            Inflation Calculator
          </button>
        </div>
      </div>

      <div className="pb-10" />
    </div>
  );
};

export default RentCalculator;
