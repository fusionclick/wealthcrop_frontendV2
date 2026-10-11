import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, Trash2 } from "lucide-react";
import { postApi, postApiWithToken } from "../../api/api";
import { laravelUrl, nodeUrl, apiErrorMessage } from "../../utils/nodeApi";
import { titleCase } from "../../utils/schemeName";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { MAX_SCHEMES, basketMinimum, basketProblem, weightTotal } from "../../utils/basketMath";

/**
 * Client 2026-10-09 — "+ Create Basket" modal: 2 to 5 schemes by autocomplete, a weight for
 * each that must add up to exactly 100%, and the minimum basket amount worked out from each
 * scheme's own minimum (utils/basketMath). Regular plans only — a distributor offers no other.
 * The server checks the same rules again (BasketController::createBasket).
 */
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function BasketBuilderModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [legs, setLegs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return setResults([]);
    let live = true;
    const t = setTimeout(async () => {
      const res = await postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
        start: 0,
        length: 10,
        search: q,
        plan: "regular",
      }).catch(() => null);
      if (live) setResults(res?.data?.lists || []);
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);

  const add = (f) => {
    const code = f.scheme_bse_code || f.scheme_isin;
    if (!code || legs.some((l) => l.code === code) || legs.length >= MAX_SCHEMES) return;
    setLegs((prev) => [...prev, { code, name: f.name, category: f.subType || "", min: Number(f.minLumpsum) || 0, weight: "" }]);
    setQuery("");
    setResults([]);
  };

  const setWeight = (code, value) => setLegs((prev) => prev.map((l) => (l.code === code ? { ...l, weight: value } : l)));
  const remove = (code) => setLegs((prev) => prev.filter((l) => l.code !== code));

  // Equal split to two decimals, the remainder on the last scheme so it totals exactly 100.
  const splitEqually = () =>
    setLegs((prev) => {
      const each = Math.floor((100 / prev.length) * 100) / 100;
      return prev.map((l, i) => ({ ...l, weight: i === prev.length - 1 ? Math.round((100 - each * (prev.length - 1)) * 100) / 100 : each }));
    });

  const problem = basketProblem(legs);
  const minimum = useMemo(() => basketMinimum(legs), [legs]);

  const save = async () => {
    if (problem || !name.trim()) return;
    setSaving(true);
    try {
      await postApiWithToken(
        laravelUrl("/baskets"),
        {
          name: name.trim(),
          holdings: legs.map((l) => ({ code: l.code, name: l.name, asset_type: "mutual_fund", weight: Number(l.weight), category: l.category })),
        },
        { silent: true, throwOnError: true }
      );
      toastSuccess("Basket created.");
      onCreated?.();
      onClose();
    } catch (e) {
      toastError(apiErrorMessage(e, "The basket could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--white-5)] px-3 py-2 text-sm text-slate-900 dark:text-[var(--text-primary)]";

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="basket-builder-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] shadow-xl p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="basket-builder-title" className="text-xl font-semibold text-blue-950 dark:text-[var(--text-primary)]">
              Create your basket
            </h2>
            <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">2 to 5 Regular-plan schemes, weights totalling 100%.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-slate-500 hover:text-slate-800 dark:text-[var(--text-secondary)]">
            <X size={20} />
          </button>
        </div>

        <label className="block text-sm text-slate-700 dark:text-[var(--text-secondary)]">
          Basket name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={`${field} mt-1`} placeholder="e.g. My retirement mix" />
        </label>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={legs.length >= MAX_SCHEMES}
            className={field}
            placeholder={legs.length >= MAX_SCHEMES ? `${MAX_SCHEMES} schemes is the most a basket holds` : "Search a scheme to add…"}
            aria-label="Search a scheme"
          />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] shadow-lg">
              {results.map((f) => (
                <li key={`${f.scheme_isin}-${f.scheme_bse_code}`}>
                  <button type="button" onClick={() => add(f)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:bg-transparent dark:hover:bg-[var(--white-5)]">
                    <span className="text-slate-900 dark:text-[var(--text-primary)]">{titleCase(f.name)}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                      {f.subType || "Mutual fund"}
                      {f.minLumpsum ? ` · min ${money(f.minLumpsum)}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {legs.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-[var(--border-color)] rounded-lg border border-slate-200 dark:border-[var(--border-color)]">
            {legs.map((l) => (
              <li key={l.code} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900 dark:text-[var(--text-primary)] truncate">{titleCase(l.name)}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">{l.min ? `min ${money(l.min)}` : "minimum not published"}</p>
                </div>
                <label className="flex items-center gap-1 text-sm text-slate-700 dark:text-[var(--text-secondary)]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={l.weight}
                    onChange={(e) => setWeight(l.code, e.target.value)}
                    aria-label={`Weight for ${titleCase(l.name)}`}
                    className="w-20 rounded-lg border border-slate-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--white-5)] px-2 py-1 text-right text-slate-900 dark:text-[var(--text-primary)]"
                  />
                  %
                </label>
                <button type="button" onClick={() => remove(l.code)} aria-label={`Remove ${titleCase(l.name)}`} className="p-1 text-slate-400 hover:text-red-600 dark:text-[var(--text-secondary)]">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="space-y-0.5">
            <p className={problem ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}>
              {problem || `Weights total ${weightTotal(legs)}% ✓`}
            </p>
            {minimum > 0 && (
              <p className="text-slate-600 dark:text-[var(--text-secondary)]">
                Minimum to invest in this basket: <strong>{money(minimum)}</strong>
              </p>
            )}
          </div>
          {legs.length >= 2 && (
            <button type="button" onClick={splitEqually} className="text-blue-700 dark:text-blue-400 font-medium hover:underline">
              Split equally
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link to="/create-basket" onClick={onClose} className="text-xs text-slate-500 dark:text-[var(--text-secondary)] hover:underline">
            Basket with stocks or ETFs? Use the full builder
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving || Boolean(problem) || !name.trim()}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create basket"}
          </button>
        </div>
      </div>
    </div>
  );
}
