import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchIpos, fetchIpo } from "../../api/marketApi";
import IpoFaq from "./IpoFaq";

const safe = (x) => (x ? x : "–");

export default function IpoDetails() {
  const { ipoName } = useParams();
  const [ipo, setIpo] = useState(null);

  useEffect(() => {
    fetchIpos()
      .then((r) => {
        const list = r?.data ?? [];
        const match = list.find((i) => i.name.replace(/\s+/g, "-") === ipoName);
        if (!match) return;
        return fetchIpo(match.id).then((d) => setIpo(d?.data ?? match));
      })
      .catch(() => setIpo(null));
  }, [ipoName]);

  if (!ipo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 dark:text-gray-400">Loading IPO...</p>
      </div>
    );
  }

  const showListing = ipo.status === "listed" || ipo.status === "LISTED";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#020617]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="bg-white dark:bg-[#020617] rounded-2xl shadow-sm px-6 py-6 mb-8 border dark:border-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{ipo.name}</h1>
          <p className="text-sm text-slate-500 mt-1">{ipo.symbol} · {ipo.status}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {[
            ["Open", ipo.openDate],
            ["Close", ipo.closeDate],
            ["Listing", ipo.listingDate],
            ["Issue price", ipo.issuePrice],
            ["Lot size", ipo.lotSize],
            ["Subscription", ipo.subscription],
          ].map(([k, v]) => (
            <div key={k} className="bg-white dark:bg-[#020617] rounded-xl p-4 border dark:border-slate-800">
              <p className="text-xs text-slate-500">{k}</p>
              <p className="font-semibold">{safe(v)}</p>
            </div>
          ))}
        </div>

        {ipo.about?.description && (
          <div className="bg-white dark:bg-[#020617] rounded-xl p-6 mb-8 border dark:border-slate-800">
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-slate-600 dark:text-slate-300">{ipo.about.description}</p>
          </div>
        )}

        <IpoFaq />
      </div>
    </div>
  );
}
