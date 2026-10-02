import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postApi, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useSelector } from "react-redux";
import { nodeUrl, laravelUrl, orderErrorMessage, orderRefId, validateInvestorReady } from "../../utils/nodeApi";
import Combo, { fieldClass } from "../../components/ui/Combo";
import OrderDisclaimers, { useDisclaimers } from "../../components/mutual_fund/OrderDisclaimers";
import SxpSchedule, { useSxpSchedule } from "../../components/mutual_fund/SxpSchedule";
import { buildSxpIntent, sxpIntentError, retireReplacedPlan } from "../../utils/sxp";

// Folio isi liye label mein hai — ek hi scheme kai folios mein ho sakti hai,
// aur switch hamesha ek folio se nikalta hai.
const holdingLabel = (h) => `${h.scheme_name || "Fund"}${h.folio ? ` · ${h.folio}` : ""}`;

const SwitchMF = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;
  // Arrived from a fund's own row or detail sheet, the way RedeemMF already works. Without
  // this the investor picks the fund, lands here, and has to pick it again.
  const pre = useLocation().state || {};

  const [srcText, setSrcText] = useState("");
  const [destText, setDestText] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [switchAll, setSwitchAll] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Ticket 22/24: a switch BUYS into the destination scheme, so it takes the same gates a
  // lumpsum does — the server judges dest_scheme, not the fund being sold.
  const disc = useDisclaimers();

  // Same query key as RedeemMF — cache hit, aur in holdings par asli BSE folio hota hai.
  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }),
    select: (res) => (Array.isArray(res?.data?.holdings) ? res.data.holdings : []),
    enabled: !!ucc,
  });

  // Holdings load after the first render, so the preselect has to wait for them. Match on
  // BSE's scheme code (unique) and, when the same scheme sits in more than one folio, the
  // folio too. Only ever sets the field while it is still untouched.
  useEffect(() => {
    if (srcText || !holdings.length) return;
    const code = String(pre.scheme_bse_code || pre.code || "").trim().toUpperCase();
    const isin = String(pre.isin || "").trim().toUpperCase();
    if (!code && !isin) return;

    const sameScheme = holdings.filter((h) => {
      const hc = String(h.scheme_bse_code || "").trim().toUpperCase();
      const hi = String(h.scheme_isin || h.isin || "").trim().toUpperCase();
      return (code && hc === code) || (isin && hi === isin);
    });
    if (!sameScheme.length) return;

    // The folio narrows between two folios of the SAME fund — it is not a condition for
    // pre-filling at all. The caller's folio can come from Laravel's mirror while these
    // holdings come from BSE, and the two number folios differently; requiring a match
    // then left the dropdown blank on exactly the funds the investor came here from.
    const byFolio = pre.folio && sameScheme.find((h) => String(h.folio || "") === String(pre.folio));
    setSrcText(holdingLabel(byFolio || sameScheme[0]));
  }, [holdings, pre.scheme_bse_code, pre.code, pre.isin, pre.folio, srcText]);

  useEffect(() => {
    // A picked row's label is "name · plan · option"; only the name is searchable.
    const t = setTimeout(() => setDestQuery(destText.split(" · ")[0].trim()), 250);
    return () => clearTimeout(t);
  }, [destText]);

  const selectedSource = holdings.find((h) => holdingLabel(h) === srcText);

  // Audit #46 — a switch stays inside one fund house, and both funds must allow it. What BSE
  // says about the source (its AMC, its Switch-OUT rule) comes from the same /scheme-details
  // the fund page reads; the server enforces both rules again whatever this page shows.
  const srcIsin = selectedSource?.scheme_isin || "";
  const srcCode = selectedSource?.scheme_bse_code || selectedSource?.scheme_code || "";
  const { data: srcInfo = null } = useQuery({
    queryKey: ["FUND_FULL_DETAILS", srcIsin, srcCode],
    queryFn: () =>
      postApi(nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details"), { isin: srcIsin, scheme_code: srcCode }),
    select: (res) => res?.data?.scheme_info || null,
    enabled: Boolean(srcIsin || srcCode),
    staleTime: 1000 * 60 * 2,
  });
  const sourceAmc = String(srcInfo?.scheme_amc_name || "").trim();
  const switchOutClosed = srcInfo?.transactions?.switchOut?.allowed === false;

  // ponytail: destination BSE ke master se server-side filter hota hai — 28k schemes
  // browser mein nahi aa sakte. Page 50 par capped hai; match na mile to user thora
  // aur type kare. Client-side full list chahiye to backend ka FETCH_MAX barhana parega.
  // Audit #46 — narrowed to the source's AMC: its name rides in the search (the catalogue
  // matches every word against name + AMC), then rows are kept only on an exact AMC match,
  // and a fund BSE says takes no switch is dropped. An unknown AMC narrows nothing.
  const { data: destFunds = [] } = useQuery({
    queryKey: ["switchDest", destQuery, sourceAmc],
    queryFn: () =>
      postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
        start: 0,
        length: 50,
        search: [sourceAmc, destQuery].filter(Boolean).join(" "),
      }),
    select: (res) =>
      (res?.data?.lists || []).filter(
        (f) =>
          (!sourceAmc || String(f.scheme_amc_name || "").trim().toLowerCase() === sourceAmc.toLowerCase()) &&
          f.txn?.switchAllowed !== false &&
          f.scheme_bse_code !== srcCode
      ),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  // Within one fund house most names repeat across plans and options ("… Liquid Fund" ×8), so
  // the label carries them — picking the Direct IDCW row when the Regular Growth one was meant
  // is a different investment.
  const destLabel = (f) => [f.name, f.plan, f.payout].filter(Boolean).join(" · ");
  const selectedDest = destFunds.find((f) => destLabel(f) === destText);
  // Ticket 18: an STP is this same switch, repeated. Source, destination and folio are
  // already picked above, so all the investor adds is a schedule.
  const sched = useSxpSchedule("stp", selectedSource);

  /**
   * Intent only. sxp_register's payload — UCC, member code, demat ids — is built
   * server-side, which is also where the folio's units are checked against BSE, and where
   * the risk-profile and disclaimer gates are applied to the fund being bought into.
   */
  const handleStp = async () => {
    const err = validateInvestorReady(investorData);
    if (err) return toastError(err);
    const destCode = selectedDest?.scheme_bse_code;
    const bad = sxpIntentError({ type: "stp", source: selectedSource, destCode, amount, schedule: sched });
    if (bad) return toastError(bad);

    setSubmitting(true);
    try {
      const res = await postApiWithToken(
        nodeUrl(import.meta.env.VITE_XSP_REGISTER || "/xspRegister"),
        buildSxpIntent({
          type: "stp",
          source: selectedSource,
          destCode,
          amount,
          schedule: sched,
          acknowledged: disc.acked,
        })
      );
      if (res?.status === 200 || res?.status === true || res?.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["bsePortfolio"] });
        // Arrived from "Change STP": the replacement is live, so retire the old one.
        const problem = await retireReplacedPlan({
          type: "stp",
          regNo: pre.replaceRegNo,
          cancelXsp: (regNo) =>
            postApiWithToken(nodeUrl(import.meta.env.VITE_CANCEL_XSP || "/cancelXsp"), {
              data: { reg_no: regNo, reason: "" },
            }),
        });
        if (problem) toastError(problem);
        else
          toastSuccess(
            pre.replaceRegNo
              ? "STP changed. The old plan has been cancelled."
              : "STP registered. You can stop it any time from Manage STP."
          );
        navigate("/mutual_fund/manage-stp");
      } else {
        toastError(orderErrorMessage(res, "Could not register the STP."));
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e?.message || "Could not register the STP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitch = async () => {
    const err = validateInvestorReady(investorData);
    if (err) return toastError(err);
    if (!selectedSource) return toastError("Pick a source fund from the list.");
    if (!selectedSource.folio) return toastError("Folio is missing on this holding. Cannot switch.");
    if (!selectedDest) return toastError("Pick a destination fund from the list.");
    const destCode = selectedDest.scheme_bse_code;
    if (destCode === (selectedSource.scheme_bse_code || selectedSource.scheme_code)) {
      return toastError("Source and destination fund cannot be the same.");
    }
    if (!switchAll && (!amount || Number(amount) <= 0)) return toastError("Enter a valid switch amount.");

    setSubmitting(true);
    const memRef = orderRefId();
    const payload = {
      data: {
        orders: [
          {
            type: "sw",
            mem_ord_ref_id: memRef,
            investor: { ucc },
            member: "91010",
            scheme: selectedSource.scheme_bse_code || selectedSource.scheme_code || "",
            dest_scheme: destCode,
            amount: switchAll ? 0 : Number(amount),
            cur: "INR",
            is_units: false,
            all_units: switchAll,
            min_redeem_flag: false,
            folio: selectedSource.folio,
            dest_folio: "",
            is_fresh: false,
            phys_or_demat: "d",
            holder: [{ holder_rank: "1", email: investorData?.email || "" }],
            kyc_passed: true,
            depository_acct: {
              depository: "C",
              dp_id: investorData?.kyc?.dp_id || "",
              client_id: investorData?.kyc?.client_id || "",
            },
            dpc: true,
            email: investorData?.email || "",
          },
        ],
        acknowledged: disc.acked,
      },
    };

    try {
      const url = nodeUrl(import.meta.env.VITE_FUND_ORDER_PLACE || "/purchaseNewOrder");
      const res = await postApiWithToken(url, payload);
      if (res?.status === 200 || res?.status === true || res?.status === "success") {
        // Orders page Laravel se padhta hai — post-back ke bagair switch wahan dikhta hi nahi.
        const orderId = res.data?.items?.[0]?.id;
        if (orderId) {
          await postApiWithToken(laravelUrl(import.meta.env.VITE_SEND_FUND_ORDER_DETAILS), {
            bse_order_id: orderId,
            mem_ord_ref_id: res.data?.items?.[0]?.mem_ord_ref_id || memRef,
            scheme_name: selectedDest.name,
            scheme_bse_code: destCode,
            inv_amo: switchAll ? selectedSource.inv_amo : Number(amount),
            folio: selectedSource.folio,
            order_type: "switch",
            scheme_category: selectedDest.scheme_category || selectedSource.scheme_category,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["bsePortfolio"] });
        queryClient.invalidateQueries({ queryKey: ["investedFunds"] });
        toastSuccess("Switch order placed successfully!");
        navigate("/user/order/mutual-funds");
      } else {
        toastError(orderErrorMessage(res, "Switch failed."));
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e?.message || "Switch failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] flex justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold dark:text-[var(--text-primary)]">Switch Mutual Fund</h1>
          <p className="text-sm text-gray-500 mt-1">Move from one fund to another within your portfolio.</p>
        </div>

        {holdings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No holdings to switch. Invest first.</p>
        ) : (
          <>
            <Combo
              id="switch-source"
              label="From (source fund)"
              value={srcText}
              onChange={setSrcText}
              placeholder="Type to filter, or click for the full list"
              options={holdings.map((h, i) => ({
                key: `${h.scheme_bse_code}-${h.folio}-${i}`,
                label: holdingLabel(h),
                hint: `₹${Number(h.inv_amo || 0).toLocaleString("en-IN")}${h.units ? ` · ${h.units} units` : ""}`,
              }))}
            />

            <Combo
              id="switch-dest"
              label="To (destination fund)"
              value={destText}
              onChange={setDestText}
              placeholder="Type to search, or click for the full list"
              options={destFunds.map((f) => ({
                key: f.scheme_bse_code || f.scheme_isin,
                label: destLabel(f),
                hint: f.scheme_bse_code,
              }))}
            />
            {selectedSource && (
              <p className="-mt-3 text-[11px] text-gray-500 dark:text-[var(--text-secondary)]">
                {sourceAmc
                  ? `Showing ${sourceAmc} schemes only — a switch stays within one fund house.`
                  : "We could not confirm this fund's fund house. A switch only works within one; BSE refuses any other."}
              </p>
            )}
            {switchOutClosed && (
              <p className="text-xs text-red-600 dark:text-red-400">
                This scheme does not allow switching out. Redeem it instead.
              </p>
            )}

            {/* "All units" and a schedule contradict each other — the first installment
                would empty the folio and leave the rest with nothing to transfer. */}
            {!sched.on && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={switchAll} onChange={(e) => setSwitchAll(e.target.checked)} />
                <span className="text-sm">Switch all units</span>
              </label>
            )}

            {(sched.on || !switchAll) && (
              <input
                type="number"
                placeholder={sched.on ? "Amount per installment (₹)" : "Amount (₹)"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={fieldClass}
              />
            )}

            <SxpSchedule {...sched} amount={amount} />

            <OrderDisclaimers {...disc} schemes={selectedDest ? [selectedDest] : []} />

            <div className="flex gap-3">
              <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-lg border">Cancel</button>
              <button
                onClick={sched.on ? handleStp : handleSwitch}
                disabled={submitting || !disc.ready || !sched.ready || switchOutClosed}
                className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50"
              >
                {submitting ? "Processing…" : sched.on ? "Start STP" : "Switch Fund"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SwitchMF;
