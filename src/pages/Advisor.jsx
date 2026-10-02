import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Bot, History, RotateCcw, Save, SlidersHorizontal, ThumbsDown, ThumbsUp, User2 } from "lucide-react";
import { getApi, getApiWithToken, postApi, postApiWithToken } from "../api/api";
import { fundBuyPath, fundSipPath, laravelUrl, mergePortfolio, nodeUrl } from "../utils/nodeApi";
import {
  CHAT_STEPS,
  DEFAULT_RISK_POLICY,
  LIFE_STAGES,
  SLEEVE_KEYS,
  actualAllocation,
  adjustmentsFor,
  allocationFor,
  allocationGap,
  behaviourInsights,
  canonicalRisk,
  driftedSleeves,
  horizonFromProfile,
  inCategory,
  lifeStageFromProfile,
  rankFunds,
  rationaleFor,
  sleevesFor,
} from "../utils/advisor";
import { glideBounds, manualSplitErrors, optimiseAroundGlidePath, mptRationale, statsFor } from "../utils/mpt";
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
const title = (k) => k[0].toUpperCase() + k.slice(1);

const SLEEVE_COLOR = {
  Equity: "bg-blue-500",
  Debt: "bg-emerald-500",
  Gold: "bg-amber-500",
  Cash: "bg-slate-400",
};

// Audit #58 — what a 👎 can say. Stored with the vote and read back by adjustmentsFor.
const REASONS = [
  ["too_risky", "Too risky"],
  ["too_safe", "Too safe"],
  ["other", "Something else"],
];

