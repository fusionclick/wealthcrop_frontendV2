import {
  Chart as ChartJS,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Pie } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Chart({ type, data }) {
  if (type === "line") {
    return (
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [
            {
              label: "",
              data,
              borderColor: "#2563eb",
              borderWidth: 2,
              tension: 0.4,
            },
          ],
        }}
        options={{
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } },
        }}
      />
    );
  }

  if (type === "pie") {
    return (
      <Pie
        data={{
          labels: ["Equity", "Debt", "Commodity"],
          datasets: [
            {
              data: data,
              backgroundColor: ["#2563eb", "#3b82f6", "#60a5fa"],
            },
          ],
        }}
        options={{ plugins: { legend: { position: "bottom" } } }}
      />
    );
  }

  return null;
}
