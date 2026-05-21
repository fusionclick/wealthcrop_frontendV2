import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DematAccountPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const navigate = useNavigate()

  const faqs = [
    { q: 'What is a Demat account?', a: 'A Demat (Dematerialized) account holds your securities in electronic form, making buying, selling and managing shares simple and paperless.' },
    { q: 'Is opening a Demat account free?', a: 'Wealthcrop offers a free Demat account opening process (zero account opening charges). Some brokers may charge for annual maintenance — check the plan.' },
    { q: 'How long does it take to open?', a: 'Most accounts are opened within 24–72 hours after KYC documents are submitted and verified.' },
    { q: 'What documents are required?', a: 'PAN card, Aadhaar (or other identity proof), canceled cheque or bank details for linking, and a recent photograph.' },
    { q: 'Can I link multiple bank accounts?', a: 'Yes. You can link one or more bank accounts to enable seamless fund transfers and payouts.' },
    { q: 'Are my holdings safe?', a: 'Yes. Demat accounts are held with depositories (NSDL/CDSL) and Wealthcrop uses secure integration — your holdings are safe and regulated.' },
    { q: 'Can I transfer shares to another Demat?', a: 'Yes — you can transfer shares to another Demat using off-market transfer or by selling and buying via the exchange.' },
    { q: 'Does Demat support mutual funds and bonds?', a: 'Yes. Many mutual funds (ETF units) and bonds can be held in Demat form. Check specific instrument eligibility.' },
    { q: 'Is online trading enabled with Demat?', a: 'Yes. Demat + trading account enables online buy/sell of stocks and ETFs.' },
    { q: 'Who should open a Demat account?', a: 'Anyone planning to invest in stocks, ETFs, bonds or hold electronic securities should open a Demat account.' },
  ];

  return (
    <div className="
  min-h-screen py-12
  bg-gradient-to-b from-blue-50 via-white to-blue-100
  dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
">
  <div className="max-w-5xl mx-auto px-6">

    {/* Hero */}
    <div className="
      bg-white dark:bg-[#020617]
      rounded-3xl shadow-xl dark:shadow-none
      border border-blue-100 dark:border-white/10
      p-8 md:p-12 mb-8
    ">
      <div className="md:flex md:items-center md:gap-8">
        <div className="md:flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 dark:text-gray-100 leading-tight mb-3">
            Open a free Demat account
          </h1>

          <p className="text-lg text-blue-700 dark:text-gray-300 mb-6">
            Start investing in stocks, ETFs and more — paperless, secure and fast.
            Open your Demat account on{" "}
            <span className="font-semibold text-red-600">Wealthcrop</span> today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="
                px-6 py-3 bg-blue-600 dark:bg-blue-500
                text-white rounded-xl font-semibold
                hover:bg-blue-700 dark:hover:bg-blue-400
                shadow-md
              "
            >
              Open Free Demat
            </button>
          </div>
        </div>

        <div className="md:w-80 mt-6 md:mt-0">
          <div className="
            rounded-2xl p-6
            bg-gradient-to-br from-blue-50 to-white
            dark:from-white/5 dark:to-white/5
            border border-blue-100 dark:border-white/10
            shadow-md dark:shadow-none
          ">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quick Overview
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Instant electronic holdings</li>
              <li>• Link bank for UPI / transfers</li>
              <li>• Trusted & regulated custody</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* How to open */}
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <div className="
        bg-white dark:bg-[#020617]
        p-6 rounded-2xl shadow-lg dark:shadow-none
        border border-blue-100 dark:border-white/10
      ">
        <h3 className="text-2xl font-bold text-blue-900 dark:text-gray-100 mb-4">
          How to open
        </h3>
        <ol className="list-decimal list-inside text-gray-700 dark:text-gray-400 space-y-3">
          <li><span className="font-semibold">Start Application:</span> Click “Open Free Demat” and begin your application.</li>
          <li><span className="font-semibold">KYC:</span> Upload PAN, Aadhaar and bank details.</li>
          <li><span className="font-semibold">e-Sign:</span> Complete e-Sign with Aadhaar OTP.</li>
          <li><span className="font-semibold">Verification:</span> Processed within 24–72 hours.</li>
          <li><span className="font-semibold">Account Ready:</span> Credentials sent via SMS/email.</li>
        </ol>
      </div>

      <div className="
        bg-gradient-to-br from-white to-blue-50
        dark:from-white/5 dark:to-white/5
        p-6 rounded-2xl
        border border-blue-100 dark:border-white/10
        shadow-lg dark:shadow-none
      ">
        <h3 className="text-2xl font-bold text-blue-900 dark:text-gray-100 mb-4">
          Documents required
        </h3>
        <ul className="text-gray-700 dark:text-gray-400 space-y-2">
          <li>• PAN card (mandatory)</li>
          <li>• Aadhaar / identity proof</li>
          <li>• Cancelled cheque / bank statement</li>
          <li>• Passport photo</li>
        </ul>

        <div className="
          mt-6 p-4 rounded-xl
          bg-white dark:bg-white/5
          border border-blue-100 dark:border-white/10
          shadow-sm dark:shadow-none
        ">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2">
            Tip
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Keep scanned copies ready — mobile photos work fine.
          </p>
        </div>
      </div>
    </div>

    {/* Benefits */}
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-blue-900 dark:text-gray-100 mb-4">
        Benefits of opening Demat on Wealthcrop
      </h3>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          ["Paperless & Fast", "Complete the account opening online with e-Sign."],
          ["Low Fees", "Transparent brokerage with no hidden charges."],
          ["Safe & Regulated", "Holdings with NSDL/CDSL under regulation."]
        ].map(([title, desc], i) => (
          <div
            key={i}
            className="
              p-5 bg-white dark:bg-[#020617]
              rounded-2xl border border-blue-100 dark:border-white/10
              shadow-sm dark:shadow-none hover:shadow-md transition
            "
          >
            <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
              {title}
            </h4>
            <p className="text-gray-700 dark:text-gray-400 text-sm">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* FAQ */}
    <div className="
      max-w-4xl mx-auto px-6 py-8
      bg-white dark:bg-[#020617]
      rounded-2xl border border-blue-100 dark:border-white/10
      shadow-md dark:shadow-none
    ">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
        Frequently Asked Questions
      </h2>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left px-4 py-4 flex justify-between items-center font-medium text-gray-800 dark:text-gray-200"
            >
              {f.q}
              <span className="text-xl">{openIndex === i ? "−" : "+"}</span>
            </button>

            {openIndex === i && (
              <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

  </div>
</div>

  );
}
