// src/pages/IpoFaq.jsx

import { useState } from "react";

const faqData = [
  {
    q: "What is the issue size of this IPO?",
    a: "The issue size represents the total value of shares being offered to the public in the IPO. It includes both fresh issue and offer-for-sale components."
  },
  {
    q: "What is 'pre-apply' for this IPO?",
    a: "Pre-apply allows investors to submit their IPO application before the IPO officially opens. Once the IPO opens, the application is automatically submitted."
  },
  {
    q: "When will my IPO order get placed?",
    a: "If you pre-apply, your order gets placed automatically when the IPO window opens. Otherwise, it is placed instantly at the time of applying within the open dates."
  },
  {
    q: "How will I know if my IPO order is placed?",
    a: "You will receive a confirmation via SMS and email once your application is submitted successfully. You can also check the status in your IPO dashboard."
  },
  {
    q: "What are the open and close dates?",
    a: "Open and close dates indicate the subscription window during which investors can apply for the IPO. Applications cannot be submitted outside this window."
  },
  {
    q: "What is the lot size and minimum order?",
    a: "Lot size is the minimum number of shares you must apply for. You can apply in multiples of a lot, and a single lot determines the minimum investment required."
  },
  {
    q: "What is the allotment date?",
    a: "The allotment date is when the company finalizes which applicants receive shares. You can check your allotment status using your PAN on the registrar’s website."
  },
  {
    q: "Who is the registrar for this IPO?",
    a: "The registrar is a SEBI-registered agency responsible for processing IPO applications, allotment, refunds, and maintaining IPO-related records."
  },
  {
    q: "Where will this IPO be listed?",
    a: "The IPO will be listed on one or both major stock exchanges—NSE and BSE. Listing details are announced after the allotment process is completed."
  }
];

export default function IpoFaq() {
  const [open, setOpen] = useState(null);

  return (
    <div className="mb-20">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">FAQs</h2>

      <div className="space-y-3">
        {faqData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900/90 rounded-2xl shadow-md px-5 py-4 cursor-pointer transition"
            onClick={() => setOpen(open === idx ? null : idx)}
          >
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{item.q}</p>
              <span className="text-lg text-slate-400 dark:text-slate-200">
                {open === idx ? "−" : "+"}
              </span>
            </div>

            {open === idx && (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
