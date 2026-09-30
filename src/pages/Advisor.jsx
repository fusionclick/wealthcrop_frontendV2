import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Bot, History, RotateCcw, Save, ThumbsDown, ThumbsUp, User2 } from "lucide-react";
import { getApiWithToken, postApi, postApiWithToken } from "../api/api";
import { fundBuyPath, nodeUrl } from "../utils/nodeApi";
import { CHAT_STEPS, allocationFor, behaviourInsights, rationaleFor, sleevesFor } from "../utils/advisor";
import { optimiseAroundGlidePath, mptRationale } from "../utils/mpt";
import { toastSuccess } from "../utils/notifyCustom";

/**
 * SRS §8 — Robo Advisory, as a chatbot.
 *
 * It asks the profile questions, produces an allocation, names the funds that carry each
 * sleeve, explains itself, and lets the investor push the answer safer or bolder. The
 * reasoning is the rule engine in utils/advisor.js — this file is only the conversation.
 */
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const api = (path) => `${import.meta.env.VITE_URL}${path}`;
// The date the advice was actually given — the whole point of reopening it.
const planDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const SLEEVE_COLOR = {
  Equity: "bg-blue-500",
  Debt: "bg-emerald-500",
  Gold: "bg-amber-500",
  Cash: "bg-slate-400",
};

