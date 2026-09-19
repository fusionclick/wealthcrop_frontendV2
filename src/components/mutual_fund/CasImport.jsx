// Ticket 16 — import a CAMS/KFintech Consolidated Account Statement.
//
// The PDF never becomes a holding on its own: it is read, the holdings inside it are shown,
// and only the ones ticked are saved — through the very same endpoint the "Add Fund" form
// posts to. So there is no second kind of external holding to maintain, and a bad import is
// undone by removing rows the investor can already see.
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { postApiWithToken } from "../../api/api";
import { casHoldingPayload, markCasDuplicates, nameDiffers, nodeUrl } from "../../utils/nodeApi";

const CAS_URL = () => nodeUrl(import.meta.env.VITE_CAS_IMPORT || "/cas/import");
const MAX_MB = 20;
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// FileReader gives a data URL; the backend strips the prefix, so it goes across as-is.
const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });

// Renders the panel only; the page owns the trigger so it can sit beside "Add Fund" while
// the panel opens full width below it.
const CasImport = ({ open, onClose, existing = [], onSave, onDone }) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState(() => new Set());

  const reset = () => {
    setFile(null);
    setPassword("");
    setRows([]);
    setPicked(new Set());
    setError("");
    setNote("");
  };

  const read = async () => {
    setError("");
    setNote("");
    if (!file) return setError("Choose your CAS PDF first.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`That file is over ${MAX_MB}MB.`);

    setReading(true);
    try {
      const res = await postApiWithToken(CAS_URL(), {
        file: await readAsDataUrl(file),
        password,
      });
      // postApiWithToken already shows the server's message on a non-2xx and returns null.
      if (!res) return;
      if (res.status !== "success") return setError(res.message || "Could not read that statement.");

      const found = markCasDuplicates(res.data?.holdings || [], existing);
      setRows(found);
      // Everything except what is already in the portfolio — see markCasDuplicates — and
      // except a row whose ISIN resolved to a fund the statement calls something else. The
      // ISIN is the identifier and is almost always right, but "almost always" is not good
      // enough to start tracking a holding the investor may not own: that one is offered
      // unticked so importing it is a decision rather than a default.
      setPicked(new Set(found.filter((r) => !r.duplicate && !nameDiffers(r)).map((r) => r.key)));
      if (!found.length) {
        setNote(
          res.data?.message ||
            "No open holdings in that statement. Ask CAMS/KFintech for the detailed statement, period 'since inception'."
        );
      }
    } catch (e) {
      setError(e.message || "Could not read that statement.");
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    const chosen = rows.filter((r) => picked.has(r.key));
    if (!chosen.length) return setError("Tick at least one holding.");
    if (chosen.some((r) => !(Number(r.units) > 0))) return setError("A holding has no units.");

    setError("");
    setSaving(true);
    let added = 0;
    const failed = [];
    // One at a time on purpose: a partial import must leave the rows it did save, and the
    // investor has to be told exactly which ones did not go in.
    for (const row of chosen) {
      const res = await onSave(casHoldingPayload(row));
      if (res?.status) added += 1;
      else failed.push(row.scheme_name);
    }
    setSaving(false);
    onDone?.();
    if (failed.length) {
      setError(`Added ${added}. Could not add: ${failed.join(", ")}`);
      setRows(rows.filter((r) => failed.includes(r.scheme_name)));
      setPicked(new Set());
      return;
    }
    reset();
    onClose?.();
  };

  const toggle = (key) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const setInvested = (key, value) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, invested_amount: value } : r)));

  // Ticked rows whose cost the statement never gave and nobody has typed. `casHoldingPayload`
  // sends `Number(invested_amount) || 0`, so saving one of these records ₹0 invested and the
  // portfolio then reports the entire holding as profit.
  const missingCost = rows.filter((r) => picked.has(r.key) && !(Number(r.invested_amount) > 0));

  if (!open) return null;

  return (
    <div className="bg-white dark:bg-[var(--white-10)] border dark:border-[var(--border-color)] rounded-xl p-4 mb-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Import from CAMS / KFintech statement</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Request a Consolidated Account Statement (detailed, with transactions, period
            “since inception”) and upload the PDF with the password they emailed you.
          </p>
        </div>
        <button
          onClick={() => {
            reset();
            onClose?.();
          }}
          className="text-xs text-slate-500 shrink-0"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block md:col-span-2">
          <span className="text-[11px] text-slate-500">CAS PDF</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setRows([]);
              setError("");
              setNote("");
            }}
            className="w-full border rounded-md px-3 py-2 text-xs mt-1 dark:bg-transparent dark:border-[var(--border-color)]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-slate-500">Password</span>
          <input
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="From the CAS email"
            className="w-full border rounded-md px-3 py-2 text-sm mt-1 dark:bg-transparent dark:border-[var(--border-color)]"
          />
        </label>
      </div>

      <button
        onClick={read}
        disabled={reading || !file}
        className="inline-flex items-center gap-1 bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs disabled:opacity-60"
      >
        {reading && <Loader2 size={12} className="animate-spin" />}
        {reading ? "Reading…" : "Read statement"}
      </button>

      {note && <p className="text-xs text-amber-600">{note}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!!rows.length && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] text-slate-500">
            {rows.length} holding(s) found. Untick anything you do not want tracked here.
          </p>
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-start gap-3 border rounded-lg p-3 dark:border-[var(--border-color)]"
            >
              <input
                type="checkbox"
                checked={picked.has(row.key)}
                onChange={() => toggle(row.key)}
                className="mt-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{row.matched_name || row.scheme_name}</p>
                <p className="text-xs text-slate-500">
                  {row.units} units
                  {Number(row.nav) > 0 ? ` · NAV ₹${Number(row.nav).toFixed(2)}` : " · NAV —"}
                  {/* A CAS prints its NAV as at the statement's closing date. Today's price
                      is what values the holding, but showing only that looked like the
                      import had altered a figure printed on the uploaded document. */}
                  {row.nav_source === "catalogue" && Number(row.statement_nav) > 0 && (
                    <span className="text-slate-400">
                      {` (today · statement ₹${Number(row.statement_nav).toFixed(2)}`}
                      {row.nav_date ? ` on ${row.nav_date}` : ""}
                      {")"}
                    </span>
                  )}
                  {row.folio ? ` · Folio ${row.folio}` : ""}
                  {row.amc ? ` · ${row.amc}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  {row.duplicate && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      Already in your portfolio
                    </span>
                  )}
                  {!row.scheme_bse_code && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Not in our catalogue — NAV from the statement
                    </span>
                  )}
                  {/* The ISIN is the identifier, so it wins — but silently swapping the name
                      is alarming when the statement says something else, and it hides a real
                      RTA data error behind a confident-looking row. Say both. */}
                  {nameDiffers(row) && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                      title={`ISIN ${row.scheme_isin}`}
                    >
                      Statement calls this “{row.scheme_name}” — matched by ISIN
                    </span>
                  )}
                  {!row.cost_from_statement && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {row.opening_units > 0
                        ? `Opened with ${row.opening_units} units bought before this period — enter what you paid`
                        : "Invested amount not in this statement — enter what you paid"}
                    </span>
                  )}
                  {/* The purchases that ARE printed here. Offered, never pre-filled: on a
                      statement that opens mid-holding this is only part of the cost, and
                      filling it in would claim a gain the investor never made. */}
                  {!row.cost_from_statement && row.visible_cost > 0 && (
                    <button
                      type="button"
                      onClick={() => setInvested(row.key, String(row.visible_cost))}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Use {money(row.visible_cost)} shown here
                    </button>
                  )}
                </div>
              </div>
              <label className="block w-32 shrink-0">
                <span className="text-[10px] text-slate-500">Invested (₹)</span>
                <input
                  type="number"
                  value={row.invested_amount}
                  onChange={(e) => setInvested(row.key, e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-xs mt-0.5 dark:bg-transparent dark:border-[var(--border-color)]"
                />
                {row.statement_value != null && (
                  <span className="text-[10px] text-slate-400">
                    Value {money(row.statement_value)}
                  </span>
                )}
              </label>
            </div>
          ))}

          {missingCost.length > 0 && (
            <p className="text-[11px] text-amber-700">
              Enter the invested amount for {missingCost.length} selected holding(s) — saving it blank
              would record ₹0 and show the whole value as profit.
            </p>
          )}

          <button
            onClick={save}
            disabled={saving || !picked.size || missingCost.length > 0}
            className="inline-flex items-center gap-1 bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs disabled:opacity-60"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {saving ? "Adding…" : `Add ${picked.size} holding(s)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CasImport;
