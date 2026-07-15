import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setStocks } from "../redux/stockSlice";
import { fetchStockList } from "../api/marketApi";

const POLL_MS = Number(import.meta.env.VITE_STOCK_POLL_MS) || 10000;

const toReduxRow = (s) => ({
  meta: {
    companyName: s.companyName,
    symbol: s.symbol,
    segment: s.segment ?? "EQ",
  },
  lastPrice: s.lastPrice,
  pChange: s.pChange,
  chartTodayPath: null,
  live: s.live ?? false,
});

const SocketHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const loadLive = () =>
      fetchStockList("NIFTY 500", 50)
        .then((res) => {
          if (cancelled) return;
          const rows = (res?.data ?? []).map(toReduxRow);
          if (rows.length) dispatch(setStocks(rows));
        })
        .catch(() => {});

    loadLive();
    const interval = setInterval(loadLive, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [dispatch]);

  return null;
};

export default SocketHandler;
