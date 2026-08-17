import React, { useCallback, useEffect, useState } from "react";
import { fetchFnoPositions } from "../../api/portfolioApi";

const PositionsFO = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchFnoPositions()
      .then((res) => setPositions(res?.data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">F&amp;O Positions</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Live positions from your linked Kotak Neo account
      </p>

      {loading && positions.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">Loading Kotak positions…</p>
      )}
      {!loading && positions.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">No open F&amp;O positions found.</p>
      )}

      <div className="space-y-3">
        {positions.map((position) => (
          <div
            key={`${position.segment}-${position.symbol}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[var(--card-bg)]"
          >
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{position.symbol}</p>
              <p className="text-xs uppercase text-slate-500">{position.segment}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-900 dark:text-white">{position.qty} Qty</p>
              <p className="text-sm text-slate-500">
                Avg ₹{Number(position.avg_price || 0).toFixed(2)} · LTP ₹{Number(position.ltp || 0).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PositionsFO;