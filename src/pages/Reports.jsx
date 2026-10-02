import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { BarChart3, Download, Printer } from "lucide-react";
import { getApi, getApiWithToken, postApiWithToken } from "../api/api";
import { fetchHoldings, fetchStockOrders } from "../api/portfolioApi";
import { laravelUrl, mergePortfolio, nodeUrl } from "../utils/nodeApi";
import { stockTradeOrders } from "../utils/stockTrades";
import {
  dividendRows,
  gainsSummary,
  isoDay,
  matchLots,
  purchaseLots,
  statementRows,
  taxEstimate,
  toCsv,
  unrealisedFromLots,
} from "../utils/taxlots";

/**
 * SRS §11 — Statements of Account, Profit and Loss, and Capital Gain reports.
 *
 * This page used to be a hardcoded "No Reports Available" panel with a button to go and
 * invest. Everything here is derived from the order history the app already fetches; the
 * matching engine is utils/taxlots.js, which is where the rules and the tests live.
 */
const money = (v) =>
  `${v < 0 ? "−" : ""}₹${Math.abs(Number(v || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const units = (v) => Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });
function downloadCsv(rows, columns, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8" }));
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Indian tax year: 1 April to 31 March. */
const fyOf = (date) => (date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1);
const fyLabel = (fy) => `FY ${fy}-${String(fy + 1).slice(2)}`;

// Which rules a realised row was taxed under, for the tooltip on its Term.
const BASIS_LABEL = {
  equity: "equity-oriented: long after 12 months",
  other: "non-equity: long after 24 months (36 before 23 Jul 2024)",
  specified: "specified (debt) fund bought from 1 Apr 2023: always short-term, slab rate",
};

const SLABS = [null, 0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];

const METHODS = [
  ["fifo", "FIFO", "Oldest units sold first — the default the tax department assumes."],
  ["lifo", "LIFO", "Newest units sold first."],
  ["specific", "Specific identification", "You name the units sold, per redemption."],
];

export default function Reports() {
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  const [tab, setTab] = useState("summary");
  const [method, setMethod] = useState("fifo");
  const [fy, setFy] = useState("all");
  const [picks, setPicks] = useState({});
  const [slabRate, setSlabRate] = useState(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["mfOrderHistory", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/orderHistory"), { ucc }),
    select: (res) => (Array.isArray(res?.data?.orders) ? res.data.orders : []),
    enabled: !!ucc,
  });

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

  // Category decides whether a gain turns long-term at one year or three, and today's NAV
  // is what values the units still held. Both come from the portfolio the app already has.
  const { categories, navByScheme } = useMemo(() => {
    const funds = mergePortfolio(laravelOrders || [], bseHoldings || []);
    const categories = {};
    const navByScheme = {};

    funds.forEach((f) => {
      const code = String(f.scheme_bse_code || f.scheme_code || "").toUpperCase();
      if (!code) return;
      categories[code] = f.scheme_category || f.category || "";
      const u = Number(f.units) || 0;
      const value = Number(f.current_value) || 0;
      if (u > 0 && value > 0) navByScheme[code] = value / u;
    });

    return { categories, navByScheme };
  }, [laravelOrders, bseHoldings]);

  const { realised, openLots, unmatched } = useMemo(
    () => matchLots(orders || [], { method, categories, picks }),
    [orders, method, categories, picks]
  );

  const lotCatalogue = useMemo(() => purchaseLots(orders || []), [orders]);
  const transactions = useMemo(() => statementRows(orders || []), [orders]);
  const unrealised = useMemo(() => unrealisedFromLots(openLots, navByScheme), [openLots, navByScheme]);

  // Audit #64 — IDCW declared on the schemes in the statement (uploaded by the admin from the
  // AMC's declarations), at the units held on each record date.
  const schemes = useMemo(() => {
    const seen = new Map();
    for (const o of orders || []) {
      const code = String(o.scheme_bse_code || o.scheme_name || "").trim().toUpperCase();
      if (code && !seen.has(code)) seen.set(code, { code, isin: o.scheme_isin || "", bse: o.scheme_bse_code || "" });
    }
    return [...seen.values()];
  }, [orders]);
  const dividendsByScheme = useQueries({
    queries: schemes.map((s) => ({
      queryKey: ["schemeDividends", s.isin, s.bse],
      queryFn: () => getApi(laravelUrl(`/scheme-dividends?isin=${encodeURIComponent(s.isin)}&code=${encodeURIComponent(s.bse)}`)),
      select: (res) => (Array.isArray(res?.data) ? res.data : []),
      staleTime: 6 * 60 * 60 * 1000,
      retry: false,
    })),
    combine: (results) => Object.fromEntries(schemes.map((s, i) => [s.code, results[i]?.data || []])),
  });
  const dividends = useMemo(() => dividendRows(transactions, dividendsByScheme), [transactions, dividendsByScheme]);
  const statement = useMemo(
    () => [...transactions, ...dividends].sort((a, b) => a.date - b.date),
    [transactions, dividends]
  );

  const years = useMemo(() => {
    const set = new Set(statement.map((r) => fyOf(r.date)));
    return [...set].sort((a, b) => b - a);
  }, [statement]);

  const inFy = (date) => fy === "all" || fyOf(date) === Number(fy);
  const realisedFy = realised.filter((r) => inFy(r.sell_date));
  const statementFy = statement.filter((r) => inFy(r.date));
  const summary = gainsSummary(realisedFy);
  // Tax is per financial year, so the estimate needs one; "All years" shows the latest.
  const taxFy = fy === "all" ? years[0] : Number(fy);
  const estimate = taxFy == null ? null : taxEstimate(realised.filter((r) => fyOf(r.sell_date) === taxFy), { slabRate });

  const unrealisedTotal = unrealised.reduce((a, r) => a + r.gain, 0);
  const invested = unrealised.reduce((a, r) => a + r.cost, 0);
  const currentValue = unrealised.reduce((a, r) => a + r.value, 0);

  const download = () => {
    const [rows, columns, name] =
      tab === "statement"
        ? [
            statementFy,
            [
              { key: "date", label: "Date" },
              { key: "scheme_name", label: "Scheme" },
              { key: "folio", label: "Folio" },
              { key: "description", label: "Transaction" },
              { key: "amount", label: "Amount" },
              { key: "units", label: "Units" },
              { key: "nav", label: "NAV" },
              { key: "balance_units", label: "Unit balance" },
              { key: "status", label: "Status" },
            ],
            "statement-of-account",
          ]
        : tab === "unrealised"
        ? [
            unrealised,
            [
              { key: "scheme_name", label: "Scheme" },
              { key: "buy_date", label: "Purchased" },
              { key: "units", label: "Units" },
              { key: "buy_nav", label: "Cost NAV" },
              { key: "current_nav", label: "Current NAV" },
              { key: "cost", label: "Cost" },
              { key: "value", label: "Value" },
              { key: "gain", label: "Unrealised gain" },
            ],
            "unrealised-gains",
          ]
        : [
            realisedFy,
            [
              { key: "scheme_name", label: "Scheme" },
              { key: "folio", label: "Folio" },
              { key: "buy_date", label: "Purchased" },
              { key: "sell_date", label: "Sold" },
              { key: "units", label: "Units" },
              { key: "buy_nav", label: "Cost NAV" },
              { key: "sell_nav", label: "Sale NAV" },
              { key: "cost", label: "Cost" },
              { key: "proceeds", label: "Proceeds" },
              { key: "gain", label: "Gain" },
              { key: "days_held", label: "Days held" },
              { key: "term", label: "Term" },
            ],
            `capital-gains-${method}`,
          ];

    downloadCsv(rows, columns, `${name}-${fy === "all" ? "all" : fyLabel(Number(fy)).replace(/\s/g, "")}`);
  };

  const togglePick = (sellId, lotId) =>
    setPicks((prev) => {
      const current = prev[sellId] || [];
      return {
        ...prev,
        [sellId]: current.includes(lotId) ? current.filter((id) => id !== lotId) : [...current, lotId],
      };
    });

  if (!ucc) {
    return (
      <Shell>
        <Empty title="No account linked yet" body="Reports are built from your transactions. Complete KYC and place an order, and they will appear here." />
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <p className="text-sm text-slate-500">Building your reports…</p>
      </Shell>
    );
  }

  if (!statement.length) {
    return (
      <Shell>
        <Empty title="No transactions yet" body="Once you invest, your statement, profit and loss, and capital gains reports appear here." />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-2 mb-5 print:hidden">
        {[
          ["summary", "Summary"],
          ["statement", "Statement"],
          ["gains", "Capital gains"],
          ["unrealised", "Unrealised"],
          ["stocks", "Stocks"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-[#94a3b8]"
            }`}
          >
            {label}
          </button>
        ))}

        <select
          value={fy}
          onChange={(e) => setFy(e.target.value)}
          aria-label="Financial year"
          className="ml-auto border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {fyLabel(y)}
            </option>
          ))}
        </select>

        {tab !== "stocks" && (
          <button onClick={download} className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-2 rounded-md">
            <Download size={14} /> CSV
          </button>
        )}
        <button onClick={() => window.print()} className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-2 rounded-md">
          <Printer size={14} /> PDF
        </button>
      </div>

      {(tab === "gains" || tab === "summary") && (
        <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
          {METHODS.map(([value, label, hint]) => (
            <button
              key={value}
              onClick={() => setMethod(value)}
              title={hint}
              className={`text-xs px-3 py-1.5 rounded-md ${
                method === value ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-[11px] text-slate-400">{METHODS.find(([v]) => v === method)[2]}</span>
        </div>
      )}

      {tab === "summary" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Card label="Invested (units held)" value={money(invested)} />
            <Card label="Current value" value={money(currentValue)} />
            <Card label="Unrealised gain" value={money(unrealisedTotal)} tone={unrealisedTotal >= 0 ? "up" : "down"} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card label={`Realised short-term (${fy === "all" ? "all years" : fyLabel(Number(fy))})`} value={money(summary.short_net)} tone={summary.short_net >= 0 ? "up" : "down"} />
            <Card label="Realised long-term" value={money(summary.long_net)} tone={summary.long_net >= 0 ? "up" : "down"} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 text-sm">
            <p className="font-semibold text-slate-900 dark:text-white mb-2">Tax summary</p>
            <Row label="Sale proceeds" value={money(summary.proceeds)} />
            <Row label="Cost of units sold" value={money(summary.cost)} />
            <Row label="Short-term gains" value={money(summary.short_gain)} />
            <Row label="Short-term losses" value={money(-summary.short_loss)} />
            <Row label="Long-term gains" value={money(summary.long_gain)} />
            <Row label="Long-term losses" value={money(-summary.long_loss)} />
            <Row label="Net realised" value={money(summary.net)} strong />
            <p className="text-[11px] text-slate-400 mt-3">
              Classified under the rules in force on each sale date: equity-oriented funds turn long-term after 12
              months; other non-equity funds after 24 months (36 for sales before 23 Jul 2024); a debt-oriented fund
              bought on or after 1 Apr 2023 is short-term whatever its age and taxed at your slab rate.
            </p>
          </div>

          {/* Audit #64 — tax payable, clearly an estimate. */}
          {estimate && (
            <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-900 dark:text-white">Estimated tax · {fyLabel(taxFy)}</p>
                <label className="text-xs text-slate-500 dark:text-[#94a3b8] flex items-center gap-2 print:hidden">
                  Your slab rate
                  <select
                    value={slabRate == null ? "" : String(slabRate)}
                    onChange={(e) => setSlabRate(e.target.value === "" ? null : Number(e.target.value))}
                    aria-label="Your income-tax slab rate"
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
                  >
                    {SLABS.map((s) => (
                      <option key={String(s)} value={s == null ? "" : String(s)}>
                        {s == null ? "Not set" : `${Math.round(s * 100)}%`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Row
                label={`Equity short-term gains @ ${(estimate.rates.equity_stcg * 100).toFixed(1)}%`}
                value={`${money(estimate.gains.equity_stcg)} → ${money(estimate.tax.equity_stcg)}`}
              />
              <Row
                label={`Equity long-term gains @ ${(estimate.rates.equity_ltcg * 100).toFixed(1)}% (first ${money(estimate.rates.exemption)} exempt)`}
                value={`${money(estimate.gains.equity_ltcg)} → ${money(estimate.tax.equity_ltcg)}`}
              />
              <Row
                label={`Other long-term gains @ ${(estimate.rates.other_ltcg * 100).toFixed(1)}%`}
                value={`${money(estimate.gains.other_ltcg)} → ${money(estimate.tax.other_ltcg)}`}
              />
              <Row
                label="Gains taxed at your slab rate"
                value={`${money(estimate.gains.slab)} → ${estimate.tax.slab == null ? "set your slab" : money(estimate.tax.slab)}`}
              />
              <Row label="Health & education cess (4%)" value={money(estimate.cess)} />
              <Row label="Estimated tax" value={money(estimate.total)} strong />
              <p className="text-[11px] text-slate-400 mt-3">
                An estimate, not a tax computation. Losses are set off within the year (a long-term loss only against
                long-term gains). Surcharge, the s.87A rebate, losses carried forward from earlier years, indexation on
                pre-23-Jul-2024 sales and gains made outside WealthCrop are not included.
                {estimate.carriedForward > 0 ? ` ${money(estimate.carriedForward)} of losses is left to carry forward.` : ""}
                {estimate.slabPending ? " Choose your slab rate to include the slab-rate gains." : ""}
              </p>
            </div>
          )}

          {unmatched.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5 p-4 text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {unmatched.length} redemption{unmatched.length === 1 ? "" : "s"} could not be fully matched
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-1">
                Units were sold that no purchase in this account's history accounts for — usually a holding transferred in
                from another platform. Those units are left out of the gain figures rather than valued at a guessed cost.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "statement" && (
        <Table
          head={["Date", "Scheme", "Transaction", "Amount", "Units", "NAV", "Balance"]}
          rows={statementFy.map((r) => [
            isoDay(r.date),
            <span key="s" className="block max-w-[220px] truncate" title={r.scheme_name}>
              {r.scheme_name}
              {r.folio ? <span className="block text-[10px] text-slate-400">Folio {r.folio}</span> : null}
            </span>,
            r.dividend ? (
              <span key="d" title="Declared rate × your units on the record date — computed, not a registrar entry">
                {r.description}
              </span>
            ) : (
              r.description
            ),
            money(r.amount),
            r.dividend ? "—" : units(r.units),
            r.nav ? Number(r.nav).toFixed(4) : "—",
            units(r.balance_units),
          ])}
        />
      )}

      {tab === "gains" && (
        <div className="space-y-3">
          <Table
            head={["Scheme", "Bought", "Sold", "Units", "Cost", "Proceeds", "Gain", "Term"]}
            rows={realisedFy.map((r) => [
              <span key="s" className="block max-w-[200px] truncate" title={r.scheme_name}>
                {r.scheme_name}
              </span>,
              isoDay(r.buy_date),
              isoDay(r.sell_date),
              units(r.units),
              money(r.cost),
              money(r.proceeds),
              <span key="g" className={r.gain >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {money(r.gain)}
              </span>,
              <span key="t" title={`${r.days_held} days · ${BASIS_LABEL[r.tax_basis] || r.asset_class}`}>
                {r.term === "long" ? "Long" : "Short"}
              </span>,
            ])}
          />

          {method === "specific" && (
            <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 print:hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Choose the units sold</p>
              <p className="text-[11px] text-slate-400 mb-3">
                Pick the purchase lots each redemption should draw from. Anything you do not pick is still used, oldest
                first, if the sale is bigger than the lots you named.
              </p>

              {[...new Set(realised.map((r) => r.sell_order_id))].filter(Boolean).map((sellId) => {
                const sale = realised.find((r) => r.sell_order_id === sellId);
                const code = String(sale.scheme_bse_code || sale.scheme_name || "").toUpperCase();
                const lots = (lotCatalogue.get(code) || []).filter((l) => l.date <= sale.sell_date);

                return (
                  <div key={sellId} className="mb-3">
                    <p className="text-xs font-medium text-slate-600 dark:text-[#94a3b8]">
                      Sold {isoDay(sale.sell_date)} · {sale.scheme_name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lots.map((l) => {
                        const on = (picks[sellId] || []).includes(l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => togglePick(sellId, l.id)}
                            className={`text-[11px] px-2 py-1 rounded-md border ${
                              on
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-slate-200 text-slate-600 dark:border-[var(--border-color)] dark:text-[#94a3b8]"
                            }`}
                          >
                            {isoDay(l.date)} · {units(l.units)}u @ {Number(l.nav).toFixed(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "unrealised" && (
        <Table
          head={["Scheme", "Bought", "Units", "Cost NAV", "Current NAV", "Cost", "Value", "Gain"]}
          rows={unrealised.map((r) => [
            <span key="s" className="block max-w-[200px] truncate" title={r.scheme_name}>
              {r.scheme_name}
            </span>,
            isoDay(r.buy_date),
            units(r.units),
            Number(r.buy_nav).toFixed(4),
            Number(r.current_nav).toFixed(4),
            money(r.cost),
            money(r.value),
            <span key="g" className={r.gain >= 0 ? "text-emerald-600" : "text-rose-600"}>
              {money(r.gain)}
            </span>,
          ])}
        />
      )}

      {tab === "stocks" && <StockReport />}
    </Shell>
  );
}

/**
 * Broker holdings supply unrealised gains; imported completed delivery trades supply
 * historical transactions and FIFO realised gains. The broker order book is today's activity.
 */
function StockReport() {
  const [importBroker, setImportBroker] = useState("kotak");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const { data: trades = [], refetch: refreshTrades } = useQuery({
    queryKey: ["stockTradeHistory"],
    queryFn: () => getApiWithToken(laravelUrl("/portfolio/stocks/trades")),
    select: (res) => res?.data?.data || [],
  });
  const tradeOrders = useMemo(() => stockTradeOrders(trades), [trades]);
  const stockGains = useMemo(() => matchLots(tradeOrders, {
    categories: Object.fromEntries(tradeOrders.map((row) => [row.scheme_bse_code, "Equity"])),
  }), [tradeOrders]);
  const importTrades = async (file) => {
    if (!file) return;
    if (file.size > 2000000) { setImportMessage("Use a CSV smaller than 2 MB."); return; }
    setImporting(true);
    try {
      const result = await postApiWithToken(laravelUrl("/portfolio/stocks/trades"), { broker: importBroker, csv: await file.text() }, { throwOnError: true });
      setImportMessage(result.message);
      await refreshTrades();
    } catch (error) { setImportMessage(error?.response?.data?.message || "The trade history could not be imported."); }
    finally { setImporting(false); }
  };
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["stockHoldings"],
    queryFn: async () => {
      const res = await fetchHoldings(false);
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    },
    staleTime: 60_000,
    retry: false,
  });
  // The order book is fetched on request: it logs in to the broker, and a failed login is a
  // toast nobody asked for just by opening a tab.
  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);

  const loadBook = async () => {
    setLoadingBook(true);
    const res = await fetchStockOrders();
    setLoadingBook(false);
    setBook(res?.data?.status ? { rows: res.data.data || [] } : { error: "Your broker's order book is not available — link your broker account (Stocks → Holdings) to see it." });
  };

  const rows = holdings.map((h) => {
    const cost = (Number(h.avgPrice) || 0) * (Number(h.qty) || 0);
    const value = (Number(h.ltp) || 0) * (Number(h.qty) || 0);
    return { ...h, cost, value, gain: value - cost };
  });
  const totals = rows.reduce((a, r) => ({ cost: a.cost + r.cost, value: a.value + r.value }), { cost: 0, value: 0 });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 dark:border-white/10 p-4 space-y-2">
        <p className="text-sm font-semibold">Historical delivery trades & stock capital gains</p>
        <p className="text-xs text-slate-500">Import your broker's completed delivery trades using these CSV columns: trade_id,exchange,symbol,side,quantity,price,traded_at,charges. Use BUY/SELL and ISO dates. Include opening purchases and adjust the supplied history for corporate actions; intraday and derivatives belong in your broker's separate report.</p>
        <p className="text-xs text-slate-500">Enter only tax-eligible charges, excluding STT. <a href="https://www.incometaxindia.gov.in/en/sale-of-shares" target="_blank" rel="noopener noreferrer" className="underline">Income Tax Department guidance</a></p>
        <button type="button" className="text-xs underline print:hidden" onClick={() => downloadCsv([], ["trade_id", "exchange", "symbol", "side", "quantity", "price", "traded_at", "charges"].map((key) => ({ key, label: key })), "delivery-trades-template")}>Download import template</button>
        <label className="text-xs">Broker <select value={importBroker} onChange={(e) => setImportBroker(e.target.value)} className="border rounded p-1 ml-2">
          {["kotak", "aliceblue", "zerodha", "trustline", "upstox"].map((broker) => <option key={broker}>{broker}</option>)}
        </select></label>
        <label className="block text-xs">Import delivery-trades CSV <input type="file" accept=".csv,text/csv" disabled={importing} onChange={(e) => { importTrades(e.target.files?.[0]); e.target.value = ""; }} className="block mt-1" /></label>
        {importMessage && <p role="status" className="text-xs">{importMessage}</p>}
        <Table head={["Date", "Broker", "Stock", "Side", "Qty", "Fill price", "Charges"]} rows={trades.map((t) => [new Date(t.traded_at).toLocaleDateString("en-IN"), t.broker, t.symbol, t.side, t.quantity, money(t.price), money(t.charges)])} />
        {stockGains.unmatched.length > 0 && <p className="text-xs text-amber-700">Some sold shares have no imported purchase lot. Their gains cannot be calculated until those purchases are imported.</p>}
        <Table head={["Stock", "Acquired", "Sold", "Qty", "Cost", "Net proceeds", "Gain", "Term"]} rows={stockGains.realised.map((r) => [r.scheme_name, isoDay(r.buy_date), isoDay(r.sell_date), units(r.units), money(r.cost), money(r.proceeds), money(r.gain), r.term === "long" ? "Long-term" : "Short-term"])} />
        <button type="button" className="text-xs underline print:hidden" onClick={() => downloadCsv(stockGains.realised, [
          { key: "scheme_name", label: "Stock" }, { key: "buy_date", label: "Acquired" }, { key: "sell_date", label: "Sold" },
          { key: "units", label: "Quantity" }, { key: "cost", label: "Cost" }, { key: "proceeds", label: "Net proceeds" }, { key: "gain", label: "Capital gain" }, { key: "term", label: "Term" },
        ], "stock-capital-gains")}>Download stock capital gains</button>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Unrealised gains</p>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <Table
              head={["Stock", "Qty", "Avg cost", "LTP", "Cost", "Value", "Gain"]}
              rows={rows.map((r) => [
                r.symbol,
                r.qty,
                Number(r.avgPrice).toFixed(2),
                Number(r.ltp) > 0 ? Number(r.ltp).toFixed(2) : "—",
                money(r.cost),
                money(r.value),
                <span key="g" className={r.gain >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {money(r.gain)}
                  {r.cost > 0 ? ` (${((r.gain / r.cost) * 100).toFixed(2)}%)` : ""}
                </span>,
              ])}
            />
            {rows.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-2">
                Total {money(totals.value)} on a cost of {money(totals.cost)}. Short- or long-term cannot be shown: the
                broker's holdings feed carries an average cost but no purchase dates.
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Stock transactions</p>
          <button
            type="button"
            onClick={loadBook}
            disabled={loadingBook}
            className="text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-1.5 rounded-md disabled:opacity-50 print:hidden"
          >
            {loadingBook ? "Loading…" : book ? "Refresh" : "Load today's order book"}
          </button>
        </div>
        {!book ? (
          <p className="text-sm text-slate-500 dark:text-[#94a3b8]">
            Load your broker's current-day orders, including pending and cancelled instructions.
          </p>
        ) : book.error ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">{book.error}</p>
        ) : (
          <Table
            head={["Placed", "Stock", "Side", "Qty", "Price", "Status"]}
            rows={book.rows.map((o) => [o.placedAt || o.id, o.symbol, o.side, o.qty, Number(o.price) > 0 ? Number(o.price).toFixed(2) : "Market", o.status])}
          />
        )}
        <p className="text-[11px] text-slate-400 mt-2">
          The broker API returns only the current day's order book, so this is today's activity, not a full trade history.
          Import completed delivery trades above for historical transactions and FIFO capital gains.
        </p>
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={20} className="text-blue-600" />
          <h1 className="text-xl font-semibold text-blue-900 dark:text-white">Reports</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function Card({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4">
      <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{label}</p>
      <p
        className={`text-lg font-semibold ${
          tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between py-1 ${strong ? "border-t border-slate-200 dark:border-[var(--border-color)] mt-1 pt-2 font-semibold" : ""}`}>
      <span className="text-slate-500 dark:text-[#94a3b8]">{label}</span>
      <span className="text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function Table({ head, rows }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">Nothing in this period.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[var(--border-color)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5 text-left">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium text-slate-500 dark:text-[#94a3b8] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-[var(--border-color)]">
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2 whitespace-nowrap text-slate-800 dark:text-[var(--text-primary)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ title, body }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-[#94a3b8]">
          <BarChart3 size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">{body}</p>
      </div>
    </div>
  );
}
