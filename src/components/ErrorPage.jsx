import React from "react";
import { Link, useLocation } from "react-router-dom";

const ErrorPage = () => {
  const location = useLocation();
  const errorMessage = location.state?.message;

  return (
 <div
  className="
    min-h-screen flex flex-col items-center justify-center px-6 text-center
    bg-linear-to-b from-blue-50 to-white
    dark:from-[#020617] dark:to-[#020617]
  "
>
  <div
    className="
      bg-white dark:bg-[#020617]
      p-8 rounded-2xl shadow-xl dark:shadow-none
      max-w-md w-full
      border border-blue-100 dark:border-white/10
    "
  >
    <div className="text-6xl mb-4">😕</div>

    <h1 className="text-3xl font-semibold text-blue-700 dark:text-blue-400 mb-2">
      Something went wrong
    </h1>

    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
      {errorMessage ||
        "We hit a small bump while processing your request. Please try again."}
    </p>

    <Link
      to="/"
      className="
        px-6 py-3 bg-blue-600 dark:bg-blue-500
        text-white rounded-xl shadow
        hover:bg-blue-700 dark:hover:bg-blue-400
        transition active:scale-95 inline-block
      "
    >
      Go Back Home
    </Link>
  </div>
</div>

  );
};

export default ErrorPage;
