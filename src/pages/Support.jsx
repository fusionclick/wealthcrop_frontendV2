import { Link } from "react-router-dom";
import React, { useState } from "react";
import { Mail, ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "You can reset your password by going to the login page and clicking on ‘Forgot Password’. Follow the instructions sent to your registered email.",
  },
  {
    question: "How can I update my KYC details?",
    answer:
      "Go to the ‘Profile’ section in your account settings, and under ‘KYC Details’ click on ‘Update’. You’ll need to upload your latest PAN and Aadhaar details.",
  },
  {
    question: "Where can I see my withdrawal status?",
    answer:
      "You can check the status of your withdrawal in the ‘Funds’ section → ‘Withdrawal History’.",
  },
  {
    question: "What are the market trading hours?",
    answer:
      "Equity and F&O markets are open from 9:15 AM to 3:30 PM, Monday to Friday, excluding holidays.",
  },
];

const SUPPORT_EMAIL = "support@wealthcrop.in";
const INVEST_EMAIL = "invest@wealthcrop.in";
const CATEGORIES = ["Account & KYC", "Bank or nominee update", "SIP / STP / SWP", "Purchase or redemption", "Statements & tax", "Stocks & F&O", "Other"];
const field =
  "mt-1 w-full rounded-lg border border-gray-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--white-5)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--text-primary)]";

const Support = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [form, setForm] = useState({ who: "existing", category: "", subject: "", message: "" });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // The category is the first thing in the subject, so the desk can sort without opening it.
  const sendMail = (e) => {
    e.preventDefault();
    const to = form.who === "new" ? INVEST_EMAIL : SUPPORT_EMAIL;
    const subject = `[${form.category}] ${form.subject.trim()}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(form.message)}`;
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div
  className="
    bg-gray-50 min-h-screen p-6 md:p-10
    dark:bg-[var(--app-bg)]
  "
>
  {/* 🔹 Header */}
  <div className="text-center mb-10">
    <h1
      className="
        text-3xl md:text-4xl font-bold
        text-blue-950
        dark:text-[var(--text-primary)]
      "
    >
      Support & Help Center
    </h1>

    <p
      className="
        text-gray-600 mt-2 text-sm md:text-base
        dark:text-[var(--text-secondary)]
      "
    >
      We’re here to help you with any questions or issues you may have.
    </p>
  </div>

  {/* 🔹 Contact Options
      Pehle yahan teen card thay — Live Chat, Call Us, Email — aur teeno ke button par
      koi onClick hi nahi tha. Helpline number aur email dono template ki baqiyat thay:
      na number hamara tha, na email ka domain. Live chat ke peeche koi backend bhi nahi
      hai. Jo cheez waqai mojood hai sirf wahi rehne di gayi hai. */}
  {/* Client 2026-10-09 — two addresses (existing investors → support@, new investors →
      invest@) and a short form whose category goes into the subject line, mandatory.
      ponytail: the form opens the visitor's own mail app (mailto:) — there is no contact
      endpoint, and a complaint already has its own tracked route (/support/complaint). */}
  <div id="contact" className="max-w-2xl mx-auto mb-10 scroll-mt-24">
    <div
      className="
        bg-white shadow-md rounded-xl p-6

        dark:bg-[var(--card-bg)] dark:border-2 dark:border-[var(--border-color)]
      "
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-purple-100 text-purple-600 p-3 rounded-full dark:bg-purple-500/15 dark:text-purple-400">
          <Mail size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">Write to us</h3>
          <p className="text-gray-600 text-sm dark:text-[var(--text-secondary)]">
            Existing investors: <a className="font-medium text-blue-700 dark:text-blue-400" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            {" · "}New investors: <a className="font-medium text-blue-700 dark:text-blue-400" href={`mailto:${INVEST_EMAIL}`}>{INVEST_EMAIL}</a>
          </p>
        </div>
      </div>

      <form onSubmit={sendMail} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
          I am
          <select required value={form.who} onChange={set("who")} className={field}>
            <option value="existing">An existing investor</option>
            <option value="new">A new investor</option>
          </select>
        </label>
        <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
          Category of support
          <select required value={form.category} onChange={set("category")} className={field}>
            <option value="">Choose one</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)] sm:col-span-2">
          Subject
          <input required value={form.subject} onChange={set("subject")} maxLength={120} className={field} placeholder="e.g. SIP debit did not happen" />
        </label>
        <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)] sm:col-span-2">
          Message
          <textarea required rows={4} value={form.message} onChange={set("message")} className={field} />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Send
          </button>
          <span className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">Opens your email app with the subject “[{form.category || "Category"}] …”.</span>
        </div>
      </form>
    </div>
  </div>

  {/* 🔹 FAQ Section */}
  <div
    className="
      bg-white shadow-md rounded-xl p-6 md:p-8 mb-10

      dark:bg-[var(--card-bg)]
    "
  >
    <h2 className="text-2xl font-semibold text-blue-950 mb-5 dark:text-[var(--text-primary)]">
      Frequently Asked Questions
    </h2>

    <div className="divide-y divide-gray-200 dark:divide-[var(--border-color)]">
      {faqs.map((faq, index) => (
        <div key={index} className="py-4">
          <button
            className="w-full flex justify-between items-center text-left"
            onClick={() => toggleFAQ(index)}
          >
            <span className="text-gray-900 font-medium text-sm md:text-base dark:text-[var(--text-primary)]">
              {faq.question}
            </span>

            <ChevronDown
              className={`transition-transform duration-300 dark:text-[var(--text-secondary)] ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>

          {openIndex === index && (
            <p className="text-gray-600 mt-2 text-sm md:text-base dark:text-[var(--text-secondary)]">
              {faq.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>

  {/* 🔹 Footer CTA */}
  <div className="text-center py-10">
    <h3 className="text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">
      Still need help?
    </h3>

    <p className="text-gray-600 text-sm mt-1 dark:text-[var(--text-secondary)]">
      Our team is always ready to assist you with any issue.
    </p>

    {/* §4.4 — there IS a ticketing system now. A complaint raised here gets a reference
        and a recorded response time; the mailto: next to it stays for general questions,
        which are not complaints and should not clutter the grievance register. */}
    <Link
      to="/support/complaint"
      className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
    >
      Raise a complaint
    </Link>
    <a
      href="mailto:support@wealthcrop.in?subject=%5BOther%5D%20Help%20request"
      className="inline-block mt-4 ml-3 text-blue-700 dark:text-blue-400 text-sm font-medium underline underline-offset-2"
    >
      Or email us a general question
    </a>
  </div>
</div>

  );
};

export default Support;
