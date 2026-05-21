import { Link } from "react-router-dom";

export default function BasketCard({ basket }) {
  return (
    <Link to={`/basket/${basket.id}`}>
      <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition border">
        <h2 className="text-lg font-semibold text-slate-800">{basket.name}</h2>

        <p className="text-sm text-gray-500 mt-1">Min SIP: ₹{basket.minSip}</p>
        <p className="text-sm mt-1">1Y Returns: <span className="text-green-600 font-semibold">{basket.returns1Y}%</span></p>

        <div className="text-xs mt-2 bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
          {basket.risk}
        </div>
      </div>
    </Link>
  );
}

