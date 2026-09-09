import React from "react";
import { Bell } from "lucide-react";

const Notifications = () => {
  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617] transition">
      {/* Header */}
      <h1 className="text-xl font-semibold text-blue-900 dark:text-white mb-6">
        Notifications
      </h1>

      {/* ponytail: no notifications backend yet — empty state until one exists. */}
      <div className="max-w-xl mx-auto min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-[#94a3b8]">
            <Bell size={26} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            No notifications yet
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8]">
            Updates about your KYC, documents and account activity will show up here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
