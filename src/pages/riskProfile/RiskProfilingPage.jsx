// RiskProfilingPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProgressBar from "./ProgressBar";
import { profileLabel, profileQuestions, riskQuestions } from "./riskQuestions";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { toastSuccess } from "../../utils/notifyCustom";
import { yearsSince } from "../../utils/profileFields";
import { fetchInvestorData } from "../../redux/investorDataSlice";

const categoryColor = {
  Conservative: "text-blue-600 dark:text-blue-400",
  Moderate: "text-amber-600 dark:text-amber-400",
  Aggressive: "text-red-600 dark:text-red-400",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

// Audit #56 — one line, wherever the profile answers appear, so nobody reads them as scored.
const CONTEXT_NOTE =
  "These describe you — they do not change your risk score. The Advisor uses your age to suggest a life stage and your goal to suggest a time horizon.";

const ABOUT_KEYS = ["age", ...profileQuestions.map((q) => q.key)];
const aboutComplete = (a) =>
  Number.isInteger(Number(a.age)) && Number(a.age) >= 18 && Number(a.age) <= 100 && profileQuestions.every((q) => a[q.key]);

/** "Age 34 · Salaried · ₹10–25 lakh …" — the stored codes, read back as their labels. */
function AboutSummary({ context }) {
  if (!context) return null;
  return (
    <div className="rounded-xl p-3 text-left bg-gray-50 dark:bg-[var(--white-5)] space-y-1">
      <p className="text-xs font-semibold text-gray-700 dark:text-[var(--text-primary)]">About you</p>
      <p className="text-xs text-gray-600 dark:text-[var(--text-secondary)]">
        {[
          context.age ? `Age ${context.age}` : null,
          ...profileQuestions.map((q) => (context[q.key] ? `${q.question}: ${profileLabel(q.key, context[q.key])}` : null)),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">{CONTEXT_NOTE}</p>
    </div>
  );
}

const RiskProfilingPage = () => {
  const [overview, setOverview] = useState(null); // null = still asking the server
  const [started, setStarted] = useState(false);
  const [about, setAbout] = useState({});
  const [currentQ, setCurrentQ] = useState(-1); // -1 = "About you"
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: investorData } = useSelector((state) => state.investorData);

  // Audit #23 / #70 — there is no lock to check any more. This reads the current profile, when
  // it is due for review, the attempt before it and the history; "About you" starts from the
  // last attempt's answers (or the profile's date of birth) so a retake is not a re-typing job.
  useEffect(() => {
    getApiWithToken(`${import.meta.env.VITE_URL}/risk/profile`).then((res) => {
      const data = res?.data?.data || {};
      const dob = new Date(investorData?.profile?.dob || "");
      setOverview(data);
      setAbout({ age: Number.isNaN(dob.getTime()) ? "" : yearsSince(dob), ...(data.context || {}) });
    });
    // Mount only: the overview is read once per visit, and a retake replaces it with the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const asking = started || (overview && !overview.current);
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
    if (currentQ > -1) {
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
    // The nine scored answers, plus the Audit #56 profile answers alongside them (the server
    // stores both with this attempt and scores only the nine).
    const formattedAnswers = Object.keys(answers).reduce(
      (acc, key) => {
        const newKey = keyMap[key];
        if (newKey) acc[newKey] = answers[key];
        return acc;
      },
      { ...Object.fromEntries(ABOUT_KEYS.map((k) => [k, about[k]])), age: Number(about.age) }
    );

    // Backend nau jawab TOP LEVEL par mangta hai (RiskProfileRequest ke rules aur uska
    // apna GET risk/questions dono `q1_income_stability` waghera flat dete hain). Yahan
    // se wo `{ answers: {...} }` ke andar lipte hue jate the, is liye validator ko top
    // level par ek bhi field nahi milti thi aur nauon "required" ho jate the —
    // "Q1 (Income Stability) is required. (and 8 more errors)", chahe sab bhar diye hon.
    const payload = formattedAnswers;

    try {
      const res = await postApiWithToken(`${import.meta.env.VITE_URL}/risk/calculate`, payload);
      // postApiWithToken returns the body, and this endpoint answers `{ success, data }` — the
      // old check read `status` / `data.success`, never matched, and the result screen never
      // appeared although the profile had been saved.
      if (res?.success) {
        toastSuccess("Risk profile saved!");
        setResult(res.data);
        // The Advisor and checkout read the profile from the store; the retake must reach them.
        dispatch(fetchInvestorData());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen flex justify-center items-center p-6 bg-gray-50 dark:bg-[var(--app-bg)]">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-8 bg-white dark:bg-[var(--card-bg)] dark:border dark:border-[var(--border-color)] text-center space-y-4">
        {children}
      </div>
    </div>
  );

  if (!overview) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6 bg-gray-50 dark:bg-[var(--app-bg)]">
        <p className="text-gray-500 dark:text-[var(--text-secondary)]">Checking your risk profile…</p>
      </div>
    );
  }

  if (result) {
    const before = result.previous;
    return shell(
      <>
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-[var(--text-primary)]">Risk Profile Complete</h2>
        {result.score != null && (
          <p className="text-gray-500 dark:text-[var(--text-secondary)]">
            Score: <span className="font-semibold text-gray-800 dark:text-[var(--text-primary)]">{result.score}</span>
          </p>
        )}
        {result.profile && (
          <p className="text-lg font-semibold text-gray-800 dark:text-[var(--text-primary)]">
            Profile: <span className={categoryColor[result.profile] || ""}>{result.profile}</span>
          </p>
        )}
        {result.meaning && <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">{result.meaning}</p>}

        {/* Audit #23 — the attempt this one replaced, and its date. Nothing is overwritten. */}
        <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
          {before
            ? `Previously ${before.profile} (score ${before.score}) on ${fmtDate(before.profiled_at)}${
                before.profile === result.profile ? " — unchanged." : ` — now ${result.profile}.`
              }`
            : "This is your first risk profile."}
        </p>
        {result.review_due_at && (
          <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
            We will remind you to review it on {fmtDate(result.review_due_at)}. You can retake it at any time.
          </p>
        )}

        <AboutSummary context={result.context} />

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/advisor")}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium dark:bg-blue-500"
          >
            Open the Advisor
          </button>
          <button
            onClick={() => navigate("/profile/basic")}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
          >
            Continue to Profile
          </button>
        </div>
      </>
    );
  }

  if (!asking) {
    const { current, previous, history = [] } = overview;
    return shell(
      <>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-[var(--text-primary)]">Your risk profile</h2>

        <div className="rounded-xl p-4 space-y-1 bg-gray-50 dark:bg-[var(--white-5)]">
          <p className="text-lg font-semibold text-gray-800 dark:text-[var(--text-primary)]">
            Profile: <span className={categoryColor[current.profile] || ""}>{current.profile}</span>
          </p>
          <p className="text-gray-500 dark:text-[var(--text-secondary)]">
            Score: <span className="font-semibold text-gray-800 dark:text-[var(--text-primary)]">{current.score}</span>
          </p>
          {current.meaning && <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">{current.meaning}</p>}
          <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">Taken on {fmtDate(current.profiled_at)}</p>
        </div>

        {/* Audit #23 — the old 6-month lock date, now only a reminder. */}
        {overview.review_due ? (
          <p className="rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Review due since {fmtDate(overview.review_due_at)} — retake it so your plan and fund suggestions match you today.
          </p>
        ) : (
          overview.review_due_at && (
            <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
              Next review due {fmtDate(overview.review_due_at)}. You can retake it at any time.
            </p>
          )
        )}

        {previous && (
          <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
            Before that: {previous.profile} (score {previous.score}) on {fmtDate(previous.profiled_at)}
          </p>
        )}

        <AboutSummary context={overview.context} />

        {history.length > 1 && (
          <details className="text-left">
            <summary className="text-xs font-semibold text-gray-600 dark:text-[var(--text-secondary)] cursor-pointer">
              Every attempt ({history.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {history.map((h, i) => (
                <li key={`${h.profiled_at}-${i}`} className="text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                  {fmtDate(h.profiled_at)} · <span className={categoryColor[h.profile] || ""}>{h.profile}</span> · score {h.score}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setStarted(true)}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium dark:bg-blue-500"
          >
            Retake questionnaire
          </button>
          <button
            onClick={() => navigate("/profile/basic")}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
          >
            Back to Profile
          </button>
        </div>
      </>
    );
  }

  const field =
    "w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800 dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

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
      current={currentQ + 1}
      total={riskQuestions.length + 1}
    />

    {currentQ === -1 ? (
      <>
        {/* Audit #56 — the spec's profile questions, asked first and kept with this attempt. */}
        <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-[var(--text-primary)]">About you</h2>
        <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mb-4">{CONTEXT_NOTE}</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
            Age
            <input
              type="number"
              min={18}
              max={100}
              value={about.age ?? ""}
              onChange={(e) => setAbout({ ...about, age: e.target.value })}
              className={field}
            />
          </label>
          {profileQuestions.map((q) => (
            <label key={q.key} className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
              {q.question}
              <select value={about[q.key] || ""} onChange={(e) => setAbout({ ...about, [q.key]: e.target.value })} className={field}>
                <option value="" disabled>
                  Choose…
                </option>
                {q.options.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </>
    ) : (
      <>
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
      </>
    )}

    {/* Navigation */}
    <div className="flex justify-between mt-8">
      <button
        onClick={back}
        disabled={currentQ === -1}
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
          disabled={Object.keys(answers).length !== riskQuestions.length || !aboutComplete(about) || submitting}
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
          disabled={currentQ === -1 ? !aboutComplete(about) : answers[question.id] == null}
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
