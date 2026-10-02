import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, Check, Plus, Trash2 } from "lucide-react";
import {
  createAlert,
  deleteAlert,
  deleteNotification,
  fetchAlerts,
  fetchNotifications,
  fetchPreferences,
  markAllRead,
  markRead,
  savePreferences,
  toggleAlert,
} from "../api/notifications";
import { postApi } from "../api/api";
import { nodeUrl } from "../utils/nodeApi";
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
  portfolio: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  market: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  earnings: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
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
            ["alerts", `Alerts${alerts.length ? ` (${alerts.length})` : ""}`],
            ["prefs", "Delivery"],
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
        ) : tab === "prefs" ? (
          <Preferences />
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
        body="Order confirmations, price and portfolio alerts, market moves, earnings dates, goal milestones and KYC reminders will appear here."
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

// Audit #65 — what each kind of alert can watch. A market index has no price level an
// investor sets an alert on, only a day's move; the portfolio has both.
const CONDITIONS = {
  stock: [
    ["above", "goes above"],
    ["below", "falls below"],
    ["pct_up", "rises by %"],
    ["pct_down", "falls by %"],
  ],
  portfolio: [
    ["day_move", "moves by % in a day (up or down)"],
    ["day_down", "falls by % in a day"],
    ["day_up", "rises by % in a day"],
    ["pct_down", "falls by % from today's value"],
    ["pct_up", "rises by % from today's value"],
  ],
  index: [
    ["day_move", "moves by % in a day (up or down)"],
    ["day_down", "falls by % in a day"],
    ["day_up", "rises by % in a day"],
  ],
};
CONDITIONS.scheme = CONDITIONS.stock;

const KIND_LABEL = { stock: "Stock", scheme: "Fund", portfolio: "Portfolio", index: "Market" };

function Alerts({ alerts, setAlerts, reload }) {
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  // Audit #55 — a fund is picked by name or ISIN from the catalogue; nobody should have to
  // know a BSE scheme code. The alert stores the ISIN, which the alert runner prices by.
  const [fundQuery, setFundQuery] = useState("");
  const [fundMatches, setFundMatches] = useState([]);
  const [fund, setFund] = useState(null);
  const needsBase = (form.kind === "stock" || form.kind === "scheme") && (form.condition === "pct_up" || form.condition === "pct_down");
  const isPercent = form.condition.startsWith("pct") || form.condition.startsWith("day");

  useEffect(() => {
    if (form.kind !== "scheme" || fund || fundQuery.trim().length < 3) {
      setFundMatches([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      const res = await postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
        start: 0,
        length: 8,
        search: fundQuery.trim(),
      });
      if (alive) setFundMatches(Array.isArray(res?.data?.lists) ? res.data.lists : []);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [form.kind, fundQuery, fund]);

  const setKind = (kind) => {
    setForm({ ...BLANK, kind, condition: CONDITIONS[kind][0][0], target: kind === "index" ? "NIFTY" : "" });
    setFund(null);
    setFundQuery("");
  };

  const pickFund = (row) => {
    setFund(row);
    setFundQuery(row.name || row.scheme_name || "");
    setForm((f) => ({
      ...f,
      target: row.scheme_isin || row.isin || row.scheme_bse_code || "",
      label: row.name || row.scheme_name || "",
      base_price: row.nav ? String(row.nav) : f.base_price,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.kind === "stock" && !form.target.trim()) return toastError("Enter an NSE symbol.");
    if (form.kind === "scheme" && !fund) return toastError("Search for the fund by name or ISIN and pick it from the list.");
    if (!(Number(form.value) > 0)) return toastError(isPercent ? "Enter a percentage above zero." : "Enter a level above zero.");
    if (needsBase && !(Number(form.base_price) > 0)) return toastError("A percentage alert needs the current price to measure from.");

    const target = form.kind === "portfolio" ? "all" : form.kind === "stock" ? form.target.trim().toUpperCase() : form.target;
    setBusy(true);
    const res = await createAlert({
      ...form,
      target,
      label: form.kind === "stock" ? form.label.trim() || target : form.label.trim() || undefined,
      value: Number(form.value),
      base_price: needsBase ? Number(form.base_price) : undefined,
    });
    setBusy(false);

    if (res?.status) {
      setForm(BLANK);
      setFund(null);
      setFundQuery("");
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
          <select value={form.kind} onChange={(e) => setKind(e.target.value)} className={field} aria-label="What to watch">
            <option value="stock">A stock (NSE symbol)</option>
            <option value="scheme">A mutual fund</option>
            <option value="portfolio">My whole portfolio</option>
            <option value="index">The market (Nifty 50 / Sensex)</option>
          </select>

          {form.kind === "stock" && (
            <>
              <input
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="INFY"
                aria-label="NSE symbol"
                className={field}
              />
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Name (optional)"
                aria-label="Display name"
                className={field}
              />
            </>
          )}

          {form.kind === "scheme" && (
            <div className="relative col-span-2">
              <input
                value={fundQuery}
                onChange={(e) => {
                  setFundQuery(e.target.value);
                  if (fund) {
                    setFund(null);
                    setForm((f) => ({ ...f, target: "", label: "" }));
                  }
                }}
                placeholder="Search fund name or ISIN, e.g. Parag Parikh Flexi Cap"
                aria-label="Fund name or ISIN"
                className={`${field} w-full`}
              />
              {fundMatches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:bg-[var(--card-bg)] dark:border-[var(--border-color)]">
                  {fundMatches.map((row) => (
                    <li key={row.scheme_isin || row.scheme_bse_code || row.name}>
                      <button
                        type="button"
                        onClick={() => pickFund(row)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5"
                      >
                        <span className="block font-medium text-slate-800 dark:text-[var(--text-primary)]">{row.name || row.scheme_name}</span>
                        <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                          {row.scheme_isin || "no ISIN"}
                          {row.nav ? ` · NAV ₹${Number(row.nav).toFixed(2)}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {fund && (
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                  Watching {fund.name || fund.scheme_name}
                  {fund.scheme_isin ? ` · ${fund.scheme_isin}` : ""}
                </p>
              )}
            </div>
          )}

          {form.kind === "index" && (
            <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className={field} aria-label="Index">
              <option value="NIFTY">Nifty 50</option>
              <option value="SENSEX">Sensex</option>
            </select>
          )}

          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={field} aria-label="Condition">
            {CONDITIONS[form.kind].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder={isPercent ? "2 (%)" : "Price / NAV"}
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
          A stock symbol is checked against NSE before the alert is saved, so a typo comes back as an error instead of
          an alert that never fires. Prices are checked every 5 minutes while the market is open; portfolio and market
          moves every 15 minutes, and once more after the evening NAVs. A price alert fires once, then switches itself
          off; a day-move alert fires at most once per trading session and stays on. Each alert says what it means
          for your own holding.
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
                  {KIND_LABEL[a.kind] || a.kind}
                  {a.kind === "stock" || a.kind === "scheme" ? ` · ${a.target}` : ""}
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

const EMAIL_OPTIONS = [
  ["default", "App default"],
  ["off", "Off"],
  ["instant", "Instantly"],
  ["daily", "Daily digest (6 pm)"],
];

/**
 * Per type: in-app on/off and email off / instant / daily. SMS is outside the agreed
 * scope; push remains unavailable until delivery is implemented.
 */
function Preferences() {
  const [rows, setRows] = useState(null);
  const [unavailable, setUnavailable] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPreferences().then((res) => {
      if (!alive) return;
      setRows(Array.isArray(res?.data) ? res.data : []);
      setUnavailable(res?.unavailable || {});
    });
    return () => {
      alive = false;
    };
  }, []);

  const update = (type, patch) => setRows((prev) => prev.map((r) => (r.type === type ? { ...r, ...patch } : r)));

  const save = async () => {
    setSaving(true);
    const res = await savePreferences(Object.fromEntries(rows.map((r) => [r.type, { in_app: r.in_app, email: r.email }])));
    setSaving(false);
    if (res?.status) {
      setRows(res.data);
      toastSuccess("Preferences saved");
    }
  };

  if (rows === null) return <p className="text-sm text-slate-500">Loading…</p>;

  const cell = "px-3 py-2 text-sm text-slate-700 dark:text-[var(--text-primary)]";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[var(--border-color)]">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-left text-xs text-slate-500 dark:text-[#94a3b8]">
              <th className="px-3 py-2 font-medium">Notification</th>
              <th className="px-3 py-2 font-medium">In-app</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Push</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.type} className="border-t border-slate-100 dark:border-[var(--border-color)]">
                <td className={cell}>{r.label}</td>
                <td className={cell}>
                  <input
                    type="checkbox"
                    checked={!!r.in_app}
                    onChange={(e) => update(r.type, { in_app: e.target.checked })}
                    aria-label={`${r.label} in-app`}
                  />
                </td>
                <td className={cell}>
                  <select
                    value={r.email}
                    onChange={(e) => update(r.type, { email: e.target.value })}
                    aria-label={`${r.label} email`}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
                  >
                    {EMAIL_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={cell}>
                  <input type="checkbox" disabled title={unavailable.push} aria-label={`${r.label} push (not available)`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50"
      >
        <Check size={14} /> {saving ? "Saving…" : "Save preferences"}
      </button>

      <p className="text-[11px] text-slate-400">
        “App default” keeps today’s behaviour: order and payment confirmations are emailed, most other notices are
        in-app only. A daily digest bundles that type’s emails into one message at 6 pm.
        {unavailable.push ? ` Push notifications are not available yet — ${unavailable.push}` : ""}
      </p>
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