export default function Advisor() {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  // Canonical: `wc:qa set-risk` once stored "moderate", and sleevesFor compares exactly.
  const savedRisk = canonicalRisk(investorData?.riskProfile?.profile || investorData?.risk_profile?.profile);
  const ucc = investorData?.kyc?.ucc_code;

  const [answers, setAnswers] = useState({});
  const [tilt, setTilt] = useState(0);
  // Audit #56 — ask the questions the risk profile already answered, when the investor wants to.
  const [askAll, setAskAll] = useState(false);
  // Audit #58 — a split the investor set by hand ({key, alloc}), and the one being edited.
  const [custom, setCustom] = useState(null);
  const [editing, setEditing] = useState(null);
  // QA 8.1 — per plan: the row it was stored as, whether it was saved, and the vote (QA 8.9:
  // the buttons show it). Keyed by the inputs below, so "Make it bolder" is a different plan
  // with its own Save and thumbs, and switching back finds the first one as it was left.
  const [marks, setMarks] = useState({});
  const [busy, setBusy] = useState(false);
  // The past plan being reopened, straight off the row as it was saved. Null = live advice.
  const [viewing, setViewing] = useState(null);
  const endRef = useRef(null);

  // Audit #56 — the risk questionnaire's "about you" answers: age sets the starting life stage,
  // the goal the horizon. Also says whether the risk profile itself is due for review.
  const { data: riskInfo } = useQuery({
    queryKey: ["riskOverview"],
    queryFn: () => getApiWithToken(api("/risk/profile")),
    select: (res) => res?.data?.data || null,
  });
  const prefill = useMemo(
    () => ({ lifeStage: lifeStageFromProfile(riskInfo?.context), horizonYears: horizonFromProfile(riskInfo?.context) }),
    [riskInfo]
  );
  const prefilled = !askAll && (prefill.lifeStage || prefill.horizonYears);

  // The questionnaire already answered on /risk is not asked again — it is shown as the
  // starting point, and can still be overridden below.
  const steps = useMemo(
    () =>
      CHAT_STEPS.filter(
        (s) => !(s.key === "risk" && savedRisk) && !(!askAll && prefill[s.key] != null)
      ),
    [savedRisk, prefill, askAll]
  );

  const answered = steps.filter((s) => answers[s.key] !== undefined);
  const current = steps[answered.length];
  const done = !current;

  const risk = answers.risk || savedRisk || "Moderate";
  const lifeStage = answers.lifeStage || prefill.lifeStage || "mid";
  const horizonYears = answers.horizonYears || prefill.horizonYears || 10;
  const monthlyAmount = answers.monthlyAmount || 0;

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
  // Audit #72 — it also hands back the latest votes, saved or not, so a 👎 is finally read.
  const { data: adviceData, refetch: refetchHistory } = useQuery({
    queryKey: ["adviceHistory"],
    queryFn: () => getApiWithToken(api("/advice")),
    select: (res) => ({
      list: Array.isArray(res?.data?.data) ? res.data.data : [],
      feedback: Array.isArray(res?.data?.recent_feedback) ? res.data.recent_feedback : [],
    }),
  });
  const history = adviceData?.list || [];

  // Audit #72 — orders and votes adjust the plan, deterministically, and say so.
  const adj = useMemo(
    () => adjustmentsFor({ insights, recentFeedback: adviceData?.feedback || [] }),
    [insights, adviceData]
  );
  const effectiveTilt = adj.tilt + tilt;

  const basePlanKey = [risk, lifeStage, horizonYears, monthlyAmount, effectiveTilt].join("|");

  const alloc = useMemo(
    () => allocationFor({ risk, lifeStage, horizonYears, tilt: effectiveTilt }),
    [risk, lifeStage, horizonYears, effectiveTilt]
  );
  // SRS §8 — Modern Portfolio Theory. The glide path above decides what this investor may
  // hold; mean-variance optimisation decides where inside that band the money sits, by
  // maximising return per unit of risk. Suitability still wins: the optimiser cannot move
  // a sleeve more than 10 points from the allocation their profile allows.
  const mpt = useMemo(() => optimiseAroundGlidePath(alloc, risk), [alloc, risk]);
  // Audit #58 — the same band holds a hand-made split.
  const band = useMemo(() => glideBounds(alloc), [alloc]);

  // A custom split belongs to the plan it was made on; changing the answers or the tilt
  // starts from the suggestion again.
  const customAlloc = custom?.key === basePlanKey ? custom.alloc : null;

  // The optimised weights ARE the plan, unless the investor set their own inside the band.
  // Falling back to the glide path when the solver finds no feasible point means the screen
  // still works rather than going blank.
  const finalAlloc = customAlloc || mpt?.weights || alloc;
  const stats = customAlloc ? statsFor(customAlloc) : mpt;

  const planKey = customAlloc ? `${basePlanKey}|${SLEEVE_KEYS.map((k) => customAlloc[k]).join("/")}` : basePlanKey;
  const mark = marks[planKey] || {};

  const sleeves = useMemo(() => sleevesFor(finalAlloc, monthlyAmount, risk), [finalAlloc, monthlyAmount, risk]);
  const rationale = useMemo(
    () => [
      ...rationaleFor({ risk, lifeStage, horizonYears, alloc: finalAlloc }),
      ...(customAlloc
        ? [
            `You set this split yourself, inside the band your profile allows (${SLEEVE_KEYS.map(
              (k) => `${k} ${band[k][0]}–${band[k][1]}%`
            ).join(", ")}). Expected return ${(stats.ret * 100).toFixed(1)}% a year with ${(stats.vol * 100).toFixed(
              1
            )}% volatility, on the same long-run assumptions.`,
          ]
        : mptRationale(mpt, alloc)),
      ...adj.lines.map((line) => `Adjusted because ${line}`),
    ],
    [risk, lifeStage, horizonYears, finalAlloc, customAlloc, band, stats, mpt, alloc, adj]
  );

  // Audit #57 / #58 — the investor's ACTUAL split, from the holdings the MF dashboard shows
  // (same two calls, same query keys, so this is usually served from cache).
  const { data: laravelOrders } = useQuery({
    queryKey: ["investedFunds"],
    queryFn: () => getApiWithToken(laravelUrl(import.meta.env.VITE_GET_FUNDLIST)),
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });
  const { data: bseHoldings } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => res?.data?.holdings || [],
    enabled: !!ucc,
  });
  const actual = useMemo(
    () => actualAllocation(mergePortfolio(laravelOrders || [], bseHoldings || [])),
    [laravelOrders, bseHoldings]
  );

  // Audit #57 — drift from the newest SAVED plan. Checked here, not in alerts:run: holdings
  // live in BSE's order book behind the investor's own login, which Laravel cannot read.
  const latestSaved = history[0];
  const drift = useMemo(
    () => (actual && latestSaved ? driftedSleeves(allocationGap(actual.alloc, latestSaved.allocation)) : []),
    [actual, latestSaved]
  );

  // Ticket 23 — the admin-configured suitability ceilings, the ones Node's order gate uses.
  const { data: policy = DEFAULT_RISK_POLICY } = useQuery({
    queryKey: ["riskPolicy"],
    queryFn: () => getApi(api("/risk-policy")).catch(() => null),
    select: (res) => res?.data || DEFAULT_RISK_POLICY,
    staleTime: 5 * 60 * 1000,
  });

  // Audit #57 — funds ranked on real catalogue data, not the first three name matches: the
  // best 3-year return in the category first, among funds checkout would accept for this
  // investor (rankFunds applies both suitability gates).
  const categories = useMemo(() => [...new Set(sleeves.map((s) => s.category))], [sleeves]);
  const picks = useQueries({
    queries: categories.map((category) => ({
      queryKey: ["advisorFunds", category],
      // The catalogue searches fund NAMES by word: "short duration" misses every "Short Term
      // Fund" in that category, and "large cap" also returns every Large & Mid Cap fund. So
      // search wide on the first word, keep only rows whose category really is this one
      // (inCategory), and page on — best 3Y first — until there are enough to choose from.
      // ponytail: 4 pages × 100 at most; no category is that deep once filtered.
      queryFn: async () => {
        const rows = [];
        for (let start = 0; start < 400; start += 100) {
          const res = await postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
            start,
            length: 100,
            search: category.split(" ")[0],
            sort: "returns_3y",
            order: "desc",
            // Regular plans: what this platform distributes (the commission disclosure every
            // order acknowledges says so), and a Direct twin is the same fund twice.
            plan: "regular",
            // Holdable on a demat account — checkout refuses a physical-only scheme.
            mode: "demat",
          });
          const page = Array.isArray(res?.data?.lists) ? res.data.lists : [];
          rows.push(...page);
          if (page.length < 100 || rows.filter((f) => inCategory(f, category)).length >= 24) break;
        }
        return rows;
      },
      // Without a risk profile checkout refuses every fund, so there is nothing to rank.
      enabled: done && Boolean(savedRisk),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const fundsFor = (category) => {
    const q = picks[categories.indexOf(category)];
    return !q || q.isLoading ? null : rankFunds(q.data || [], { category, profile: savedRisk, policy });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answered.length, done]);

  const answer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const restart = () => {
    setAnswers({});
    setTilt(0);
    setCustom(null);
    setEditing(null);
    setAskAll(false);
  };

  // Audit #57 — "Review due" → one click re-runs the saved plan's answers against today's
  // risk profile, as live advice.
  const rerun = (h) => {
    setAnswers({
      lifeStage: h.life_stage,
      horizonYears: Number(h.horizon_years) || undefined,
      monthlyAmount: Number(h.monthly_amount) || undefined,
    });
    setTilt(0);
    setCustom(null);
    setEditing(null);
    setAskAll(true);
    setViewing(null);
  };

  // QA 8.1 — Save, 👍 and 👎 all posted a new copy of the plan, so the three did the same
  // thing and every vote added a duplicate to "Reopen an earlier recommendation". Now Save
  // keeps the plan (once), and a vote is feedback on it that never adds to that list. The
  // first click on a plan creates its row; every later one updates that same row.
  const record = async (request, change) => {
    setBusy(true);
    const res = await request;
    setBusy(false);
    if (!res?.status) return false;
    setMarks((m) => ({ ...m, [planKey]: { ...m[planKey], id: res.data.id, ...change } }));
    return true;
  };

  const plan = () => ({
    risk,
    life_stage: lifeStage,
    horizon_years: horizonYears,
    monthly_amount: monthlyAmount,
    allocation: finalAlloc,
    sleeves,
    rationale,
    portfolio_positions: (bseHoldings || []).filter((h) => /^IN[A-Z0-9]{10}$/.test(h.scheme_isin || h.isin || "") && Number(h.units) > 0)
      .map((h) => ({ isin: h.scheme_isin || h.isin, units: Number(h.units) })),
    ...(sleeves.every((s) => fundsFor(s.category)?.[0]?.scheme_isin) ? {
      composition: sleeves.map((s) => ({ isin: fundsFor(s.category)[0].scheme_isin,
        weight: s.pct / sleeves.reduce((sum, sleeve) => sum + sleeve.pct, 0) * 100 })),
    } : {}),
  });

  const savePlan = async () => {
    const ok = await record(
      mark.id
        ? postApiWithToken(api(`/advice/${mark.id}/save`), { composition: plan().composition, portfolio_positions: plan().portfolio_positions })
        : postApiWithToken(api("/advice"), { ...plan(), saved: true }),
      { saved: true }
    );
    if (ok) {
      refetchHistory();
      toastSuccess("Plan saved — reopen it any time from the list at the top");
    }
  };

  const rate = async (feedback) => {
    const ok = await record(
      mark.id
        ? postApiWithToken(api(`/advice/${mark.id}/feedback`), { feedback })
        : postApiWithToken(api("/advice"), { ...plan(), saved: false, feedback }),
      { vote: feedback, reason: null }
    );
    if (ok) toastSuccess(feedback === "down" ? "Noted — tell us what was wrong" : "Thanks for the feedback");
  };

  // Audit #58 — the reason behind a 👎, on the row the vote created. Remembered server-side:
  // two "too risky" in the recent votes start the next plan one notch safer.
  const explain = async (reason) => {
    const ok = await record(postApiWithToken(api(`/advice/${mark.id}/feedback`), { feedback: "down", reason }), {
      vote: "down",
      reason,
    });
    if (ok) toastSuccess("Thanks — we will remember that for your next plan");
  };

  const editErrors = editing ? manualSplitErrors(editing, band) : [];

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-blue-900 dark:text-white">Asset Allocation</h1>
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
            Reopen an earlier allocation ({history.length})
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
                    {/* Audit #57 — older than six months, or saved under a different profile. */}
                    {h.review_reason && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        Review due
                      </span>
                    )}
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

        {/* Audit #57 — the investor's real split against the newest saved plan, >10 points. */}
        {drift.length > 0 && !viewing && (
          <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-semibold">Your portfolio has drifted from the plan you saved on {planDate(latestSaved.created_at)}</p>
            <p>
              {drift
                .map((g) => `${title(g.key)} ${g.actual}% against ${g.plan}% planned (${g.gap > 0 ? "+" : ""}${g.gap} points)`)
                .join(" · ")}
            </p>
            <p className="text-amber-700/80 dark:text-amber-200/70">
              Rebalance by pointing new money at the sleeve that is short, or re-run the plan if your situation changed.
              Only mutual funds held through WealthCrop are counted.
            </p>
          </div>
        )}

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

            {viewing.review_reason && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-100/70 dark:bg-amber-500/10 px-3 py-2">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <b>Review due.</b> {viewing.review_reason}
                </p>
                <button
                  onClick={() => rerun(viewing)}
                  className="ml-auto text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                >
                  Re-run with today&apos;s profile
                </button>
              </div>
            )}

            {viewing.review_proposal && (
              <div className="rounded-lg border border-blue-200 p-3 space-y-2 text-xs">
                <p>Updated suggestions · {planDate(viewing.review_proposal.computed_at)} · {viewing.review_proposal.risk}</p>
                <p>Equity {viewing.review_proposal.allocation?.equity}% · Debt {viewing.review_proposal.allocation?.debt}% · Gold {viewing.review_proposal.allocation?.gold}% · Cash {viewing.review_proposal.allocation?.cash}%</p>
                <button type="button" onClick={() => rerun(viewing.review_proposal)} className="rounded-md bg-blue-600 px-3 py-1 text-white">Review updated scheme suggestions</button>
              </div>
            )}

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

            {actual && <PortfolioVsPlan actual={actual} plan={viewing.allocation} tone="amber" />}
            {viewing.model_return_pct != null && (
              <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
                Suggested portfolio NAV return: <b>{viewing.model_return_pct >= 0 ? "+" : ""}{viewing.model_return_pct}%</b>
                {viewing.holdings_return_pct != null && <> · MF holdings captured at save: <b>{viewing.holdings_return_pct >= 0 ? "+" : ""}{viewing.holdings_return_pct}%</b></>}
                {" "}since {planDate(viewing.market_basis?.as_of || viewing.created_at)}. Uses the saved scheme weights; excludes distributions, fees and subsequent contributions.
              </p>
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

          {riskInfo?.review_due && (
            <Bubble side="bot">
              Your risk profile is due for a review (taken {planDate(riskInfo.current?.profiled_at)}).{" "}
              <button onClick={() => navigate("/risk")} className="font-semibold text-blue-600 dark:text-blue-300 underline">
                Retake it
              </button>{" "}
              so this plan matches you today.
            </Bubble>
          )}

          {/* Audit #56 — the profile answers prefill the chat, and the investor is told so. */}
          {prefilled && (
            <Bubble side="bot">
              From your risk profile:{" "}
              {[
                prefill.lifeStage && `age ${riskInfo.context.age} → ${LIFE_STAGES.find(([k]) => k === prefill.lifeStage)?.[1].split(" — ")[0]}`,
                prefill.horizonYears &&
                  `goal → ${CHAT_STEPS.find((s) => s.key === "horizonYears").options.find((o) => o.value === prefill.horizonYears)?.label}`,
              ]
                .filter(Boolean)
                .join("; ")}
              .{" "}
              <button onClick={() => setAskAll(true)} className="font-semibold text-blue-600 dark:text-blue-300 underline">
                Change these
              </button>
              <span className="block mt-1 text-[11px] text-slate-500 dark:text-[#94a3b8]">
                Your age and goal set the starting life stage and horizon; they never change your risk score.
              </span>
            </Bubble>
          )}

          {riskInfo !== undefined &&
            steps.map((step) => {
              if (answers[step.key] === undefined) return null;
              const chosen = step.options.find((o) => String(o.value) === String(answers[step.key]));
              return (
                <div key={step.key} className="space-y-3">
                  <Bubble side="bot">{step.question}</Bubble>
                  <Bubble side="user">{chosen?.label ?? String(answers[step.key])}</Bubble>
                </div>
              );
            })}

          {riskInfo !== undefined && current && (
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

          {riskInfo !== undefined && done && (
            <>
              <Bubble side="bot">
                Here is the plan. {monthlyAmount ? `${money(monthlyAmount)} a month, split like this:` : "Split it like this:"}
              </Bubble>

              {/* Audit #72 — what the investor's own orders and votes changed, said out loud. */}
              {adj.lines.length > 0 && (
                <ul className="ml-10 space-y-1 rounded-xl bg-purple-50 dark:bg-purple-500/10 px-3 py-2">
                  {adj.lines.map((line) => (
                    <li key={line} className="text-xs text-purple-800 dark:text-purple-200">
                      <b>Adjusted because</b> {line}
                    </li>
                  ))}
                </ul>
              )}

              <div className="ml-10 rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 space-y-4">
                {/* Audit #58 — the bar draws the plan the numbers describe (it drew the
                    pre-optimisation split while the figures showed the optimised one). */}
                <div className="flex h-3 rounded-full overflow-hidden">
                  {SLEEVE_KEYS.map((k) =>
                    finalAlloc[k] > 0 ? (
                      <div
                        key={k}
                        className={SLEEVE_COLOR[title(k)] || "bg-slate-400"}
                        style={{ width: `${finalAlloc[k]}%` }}
                        title={`${k} ${finalAlloc[k]}%`}
                      />
                    ) : null
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  Equity {finalAlloc.equity}% · Debt {finalAlloc.debt}% · Gold {finalAlloc.gold}% · Cash {finalAlloc.cash}%
                  {customAlloc && <span className="ml-1 font-semibold text-blue-600 dark:text-blue-300">· your own split</span>}
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
                  {[
                    [-1, "Make it safer"],
                    [0, "As suggested"],
                    [1, "Make it bolder"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTilt(value)}
                      className={`text-xs px-3 py-1.5 rounded-md ${
                        tilt === value && !customAlloc
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"
                      } ${value === 1 && adj.preferBolder ? "ring-2 ring-blue-400" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditing({ ...finalAlloc })}
                    className="text-xs px-3 py-1.5 rounded-md inline-flex items-center gap-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"
                  >
                    <SlidersHorizontal size={12} /> Customise split
                  </button>
                  {customAlloc && (
                    <button onClick={() => setCustom(null)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 px-2">
                      Back to suggested
                    </button>
                  )}
                </div>

                {/* Audit #58 — per-sleeve editing, held to the optimiser's own band (glideBounds). */}
                {editing && (
                  <div className="rounded-lg border border-slate-200 dark:border-[var(--border-color)] p-3 space-y-2">
                    {SLEEVE_KEYS.map((k) => (
                      <label key={k} className="flex items-center gap-3 text-xs text-slate-600 dark:text-[#94a3b8]">
                        <span className="w-14">{title(k)}</span>
                        <input
                          type="range"
                          min={band[k][0]}
                          max={band[k][1]}
                          value={editing[k]}
                          onChange={(e) => setEditing({ ...editing, [k]: Number(e.target.value) })}
                          className="flex-1"
                          aria-label={`${k} percent`}
                        />
                        <input
                          type="number"
                          min={band[k][0]}
                          max={band[k][1]}
                          value={editing[k]}
                          onChange={(e) => setEditing({ ...editing, [k]: e.target.value === "" ? "" : Number(e.target.value) })}
                          className="w-16 border border-slate-200 rounded px-1 py-0.5 bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
                        />
                        <span className="w-20 text-[11px] text-slate-400">
                          {band[k][0]}–{band[k][1]}%
                        </span>
                      </label>
                    ))}
                    <p
                      className={`text-[11px] ${
                        editErrors.length ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {editErrors.length ? editErrors.join(" ") : "Adds up to 100% and stays inside your profile's limits."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        disabled={editErrors.length > 0}
                        onClick={() => {
                          setCustom({ key: basePlanKey, alloc: { ...editing } });
                          setEditing(null);
                        }}
                        className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                      >
                        Use this split
                      </button>
                      <button onClick={() => setEditing(null)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 px-2">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SRS §8 — the two numbers MPT exists to produce. Shown next to the split
                  so "why this and not something bolder" has an answer on screen. */}
              {stats && (
                <div className="ml-10 mb-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-[#94a3b8]">
                  <span>Expected return <b className="text-slate-800 dark:text-white">{(stats.ret * 100).toFixed(1)}%</b></span>
                  <span>Volatility <b className="text-slate-800 dark:text-white">{(stats.vol * 100).toFixed(1)}%</b></span>
                  <span>Sharpe <b className="text-slate-800 dark:text-white">{stats.sharpe.toFixed(2)}</b></span>
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

              {/* Audit #58 — the investor's real portfolio against this plan, sleeve by sleeve. */}
              <Bubble side="bot">Your portfolio vs this plan:</Bubble>
              <div className="ml-10">
                {actual ? (
                  <PortfolioVsPlan actual={actual} plan={finalAlloc} />
                ) : (
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    {ucc ? "No mutual fund holdings to compare yet." : "Once you hold funds here, this compares them with the plan."}
                  </p>
                )}
              </div>

              <Bubble side="bot">Funds that fit each sleeve — best 3-year return first, only ones checkout will accept for you:</Bubble>
              <div className="ml-10 space-y-3">
                {!savedRisk && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Checkout needs a risk profile before any order.{" "}
                    <button onClick={() => navigate("/risk")} className="font-semibold underline">
                      Take the questionnaire
                    </button>{" "}
                    to see funds you can buy.
                  </p>
                )}
                {savedRisk &&
                  categories.map((category) => {
                    const ranked = fundsFor(category);
                    return (
                      <div key={category}>
                        <p className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] mb-1">{category}</p>
                        <ul className="space-y-1">
                          {ranked === null ? (
                            <li className="text-xs text-slate-400">Loading suggestions…</li>
                          ) : ranked.picks.length === 0 ? (
                            <li className="text-xs text-slate-500 dark:text-[#94a3b8]">
                              {ranked.refused
                                ? `None of the ${category} funds listed would pass checkout for your ${savedRisk.toLowerCase()} profile. ${ranked.reason}`
                                : `No ${category} funds are listed right now.`}
                            </li>
                          ) : (
                            ranked.picks.map((f) => (
                              <li
                                key={`${f.scheme_isin}-${f.scheme_bse_code}`}
                                className="flex items-center gap-2 justify-between rounded-lg border border-slate-200 dark:border-[var(--border-color)] px-3 py-2"
                              >
                                <span className="min-w-0">
                                  <span className="block text-sm truncate">{f.name}</span>
                                  <span className="block text-[11px] text-slate-400">
                                    3Y return {Number.isFinite(f.returns?.["3Y"]) ? `${f.returns["3Y"].toFixed(1)}%` : "not published"} · risk{" "}
                                    {f.risk || "not published"}
                                  </span>
                                </span>
                                <span className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => navigate(fundSipPath(f.scheme_isin, f.scheme_bse_code))}
                                    className={`text-xs font-semibold px-3 py-1 rounded-md ${
                                      adj.suggestSip
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-[#94a3b8]"
                                    }`}
                                  >
                                    Start SIP
                                  </button>
                                  <button
                                    onClick={() => navigate(fundBuyPath(f.scheme_isin, f.scheme_bse_code))}
                                    className={`text-xs font-semibold px-3 py-1 rounded-md ${
                                      adj.suggestSip
                                        ? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-[#94a3b8]"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    }`}
                                  >
                                    Invest
                                  </button>
                                </span>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    );
                  })}
              </div>

              <div className="ml-10 flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={savePlan}
                  disabled={busy || mark.saved || !sleeves.every((s) => fundsFor(s.category)?.[0]?.scheme_isin)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md disabled:opacity-60 disabled:cursor-default"
                >
                  <Save size={13} /> {mark.saved ? "Saved" : "Save this plan"}
                </button>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-1.5 rounded-md"
                >
                  Set a goal for it
                </button>

                <span className="text-xs text-slate-400 ml-auto">
                  {mark.vote ? "Thanks — noted" : "Was this useful?"}
                </span>
                <button
                  onClick={() => rate("up")}
                  disabled={busy || mark.vote === "up"}
                  aria-label="Helpful"
                  aria-pressed={mark.vote === "up"}
                  className={mark.vote === "up" ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"}
                >
                  <ThumbsUp size={15} fill={mark.vote === "up" ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => rate("down")}
                  disabled={busy || mark.vote === "down"}
                  aria-label="Not helpful"
                  aria-pressed={mark.vote === "down"}
                  className={mark.vote === "down" ? "text-rose-600" : "text-slate-400 hover:text-rose-600"}
                >
                  <ThumbsDown size={15} fill={mark.vote === "down" ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Audit #58 — a 👎 asks why, then offers the alternative it points to. */}
              {mark.vote === "down" && (
                <div className="ml-10 rounded-xl border border-slate-200 dark:border-[var(--border-color)] px-3 py-2 space-y-2">
                  {!mark.reason ? (
                    <>
                      <p className="text-xs text-slate-600 dark:text-[#94a3b8]">What was wrong with this plan?</p>
                      <div className="flex flex-wrap gap-2">
                        {REASONS.map(([value, label]) => (
                          <button
                            key={value}
                            disabled={busy}
                            onClick={() => explain(value)}
                            className="text-xs border border-slate-300 dark:border-[var(--border-color)] text-slate-700 dark:text-[var(--text-primary)] px-3 py-1 rounded-full bg-transparent dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : mark.reason === "other" ? (
                    <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
                      Noted. <b>Customise split</b> above lets you set each sleeve yourself, inside your profile&apos;s limits.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
                        Noted — we will remember it for your next plan. Want to see the alternative now?
                      </p>
                      <button
                        onClick={() => {
                          setCustom(null);
                          setTilt((t) => (mark.reason === "too_risky" ? Math.max(t - 1, -1) : Math.min(t + 1, 1)));
                        }}
                        className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                      >
                        {mark.reason === "too_risky" ? "Show a safer plan" : "Show a bolder plan"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

/** Audit #58 — plan vs the investor's real holdings, by sleeve, with the gap in points. */
function PortfolioVsPlan({ actual, plan, tone = "slate" }) {
  const border = tone === "amber" ? "border-amber-200/70 dark:border-amber-500/20" : "border-slate-100 dark:border-[var(--border-color)]";
  return (
    <div className="space-y-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left font-medium py-1">Sleeve</th>
            <th className="text-right font-medium">Plan</th>
            <th className="text-right font-medium">You hold</th>
            <th className="text-right font-medium">Gap</th>
          </tr>
        </thead>
        <tbody>
          {allocationGap(actual.alloc, plan).map((g) => (
            <tr key={g.key} className={`border-t ${border}`}>
              <td className="py-1 text-slate-600 dark:text-[#94a3b8]">{title(g.key)}</td>
              <td className="py-1 text-right text-slate-600 dark:text-[#94a3b8]">{g.plan}%</td>
              <td className="py-1 text-right text-slate-600 dark:text-[#94a3b8]">{g.actual}%</td>
              <td
                className={`py-1 text-right font-semibold ${
                  Math.abs(g.gap) > 10 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-[#94a3b8]"
                }`}
              >
                {g.gap > 0 ? "+" : ""}
                {g.gap}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-slate-400">
        {money(actual.total)} in WealthCrop mutual funds, valued at today&apos;s NAV (at cost where none is published).
        {actual.unclassified > 0 && ` ${money(actual.unclassified)} in hybrid funds that span sleeves is left out.`}
      </p>
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
