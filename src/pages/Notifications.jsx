import React from "react";

const notifications = [
  {
    id: 1,
    title: "KYC Submitted",
    desc: "Your KYC has been submitted successfully.",
    time: "2 mins ago",
    type: "success",
  },
  {
    id: 2,
    title: "Document Rejected",
    desc: "Please re-upload your PAN document.",
    time: "1 hour ago",
    type: "error",
  },
  {
    id: 3,
    title: "Bank Verified",
    desc: "Your bank account has been verified.",
    time: "Yesterday",
    type: "info",
  },
];

const getTypeStyle = (type) => {
  switch (type) {
    case "success":
      return "border-green-500 text-green-500";
    case "error":
      return "border-red-500 text-red-500";
    default:
      return "border-blue-900 text-blue-900 dark:text-blue-400";
  }
};

const Notifications = () => {
  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617] transition">
      {/* Header */}
      <h1 className="text-xl font-semibold text-blue-900 dark:text-white mb-6">
        Notifications
      </h1>

      {/* List */}
      <div className="space-y-4 max-w-xl mx-auto">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`
              p-4 rounded-xl border
              bg-white dark:bg-[#020617]
              border-gray-200 dark:border-white/10
              shadow-sm hover:shadow-md
              transition cursor-pointer
            `}
          >
            {/* Top Row */}
            <div className="flex justify-between items-start">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                {item.title}
              </h2>
              <span className="text-xs text-gray-400">
                {item.time}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm mt-1 text-gray-600 dark:text-[#94a3b8]">
              {item.desc}
            </p>

            {/* Type Indicator */}
            <div
              className={`mt-3 text-xs font-medium inline-block px-2 py-1 rounded border ${getTypeStyle(
                item.type
              )}`}
            >
              {item.type.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;