import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    question: "How do I start investing with Wealthcrop?",
    answer:
      "Simply sign up, complete your KYC verification, and explore our curated mutual fund options based on your goals and risk appetite.",
  },
  {
    question: "Are my investments safe on this platform?",
    answer:
      "Yes, all transactions are handled through secure, SEBI-registered partners with bank-level encryption to protect your data and investments.",
  },
  {
    question: "Can I withdraw my investments anytime?",
    answer:
      "Most mutual funds allow withdrawals at any time, though exit load and tax implications may apply depending on your holding period.",
  },
  {
    question: "Do I get personalized investment recommendations?",
    answer:
      "Yes, once you set your goals and risk preferences, our system recommends the best-performing mutual funds suited to your profile.",
  },
  {
    question: "Is there any minimum investment amount?",
    answer:
      "You can start investing with as little as ₹500 in most SIPs. We believe wealth building should be accessible to everyone.",
  },
  {
    question: "How can I track the performance of my funds?",
    answer:
      "You can view live NAV updates, growth charts, and detailed performance reports anytime from your dashboard.",
  },
];




const FAQSection = () => {
  const [open, setOpen] = useState(null);

  const handleWhatsapp = () => {
  const phone = "91XXXXXXXXXX"; // your number
  const message = "Hello, I need some help regarding your app!";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
};

const navigate = useNavigate()
const handleRedirect = (url)=>{
  navigate(url)
}


  return (
 <section
  className="
    py-16 px-6
    bg-gray-50
    dark:bg-[#020617]
  "
>
  <h2
    className="
      text-3xl font-semibold
      lg:pl-25 text-center lg:text-left
      text-blue-950 dark:text-gray-100
      mb-12
    "
  >
    Frequently Asked Questions
  </h2>

  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
    {/* LEFT — FAQ LIST */}
    <div className="lg:col-span-2 space-y-4">
      {faqs.map((item, i) => (
        <div
          key={i}
          className="
            rounded-xl p-4
            bg-white dark:bg-white/5
            shadow dark:shadow-white/5
            border border-gray-100 dark:border-white/10
          "
        >
          <button
            className="
              w-full flex justify-between items-center text-left
              text-blue-950 dark:text-gray-100
              font-medium
            "
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.question}
            {open === i ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {open === i && (
            <p
              className="
                mt-2 pt-2
                text-gray-600 dark:text-gray-400
                border-t border-gray-200 dark:border-white/10
              "
            >
              {item.answer}
            </p>
          )}
        </div>
      ))}
    </div>

    {/* RIGHT — SIDE INFO CARD */}
    <div
      className="
        h-fit p-6 rounded-xl
        bg-white dark:bg-white/5
        shadow-xl dark:shadow-white/5
        border border-gray-100 dark:border-white/10
      "
    >
      <h3 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-4">
        Need More Help?
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        If your questions are not covered in the FAQ section, you can reach out
        to our support team anytime.
      </p>

      <div className="space-y-3">
        <button
          onClick={() => handleRedirect("/support")}
          className="
            w-full py-2 rounded-lg font-medium
            bg-blue-600 hover:bg-blue-700
            dark:bg-blue-500 dark:hover:bg-blue-600
            text-white
          "
        >
          Contact Support
        </button>

        <button
          onClick={() => handleRedirect("/support")}
          className="
            w-full py-2 rounded-lg font-medium
            bg-gray-200 hover:bg-gray-300
            dark:bg-white/10 dark:hover:bg-white/15
            text-blue-950 dark:text-gray-100
          "
        >
          Live Chat
        </button>

        <button
          onClick={handleWhatsapp}
          className="
            w-full py-2 rounded-lg font-medium
            bg-green-600 hover:bg-green-700
            dark:bg-green-500 dark:hover:bg-green-600
            text-white
          "
        >
          WhatsApp Help
        </button>
      </div>

      <hr className="my-6 border-gray-200 dark:border-white/10" />
    </div>
  </div>
</section>


  );
};

export default FAQSection;
