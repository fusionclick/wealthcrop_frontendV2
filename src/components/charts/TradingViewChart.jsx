import { useEffect, useRef } from "react";

const TradingViewChart = ({ symbol = "NSE:TCS" }) => {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        container_id: container.current.id,
        autosize: true,
        symbol: symbol,
        interval: "5",
        timezone: "Asia/Kolkata",
        theme: "light",
        style: "1",
        locale: "in",
        enable_publishing: false,
        allow_symbol_change: true,
      });
    };
    document.body.appendChild(script);
  }, [symbol]);

  return (
    <div id="tradingview_chart" ref={container} className="h-[600px] w-full" />
  );
};

export default TradingViewChart;
