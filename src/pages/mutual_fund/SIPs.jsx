import React, { useEffect, useState } from "react";
import emptySip from "../../assets/mutualFund/sipEmpty2.svg";
import { useNavigate } from "react-router-dom";
import { postApiWithToken } from "../../api/api";
import { useSelector } from "react-redux";
import { nodeUrl, mapXspToSip, xspItems } from "../../utils/nodeApi";
import { sipXirr } from "../../utils/xirr";

const SIPs = () => {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const [sips, setSips] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSips = async () => {
      const ucc = investorData?.kyc?.ucc_code;
      if (!ucc) {
        setLoading(false);
        return;
      }
      try {
        const url = nodeUrl(import.meta.env.VITE_GET_ALL_XSP || "/getAllXsp");
        // The registrations, and the instalments each one actually put through. A SIP's XIRR
        // is the second list's dates against the first list's scheme — getAllXsp describes
        // the registration and carries no cash flows. Orders are optional: if that call
        // fails the cards still render, just without a rate on them.
        const [res, history] = await Promise.all([
          postApiWithToken(url, {
            data: {
              fields: ["ALL"],
              start: 0,
              length: 50,
              filter_param: { sxp_type: "SIP", ucc },
            },
          }),
          postApiWithToken(nodeUrl("/orderHistory"), { ucc }).catch(() => null),
        ]);
        setSips(xspItems(res).map((item, i) => mapXspToSip(item, i)));
        setOrders(Array.isArray(history?.data?.orders) ? history.data.orders : []);
      } catch (_) {
        /* empty */
      } finally {
        setLoading(false);
      }
    };
    fetchSips();
  }, [investorData?.kyc?.ucc_code]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-10 text-center text-gray-400">
        Loading SIPs…
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 bg-transparent text-slate-900 dark:text-[var(--text-primary)]">
      {sips.length === 0 ? (
        <div className="min-h-[400px] flex flex-col justify-center items-center space-y-5">
          <img src={emptySip} className="w-72 opacity-90" alt="" />
          <h1 className="text-2xl font-semibold dark:text-[var(--text-primary)]">No SIPs yet</h1>
          <p className="text-slate-500 dark:text-[var(--text-secondary)] text-sm">
            When you start an SIP, it will appear here.
          </p>
          <button
            onClick={() => navigate("/user/mutual_fund/explore")}
            className="mt-2 px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
          >
            Explore Funds
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold dark:text-[var(--text-primary)]">Your SIPs</h1>
            <button
              onClick={() => navigate("/mutual_fund/manage-sip")}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium"
            >
              Manage SIPs →
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sips.map((sip) => {
              // Only once BSE has valued the holding. `sip.currentValue` falls back to what
              // was paid in, and running that through XIRR prints a confident 0%.
              const rate = sip.marketValue ? sipXirr(orders, sip.schemeCode, sip.marketValue) : null;
              return (
                <div
                  key={sip.id}
                  className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-5 bg-white dark:bg-[var(--card-bg)]"
                >
                  <h3 className="font-semibold text-sm dark:text-[var(--text-primary)]">{sip.schemeName}</h3>
                  <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-1">{sip.category}</p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>₹{sip.sipAmount.toLocaleString()} / {sip.frequency}</span>
                    <span className="text-emerald-600 font-medium">{sip.status}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline">
                    <p className="text-xs text-slate-400">Next: {sip.nextInstallment}</p>
                    {rate != null && (
                      <p
                        className={`text-xs font-semibold ${rate >= 0 ? "text-emerald-600" : "text-red-500"}`}
                        title="XIRR on this SIP's own instalments, valued today"
                      >
                        {rate >= 0 ? "+" : "−"}
                        {Math.abs(rate).toFixed(2)}% p.a.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SIPs;
