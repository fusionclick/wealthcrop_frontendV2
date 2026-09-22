import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, Check, Plus, Trash2 } from "lucide-react";
import {
  createAlert,
  deleteAlert,
  deleteNotification,
  fetchAlerts,
  fetchNotifications,
  markAllRead,
  markRead,
  toggleAlert,
} from "../api/notifications";
import { toastError, toastSuccess } from "../utils/notifyCustom";

/**
 * SRS FR 6.1 and §12 — what happened, and what should happen next.
 *
 * Both live on one screen because they are one loop: an alert the investor sets here is
 * what produces a line in the feed above it. Splitting them would mean a second route
 * whose only content is a form.
 */
const TYPE_STYLE = {
  order: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  alert: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  goal: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  kyc: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  performance: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  system: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
};

const when = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function Notifications() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("feed");
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [feed, list] = await Promise.all([fetchNotifications(), fetchAlerts()]);
    setItems(feed?.data ?? []);
    setAlerts(list ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The header bell reads its own count, so tell it whenever this page changes one.
  const bellChanged = () => window.dispatchEvent(new Event("wc:notifications-changed"));

  const readAll = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    bellChanged();
  };

  const open = async (note) => {
    if (!note.read_at) {
      await markRead(note.id);
      setItems((prev) => prev.map((n) => (n.id === note.id ? { ...n, read_at: new Date().toISOString() } : n)));
      bellChanged();
    }
    if (note.link) navigate(note.link);
  };

  const remove = async (id) => {
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    bellChanged();
  };

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617] transition">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="text-xl font-semibold text-blue-900 dark:text-white">
            Notifications {unread > 0 && <span className="text-sm text-amber-600">({unread} new)</span>}
          </h1>
          {tab === "feed" && unread > 0 && (
            <button onClick={readAll} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-5">
          {[
            ["feed", "Activity"],
            ["alerts", `Price alerts${alerts.length ? ` (${alerts.length})` : ""}`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-[#94a3b8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : tab === "feed" ? (
          <Feed items={items} onOpen={open} onRemove={remove} />
        ) : (
          <Alerts alerts={alerts} setAlerts={setAlerts} reload={load} />
        )}
      </div>
    </div>
  );
}

function Feed({ items, onOpen, onRemove }) {
  if (!items.length) {
    return (
      <Empty
        icon={<Bell size={26} />}
        title="No notifications yet"
        body="Order confirmations, price alerts, goal milestones and KYC reminders will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li
          key={n.id}
          className={`group flex gap-3 items-start rounded-xl border p-3 transition ${
            n.read_at
              ? "border-slate-200 dark:border-[var(--border-color)]"
              : "border-blue-200 bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-500/5"
          }`}
        >
          <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md shrink-0 ${TYPE_STYLE[n.type] || TYPE_STYLE.system}`}>
            {n.type}
          </span>

          <button type="button" onClick={() => onOpen(n)} className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
            {n.body && <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">{n.body}</p>}
            <p className="text-[11px] text-slate-400 mt-1">{when(n.created_at)}</p>
          </button>

          <button
            type="button"
            onClick={() => onRemove(n.id)}
            aria-label="Delete notification"
            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-rose-600"
          >
            <Trash2 size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}

const BLANK = { kind: "stock", target: "", label: "", condition: "above", value: "", base_price: "" };

function Alerts({ alerts, setAlerts, reload }) {
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const needsBase = form.condition === "pct_up" || form.condition === "pct_down";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.target.trim()) return toastError(form.kind === "stock" ? "Enter an NSE symbol." : "Enter the BSE scheme code.");
    if (!(Number(form.value) > 0)) return toastError("Enter a level above zero.");
    if (needsBase && !(Number(form.base_price) > 0)) return toastError("A percentage alert needs the current price to measure from.");

    setBusy(true);
    const res = await createAlert({
      ...form,
      target: form.target.trim().toUpperCase(),
      label: form.label.trim() || form.target.trim().toUpperCase(),
      value: Number(form.value),
      base_price: needsBase ? Number(form.base_price) : undefined,
    });
    setBusy(false);

    if (res?.status) {
      setForm(BLANK);
      toastSuccess("Alert set");
      reload();
    }
  };

  const flip = async (id) => {
    await toggleAlert(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const remove = async (id) => {
    await deleteAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const field =
    "border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Tell me when…</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={field} aria-label="Instrument type">
            <option value="stock">Stock (NSE symbol)</option>
            <option value="scheme">Fund (BSE scheme code)</option>
          </select>

          <input
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            placeholder={form.kind === "stock" ? "INFY" : "119551"}
            aria-label="Symbol or scheme code"
            className={field}
          />

          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Name (optional)"
            aria-label="Display name"
            className={field}
          />

          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={field} aria-label="Condition">
            <option value="above">goes above</option>
            <option value="below">falls below</option>
            <option value="pct_up">rises by %</option>
            <option value="pct_down">falls by %</option>
          </select>

          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder={needsBase ? "5 (%)" : "Price / NAV"}
            aria-label="Level"
            className={field}
          />

          {needsBase && (
            <input
              type="number"
              step="0.01"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              placeholder="Price today"
              aria-label="Price to measure from"
              className={field}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-3 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          <Plus size={14} /> {busy ? "Saving…" : "Set alert"}
        </button>

        <p className="text-[11px] text-slate-400 mt-2">
          Prices are checked every 30 minutes while the market is open. An alert fires once, then switches itself off.
        </p>
      </form>

      {alerts.length === 0 ? (
        <Empty icon={<BellRing size={26} />} title="No alerts set" body="Set a level above and we will watch it for you." />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.description}</p>
                <p className="text-[11px] text-slate-400">
                  {a.kind === "stock" ? "Stock" : "Fund"} · {a.target}
                  {a.last_triggered_at ? ` · fired ${when(a.last_triggered_at)}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => flip(a.id)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                  a.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15" : "bg-slate-100 text-slate-500 dark:bg-white/10"
                }`}
              >
                {a.active ? "Watching" : "Off"}
              </button>

              <button type="button" onClick={() => remove(a.id)} aria-label="Delete alert" className="text-slate-400 hover:text-rose-600">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ icon, title, body }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-[#94a3b8]">
          {icon}
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">{body}</p>
      </div>
    </div>
  );
}
