import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { deleteApiWithToken, getApiWithToken, postApi, postApiWithToken } from "../../api/api";
import { externalTotals, laravelUrl, navLooksPlausible, nodeUrl, unitsFor } from "../../utils/nodeApi";
import { useNavMap, liveNav } from "../../utils/navSocket";
import Combo from "../../components/ui/Combo";
import FundDashboardSkeleton from "../../components/ui/skeleton/main/FundDashboardSkeleton";

const EXTERNAL_URL = () => laravelUrl(import.meta.env.VITE_EXTERNAL_MF || "/portfolio/mf/external");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const EMPTY = { units: "", invested_amount: "", folio: "", source: "", purchased_at: "" };
// Aaj se aage ki tareekh purchase date nahi ho sakti. en-CA isi liye — YYYY-MM-DD local mein,
// toISOString UTC deta hai to IST ki raat ko ek din peeche chala jata.
const today = () => new Date().toLocaleDateString("en-CA");

const ExternalMF = () => {
  const qc = useQueryClient();
  const navs = useNavMap();
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [schemeText, setSchemeText] = useState("");
  const [schemeQuery, setSchemeQuery] = useState("");
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
      setSchemeText("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["externalMf"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteApiWithToken(`${EXTERNAL_URL()}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["externalMf"] }),
  });

  const navOf = (row) =>
    liveNav({ scheme_isin: row.scheme_isin, scheme_bse_code: row.scheme_bse_code, nav: row.nav }, navs);
  const totals = useMemo(() => externalTotals(rows, navOf), [rows, navs]);

  useEffect(() => {
    const t = setTimeout(() => setSchemeQuery(schemeText.trim()), 250);
    return () => clearTimeout(t);
  }, [schemeText]);

  // ponytail: wahi catalogue endpoint jo Explore use karta hai — server-side filter,
  // 28k schemes browser mein nahi aa sakte. Khali field par pehla page dikhta hai.
  const { data: schemes = [] } = useQuery({
    queryKey: ["externalSchemeSearch", schemeQuery],
    queryFn: () =>
      postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
        start: 0,
        length: 50,
        search: schemeQuery,
      }),
    select: (res) => res?.data?.lists || [],
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
    enabled: showForm,
  });

  const picked = schemes.find((f) => f.name === schemeText.trim());
  // Catalogue sirf priced schemes deta hai, is liye chuni hui fund par NAV hamesha hoti hai.
  const pickedNav = picked?.nav ?? null;
  const derived = unitsFor(form.invested_amount, pickedNav);
  const units = form.units !== "" ? Number(form.units) : derived;
  const preview = units > 0 && pickedNav ? units * pickedNav : null;

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const scheme_name = schemeText.trim();
    if (!scheme_name) return setError("Fund ka naam zaroori hai");
    if (!(Number(form.invested_amount) > 0)) return setError("Invested amount 0 se zyada honi chahiye");
    if (!(units > 0)) return setError("Units 0 se zyada honi chahiye — ya list se fund chuno");
    addMutation.mutate({
      ...form,
      scheme_name,
      scheme_isin: picked?.scheme_isin || "",
      scheme_bse_code: picked?.scheme_bse_code || "",
      scheme_category: picked?.category || "",
      // NAV bhi save hoti hai: AMFI kuch schemes publish nahi karta aur socket map usi
      // par bana hai — warna aisi holding ki current value hamesha "—" rehti.
      nav: pickedNav,
      units,
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
          ke barabar dikh rahi hai. Fund ko list se chun kar dobara add karo.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-5 space-y-3"
        >
          <Combo
            id="external-scheme"
            value={schemeText}
            onChange={setSchemeText}
            placeholder="Fund ka naam likhna shuru karo, ya poori list ke liye click karo"
            className="w-full border rounded-md px-3 py-2 pr-9 text-sm dark:bg-transparent dark:border-[var(--border-color)]"
            options={schemes.map((f) => ({
              key: f.scheme_bse_code || f.scheme_isin,
              label: f.name,
              hint: `${f.subType} · NAV ₹${Number(f.nav || 0).toFixed(2)}`,
            }))}
          />

          {picked ? (
            <p className="text-[11px] text-emerald-600">
              Linked: {picked.scheme_isin} · {picked.scheme_bse_code} · NAV ₹{pickedNav.toFixed(2)}
            </p>
          ) : (
            !!schemeText.trim() && (
              <p className="text-[11px] text-amber-600">
                List se chuna nahi gaya — NAV nahi lagegi, units khud likhni hongi.
              </p>
            )
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field
              label="Invested Amount (₹)"
              type="number"
              value={form.invested_amount}
              onChange={(v) => setForm((p) => ({ ...p, invested_amount: v }))}
            />
            <Field
              label="Units"
              type="number"
              step="0.0001"
              placeholder={derived ? `${derived} (auto)` : ""}
              value={form.units}
              onChange={(v) => setForm((p) => ({ ...p, units: v }))}
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
              max={today()}
              value={form.purchased_at}
              onChange={(v) => setForm((p) => ({ ...p, purchased_at: v }))}
            />
          </div>

          {preview != null && (
            <p className="text-[11px] text-slate-500">
              {units} units × NAV ₹{pickedNav.toFixed(2)} = <b>{money(preview)}</b> aaj ki value
            </p>
          )}

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
            const inv = Number(row.invested_amount || 0);
            const units = Number(row.units) || 0;
            const ok = navLooksPlausible(inv, units, nav);
            const value = ok ? units * nav : null;
            const pnl = value == null ? null : value - inv;
            return (
              <div
                key={row.id}
                className="p-4 rounded-lg border bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] flex justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{row.scheme_name}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {!ok && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        NAV missing / mismatch
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {units} units
                    {ok && nav ? ` · NAV ₹${nav.toFixed(2)}` : " · NAV —"}
                    {row.folio ? ` · Folio ${row.folio}` : ""}
                    {row.source ? ` · ${row.source}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">{value == null ? money(inv) : money(value)}</p>
                  <p className="text-[11px] text-slate-500">Invested {money(inv)}</p>
                  {pnl != null ? (
                    <p className={`text-xs ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {pnl >= 0 ? "+" : ""}
                      {money(pnl)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600">P&amp;L pending NAV</p>
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

const Field = ({ label, value, onChange, type = "text", step, placeholder, max }) => (
  <label className="block">
    <span className="text-[11px] text-slate-500">{label}</span>
    <input
      type={type}
      step={step}
      max={max}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-md px-3 py-2 text-sm mt-1 dark:bg-transparent dark:border-[var(--border-color)]"
    />
  </label>
);

export default ExternalMF;
