    import { Link } from "react-router-dom";

export default function BasketCard({ basket }) {
  return (
    <Link to={`/basket/${basket.id}`}>
  <div
    className="
      bg-white border border-[#e0e7ef]
      rounded-xl shadow-sm hover:shadow-md
      transition p-5 cursor-pointer

      dark:bg-[var(--card-bg)]
      dark:border-[var(--border-color)]
      dark:hover:shadow-lg
    "
  >
    {/* Light icon */}
    <img
      src="https://cdn-icons-png.flaticon.com/512/3208/3208750.png"
      className="w-9 mb-2 opacity-70"
      alt="icon"
    />

    <h2
      className="
        font-semibold text-[16px] leading-snug mb-1
        text-slate-800 dark:text-[var(--text-primary)]
      "
    >
      {basket.name}
    </h2>

    {/* minSip, returns1Y aur risk teenon NULL hote hain — createBasket inhe kabhi likhta
        hi nahi. Card par "Min SIP: ₹", "1Y Returns: %" aur ek khali neela pill chhapte
        the. Jo maloom nahi wo likhna hi nahi chahiye. */}
    {basket.minSip != null && (
      <p
        className="
          text-[13px] mt-1
          text-gray-600 dark:text-[var(--text-secondary)]
        "
      >
        Min SIP: <span className="font-medium">₹{basket.minSip}</span>
      </p>
    )}

    {basket.returns1Y != null && (
      <p className="text-[13px] mt-1">
        1Y Returns:{" "}
        <span
          className="
            font-semibold
            text-green-600 dark:text-emerald-400
          "
        >
          {basket.returns1Y}%
        </span>
      </p>
    )}

    {/* Khali pill ki jagah wo dikhao jo waqai maloom hai: basket kis cheez se bana hai. */}
    <div className="mt-3 flex flex-wrap gap-1.5">
      {(basket.risk ? [basket.risk] : basket.categories || []).map((label) => (
        <span
          key={label}
          className="
            inline-block px-3 py-1 text-xs rounded-full
            bg-blue-100 text-blue-700

            dark:bg-blue-500/15
            dark:text-blue-400
          "
        >
          {label}
        </span>
      ))}
    </div>
  </div>
</Link>

  );
}
