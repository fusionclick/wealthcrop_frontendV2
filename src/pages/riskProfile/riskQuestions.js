// riskQuestions.js
export const riskQuestions = [
  {
    id: 1,
    question: "How stable is your monthly income?",
    subText: "(Ability to handle long-term market volatility)",
    options: [
      { label: "Very stable (Govt / PSU / MNC)", score: 5 },
      { label: "Mostly stable", score: 4 },
      { label: "Somewhat variable", score: 3 },
      { label: "Unpredictable", score: 2 },
      { label: "No income", score: 1 },
    ],
  },
//   {
//     id: 2,
//     question: "How long do you plan to stay invested?",
//     subText: "(Investment time horizon)",
//     options: [
//       { label: "More than 10 years", score: 5 },
//       { label: "5 – 10 years", score: 4 },
//       { label: "3 – 5 years", score: 3 },
//       { label: "1 – 3 years", score: 2 },
//       { label: "Less than 1 year", score: 1 },
//     ],
//   },
  {
    id: 2,
    question: "How financially prepared are you for emergencies?",
    subText: "(Composite measure: emergency savings + EMI burden)",
    options: [
      { label: "Very strong cushion (12+ months savings + low EMI)", score: 5 },
      { label: "Good cushion (6–12 months)", score: 4 },
      { label: "Moderate cushion (3–6 months OR medium EMI)", score: 3 },
      { label: "Weak (1–3 months OR high EMI)", score: 2 },
      { label: "No savings + high EMI pressure", score: 1 },
    ],
  },
   {
    id: 3,
    question: "When do you expect to need most of this invested money?",
    subText: "(Horizon + Liquidity Need — perfect efficiency)",
    options: [
      { label: "Not needed for 10+ years", score: 5 },
      { label: "Will need after 7–10 years", score: 4 },
      { label: "Will need after 5–7 years", score: 3 },
      { label: "Will need after 2–5 years", score: 2 },
      { label: "Will need within 12 months", score: 1 },
    ],
  },
   {
    id: 4,
    question: "If your investments fall 20% in a short time, what would you do?",
    subText: "(Emotional response to volatility)",
    options: [
      { label: "Invest more", score: 5 },
      { label: "Stay invested", score: 4 },
      { label: "Wait and observe", score: 3 },
      { label: "Reduce exposure", score: 2 },
      { label: "Exit immediately", score: 1 },
    ],
  },
   {
    id: 5,
    question: "How comfortable are you with short-term ups and downs in the market?",
    subText: "",
    options: [
      { label: "Very comfortable", score: 5 },
      { label: "Comfortable", score: 4 },
      { label: "Neutral", score: 3 },
      { label: "Slightly uncomfortable", score: 2 },
      { label: "Very uncomfortable", score: 1 },
    ],
  },
   {
    id: 6,
    question: "What return-risk tradeoff do you prefe?",
    subText: "",
    options: [
      { label: "High return + high volatility", score: 5 },
      { label: "Good returns + moderate volatility", score: 4 },
      { label: "Balanced risk and return", score: 3 },
      { label: "Prefer stability", score: 2 },
      { label: "Avoid volatility entirely", score: 1 },
    ],
  },
   {
    id: 7,
    question: "How much temporary loss can you emotionally tolerate in your investments?",
    subText: "(Numeric drawdown tolerance — very high predictive value)",
    options: [
      { label: "<=5%", score: 5 },
      { label: "5-10%", score: 4 },
      { label: "10-20%", score: 3 },
      { label: "20-30%", score: 2 },
      { label: "30%", score: 1 },
    ],
  },
   {
    id: 8,
    question: "During a market crash, what do you typically do?",
    subText: "(Horizon + Liquidity Need — perfect efficiency)",
    options: [
      { label: "Buy more", score: 5 },
      { label: "Stay invested", score: 4 },
      { label: "Pause and wait", score: 3 },
      { label: "Reduce exposure", score: 2 },
      { label: "Exit completely", score: 1 },
    ],
  },
   {
    id: 9,
    question: "If many people around you invest in a trending fund, what do you do?",
    subText: "(Herd bias test)",
    options: [
      { label: "Stick to my plan", score: 5 },
      { label: "Research first", score: 4 },
      { label: "Might consider", score: 3 },
      { label: "Likely follow", score: 2 },
      { label: "Always follow", score: 1 },
    ],
  },

  // 👉 Add 7–8 more questions same way
];
