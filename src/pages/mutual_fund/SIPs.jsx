import React, { useEffect, useState } from "react";
import emptySip from "../../assets/mutualFund/sipEmpty2.svg";
import { useNavigate } from "react-router-dom";
import { postApiWithToken } from "../../api/api";
import { useSelector } from "react-redux";
import { nodeUrl, mapXspToSip } from "../../utils/nodeApi";

const SIPs = () => {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const [sips, setSips] = useState([]);
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
        const res = await postApiWithToken(url, {
          data: {
            fields: ["ALL"],
            start: 0,
            length: 50,
            filter_param: { sxp_type: ["SIP"], ucc: [ucc] },
          },
        });
        const items = res?.data?.items || res?.response?.data?.items || res?.items || [];
        if (Array.isArray(items)) {
          setSips(items.map((item, i) => mapXspToSip(item, i)).filter((s) => s.status === "ACTIVE"));
        }
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
          <h1 className="text-2xl font-semibold dark:text-[var(--text-primary)]">No active SIPs</h1>
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
            {sips.map((sip) => (
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
                <p className="text-xs text-slate-400 mt-2">Next: {sip.nextInstallment}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SIPs;
