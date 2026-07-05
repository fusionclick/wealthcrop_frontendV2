// RiskProfilingPage.jsx
import { useState } from "react";
import ProgressBar from "./ProgressBar";
import { riskQuestions } from "./riskQuestions";
import axios from "axios";
import { postApiWithToken } from "../../api/api";
import { toastSuccess } from "../../utils/notifyCustom";
import { useNavigate } from "react-router-dom";

const RiskProfilingPage = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // { score, category }
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate()

  const question = riskQuestions[currentQ];

  const handleSelect = (score) => {
    
    setAnswers({
      ...answers,
      [question.id]: score, //  ONLY SCORE STORED
    });
  };

  const next = () => {
    if (currentQ < riskQuestions.length - 1) {
      setCurrentQ((p) => p + 1);
    }
  };

  const back = () => {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
    }
  };

  const submitRiskProfile = async () => {
    setSubmitting(true);
    const keyMap = {
      1: "q1_income_stability",
      2: "q2_emergency_cushion",
      3: "q3_investment_horizon",
      4: "q4_loss_reaction",
      5: "q5_volatility_comfort",
      6: "q6_return_risk_tradeoff",
      7: "q7_loss_tolerance",
      8: "q8_crash_behavior",
      9: "q9_herd_behavior",
    };
    const formattedAnswers = Object.keys(answers).reduce((acc, key) => {
      const newKey = keyMap[key];
      if (newKey) acc[newKey] = answers[key];
      return acc;
    }, {});

    const payload = { answers: formattedAnswers };

    try {
      const res = await postApiWithToken(`${import.meta.env.VITE_URL}/risk/calculate`, payload);
      if (res?.status === 200 || res?.status === true || res?.success) {
        toastSuccess(res?.message || "Risk profile saved!");
        const d = res?.data || res;
        setResult({
          score: d?.score,
          category: d?.category || d?.profile,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categoryColor = { Conservative: "text-blue-600", Moderate: "text-amber-600", Aggressive: "text-red-600" };

  if (result) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6 bg-gray-50 dark:bg-[var(--app-bg)]">
        <div className="w-full max-w-md rounded-2xl shadow-lg p-8 bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-[var(--text-primary)]">Risk Profile Complete</h2>
          {result.score != null && (
            <p className="text-gray-500 dark:text-[var(--text-secondary)]">Score: <span className="font-semibold text-gray-800 dark:text-[var(--text-primary)]">{result.score}</span></p>
          )}
          {result.category && (
            <p className="text-lg font-semibold">
              Profile: <span className={categoryColor[result.category] || "text-gray-700"}>{result.category}</span>
            </p>
          )}
          <button
            onClick={() => navigate("/profile/basic")}
            className="mt-4 w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-medium dark:bg-blue-500"
          >
            Continue to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
  className="
    min-h-screen flex justify-center items-center p-6
    bg-gray-50
    dark:bg-[var(--app-bg)]
  "
>
  <div
    className="
      w-full max-w-2xl rounded-2xl shadow-lg p-8
      bg-white

      dark:bg-[var(--card-bg)]
      dark:border dark:border-[var(--border-color)]
    "
  >
    {/* Progress */}
    <ProgressBar
      current={currentQ}
      total={riskQuestions.length}
    />

    {/* Question */}
    <h2
      className="
        text-xl font-semibold mb-1
        text-gray-800
        dark:text-[var(--text-primary)]
      "
    >
      Q{question.id}. {question.question}
    </h2>

    {/* Options */}
    <div className="space-y-3 mt-4">
      {question.options.map((opt, idx) => (
        <label
          key={idx}
          className={`
            flex items-center gap-3 p-4 rounded-xl cursor-pointer transition border
            ${
              answers[question.id] === opt.score
                ? "border-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:border-blue-400"
                : "border-gray-200 hover:border-gray-400 dark:border-[var(--border-color)] dark:hover:border-[var(--text-secondary)]"
            }
          `}
        >
          <input
            type="radio"
            name={`q-${question.id}`}
            checked={answers[question.id] === opt.score}
            onChange={() => handleSelect(opt.score)}
            className="hidden"
          />

          <span
            className="
              text-gray-800
              dark:text-[var(--text-primary)]
            "
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>

    {/* Navigation */}
    <div className="flex justify-between mt-8">
      <button
        onClick={back}
        disabled={currentQ === 0}
        className="
          px-5 py-2 rounded-lg border transition
          border-gray-300 text-gray-700 disabled:opacity-40

          dark:border-[var(--border-color)]
          dark:text-[var(--text-secondary)]
        "
      >
        Back
      </button>

      {currentQ === riskQuestions.length - 1 ? (
        <button
          onClick={submitRiskProfile}
          disabled={Object.keys(answers).length !== riskQuestions.length || submitting}
          className="
            px-6 py-2 rounded-lg transition
            bg-blue-600 text-white disabled:opacity-50

            dark:bg-blue-500
            dark:hover:bg-blue-600
          "
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      ) : (
        <button
          onClick={next}
          disabled={answers[question.id] == null}
          className="
            px-6 py-2 rounded-lg transition
            bg-blue-600 text-white disabled:opacity-50

            dark:bg-blue-500
            dark:hover:bg-blue-600
          "
        >
          Next
        </button>
      )}
    </div>
  </div>
</div>

  );
};

export default RiskProfilingPage;
