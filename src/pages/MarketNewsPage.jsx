import React from "react";
import { Newspaper } from "lucide-react";

// ponytail: no news feed is wired up — search/category filters would filter nothing,
// so the whole feed UI is gone until there is a source to filter.
export default function MarketNewsPage() {
  return (
    <div
  className="
    min-h-screen py-12
    bg-linear-to-b from-blue-50 via-white to-blue-50
    dark:from-[#020617] dark:via-[#020617] dark:to-[#020617]
  "
>
  <div className="max-w-6xl mx-auto px-6">

    {/* HERO SECTION */}
    <div
      className="
        rounded-3xl p-10 shadow-lg mb-10 border
        bg-linear-to-r from-blue-100 to-indigo-100 border-blue-200
        text-blue-900
        dark:from-[#020617] dark:to-[#020617] dark:border-white/10 dark:text-white
      "
    >
      <h1 className="text-4xl font-extrabold mb-2">
        Market News
      </h1>

      <p className="text-blue-700 text-lg dark:text-gray-400">
        Financial news curated by Wealthcrop analysts.
      </p>
    </div>

    {/* EMPTY STATE */}
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400">
          <Newspaper size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          Market news isn’t connected yet
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
          We haven’t hooked up a news provider for this account. Headlines will
          appear here once the feed is live.
        </p>
      </div>
    </div>

  </div>
</div>

  );
}
