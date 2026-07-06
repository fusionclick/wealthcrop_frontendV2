import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setStocks } from "../redux/stockSlice";
import { fetchStockList } from "../api/marketApi";

const SocketHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const load = () => {
      fetchStockList("NIFTY 50")
        .then((res) => {
          const rows = (res?.data ?? []).map((s) => ({
            meta: { companyName: s.companyName, symbol: s.symbol, segment: s.segment },
            lastPrice: s.lastPrice,
            pChange: s.pChange,
            chartTodayPath: null,
          }));
          dispatch(setStocks(rows));
        })
        .catch(() => dispatch(setStocks([])));
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
};

export default SocketHandler;
