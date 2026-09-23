import { useEffect, useState } from "react";
import { getApiWithToken, postApiWithToken } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";

/**
 * §4.4 — Grievance Redressal.
 *
 * Replaces the mailto: link the Support page offered. An email is not a ticketing system:
 * nothing is stored, nothing can be aged, and SEBI's monthly grievance report has nothing to
 * report from. What a regulator asks is how long the investor waited, and only a record can
 * answer that — so this exists to create the record, and the reference number exists so the
 * investor can hold the platform to it.
 */

const CATEGORIES = [
  ["transaction", "A purchase, SIP or switch"],
  ["redemption", "A redemption or withdrawal"],
  ["payment", "A payment or refund"],
  ["kyc", "KYC or account details"],
  ["other", "Something else"],
];

const STATUS_LABEL = {
  open: "Open",
  in_progress: "Being looked into",
  resolved: "Resolved",
  closed: "Closed",
};

export default function Grievance() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ category: "transaction", subject: "", body: "", related_order_id: "" });
  const [busy, setBusy] = useState(false);

  const load = () =>
    getApiWithToken("/grievances")
      .then((res) => setList(res?.data?.data || res?.data || []))
      .catch(() => setList([]));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    setBusy(true);
    try {
      const res = await postApiWithToken("/grievances", form);
      // The reference is the point of the whole screen — it is what the investor quotes back.
      toastSuccess(res?.data?.message || "Your complaint has been logged.");
      setForm({ category: "transaction", subject: "", body: "", related_order_id: "" });
      await load();
    } catch (err) {
      toastError(err?.response?.data?.message || err?.message || "We could not log that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Raise a complaint</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            You will get a reference number straight away and can follow the complaint here.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-6 space-y-4 dark:border dark:border-[var(--border-color)]"
        >
          <div>
            <label className="text-sm text-[var(--text-secondary)]">What is this about?</label>
            <select
              className="w-full mt-1 rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-transparent p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)]">Subject</label>
            <input
              className="w-full mt-1 rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-transparent p-2"
              value={form.subject}
              maxLength={191}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)]">What happened?</label>
            <textarea
              className="w-full mt-1 rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-transparent p-2"
              rows={5}
              maxLength={5000}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)]">Order reference (optional)</label>
            <input
              className="w-full mt-1 rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-transparent p-2"
              value={form.related_order_id}
              maxLength={64}
              onChange={(e) => setForm({ ...form, related_order_id: e.target.value })}
              placeholder="If this is about one order"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[var(--accent,#ED1C24)] text-white py-2 font-semibold disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit complaint"}
          </button>
        </form>

        <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-6 dark:border dark:border-[var(--border-color)]">
          <h2 className="font-semibold text-[var(--text-primary)] mb-3">Your complaints</h2>
          {list === null ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">You have not raised any complaints.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((g) => (
                <li key={g.reference} className="border-b border-slate-100 dark:border-[var(--border-color)] pb-3 last:border-0">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-[var(--text-primary)]">{g.subject}</span>
                    <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {STATUS_LABEL[g.status] || g.status}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    <code>{g.reference}</code> · raised {new Date(g.created_at).toLocaleDateString("en-GB")}
                    {g.first_responded_at ? " · replied to" : " · awaiting our first reply"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
