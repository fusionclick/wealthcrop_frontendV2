import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getApiWithToken, postApiWithToken } from "../api/api";
import { laravelUrl } from "../utils/nodeApi";
import { toastSuccess } from "../utils/notifyCustom";

/**
 * §4.4 — Grievance Redressal.
 *
 * Replaces the mailto: link the Support page offered. An email is not a ticketing system:
 * nothing is stored, nothing can be aged, and SEBI's monthly grievance report has nothing to
 * report from. What a regulator asks is how long the investor waited, and only a record can
 * answer that — so this exists to create the record, and the reference number exists so the
 * investor can hold the platform to it.
 *
 * Audit #35 — and the investor can read the answer. The list used to show a status and
 * nothing else: replies and resolution notes were stored but unreadable here, and there was
 * no way to answer back. Each complaint now opens into its thread (?ref= deep-links it, which
 * is where the reply/resolve notification points).
 */

// Audit #35 — these were bare "/grievances" paths, which the SPA (not Laravel) answered, so
// the list and the form never reached the API at all.
const api = (path) => laravelUrl(path);

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

const when = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const field =
  "w-full mt-1 rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-transparent p-2 text-[var(--text-primary)]";

function Thread({ reference, onChanged }) {
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    getApiWithToken(api(`/grievances/${encodeURIComponent(reference)}`)).then((res) =>
      setThread(res?.data?.data || false)
    );

  useEffect(() => {
    setThread(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    const res = await postApiWithToken(api(`/grievances/${encodeURIComponent(reference)}/reply`), { body: reply });
    setBusy(false);
    if (!res) return; // the server's reason has already been shown
    setReply("");
    toastSuccess("Reply sent.");
    await load();
    onChanged();
  };

  if (thread === null) return <p className="text-sm text-[var(--text-secondary)] mt-3">Loading the conversation…</p>;
  if (thread === false) return <p className="text-sm text-[var(--text-secondary)] mt-3">We could not load this complaint.</p>;

  const closed = thread.status === "resolved" || thread.status === "closed";
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 dark:bg-[var(--white-5)] p-4">
      <div>
        <p className="text-xs text-[var(--text-secondary)]">You wrote · {when(thread.created_at)}</p>
        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap mt-1">{thread.body}</p>
      </div>

      {(thread.replies || []).map((r, i) => (
        <div
          key={i}
          className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
            r.side === "support"
              ? "bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)]"
              : "bg-blue-50 dark:bg-blue-500/10"
          }`}
        >
          <p className="text-xs text-[var(--text-secondary)] mb-1">
            {r.side === "support" ? "WealthCrop support" : "You"} · {when(r.created_at)}
          </p>
          <span className="text-[var(--text-primary)]">{r.body}</span>
        </div>
      ))}

      {thread.resolution_notes ? (
        <div className="rounded-lg p-3 text-sm border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
            {STATUS_LABEL[thread.status] || "Resolution"}
            {thread.resolved_at ? ` · ${when(thread.resolved_at)}` : ""}
          </p>
          <p className="text-[var(--text-primary)] whitespace-pre-wrap">{thread.resolution_notes}</p>
        </div>
      ) : null}

      <form onSubmit={send} className="space-y-2">
        <label className="text-sm text-[var(--text-secondary)]">
          {closed ? "Still not sorted? Replying reopens this complaint." : "Add a reply"}
        </label>
        <textarea
          className={field}
          rows={3}
          maxLength={5000}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy || !reply.trim()}
          className="rounded-lg bg-[var(--accent,#ED1C24)] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send reply"}
        </button>
      </form>
    </div>
  );
}

export default function Grievance() {
  const [params, setParams] = useSearchParams();
  const open = params.get("ref") || "";
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ category: "transaction", subject: "", body: "", related_order_id: "" });
  const [busy, setBusy] = useState(false);

  const load = () =>
    getApiWithToken(api("/grievances")).then((res) => {
      const rows = res?.data?.data;
      setList(Array.isArray(rows) ? rows : []);
    });

  useEffect(() => {
    load();
  }, []);

  const toggle = (reference) => setParams(open === reference ? {} : { ref: reference });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    setBusy(true);
    const res = await postApiWithToken(api("/grievances"), form);
    setBusy(false);
    if (!res) return; // postApiWithToken has already shown the server's reason
    // The reference is the point of the whole screen — it is what the investor quotes back.
    toastSuccess(res?.message || "Your complaint has been logged.");
    setForm({ category: "transaction", subject: "", body: "", related_order_id: "" });
    await load();
    if (res?.data?.reference) setParams({ ref: res.data.reference });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Raise a complaint</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            You will get a reference number straight away and can follow the complaint, read our replies and
            answer them here.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-6 space-y-4 dark:border dark:border-[var(--border-color)]"
        >
          <div>
            <label className="text-sm text-[var(--text-secondary)]">What is this about?</label>
            <select
              className={field}
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
              className={field}
              value={form.subject}
              maxLength={191}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)]">What happened?</label>
            <textarea
              className={field}
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
              className={field}
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
                  <button type="button" onClick={() => toggle(g.reference)} className="w-full text-left">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium text-[var(--text-primary)]">{g.subject}</span>
                      <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {STATUS_LABEL[g.status] || g.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      <code>{g.reference}</code> · raised {new Date(g.created_at).toLocaleDateString("en-GB")}
                      {g.first_responded_at ? " · replied to" : " · awaiting our first reply"}
                      {" · "}
                      <span className="underline underline-offset-2">{open === g.reference ? "Hide conversation" : "View conversation"}</span>
                    </div>
                  </button>
                  {open === g.reference ? <Thread reference={g.reference} onChanged={load} /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
