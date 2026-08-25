import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Search } from "lucide-react";
import { deleteApiWithToken, getApiWithToken, postApi, postApiWithToken } from "../../api/api";
import { externalTotals, laravelUrl, nodeUrl } from "../../utils/nodeApi";
import { useNavMap, liveNav } from "../../utils/navSocket";
import FundDashboardSkeleton from "../../components/ui/skeleton/main/FundDashboardSkeleton";

const EXTERNAL_URL = () => laravelUrl(import.meta.env.VITE_EXTERNAL_MF || "/portfolio/mf/external");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const EMPTY = {
  scheme_name: "",
  scheme_isin: "",
  scheme_bse_code: "",
  scheme_category: "",
  units: "",
  invested_amount: "",
  folio: "",
  source: "",
  purchased_at: "",
};

const ExternalMF = () => {
  const qc = useQueryClient();
  const navs = useNavMap();
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [schemeQuery, setSchemeQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["externalMf"],
    queryFn: () => getApiWithToken(EXTERNAL_URL()),
    select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
  });

  const addMutation = useMutation({
    mutationFn: (payload) => postApiWithToken(EXTERNAL_URL(), payload),
    onSuccess: (res) => {
      if (!res?.status) {
        setError(res?.message || "Could not save this holding");
        return;
      }
      setForm(EMPTY);
      setSchemeQuery("");
      setMatches([]);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["externalMf"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteApiWithToken(`${EXTERNAL_URL()}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["externalMf"] }),
  });

  const navOf = (row) =>
    liveNav({ scheme_isin: row.scheme_isin, scheme_bse_code: row.scheme_bse_code }, navs);
  const totals = useMemo(() => externalTotals(rows, navOf), [rows, navs]);

  // ponytail: wahi catalogue endpoint jo Explore use karta hai — scheme chunne se isin/code
  // mil jaate hain aur NAV apne aap lag jati hai. Na mile to free-text naam bhi chalta hai.
  const searchSchemes = async () => {
    const q = schemeQuery.trim();
    if (!q) return;
    setSearching(true);
    const res = await postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
      start: 0,
      length: 8,
      search: q,
    });
    setMatches(res?.data?.lists || []);
    setSearching(false);
  };

  const pickScheme = (f) => {
    setForm((p) => ({
      ...p,
      scheme_name: f.name,
      scheme_isin: f.scheme_isin || "",
      scheme_bse_code: f.scheme_bse_code || "",
      scheme_category: f.category || "",
    }));
    setMatches([]);
    setSchemeQuery(f.name);
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const scheme_name = (form.scheme_name || schemeQuery).trim();
    if (!scheme_name) {
      setError("Fund ka naam zaroori hai");
      return;
    }
    if (!(Number(form.units) > 0)) {
      setError("Units 0 se zyada honi chahiye");
      return;
    }
    if (!(Number(form.invested_amount) > 0)) {
      setError("Invested amount 0 se zyada honi chahiye");
      return;
    }
    addMutation.mutate({
      ...form,
      scheme_name,
      units: Number(form.units),
      invested_amount: Number(form.invested_amount),
      purchased_at: form.purchased_at || null,
    });
  };

  if (isLoading) return <FundDashboardSkeleton />;

  return (
    <div className="p-4 min-h-screen bg-slate-50 dark:bg-[var(--app-bg)]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-blue-950 dark:text-[var(--text-primary)]">
            External Portfolio
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Doosre AMC, bank ya platform se li hui units — yahan sirf track hoti hain, buy/sell nahi.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs shrink-0"
        >
          <Plus size={14} /> Add Fund
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card label="Current Value" value={money(totals.current)} />
        <Card label="Invested" value={money(totals.invested)} />
        <Card
          label="P&amp;L"
          value={`${totals.pnl >= 0 ? "+" : ""}${money(totals.pnl)}`}
          tone={totals.pnl >= 0 ? "text-emerald-600" : "text-red-500"}
        />
        <Card label="Returns" value={`${totals.pnlPct.toFixed(2)}%`} />
      </div>

      {totals.priced < rows.length && (
        <p className="text-[11px] text-amber-600 mb-4">
          {rows.length - totals.priced} holding(s) ki NAV nahi mili — un ki current value invested
          ke barabar dikh rahi hai.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-5 space-y-3"
        >
          <div className="flex gap-2">
            <input
              value={schemeQuery}
              onChange={(e) => setSchemeQuery(e.target.value)}
              placeholder="Fund ka naam (search karke chuno)"
              className="flex-1 border rounded-md px-3 py-2 text-sm dark:bg-transparent dark:border-[var(--border-color)]"
            />
            <button
              type="button"
              onClick={searchSchemes}
              className="bg-blue-600 text-white px-3 rounded-md text-xs flex items-center gap-1"
            >
              <Search size={14} /> {searching ? "…" : "Search"}
            </button>
          </div>

          {!!matches.length && (
            <div className="border rounded-md divide-y dark:border-[var(--border-color)] max-h-52 overflow-y-auto">
              {matches.map((f) => (
                <button
                  type="button"
                  key={`${f.scheme_isin}-${f.scheme_bse_code}`}
                  onClick={() => pickScheme(f)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-white/5"
                >
                  <p className="font-medium">{f.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {f.subType} · NAV ₹{Number(f.nav || 0).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {form.scheme_isin && (
            <p className="text-[11px] text-emerald-600">
              Linked: {form.scheme_isin} · {form.scheme_bse_code} (NAV auto)
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field
              label="Units"
              type="number"
              step="0.0001"
              value={form.units}
              onChange={(v) => setForm((p) => ({ ...p, units: v }))}
            />
            <Field
              label="Invested Amount (₹)"
              type="number"
              value={form.invested_amount}
              onChange={(v) => setForm((p) => ({ ...p, invested_amount: v }))}
            />
            <Field
              label="Folio (optional)"
              value={form.folio}
              onChange={(v) => setForm((p) => ({ ...p, folio: v }))}
            />
            <Field
              label="Bought from (optional)"
              value={form.source}
              onChange={(v) => setForm((p) => ({ ...p, source: v }))}
            />
            <Field
              label="Purchase date (optional)"
              type="date"
              value={form.purchased_at}
              onChange={(v) => setForm((p) => ({ ...p, purchased_at: v }))}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            disabled={addMutation.isPending}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs disabled:opacity-60"
          >
            {addMutation.isPending ? "Saving…" : "Save Holding"}
          </button>
        </form>
      )}

      {!rows.length ? (
        <div className="text-center py-16 border border-dashed rounded-xl dark:border-[var(--border-color)]">
          <p className="text-sm font-medium">No external funds added yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Kisi doosri jagah se khareede hue funds yahan add karke track karo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const nav = navOf(row);
            const value = nav && Number(row.units) > 0 ? Number(row.units) * nav : null;
            const pnl = value == null ? null : value - Number(row.invested_amount || 0);
            return (
              <div
                key={row.id}
                className="p-4 rounded-lg border bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] flex justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{row.scheme_name}</p>
                  <p className="text-xs text-gray-500">
                    {Number(row.units)} units
                    {row.folio ? ` · Folio ${row.folio}` : ""}
                    {row.source ? ` · ${row.source}` : ""}
                  </p>
                  {nav && <p className="text-[10px] text-slate-400 mt-0.5">NAV ₹{nav.toFixed(2)}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{value == null ? "—" : money(value)}</p>
                  <p className="text-[11px] text-slate-500">Invested {money(row.invested_amount)}</p>
                  {pnl != null && (
                    <p className={`text-xs ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {pnl >= 0 ? "+" : ""}
                      {money(pnl)}
                    </p>
                  )}
                  <button
                    onClick={() => removeMutation.mutate(row.id)}
                    className="mt-2 text-xs px-3 py-1 rounded-md bg-red-600 text-white inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Card = ({ label, value, tone = "" }) => (
  <div className="bg-white dark:bg-[var(--white-10)] p-4 rounded-xl border shadow-sm dark:border-[var(--border-color)]">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className={`text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

const Field = ({ label, value, onChange, type = "text", step }) => (
  <label className="block">
    <span className="text-[11px] text-slate-500">{label}</span>
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-md px-3 py-2 text-sm mt-1 dark:bg-transparent dark:border-[var(--border-color)]"
    />
  </label>
);

export default ExternalMF;
