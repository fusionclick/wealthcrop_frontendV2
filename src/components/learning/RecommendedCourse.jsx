import { useNavigate } from "react-router-dom";

/**
 * Audit #76 — "recommendations": the next unfinished course, picked by the server (easiest
 * level first, then the admin's order). Shown on the Learning Centre and on a finished course.
 */
export default function RecommendedCourse({ course, className = "" }) {
  const navigate = useNavigate();
  if (!course) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/learning-centre/course/${course.slug}`)}
      className={`w-full text-left rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/5 p-4 transition hover:shadow-md ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        Recommended next
      </p>
      <p className="mt-1 font-semibold text-blue-950 dark:text-white">
        {course.cover_emoji} {course.title}
      </p>
      {course.summary && <p className="text-xs text-slate-600 dark:text-[#94a3b8] mt-0.5">{course.summary}</p>}
    </button>
  );
}
