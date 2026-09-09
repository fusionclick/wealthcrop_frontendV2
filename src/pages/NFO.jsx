import React from "react";

// ponytail: no NFO feed exists yet — the only content endpoints are /content/blogs and
// /content/ipos. The hardcoded list that used to live here was invented and long expired,
// so the page states that honestly until a real source lands.
const NFO = () => {
  return (
    <div className="min-h-screen bg-blue-50 px-6 py-12 dark:bg-[var(--app-bg)] ">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-200 mb-2">New Fund Offerings</h1>
        <div className="h-1 w-16 bg-green-500 mx-auto rounded-full mb-4"></div>
        <p className="text-gray-600 dark:text-slate-400">Subscribe to the latest NFOs from top investment companies.</p>
      </div>

      <p className="max-w-6xl mx-auto text-center text-gray-500 dark:text-slate-400 py-16">
        No NFOs are open right now. Check back soon.
      </p>
    </div>
  );
};

export default NFO;
