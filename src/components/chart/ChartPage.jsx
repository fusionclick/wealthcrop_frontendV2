import { useNavigate } from "react-router-dom";
import CandleChart from "./CandleChart";
import { useEffect, useState } from "react";

export default function ChartPage() {
  const [data, setData] = useState([]);
  const navigate = useNavigate()

  // useEffect(() => {
  //   fetch("/api/candles?symbol=SUNPHARMA&interval=1D")
  //     .then(res => res.json())
  //     .then(data => setData(data));
  // }, []);


//! API should return data shaped like this ⤵
[
  {
    "timestamp": 1735564800000,
    "open": 162.10,
    "high": 164.00,
    "low": 160.50,
    "close": 162.65,
    "volume": 2670000
  }
]

  return (
    <div className="p-5">
      <CandleChart onOpenTerminal={() => navigate("/terminal")} data={data} />
    </div>
  );
}
