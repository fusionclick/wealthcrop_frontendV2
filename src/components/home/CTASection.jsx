import React from "react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
   <section
  className="
    text-center py-16 px-6 overflow-hidden
    bg-linear-to-r
    from-blue-950 to-red-600
    dark:from-[#020617] dark:to-[#0f172a]
    text-white
  "
>
  <h2 className="text-3xl font-semibold mb-4">
    Ready to Begin Your Wealth Journey?
  </h2>

  <p className="mb-6 text-gray-200 dark:text-[var(--text-secondary)]">
    Start investing today with a platform that understands your goals.
  </p>

  <Link
    to="/signup"
    className="
      inline-block
      bg-white text-blue-950
      dark:bg-[var(--white-10)] dark:text-[var(--text-primary)]
      font-semibold px-6 py-3 rounded-lg
      shadow hover:bg-gray-100
      dark:hover:bg-[var(--white-5)]
      transition
    "
  >
    Join Now
  </Link>
</section>

  );
};

export default CTASection;
