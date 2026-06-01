import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { postApiWithToken } from "../../api/api";
import { useSelector } from "react-redux";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import PageLoader from "../../components/PageLoader";
import InvestLoader from "../../components/InvestLoader";

const MutualFundInvestPage = ({ fundsList, setBuyModal }) => {
  // Dummy values — replace with actual data later
  console.log("funddeatils from mfinvest", fundsList);

  const schemeCode = fundsList?.scheme_bse_code;
  const name = fundsList?.name;
  const fundCategory = "Equity • Flexi Cap";
  const risk = fundsList?.risk;
  const rating = fundsList?.rating;
  const nav = fundsList?.nav;
  const returns = {
    "1Y": fundsList?.returns?.["1Y"],
    "3Y": fundsList?.returns?.["3Y"],
    "5Y": fundsList?.returns?.["5Y"],
  };
  const minLumpsum = fundsList?.minLumpsum;
  const minSip = fundsList?.minSip;
  const expenseRatio = fundsList?.expense;
  const exitLoad = "1% if redeemed within 365 days";

  const [investType, setInvestType] = useState("LUMPSUM");
  const [planType, setPlanType] = useState("GROWTH");
  const [amount, setAmount] = useState(5000);
  const [sipDay, setSipDay] = useState("05");

  const [recurringFrequency, setRecurringFrequency] = useState("DAILY");
  const [confirmAutoDebit, setConfirmAutoDebit] = useState(true);
  const [confirmNoAdvisor, setConfirmNoAdvisor] = useState(true);
  const [confirmTerms, setConfirmTerms] = useState(true);

  const[loading, setLoading] = useState(false)
  // const [estimatedUnits, setEstimatedUnits] = useState(0);

  const { data } = useSelector((state) => state.investorData);

  useEffect(() => {
    console.log("Investor Data from mutualfundinvest page", data);
  }, [data]);

  const estimatedUnits = useMemo(() => {
    if (!amount || nav <= 0) return 0;
    return amount / nav;
  }, [amount, nav]);

  const formatReturn = (val) =>
    val != null ? `${val > 0 ? "+" : ""}${val.toFixed(2)}%` : "--";

  const Stars = ({ rating }) => (
    <span className="text-[11px] text-amber-500">
      {"★".repeat(rating)}
      <span className="text-slate-300 dark:text-[var(--text-secondary)]">
        {"☆".repeat(5 - rating)}
      </span>
    </span>
  );

  //! for nominee name
  const getNameParts = (fullName = "") => {
    const parts = fullName.trim().split(/\s+/); // split by spaces

    return {
      first_name: parts[0] || "",
      middle_name: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
      last_name: parts.length > 1 ? parts[parts.length - 1] : "",
    };
  };

  //! Generate Order Ref Id
  const generateOrderRefId = () => Math.floor(100000 + Math.random() * 900000);

  const handleInvest = async () => {

    setLoading(true)
    //     const encrypted =
    //   "eyJpdiI6IlJUajUyaU5TL3pLYWNNRVpmZVVLUUE9PSIsInZhbHVlIjoiWm9DeXpNUUtlbEN4WmtQT1lXRWlTUT09IiwibWFjIjoiZGM5Yjg1OTFjMmRhZjczMzA2YzgzNmIxZjQyMWRmYTg3NTNmNzhkMWViNTU2ZGFjZWNhOWYyYWUxZmNiMDg2YyIsInRhZyI6IiJ9";

    // const decoded = atob(encrypted);

    // console.log("decode",decoded);

    // const payload = {
    //   schemeCode,
    //   schemeName: name,
    //   investType,
    //   planType,
    //   amount: Number(amount),
    //   nav,
    //   mode: "ONLINE",
    //   orderSource: "WEB_APP",

    //   sipDetails:
    //     investType === "SIP"
    //       ? {
    //           sipDay,
    //           sipFrequency: "MONTHLY",
    //         }
    //       : null,

    //   recurringDetails:
    //     investType === "RECURRING"
    //       ? {
    //           frequency: recurringFrequency,
    //           startDate: new Date().toISOString(),
    //           autoDebitConfirmed: confirmAutoDebit,
    //           termsAccepted: confirmTerms,
    //         }
    //       : null,
    // };

    // const payload = {
    //   data: {
    //     orders: [
    //       {
    //         type: "p",
    //         // mem_ord_ref_id: "ORD20260518001",
    //         mem_ord_ref_id: generateOrderRefId(),
    //         investor: {
    //           // ucc: "UCC00078",
    //           ucc: data?.kyc?.ucc_code,
    //         },
    //         member: "91010",
    //         mem_details: {
    //           euin: "E999999",
    //           euin_flag: true,
    //           sub_br_code: "SUB001",
    //           sub_br_arn: "ARN-123456",
    //           partner_id: "PART001",
    //         },
    //         scheme: schemeCode,
    //         amount: amount,
    //         cur: "INR",
    //         is_units: false,
    //         all_units: false,
    //         min_redeem_flag: false,
    //         dest_scheme: "",
    //         folio: "",
    //         dest_folio: "",
    //         bank_ref_id: "",
    //         payment_ref_id: "",
    //         parent_client_code: "",
    //         is_fresh: true,
    //         phys_or_demat: "P",
    //         src: investType.toLowerCase(),
    //         reg_no: "",
    //         // holder: [
    //         //   {
    //         //     holder_rank: "1",
    //         //     email: data?.email,
    //         //     mobnum: data?.phone,
    //         //     is_nomination_opted: false,
    //         //     nomination_auth_mode: "UNKNOWN",
    //         //   },
    //         // ],

    //         holder:  data?.nominees?.length
    //         ?  data?.nominees?.map((holder, index) => (
    //           {
    //             holder_rank: `${index + 1}`,
    //             email: "investor1@example.com",
    //             mobnum: "9999999999",
    //             is_nomination_opted: false,
    //             nomination_auth_mode: "UNKNOWN",
    //           }
    //         )) : [],

    //         email: data?.email,
    //         mobnum: data?.phone,
    //         kyc_passed: true,
    //         depository_acct: {},
    //         bank_acct: {
    //           ifsc: data?.bank_accounts?.[0]?.ifsc_code,
    //           no: data?.bank_accounts?.[0]?.account_number,
    //           // no: "123456789012",
    //           type: "SB",
    //           name: data?.bank_accounts?.[0]?.bank_name,
    //         },
    //         dpc: true,
    //         is_nomination_opted: true,
    //         nomination_auth_mode: 0,
    //         // nomination: [

    //         //   {
    //         //     first_name: "NomineeOne",
    //         //     middle_name: "",
    //         //     last_name: "Test",
    //         //     dob: "01-Jan-2000",
    //         //     nomination_percent: 100,
    //         //     nomination_relation: "18",
    //         //     is_pan_exempt: true,
    //         //     pan_exempt_category: "01",
    //         //     is_minor: false,
    //         //     identifier: [
    //         //       {
    //         //         identifier_type: "pan_exempt_ref_no",
    //         //         identifier_number: "EXEMPT1234"
    //         //       }
    //         //     ]
    //         //   }
    //         // ],
    //         nomination: data?.nominees?.length
    //           ? data?.nominees?.map((nominee) => {

    //             const nameParts = getNameParts(nominee?.name);
    //             return {
    //               ...nameParts,
    //               dob: "01-Jan-2000",
    //               nomination_percent: nominee?.percentage,
    //               nomination_relation: nominee?.relation,
    //               is_pan_exempt: true,
    //               pan_exempt_category: "01",
    //               is_minor: false,
    //               identifier: [
    //                 {
    //                   identifier_type: "pan_exempt_ref_no",
    //                   identifier_number: "EXEMPT1234",
    //                 },
    //               ],
    //             };
    //           })
    //         : [],
    //         special_product: {
    //           special_prod_type: "",
    //           special_prod_name: "",
    //           target_scheme: "",
    //           target_amt: 0,
    //           goal_type: "",
    //           goal_amt: 0,
    //           sip_tenure: 0,
    //         },
    //       },
    //     ],
    //   },

    const payload = {
      data: {
        orders: [
          {
            type: "p",
            mem_ord_ref_id: String(generateOrderRefId()),

            investor: {
              ucc: data?.kyc?.ucc_code,
              // ucc: "USRWC003",
            },

            member: "91010",

            // "mem_details": {
            //     "euin": "E123456",
            //     "euin_flag": true,
            //     "sub_br_code": "123456",
            //     "sub_br_arn": "ARN-12345",
            //     "partner_id": "partner id"
            // },

            scheme: schemeCode,
            amount: amount,
            cur: "INR",
            is_units: false,
            all_units: false,
            min_redeem_flag: false,

            folio: "",
            is_fresh: true,
            phys_or_demat: "d",

            //"reg_no": "202500000002194",

            // "info": {
            // "min_redeem_flag": true,
            // // "src": investType.toLowerCase(),
            // // "reg_no": "123",
            // },

            holder: [
              {
                holder_rank: "1",
                email: data?.email,
                mobnum: data?.phone,
              },
            ],
            // holder: data?.nominees?.length
            //   ? data.nominees.map((holder, index) => ({
            //       holder_rank: `${index + 1}`,
            //       email: data?.email,
            //       mobnum: data?.phone,
            //     }))
            //   : [
            //       {
            //         holder_rank: "1",
            //         email: data?.email,
            //         mobnum: data?.phone,
            //       },
            //     ],

            // is_nomination_opted: data?.nominees?.length > 0,
            is_nomination_opted: false,
            nomination_auth_mode: "",
            payment_ref_id: "",

            email: data?.email,
            mobnum: data?.phone,

            //"exch_mandate_id": 12,

            kyc_passed: true,

            depository_acct: {
              depository: "C",
              dp_id: data?.kyc?.dp_id,
              client_id: data?.kyc?.client_id,
              // dp_id: "12345678",
              // client_id: "12345678",
            },

            // "bank_acct": {
            //     "ifsc": data?.bank_accounts?.[0]?.ifsc_code,
            //     "no": data?.bank_accounts?.[0]?.account_number,
            //     "type": "SB",
            //     "name": data?.bank_accounts?.[0]?.bank_name
            // },

            dpc: true,
          },
        ],
      },
    };

    const url = `${import.meta.env.VITE_NODE_URL}${import.meta.env.VITE_FUND_ORDER_PLACE}`;
    try {
      const res = await postApiWithToken(url, payload);
      console.log("Order", res);
      console.log("Order status", res?.status);
      console.log("Order data", res?.data);
      if (res?.status === 200 || res?.status === true || res?.status === "success") {
        setLoading(false)
        setBuyModal(false)
        toastSuccess("Order placed successfully");
        sendOrderDetails(
          res.data.items[0].id,
          res.data.items[0].mem_ord_ref_id,
        );
      }
    } catch (error) {
      toastError(error?.message);
    }

    console.log("MF Invest Payload:", payload);

    // alert(`${investType} order placed for ₹${amount} in ${name} (${planType})`);
  };

  const sendOrderDetails = async (bse_order_id, mem_ord_ref_id) => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_SEND_FUND_ORDER_DETAILS}`;
    try {
      const res = await postApiWithToken(url, {
        bse_order_id,
        mem_ord_ref_id,
        scheme_name: name,
        inv_amo: amount,
        ret_percentage: fundsList?.returns?.["1Y"] ?? 0.00,
      });

      console.log("order details send response", res);

      if (res?.status === 200 || res?.status === true) {
        toastSuccess(res?.message, "from send order fn");
      }
    } catch (error) {
      console.log(error?.message);
    }
  };

 if (loading) {
   return <InvestLoader />;
 }

  return (
    <div
      className="
  min-h-screen rounded-2xl
  bg-slate-100 dark:bg-[var(--app-bg)]
  flex justify-center px-4 py-6
"
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              className="
          text-xl font-semibold
          text-slate-900 dark:text-[var(--text-primary)]
        "
            >
              Invest in Mutual Fund
            </h1>
            <p
              className="
          text-xs mt-1
          text-slate-500 dark:text-[var(--text-secondary)]
        "
            >
              Choose lumpsum or SIP and review details before investing.
            </p>
          </div>

          {/* <div className="
        flex gap-2 text-xs
        text-slate-500 dark:text-[var(--text-secondary)]
      ">
        <span>Mutual Funds</span>
        <span>/</span>
        <span className="
          text-slate-700 font-medium
          dark:text-[var(--text-primary)]
        ">
          Invest
        </span>
      </div> */}
        </div>

        {/* Fund header */}
        <div
          className="
      bg-white dark:bg-[var(--card-bg)]
      rounded-2xl shadow-sm
      border border-slate-200 dark:border-[var(--border-color)]
      mb-4 p-4
      flex flex-wrap items-center justify-between gap-4
    "
        >
          <div className="flex items-center gap-3">
            <div
              className="
          h-9 w-9 rounded-lg
          bg-indigo-100 text-indigo-700
          dark:bg-indigo-500/15 dark:text-indigo-400
          flex items-center justify-center text-xs font-bold
        "
            >
              MF
            </div>

            <div>
              <p
                className="
            text-sm font-semibold
            text-slate-900 dark:text-[var(--text-primary)]
          "
              >
                {name}
              </p>
              <p
                className="
            text-[11px]
            text-slate-500 dark:text-[var(--text-secondary)]
          "
              >
                {fundCategory}
              </p>

              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <Stars rating={rating} />
                <span
                  className="
              px-2 py-0.5 rounded-full
              bg-slate-100 text-slate-600
              dark:bg-[var(--white-5)] dark:text-[var(--text-secondary)]
            "
                >
                  {risk} risk
                </span>
              </div>
            </div>
          </div>

          {/* NAV + returns */}
          <div className="flex items-end gap-6 text-xs">
            <div className="text-right">
              <p
                className="
            text-[11px] uppercase
            text-slate-500 dark:text-[var(--text-secondary)]
          "
              >
                NAV
              </p>
              <p
                className="
            text-sm font-semibold
            text-slate-900 dark:text-[var(--text-primary)]
          "
              >
                ₹{nav?.toFixed(2)}
              </p>
              <p
                className="
            text-[11px] mt-0.5
            text-slate-500 dark:text-[var(--text-secondary)]
          "
              >
                As of today
              </p>
            </div>

            <div className="text-right">
              <p
                className="
            text-[11px]
            text-slate-500 dark:text-[var(--text-secondary)]
          "
              >
                1Y • 3Y • 5Y
              </p>
              <p
                className="
            text-[11px] font-medium
            text-emerald-600 dark:text-emerald-400
          "
              >
                {formatReturn(returns["1Y"])} • {formatReturn(returns["3Y"])} •{" "}
                {formatReturn(returns["5Y"])}
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid md:grid-cols-[1.5fr,1fr] gap-4 items-start">
          {/* LEFT – Invest Form */}
          <div
            className="
        bg-white dark:bg-[var(--card-bg)]
        rounded-2xl shadow-sm
        border border-slate-200 dark:border-[var(--border-color)]
        p-4 space-y-4
      "
          >
            {/* Lumpsum / SIP Toggle */}
            <div className="flex gap-2 text-xs font-medium mb-2">
              {[
                ["LUMPSUM", "Lumpsum", "emerald"],
                ["SIP", "SIP", "blue"],
                ["RECURRING", "Recurring", "indigo"],
              ].map(([type, label, color]) => (
                <button
                  key={type}
                  onClick={() => setInvestType(type)}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    investType === type
                      ? `bg-${color}-500 text-white shadow-sm`
                      : `bg-${color}-100 text-${color}-700 dark:bg-${color}-500/15 dark:text-${color}-400`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Plan type */}
            <div className="text-xs">
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
                Plan
              </p>

              <div
                className="
            flex gap-1 rounded-xl p-1
            bg-slate-50 dark:bg-[var(--white-5)]
          "
              >
                {["GROWTH", "IDCW"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPlanType(type)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] transition ${
                      planType === type
                        ? "bg-slate-900 text-white dark:bg-[var(--text-primary)] dark:text-[var(--app-bg)]"
                        : "text-slate-600 dark:text-[var(--text-secondary)]"
                    }`}
                  >
                    {type === "GROWTH" ? "Growth" : "IDCW"}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="text-xs">
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
                {investType === "LUMPSUM"
                  ? "Lumpsum amount (₹)"
                  : "Monthly SIP amount (₹)"}
              </p>

              <div
                className="
            flex items-center rounded-xl px-3
            border border-slate-200 dark:border-[var(--border-color)]
            bg-slate-50 dark:bg-[var(--white-5)]
          "
              >
                <span className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mr-1">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="
                w-full bg-transparent py-2 outline-none text-sm
                text-slate-900 dark:text-[var(--text-primary)]
              "
                />
              </div>

              <p className="mt-1 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                Minimum{" "}
                {investType === "LUMPSUM" ? `₹${minLumpsum}` : `₹${minSip}`}
              </p>
            </div>

            {/* SIP Date */}
            {investType === "SIP" && (
              <div className="text-xs">
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
                  SIP date
                </p>
                <select
                  value={sipDay}
                  onChange={(e) => setSipDay(e.target.value)}
                  className="
                w-full rounded-xl px-3 py-2 outline-none text-xs
                border border-slate-200 dark:border-[var(--border-color)]
                bg-slate-50 dark:bg-[var(--white-5)]
                text-slate-900 dark:text-[var(--text-primary)]
              "
                >
                  {["01", "05", "10", "15", "25"].map((d) => (
                    <option key={d} value={d}>
                      {d} of every month
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* RECURRING OPTIONS */}
            {investType === "RECURRING" && (
              <div className="space-y-3 text-xs">
                {/* Frequency */}
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1">
                    Frequency (Daily / Weekly / Fortnightly)
                  </p>

                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value)}
                    className="
          w-full rounded-xl px-3 py-2 outline-none text-xs
          border border-slate-200 dark:border-[var(--border-color)]
          bg-slate-50 dark:bg-[var(--white-5)]
          text-slate-900 dark:text-[var(--text-primary)]
        "
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="FORTNIGHTLY">Fortnightly</option>
                  </select>
                </div>

                {/* Confirmations */}
                <div className="space-y-2 text-[11px]">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={confirmAutoDebit}
                      onChange={() => setConfirmAutoDebit(!confirmAutoDebit)}
                    />
                    <span className="text-slate-600 dark:text-[var(--text-secondary)]">
                      I confirm that the first payment starts today. Subsequent
                      payments will be processed{" "}
                      {recurringFrequency.toLowerCase()} (including weekends and
                      holidays).
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={confirmNoAdvisor}
                      onChange={() => setConfirmNoAdvisor(!confirmNoAdvisor)}
                    />
                    <span className="text-slate-600 dark:text-[var(--text-secondary)]">
                      I confirm that I have not been advised by any employee or
                      partner.
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={confirmTerms}
                      onChange={() => setConfirmTerms(!confirmTerms)}
                    />
                    <span className="text-slate-600 dark:text-[var(--text-secondary)]">
                      I agree to the Terms and Conditions.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Estimated units */}
            {investType === "LUMPSUM" && (
              <div
                className="
            rounded-xl border border-dashed
            border-slate-300 dark:border-[var(--border-color)]
            bg-slate-50 dark:bg-[var(--white-5)]
            px-3 py-2 text-xs
          "
              >
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                  Estimated units (approx)
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">
                  {estimatedUnits.toFixed(4)} units
                </p>
                <p className="text-[10px] text-slate-400 dark:text-[var(--text-secondary)]">
                  Based on NAV. Actual allocated units may differ.
                </p>
              </div>
            )}

            {/* ACTION */}
            <div
              className="
          pt-1 mt-2 flex items-center justify-between gap-3
          border-t border-slate-100 dark:border-[var(--border-color)]
        "
            >
              <div className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)]">
                <p>
                  Investing in{" "}
                  <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
                    {name}
                  </span>
                </p>
                <p className="mt-0.5">
                  Mode{" "}
                  <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
                    {investType === "LUMPSUM"
                      ? "One-time lumpsum"
                      : investType === "SIP"
                        ? "Monthly SIP"
                        : investType === "RECURRING"
                          ? "Recurring Investment"
                          : "Unknown"}
                  </span>
                </p>
              </div>

              <button
                onClick={handleInvest}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white ${
                  investType === "LUMPSUM"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {investType === "LUMPSUM"
                  ? "Confirm & Invest"
                  : investType === "SIP"
                    ? "Start SIP"
                    : "Buy"}
              </button>
            </div>
          </div>

          {/* RIGHT – Key Fund Info */}
          <div
            className="
        bg-white dark:bg-[var(--card-bg)]
        rounded-2xl shadow-sm
        border border-slate-200 dark:border-[var(--border-color)]
        p-4 space-y-4 text-xs
      "
          >
            <div>
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-2">
                Key details
              </p>

              <div className="rounded-xl bg-slate-50 dark:bg-[var(--white-5)] px-3 py-2 space-y-1">
                {[
                  ["Category", fundCategory],
                  ["Risk", risk],
                  ["Expense ratio", expenseRatio + ""],
                  ["Exit load", exitLoad],
                ].map(([k, v]) => (
                  <div className="flex justify-between" key={k}>
                    <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                      {k}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-[var(--text-primary)]">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-2">
                Historical returns
              </p>

              <div
                className="
            rounded-xl border border-slate-100 dark:border-[var(--border-color)]
            px-3 py-2 space-y-1
          "
              >
                {["1Y", "3Y", "5Y"].map((p) => (
                  <div className="flex justify-between" key={p}>
                    <span className="text-slate-500 dark:text-[var(--text-secondary)]">
                      {p}
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatReturn(returns[p])}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-1 text-[10px] text-slate-400 dark:text-[var(--text-secondary)]">
                Past performance is not indicative of future returns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutualFundInvestPage;
