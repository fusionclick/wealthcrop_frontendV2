import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Target, Plus, Trash2, TrendingUp, Wallet } from "lucide-react";
import { deleteApiWithToken, getApiWithToken, postApiWithToken } from "../api/api";
import { laravelUrl, nodeUrl, mergePortfolio } from "../utils/nodeApi";
import { toastError, toastSuccess } from "../utils/notifyCustom";

/**
 * SRS §8.2 and §12.5 — Goal Setting, Progress Tracking, Goal Progress Alerts.
 *
 * The calculators already answered "how much a month?"; nothing kept the answer. A goal is
 * that calculation, saved, measured, and watched by alerts:run.
 *
 * The projection arithmetic is deliberately NOT repeated here — the server sends
 * progress_pct / projected_amount / required_monthly / advice with every goal, and the
 * alert emails are generated from those same numbers. A second copy in the browser is a
 * second answer waiting to disagree with the one that emails the investor.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const TYPES = [
  ["retirement", "Retirement"],
  ["education", "Education"],
  ["vacation", "Vacation"],
  ["purchase", "Major purchase"],
  ["emergency", "Emergency fund"],
  ["custom", "Something else"],
];

const BLANK = {
  name: "",
  type: "custom",
  target_amount: "",
  target_date: "",
  priority: "medium",
  monthly_contribution: "",
  saved_amount: "",
  expected_return: 12,
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  // Same two calls the MF dashboard makes, under the same query keys — react-query serves
  // them from cache when the investor has already been there, so "use my portfolio value"
  // usually costs nothing.
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

  const portfolioValue = useMemo(() => {
    const funds = mergePortfolio(laravelOrders || [], bseHoldings || []);
    return funds.reduce((acc, f) => acc + (Number(f.current_value) || Number(f.inv_amo) || 0), 0);
  }, [laravelOrders, bseHoldings]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getApiWithToken(api("/goals"));
    setGoals(res?.data?.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toastError("Give the goal a name.");
    if (!(Number(form.target_amount) > 0)) return toastError("Enter the amount you need.");
    if (!form.target_date) return toastError("Pick the date you need it by.");

    setBusy(true);
    const res = await postApiWithToken(api("/goals"), {
      ...form,
      name: form.name.trim(),
      target_amount: Number(form.target_amount),
      monthly_contribution: Number(form.monthly_contribution || 0),
      saved_amount: Number(form.saved_amount || 0),
      expected_return: Number(form.expected_return || 12),
    });
    setBusy(false);

    if (res?.status) {
      setGoals((prev) => [...prev, res.data]);
      setForm(BLANK);
      setShowForm(false);
      toastSuccess("Goal saved");
    }
  };

  const contribute = async (goal, amount, mode = "add") => {
    const res = await postApiWithToken(api(`/goals/${goal.id}/contribute`), { amount, mode });
    if (res?.status) {
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? res.data : g)));
      toastSuccess(mode === "set" ? "Balance updated" : "Contribution recorded");
    }
  };

  const remove = async (id) => {
    await deleteApiWithToken(api(`/goals/${id}`));
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const field =
    "w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-blue-900 dark:text-white">Goals</h1>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              What you are saving for, how far along it is, and whether the plan still gets there.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-md"
          >
            <Plus size={14} /> New goal
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 mb-6 grid md:grid-cols-3 gap-3">
            <label className="text-xs text-slate-500 md:col-span-2">
              Goal
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Daughter's college" className={field} />
            </label>

            <label className="text-xs text-slate-500">
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={field}>
                {TYPES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Amount needed
              <input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="2500000" className={field} />
            </label>

            <label className="text-xs text-slate-500">
              Needed by
              <input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} className={field} />
            </label>

            <label className="text-xs text-slate-500">
              Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={field}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Saving each month
              <input type="number" value={form.monthly_contribution} onChange={(e) => setForm({ ...form, monthly_contribution: e.target.value })} placeholder="10000" className={field} />
            </label>

            <label className="text-xs text-slate-500">
              Already saved
              <input type="number" value={form.saved_amount} onChange={(e) => setForm({ ...form, saved_amount: e.target.value })} placeholder="0" className={field} />
            </label>

            <label className="text-xs text-slate-500">
              Expected return (% a year)
              <input type="number" step="0.5" value={form.expected_return} onChange={(e) => setForm({ ...form, expected_return: e.target.value })} className={field} />
            </label>

            <div className="md:col-span-3">
              <button type="submit" disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50">
                {busy ? "Saving…" : "Save goal"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : goals.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-[#94a3b8]">
                <Target size={26} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No goals yet</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
                Retirement, a house, an emergency fund — set the target and we will track it and tell you when it slips.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                portfolioValue={portfolioValue}
                onContribute={contribute}
                onRemove={remove}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GoalCard({ goal, portfolioValue, onContribute, onRemove }) {
  const [amount, setAmount] = useState("");
  const pct = Number(goal.progress_pct || 0);

  return (
    <li className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {goal.name}
            <span className="ml-2 text-[10px] uppercase font-semibold text-slate-400">{goal.priority}</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
            {money(goal.saved_amount)} of {money(goal.target_amount)} · by{" "}
            {new Date(goal.target_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · {goal.months_left} months left
          </p>
        </div>

        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded-md shrink-0 ${
            goal.status === "achieved"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15"
              : goal.on_track
              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15"
              : "bg-amber-50 text-amber-700 dark:bg-amber-500/15"
          }`}
        >
          {goal.status === "achieved" ? "Achieved" : goal.on_track ? "On track" : "Behind"}
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${goal.on_track || goal.status === "achieved" ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{pct}% of the way there</p>

      <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
        <Stat icon={<TrendingUp size={13} />} label="Projected at target date" value={money(goal.projected_amount)} />
        <Stat icon={<Wallet size={13} />} label="Saving now" value={`${money(goal.monthly_contribution)}/mo`} />
        <Stat icon={<Target size={13} />} label="Needed to land on target" value={`${money(goal.required_monthly)}/mo`} />
      </div>

      <p className="mt-2 text-xs text-slate-600 dark:text-[#94a3b8]">{goal.advice}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Add amount"
          aria-label={`Add to ${goal.name}`}
          className="w-32 border border-slate-200 rounded-md px-2 py-1 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
        />
        <button
          type="button"
          onClick={() => {
            if (!(Number(amount) > 0)) return toastError("Enter an amount.");
            onContribute(goal, Number(amount));
            setAmount("");
          }}
          className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md"
        >
          Add
        </button>

        {portfolioValue > 0 && (
          <button
            type="button"
            onClick={() => onContribute(goal, portfolioValue, "set")}
            title="Set this goal's balance to what your mutual fund portfolio is worth today"
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-[#94a3b8] px-3 py-1.5 rounded-md"
          >
            Use my portfolio value ({money(portfolioValue)})
          </button>
        )}

        <button type="button" onClick={() => onRemove(goal.id)} aria-label="Delete goal" className="ml-auto text-slate-400 hover:text-rose-600">
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2">
      <p className="flex items-center gap-1 text-[11px] text-slate-400">
        {icon} {label}
      </p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