export default function Advisor() {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const savedRisk = investorData?.riskProfile?.profile || investorData?.risk_profile?.profile;
  const ucc = investorData?.kyc?.ucc_code;

  const [answers, setAnswers] = useState({});
  const [tilt, setTilt] = useState(0);
  const [saved, setSaved] = useState(false);
  // QA 8.9 — which way the investor voted on this plan, so the buttons can show it.
  const [vote, setVote] = useState(null);
  // The past plan being reopened, straight off the row as it was saved. Null = live advice.
  const [viewing, setViewing] = useState(null);
  const endRef = useRef(null);

  // The questionnaire already answered on /risk is not asked again — it is shown as the
  // starting point, and can still be overridden below.
  const steps = useMemo(
    () => CHAT_STEPS.filter((s) => !(s.key === "risk" && savedRisk)),
    [savedRisk]
  );

  const answered = steps.filter((s) => answers[s.key] !== undefined);
  const current = steps[answered.length];
  const done = !current;

  const risk = answers.risk || savedRisk || "Moderate";
  const lifeStage = answers.lifeStage || "mid";
  const horizonYears = answers.horizonYears || 10;
  const monthlyAmount = answers.monthlyAmount || 0;

  const alloc = useMemo(
    () => allocationFor({ risk, lifeStage, horizonYears, tilt }),
    [risk, lifeStage, horizonYears, tilt]
  );
  // SRS §8 — Modern Portfolio Theory. The glide path above decides what this investor may
  // hold; mean-variance optimisation decides where inside that band the money sits, by
  // maximising return per unit of risk. Suitability still wins: the optimiser cannot move
  // a sleeve more than 10 points from the allocation their profile allows.
  const mpt = useMemo(() => optimiseAroundGlidePath(alloc, risk), [alloc, risk]);

  // The optimised weights ARE the plan. Falling back to the glide path when the solver
  // finds no feasible point means the screen still works rather than going blank.
  const finalAlloc = mpt?.weights || alloc;

  const sleeves = useMemo(() => sleevesFor(finalAlloc, monthlyAmount, risk), [finalAlloc, monthlyAmount, risk]);
  const rationale = useMemo(
    () => [
      ...rationaleFor({ risk, lifeStage, horizonYears, alloc: finalAlloc }),
      ...mptRationale(mpt, alloc),
    ],
    [risk, lifeStage, horizonYears, finalAlloc, mpt, alloc]
  );

  // SRS §16.3 — behaviour read from the investor's own order history, nothing inferred.
  const { data: orders } = useQuery({
    queryKey: ["mfOrderHistory", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/orderHistory"), { ucc }),
    select: (res) => (Array.isArray(res?.data?.orders) ? res.data.orders : []),
    enabled: !!ucc,
  });
  const insights = useMemo(() => behaviourInsights(orders || []), [orders]);

  // SRS §8 (QA 8.9) — the plans this investor already saved, newest first. GET /advice had
  // been written and left with no caller, so advice could be stored and never seen again.
  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ["adviceHistory"],
    queryFn: () => getApiWithToken(api("/advice")),
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });

  // One catalogue lookup per sleeve, by category name. The scheme master has no category
  // filter, but every scheme's name carries it ("... Flexi Cap Fund ...").
  const categories = useMemo(() => [...new Set(sleeves.map((s) => s.category))], [sleeves]);
  const picks = useQueries({
    queries: categories.map((category) => ({
      queryKey: ["advisorFunds", category],
      queryFn: () =>
        postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
          start: 0,
          length: 3,
          search: category,
          mode: "physical",
        }),
      select: (res) => res?.data?.lists || [],
      enabled: done,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const fundsFor = (category) => picks[categories.indexOf(category)]?.data || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answered.length, done]);

  const answer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const restart = () => {
    setAnswers({});
    setTilt(0);
    setSaved(false);
    setVote(null);
  };

  const savePlan = async (feedback = null) => {
    const res = await postApiWithToken(api("/advice"), {
      risk,
      life_stage: lifeStage,
      horizon_years: horizonYears,
      monthly_amount: monthlyAmount,
      allocation: finalAlloc,
      sleeves,
      rationale,
      feedback,
    });
    if (res?.status) {
      setSaved(true);
      // QA 8.9 — the thumbs posted correctly and then looked exactly as they had a moment
      // earlier, so "nothing happened" was the only reasonable reading. A toast that has
      // already faded is not feedback about feedback.
      if (feedback) setVote(feedback);
      refetchHistory();
      toastSuccess(feedback ? "Thanks — noted" : "Plan saved");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-blue-900 dark:text-white">Advisor</h1>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              A few questions, then a plan you can change.
            </p>
          </div>
          {Object.keys(answers).length > 0 && (
            <button onClick={restart} className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1">
              <RotateCcw size={13} /> Start over
            </button>
          )}
        </div>

        {/* ponytail: <details> rather than another open/closed useState — the browser
            already tracks that, and the list is collapsed until it is wanted. */}
        {/* QA 8.9 — this whole block used to be hidden until a plan had been saved, so an
            investor with nothing saved yet saw no sign that reopening one was possible and
            reported it as missing. Shown always: the empty version says where past plans
            will appear, which is the difference between "not built" and "not yet used". */}
        {/* QA 8.9 (re-report) — "can not see any button for reopen an old recommendation". The
            list was here and worked, but it was a collapsed strip labelled "Past plans" whose
            rows showed only a date, so nothing on screen used the word the tester was looking
            for. Open by default once there IS something to reopen, and each row says so. */}
        <details
          open={history.length > 0}
          className="mb-4 rounded-xl border border-slate-200 dark:border-[var(--border-color)] px-3 py-2"
        >
          <summary className="text-xs font-semibold text-slate-600 dark:text-[#94a3b8] cursor-pointer">
            Reopen an earlier recommendation ({history.length})
          </summary>
          {history.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-[var(--text-secondary)]">
              None saved yet. Use <span className="font-medium">Save this plan</span> below and it will appear
              here, ready to reopen.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => setViewing(h)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-md flex items-center gap-2 ${
                      viewing?.id === h.id ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <History size={12} className="shrink-0 text-slate-400" />
                    <span className="text-slate-700 dark:text-[var(--text-primary)]">{planDate(h.created_at)}</span>
                    <span className="text-slate-400">
                      {h.risk} · equity {h.allocation?.equity}%
                    </span>
                    {/* The row was always clickable; nothing said so. */}
                    <span className="ml-auto shrink-0 font-semibold text-blue-600">
                      {viewing?.id === h.id ? "Showing" : "Reopen"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </details>

        {viewing && (
          <div className="mb-5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
                  Past plan · saved {planDate(viewing.created_at)}
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-200/70">
                  Shown as it was saved on that date. This is not live advice.
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 shrink-0"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
              {viewing.risk} · {viewing.horizon_years}-year horizon
              {viewing.monthly_amount ? ` · ${money(viewing.monthly_amount)} a month` : ""}
            </p>
            <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
              Equity {viewing.allocation?.equity}% · Debt {viewing.allocation?.debt}% · Gold {viewing.allocation?.gold}%
              · Cash {viewing.allocation?.cash}%
            </p>

            <table className="w-full text-sm">
              <tbody>
                {(viewing.sleeves || []).map((s) => (
                  <tr
                    key={`${s.sleeve}-${s.category}`}
                    className="border-t border-amber-200/70 dark:border-amber-500/20"
                  >
                    <td className="py-1.5">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${SLEEVE_COLOR[s.sleeve]}`} />
                      {s.category}
                      <span className="text-xs text-slate-400 ml-1">{s.sleeve}</span>
                    </td>
                    <td className="py-1.5 text-right font-semibold whitespace-nowrap">{s.pct}%</td>
                    <td className="py-1.5 text-right text-slate-500 whitespace-nowrap">
                      {viewing.monthly_amount ? `${money(s.amount)}/mo` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(viewing.rationale || []).length > 0 && (
              <ul className="space-y-1 text-xs text-slate-600 dark:text-[#94a3b8] list-disc list-inside">
                {viewing.rationale.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}

            {/* What actually happened since. The row keeps the split and one broad-market
                level, never a per-sleeve NAV — so the market's own move is the only thing
                here that is actually measurable, and it is labelled as exactly that. */}
            <p className="text-xs pt-2 border-t border-amber-200/70 dark:border-amber-500/20 text-slate-700 dark:text-[#94a3b8]">
              {viewing.market_change_pct == null ? (
                "No comparison available for this plan — it was saved before the market level was recorded."
              ) : (
                <>
                  The market ({viewing.market_basis?.symbol}) is{" "}
                  <b className={viewing.market_change_pct >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {viewing.market_change_pct >= 0 ? "up" : "down"} {Math.abs(viewing.market_change_pct)}%
                  </b>{" "}
                  since this advice. That is the market's move, not this plan's own return.
                </>
              )}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Bubble side="bot">
            Hello. I will suggest how to split what you invest — and tell you why.
            {savedRisk && ` Your risk profile says ${savedRisk.toLowerCase()}, so I will start there.`}
          </Bubble>

          {steps.map((step) => {
            if (answers[step.key] === undefined) return null;
            const chosen = step.options.find((o) => String(o.value) === String(answers[step.key]));
            return (
              <div key={step.key} className="space-y-3">
                <Bubble side="bot">{step.question}</Bubble>
                <Bubble side="user">{chosen?.label ?? String(answers[step.key])}</Bubble>
              </div>
            );
          })}

          {current && (
            <>
              <Bubble side="bot">{current.question}</Bubble>
              <div className="flex flex-wrap gap-2 pl-10">
                {current.options.map((o) => (
                  <button
                    key={String(o.value)}
                    onClick={() => answer(current.key, o.value)}
                    className="text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-full"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {done && (
            <>
              <Bubble side="bot">
                Here is the plan. {monthlyAmount ? `${money(monthlyAmount)} a month, split like this:` : "Split it like this:"}
              </Bubble>

              <div className="ml-10 rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-4">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {["equity", "debt", "gold", "cash"].map((k) =>
                    alloc[k] > 0 ? (
                      <div
                        key={k}
                        className={SLEEVE_COLOR[k[0].toUpperCase() + k.slice(1)] || "bg-slate-400"}
                        style={{ width: `${alloc[k]}%` }}
                        title={`${k} ${alloc[k]}%`}
                      />
                    ) : null
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  Equity {finalAlloc.equity}% · Debt {finalAlloc.debt}% · Gold {finalAlloc.gold}% · Cash {finalAlloc.cash}%
                </p>

                <table className="w-full text-sm">
                  <tbody>
                    {sleeves.map((s) => (
                      <tr key={`${s.sleeve}-${s.category}`} className="border-t border-slate-100 dark:border-[var(--border-color)]">
                        <td className="py-2">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${SLEEVE_COLOR[s.sleeve]}`} />
                          {s.category}
                          <span className="text-xs text-slate-400 ml-1">{s.sleeve}</span>
                        </td>
                        <td className="py-2 text-right font-semibold whitespace-nowrap">{s.pct}%</td>
                        <td className="py-2 text-right text-slate-500 whitespace-nowrap">
                          {monthlyAmount ? `${money(s.amount)}/mo` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTilt(-1)}
                    className={`text-xs px-3 py-1.5 rounded-md ${tilt === -1 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"}`}
                  >
                    Make it safer
                  </button>
                  <button
                    onClick={() => setTilt(0)}
                    className={`text-xs px-3 py-1.5 rounded-md ${tilt === 0 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"}`}
                  >
                    As suggested
                  </button>
                  <button
                    onClick={() => setTilt(1)}
                    className={`text-xs px-3 py-1.5 rounded-md ${tilt === 1 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"}`}
                  >
                    Make it bolder
                  </button>
                </div>
              </div>

              {/* SRS §8 — the two numbers MPT exists to produce. Shown next to the split
                  so "why this and not something bolder" has an answer on screen. */}
              {mpt && (
                <div className="ml-10 mb-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-[#94a3b8]">
                  <span>Expected return <b className="text-slate-800 dark:text-white">{(mpt.ret * 100).toFixed(1)}%</b></span>
                  <span>Volatility <b className="text-slate-800 dark:text-white">{(mpt.vol * 100).toFixed(1)}%</b></span>
                  <span>Sharpe <b className="text-slate-800 dark:text-white">{mpt.sharpe.toFixed(2)}</b></span>
                </div>
              )}

              <Bubble side="bot">Why this split:</Bubble>
              <ul className="ml-10 space-y-1 text-sm text-slate-600 dark:text-[#94a3b8] list-disc list-inside">
                {rationale.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              {insights.length > 0 && (
                <>
                  <Bubble side="bot">What your own orders show:</Bubble>
                  <ul className="ml-10 space-y-2">
                    {insights.map((i) => (
                      <li key={i.tag} className="text-sm">
                        <span className="text-[11px] font-semibold uppercase bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 px-2 py-0.5 rounded-md mr-2">
                          {i.tag}
                        </span>
                        <span className="text-slate-600 dark:text-[#94a3b8]">{i.text}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Bubble side="bot">Funds that fit each sleeve:</Bubble>
              <div className="ml-10 space-y-3">
                {categories.map((category) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] mb-1">{category}</p>
                    <ul className="space-y-1">
                      {fundsFor(category).length === 0 ? (
                        <li className="text-xs text-slate-400">Loading suggestions…</li>
                      ) : (
                        fundsFor(category).map((f) => (
                          <li
                            key={`${f.scheme_isin}-${f.scheme_bse_code}`}
                            className="flex items-center gap-2 justify-between rounded-lg border border-slate-200 dark:border-[var(--border-color)] px-3 py-2"
                          >
                            <span className="text-sm truncate">{f.name}</span>
                            <button
                              onClick={() => navigate(fundBuyPath(f.scheme_isin, f.scheme_bse_code))}
                              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md shrink-0"
                            >
                              Invest
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="ml-10 flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => savePlan()}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md"
                >
                  <Save size={13} /> {saved ? "Saved" : "Save this plan"}
                </button>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-1.5 rounded-md"
                >
                  Set a goal for it
                </button>

                <span className="text-xs text-slate-400 ml-auto">
                  {vote ? "Thanks — noted" : "Was this useful?"}
                </span>
                <button
                  onClick={() => savePlan("up")}
                  aria-label="Helpful"
                  aria-pressed={vote === "up"}
                  className={vote === "up" ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"}
                >
                  <ThumbsUp size={15} fill={vote === "up" ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => savePlan("down")}
                  aria-label="Not helpful"
                  aria-pressed={vote === "down"}
                  className={vote === "down" ? "text-rose-600" : "text-slate-400 hover:text-rose-600"}
                >
                  <ThumbsDown size={15} fill={vote === "down" ? "currentColor" : "none"} />
                </button>
              </div>
            </>
          )}

          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, children }) {
  const bot = side === "bot";

  return (
    <div className={`flex gap-2 ${bot ? "" : "flex-row-reverse"}`}>
      <span
        className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
          bot ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-[#94a3b8]"
        }`}
      >
        {bot ? <Bot size={16} /> : <User2 size={16} />}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          bot
            ? "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-[var(--text-primary)]"
            : "bg-blue-600 text-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
