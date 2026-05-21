export default function FundCard({ fund }) {
  return (
 <div
  className="
    bg-white border border-[#e1e8f0] rounded-lg p-3
    flex justify-between hover:shadow transition

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  "
>
  <div>
    <p
      className="
        font-medium text-[15px]
        text-slate-800
        dark:text-[var(--text-primary)]
      "
    >
      {fund.name}
    </p>

    <p
      className="
        text-xs mt-0.5
        text-gray-500
        dark:text-[var(--text-secondary)]
      "
    >
      Weight: {fund.weight}%
    </p>
  </div>

  {/* Returns Breakdown */}
  <div className="text-right">
    <p
      className="
        font-semibold text-sm
        text-green-600
        dark:text-emerald-400
      "
    >
      {fund.returns3Y}%
    </p>

    <div className="flex gap-1 text-[11px] justify-end mt-1">
      <span
        className="
          px-2 py-0.5 rounded
          bg-blue-100 text-blue-700

          dark:bg-blue-500/15
          dark:text-blue-400
        "
      >
        1Y: {fund.returns1Y}%
      </span>

      <span
        className="
          px-2 py-0.5 rounded
          bg-emerald-100 text-emerald-700

          dark:bg-emerald-500/15
          dark:text-emerald-400
        "
      >
        3Y: {fund.returns3Y}%
      </span>

      <span
        className="
          px-2 py-0.5 rounded
          bg-purple-100 text-purple-700

          dark:bg-purple-500/15
          dark:text-purple-400
        "
      >
        5Y: {fund.returns5Y}%
      </span>
    </div>
  </div>
</div>

  );
}
