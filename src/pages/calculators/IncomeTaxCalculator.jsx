import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { compareRegimes } from "../../utils/calculators";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const IncomeTaxCalculator = () => {
  const navigate = useNavigate();

  const [gross, setGross] = useState("1200000");
  const [salaried, setSalaried] = useState(true);
  const [c80c, setC80c] = useState("");
  const [c80d, setC80d] = useState("");
  const [hra, setHra] = useState("");
  const [homeLoan, setHomeLoan] = useState("");
  const [openFAQ, setOpenFAQ] = useState(null);

  // Old regime ki deductions apni apni legal limit par cap hoti hain.
  const deductions = useMemo(
    () =>
      Math.min(150000, Number(c80c) || 0) +
      Math.min(100000, Number(c80d) || 0) +
      (Number(hra) || 0) +
      Math.min(200000, Number(homeLoan) || 0),
    [c80c, c80d, hra, homeLoan]
  );

  const result = useMemo(
    () => (Number(gross) > 0 ? compareRegimes({ gross: Number(gross), deductions, salaried }) : null),
    [gross, deductions, salaried]
  );

  const faqs = [
    { q: "Kaun sa regime default hai?", a: "FY 2025-26 se New Regime default hai. Old Regime chunna ho to ITR bharte waqt select karna hota hai." },
    { q: "New regime mein 12 lakh tak tax zero kaise?", a: "Section 87A ka rebate ₹60,000 tak milta hai, jo ₹12 lakh taxable income par banne wale tax ko poora cover kar leta hai. Salaried ko ₹75,000 standard deduction alag se milta hai — yaani ₹12.75 lakh salary tak zero tax." },
    { q: "New regime mein 80C chalta hai?", a: "Nahi. 80C, 80D, HRA aur home loan interest sirf Old Regime mein milte hain. New Regime mein sirf standard deduction hai." },
    { q: "Surcharge kab lagta hai?", a: "₹50 lakh se upar. New Regime mein maximum 25%, Old Regime mein 37% tak. Uske upar 4% health & education cess sab par lagta hai." },
    { q: "Ye figure final hai?", a: "Ye estimate hai. Capital gains, business income, senior citizen slabs aur surcharge ka marginal relief shamil nahi — final filing se pehle CA se confirm kar lein." },
  ];

  const Row = ({ label, value, strong }) => (
    <div className={`flex justify-between py-1 ${strong ? "font-bold text-base" : "text-sm opacity-90"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  const Input = ({ label, value, onChange, placeholder, hint }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
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
      {hint && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{hint}</p>}
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
          Income Tax Calculator 🧾
        </h1>
        <p className="max-w-3xl mx-auto mt-4 text-gray-700 text-lg dark:text-slate-300">
          FY 2025-26 (AY 2026-27) — New vs Old Regime ka seedha muqabla.
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

            <div className="space-y-4">
              <Input
                label="Gross Annual Income (₹)"
                value={gross}
                onChange={setGross}
                placeholder="Ex: 1200000"
              />

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={salaried}
                  onChange={(e) => setSalaried(e.target.checked)}
                  className="accent-purple-600"
                />
                Salaried hoon (standard deduction milega)
              </label>

              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 pt-2">
                Old Regime deductions — New Regime par inka koi asar nahi
              </p>

              <Input label="80C (PPF, ELSS, LIC…)" value={c80c} onChange={setC80c} placeholder="Ex: 150000" hint="Max ₹1,50,000" />
              <Input label="80D (Health insurance)" value={c80d} onChange={setC80d} placeholder="Ex: 25000" hint="Max ₹1,00,000" />
              <Input label="HRA exemption" value={hra} onChange={setHra} placeholder="Ex: 120000" hint="HRA Calculator se nikal lein" />
              <Input label="Home loan interest (24b)" value={homeLoan} onChange={setHomeLoan} placeholder="Ex: 200000" hint="Max ₹2,00,000" />

              <div className="text-sm font-semibold text-purple-700 dark:text-purple-400 pt-1">
                Total deductions: {money(deductions)}
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
            <h3 className="text-xl font-bold mb-4">📊 Tax Summary</h3>

            {result ? (
              <>
                <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm mb-3">
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-2">New Regime</p>
                  <Row label="Standard deduction" value={money(result.new.std)} />
                  <Row label="Taxable income" value={money(result.new.taxable)} />
                  <Row label="Tax (slabs, 87A ke baad)" value={money(result.new.slab)} />
                  {result.new.surcharge > 0 && <Row label="Surcharge" value={money(result.new.surcharge)} />}
                  <Row label="Cess (4%)" value={money(result.new.cess)} />
                  <div className="border-t border-white/30 mt-2 pt-2">
                    <Row label="Total Tax" value={money(result.new.total)} strong />
                    <Row label="Effective rate" value={`${result.new.effectiveRate}%`} />
                  </div>
                </div>

                <div className="bg-white/20 rounded-xl p-4 shadow-lg backdrop-blur-sm mb-3">
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-2">Old Regime</p>
                  <Row label="Standard deduction" value={money(result.old.std)} />
                  <Row label="Deductions claimed" value={money(deductions)} />
                  <Row label="Taxable income" value={money(result.old.taxable)} />
                  <Row label="Tax (slabs, 87A ke baad)" value={money(result.old.slab)} />
                  {result.old.surcharge > 0 && <Row label="Surcharge" value={money(result.old.surcharge)} />}
                  <Row label="Cess (4%)" value={money(result.old.cess)} />
                  <div className="border-t border-white/30 mt-2 pt-2">
                    <Row label="Total Tax" value={money(result.old.total)} strong />
                    <Row label="Effective rate" value={`${result.old.effectiveRate}%`} />
                  </div>
                </div>

                <div className="bg-emerald-500/90 rounded-xl p-4 shadow-lg text-center">
                  <p className="text-sm opacity-90">Aap ke liye behtar</p>
                  <p className="text-2xl font-extrabold uppercase">
                    {result.better === "new" ? "New Regime" : "Old Regime"}
                  </p>
                  <p className="text-sm mt-1">
                    {result.saving > 0 ? `${money(result.saving)} ki bachat` : "Dono barabar hain"}
                  </p>
                </div>
              </>
            ) : (
              <p className="opacity-95">Gross income daaliye — dono regime ka tax turant nikal aayega.</p>
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
          FAQ — Income Tax
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
          <button onClick={() => navigate("/calculator/hra-calculator")} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
            HRA Calculator
          </button>
          <button onClick={() => navigate("/calculator/eightyC-calculator")} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow">
            80C Tracker
          </button>
          <button onClick={() => navigate("/calculator/elss-calculator")} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow">
            ELSS Calculator
          </button>
          <button onClick={() => navigate("/calculator/ltcg-calculator")} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow">
            LTCG Calculator
          </button>
        </div>
      </div>

      <div className="pb-10" />
    </div>
  );
};

export default IncomeTaxCalculator;
