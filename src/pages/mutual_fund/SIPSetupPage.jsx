import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { postApi, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { apiErrorMessage, nodeUrl, validateInvestorReady } from "../../utils/nodeApi";
import { titleCase } from "../../utils/schemeName";
import { allowedDays, FALLBACK_SIP_DAYS, iso, nextOccurrence, ordinal, smartDefaultDay } from "../../utils/sipDates";
import OrderDisclaimers, { useDisclaimers } from "../../components/mutual_fund/OrderDisclaimers";
import EnachAuthorization from "../../components/mutual_fund/EnachAuthorization";
import SipCalendar from "../../components/sip/SipCalendar";
import { useEffectiveMinimum } from "../../hooks/usePlatformSettings";

// The ceiling the server enforces (MANDATE_MAX_LIMIT). Shown, not chosen: the screen must
// display the same number the backend will accept, or the investor authorises one thing and
// the bank is told another.
const MANDATE_MAX_LIMIT = 100000;

// BSE counts installments, not an end date; the server derives the count the same way.
// Showing it here means the investor sees exactly what is being registered.
const PER_YEAR = { m: 12, q: 4, w: 52 };
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const SIPSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isin, code } = useParams();
  const { data: investorData } = useSelector((state) => state.investorData);

  // Router state is the fast path (the fund page already has the scheme), but it dies on
  // refresh and cannot be linked or bookmarked. /mutual_fund/:isin/:code/sip survives both,
  // so fall back to fetching the scheme from the URL.
  const [fund, setFund] = useState(location.state?.fund || {});

  // QA 3.5 — the bare /mutual_fund/sip-setup route can carry no scheme at all: no router
  // state (a reload drops it) and no :isin/:code to recover one from. The page used to
  // render anyway and register a SIP with an empty src_scheme, which BSE rejects. Nothing
  // can be set up without a fund, so send them to pick one rather than fail at submit.
  const hasScheme = !!(location.state?.fund || isin || code);
  useEffect(() => {
    if (!hasScheme) navigate("/user/mutual_fund/explore", { replace: true });
  }, [hasScheme, navigate]);

  useEffect(() => {
    if (fund.scheme_bse_code || (!isin && !code)) return;
    postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
      isin,
      scheme_code: code,
    })
      .then((res) => {
        const item = res?.data?.lists?.[0];
        if (item) setFund(item);
      })
      .catch(() => {});
  }, [fund.scheme_bse_code, isin, code]);

  // The list row does not carry the SIP rulebook (11k schemes × 4 frequencies × ~30 dates
  // never goes in the index), so the dates and today's NAV are fetched here. Fail-open:
  // no details means the fallback days, which is what this page always used.
  const [details, setDetails] = useState(null);
  useEffect(() => {
    const wantIsin = isin || fund.scheme_isin;
    const wantCode = code || fund.scheme_bse_code;
    if (!wantIsin && !wantCode) return;
    let live = true;
    postApi(nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details"), {
      isin: wantIsin,
      scheme_code: wantCode,
    })
      .then((res) => {
        if (live) setDetails(res?.data?.scheme_info || null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [isin, code, fund.scheme_isin, fund.scheme_bse_code]);

  const sipTxn = details?.transactions?.sip || null;
  // BSE's real minimum for this scheme. No 500 floor invented when nobody published one.
  // QA 13.7 — the admin's min_sip_amount saved but reached nothing here. Effective minimum is
  // the higher of the scheme's own (BSE will reject below it) and the platform's own rule.
  const schemeMinSip = Number(sipTxn?.minAmount) || Number(details?.minSip) || Number(fund.minSip) || 0;
  const minSip = useEffectiveMinimum("min_sip_amount", schemeMinSip);
  // /scheme-details resolves today's NAV (BSE, then AMFI, then the master row); the list
  // row's `nav` can be a day behind it.
  const currentNav = details?.current_nav ?? fund.nav ?? null;
  // The fund page's return calculator hands over the amount and duration the investor
  // just modelled, so the form opens on those numbers instead of resetting to defaults.
  const seedAmount = Number(location.state?.amount) || 0;
  const seedYears = Number(location.state?.years) || 10;

  const [amount, setAmount] = useState(Math.max(seedAmount, minSip) || 500);
  const [frequency, setFrequency] = useState("m"); // m=monthly, w=weekly, q=quarterly
  const sipDays = useMemo(() => allowedDays(sipTxn, frequency), [sipTxn, frequency]);
  const [sipDay, setSipDay] = useState(() => smartDefaultDay(FALLBACK_SIP_DAYS));
  const [startDate, setStartDate] = useState(() => nextOccurrence(smartDefaultDay(FALLBACK_SIP_DAYS)));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(nextOccurrence(smartDefaultDay(FALLBACK_SIP_DAYS)));
    d.setFullYear(d.getFullYear() + seedYears);
    return iso(d);
  });

  // One control drives the other, both ways, so they can never be sent out of step.
  const pickSipDay = (day) => {
    setSipDay(day);
    setStartDate(nextOccurrence(day));
  };
  const pickStartDate = (value) => {
    setStartDate(value);
    const day = Number(String(value).slice(8, 10));
    if (day >= 1 && day <= 28) setSipDay(day);
  };
  // The investor may type any date into the calendar — a native date input cannot be told
  // "only the 5th and the 15th" — so an unsupported day is caught here and blocks submit.
  const startDay = Number(String(startDate).slice(8, 10));
  const startDayInvalid = !sipDays.includes(startDay);
  // `min` keeps the picker honest, but a date can still be typed straight into the field.
  const endBeforeStart = Boolean(endDate) && Date.parse(endDate) <= Date.parse(startDate);

  const [loading, setLoading] = useState(false);
  // Ticket 22: a SIP is a purchase instruction repeated, so it carries the same
  // acknowledgement. The server refuses /xspRegister without it.
  const disc = useDisclaimers();
  // Shown only after the SIP itself is registered, so declining the mandate never costs the
  // investor the SIP.
  const [showEnach, setShowEnach] = useState(false);
  const [enachBusy, setEnachBusy] = useState(false);
  // Audit #22 — the SIP just registered, so its mandate can be linked to it.
  const [registeredRegNo, setRegisteredRegNo] = useState("");

  // Audit #22 — an investor who already has an ACTIVE mandate pays this SIP with it; it goes
  // in the registration itself (the server checks it is theirs) and no second one is needed.
  const [activeMandate, setActiveMandate] = useState(null);
  const [useMandate, setUseMandate] = useState(true);
  useEffect(() => {
    if (!investorData?.kyc?.ucc_code) return;
    postApiWithToken(nodeUrl("/mandateStatus"), {}, { silent: true })
      .then((res) => {
        const rows = Array.isArray(res?.data?.mandates) ? res.data.mandates : [];
        setActiveMandate(rows.find((m) => m.status === "approved" && m.exch_mandate_id) || null);
      })
      .catch(() => {});
  }, [investorData?.kyc?.ucc_code]);

  // The server refuses anything without `authorized: true` — the record that the investor
  // was shown the limit and pressed the button. It builds the BSE payload itself from the
  // channel and UPI ID chosen here, and resolves only when BSE said success.
  const authoriseMandate = async ({ mode, vpa }) => {
    setEnachBusy(true);
    try {
      const res = await postApiWithToken(
        nodeUrl(import.meta.env.VITE_MANDATE_REGISTRATION || "/mandate_register/upi-autopay"),
        { authorized: true, mode, vpa, sip_reg_no: registeredRegNo || undefined, data: { amount: MANDATE_MAX_LIMIT, scheme: fund.scheme_bse_code, acknowledged: disc.acked } },
        { silent: true, throwOnError: true }
      );
      if (res?.status !== "success") throw new Error(res?.message || "BSE did not register the mandate.");
      return res.data;
    } catch (e) {
      throw new Error(apiErrorMessage(e, "BSE did not register the mandate."));
    } finally {
      setEnachBusy(false);
    }
  };

  // Once the scheme's real dates arrive, re-pick. Only when the day in hand is not one the
  // scheme accepts — an investor who already chose a valid date keeps it.
  useEffect(() => {
    if (sipDays.includes(sipDay)) return;
    const next = smartDefaultDay(sipDays);
    setSipDay(next);
    setStartDate(nextOccurrence(next));
  }, [sipDays, sipDay]);

  // Once the scheme arrives from the URL we know its real minimum; lift the amount to it
  // rather than posting 500 into a fund that will not accept it.
  useEffect(() => {
    setAmount((a) => (a < minSip ? minSip : a));
  }, [minSip]);

  const installments = useMemo(() => {
    const perYear = PER_YEAR[frequency];
    const years = (Date.parse(endDate) - Date.parse(startDate)) / (365.25 * 24 * 3600 * 1000);
    if (!perYear || !Number.isFinite(years) || years <= 0) return 0;
    return Math.max(1, Math.round(years * perYear));
  }, [frequency, startDate, endDate]);

  // The BSE reference id is generated server-side with the rest of the payload now.

  const handleRegister = async () => {
    // A SIP needs a fund. This page was only ever reachable from a promo link that passed
    // none, so src_scheme went to BSE empty and every registration failed — send the
    // investor to pick one instead of posting a request that cannot succeed.
    if (!fund.scheme_bse_code) {
      toastError("Pick a fund first — open it from Explore and start the SIP there.");
      navigate("/user/mutual_fund/explore");
      return;
    }
    if (!installments) {
      toastError("End date must be after the start date");
      return;
    }
    const err = validateInvestorReady(investorData, minSip, amount);
    if (err) {
      toastError(err);
      return;
    }

    setLoading(true);
    // Intent only. The BSE payload is built server-side now — the UCC, member code and
    // demat details come from the session there, not from whatever this page believes.
    const payload = {
      data: {
        scheme: fund.scheme_bse_code,
        amount: Number(amount),
        freq: frequency,
        txn_date: Number(sipDay),
        start_date: startDate,
        end_date: endDate,
        acknowledged: disc.acked,
        ...(activeMandate && useMandate ? { exch_mandate_id: Number(activeMandate.exch_mandate_id) } : {}),
      },
    };

    try {
      const url = nodeUrl(import.meta.env.VITE_XSP_REGISTER || "/xspRegister");
      const res = await postApiWithToken(url, payload);
      if (res) {
        toastSuccess("SIP registered successfully!");
        // Paid by the mandate it named — there is nothing left to authorise.
        if (activeMandate && useMandate) {
          navigate("/mutual_fund/manage-sip");
          return;
        }
        const d = res?.data || {};
        setRegisteredRegNo(String(d.reg_no ?? d.sxp_id ?? d.lists?.[0]?.reg_no ?? d.items?.[0]?.reg_no ?? ""));
        // The e-NACH mandate used to be fired here, silently, inside an empty catch: a
        // standing bank authorisation created as a side effect of buying, with the limit
        // never shown. §2 row 5 requires an explicit act, so the investor is asked.
        setShowEnach(true);
      }
    } catch (err) {
      toastError(err?.message || "SIP registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // The mandate step stands on its own screen rather than as an overlay on a form that is
  // already submitted: an authorisation the investor can half-read behind a dimmed form is
  // the shape §3.A is warning about.
  if (showEnach) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center items-start p-6">
        <div className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-4 dark:border dark:border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-secondary)]">
            Your SIP in {titleCase(fund.name) || "this fund"} is registered.
          </p>
          <OrderDisclaimers {...disc} schemeName={titleCase(fund.name) || ""} schemes={[fund]} />
          <EnachAuthorization
            sipAmount={amount}
            maxLimit={MANDATE_MAX_LIMIT}
            busy={enachBusy}
            disclosuresReady={disc.ready}
            onAuthorize={authoriseMandate}
            onSkip={() => navigate("/mutual_fund/manage-sip")}
            onDone={() => navigate("/mutual_fund/manage-sip")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center items-start p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-6 dark:border dark:border-[var(--border-color)]">
        {/* One line: which scheme, at what NAV. The three-row detail card that used to sit
            under it is gone — ISIN and the minimum are a caption, not a table. */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--text-primary)] truncate">
              {titleCase(fund.name) || "Set Up SIP"}
            </h1>
            {currentNav != null && (
              <span className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)] whitespace-nowrap">
                ₹{Number(currentNav).toFixed(4)}
                <span className="text-[11px] font-normal text-slate-400 ml-1">NAV</span>
              </span>
            )}
          </div>
          {/* ISIN, not the BSE scheme code: the code is our routing detail and still goes
              out in the registration payload, it just is not an investor-facing id. */}
          <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-1">
            {[fund.scheme_isin ? `ISIN ${fund.scheme_isin}` : null, minSip > 0 ? `Min ${money(minSip)}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Reached without a fund — say so up front rather than after a failed submit. */}
        {!fund.scheme_bse_code && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              No fund selected. Open a fund from Explore and start the SIP from there.
            </p>
            <button
              onClick={() => navigate("/user/mutual_fund/explore")}
              className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-400 underline"
            >
              Browse funds
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Monthly Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minSip}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
            />
            <p className={`text-xs mt-1 ${Number(amount) < minSip ? "text-red-500" : "text-gray-400"}`}>
              Minimum: {money(minSip)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
            >
              <option value="m">Monthly</option>
              <option value="q">Quarterly</option>
              <option value="w">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">SIP Date</label>
            <select
              value={sipDay}
              onChange={(e) => pickSipDay(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
            >
              {sipDays.map((d) => (
                <option key={d} value={d}>
                  {ordinal(d)} of every month
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {sipTxn
                ? `This scheme accepts ${sipDays.length} date${sipDays.length === 1 ? "" : "s"} a month. `
                : ""}
              Changing this moves the start date to the next {ordinal(sipDay)} — BSE requires them to match.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sip-start-date" className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">Start Date</label>
              {/* Audit #13 — past days and days this scheme does not run a SIP on cannot be
                  picked at all; the red line below stays as the backstop for a date that went
                  stale when the scheme's own dates arrived. */}
              <SipCalendar id="sip-start-date" value={startDate} onChange={pickStartDate} days={sipDays} />
              {startDayInvalid && (
                <p className="text-xs text-red-500 mt-1">
                  {startDay > 28
                    ? "Pick a day from the 1st to the 28th — not every month has a 29th."
                    : `This scheme only starts a SIP on the ${sipDays.map(ordinal).join(", ")}.`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                // The start date has always been floored at tomorrow; this one was not, so
                // the calendar happily offered 2008 and the only sign of trouble was the
                // installment count silently reading zero. A SIP cannot end before it
                // begins, so that is the floor.
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-gray-800 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] dark:border-[var(--border-color)]"
              />
              {endBeforeStart && (
                <p className="text-xs text-red-500 mt-1">The end date has to come after the start date.</p>
              )}
            </div>
          </div>
        </div>

        {/* BSE registers a count of installments, not an end date — show the count that
            will actually be sent, so the dates above are not a black box. */}
        {fund.scheme_bse_code && installments > 0 && (
          <div className="rounded-lg bg-slate-50 dark:bg-[var(--white-5)] p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[var(--text-secondary)]">Installments</span>
              <span className="font-medium text-slate-900 dark:text-[var(--text-primary)]">{installments}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 dark:text-[var(--text-secondary)]">Total invested if it runs in full</span>
              <span className="font-medium text-slate-900 dark:text-[var(--text-primary)]">
                {money(Number(amount) * installments)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              A projection of what you would pay in, not a return estimate. You can stop a SIP any time.
            </p>
          </div>
        )}

        {/* Audit #22 — an approved mandate pays this SIP; otherwise one is set up after. */}
        {activeMandate && (
          <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <input type="checkbox" checked={useMandate} onChange={(e) => setUseMandate(e.target.checked)} className="mt-0.5" />
            <span className="text-sm text-emerald-800 dark:text-emerald-300">
              Pay instalments with my active auto-debit mandate (BSE {activeMandate.exch_mandate_id})
            </span>
          </label>
        )}

        <OrderDisclaimers
          {...disc}
          schemeDocsUrl={details?.factsheetUrl || ""}
          schemeName={titleCase(fund.name) || ""}
          schemes={[fund]}
        />

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={
              loading || !fund.scheme_bse_code || Number(amount) < minSip || !installments || startDayInvalid || !disc.ready
            }
            className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 dark:bg-blue-500"
          >
            {loading ? "Registering…" : "Start SIP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SIPSetupPage;
