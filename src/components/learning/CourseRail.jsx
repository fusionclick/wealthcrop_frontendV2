import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, GraduationCap } from "lucide-react";
import { getApiWithToken } from "../../api/api";

/**
 * SRS §11 — the courses strip on the Learning Centre, with progress and earned badges.
 *
 * Rendered above the existing written guides rather than replacing them: an article is
 * still the right shape for "read this once", and a course is the shape for something that
 * can be completed, scored and badged. Silent for signed-out visitors, who have no
 * progress to show and no token to ask with.
 */
export default function CourseRail() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!localStorage.getItem("token")) return;
      const res = await getApiWithToken(`${import.meta.env.VITE_URL}/learning/courses`);
      if (!alive) return;
      setCourses(res?.data?.data ?? []);
      setBadges(res?.data?.badges ?? []);
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!courses.length) return null;

  return (
    <div className="mb-14">
      <div className="flex items-end justify-between gap-3 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <GraduationCap className="text-blue-600" /> Courses
        </h2>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.badge}
                title={`Earned for completing ${b.course}`}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 px-2 py-1 rounded-full"
              >
                <Award size={13} /> {b.badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {courses.map((c) => (
          <button
            key={c.slug}
            onClick={() => navigate(`/learning-centre/course/${c.slug}`)}
            className="text-left bg-white rounded-2xl shadow-md border border-blue-100 p-5 transition hover:shadow-xl dark:bg-[#020617] dark:border-white/10"
          >
            <div className="text-3xl">{c.cover_emoji || "📘"}</div>
            <h3 className="mt-3 font-semibold text-blue-900 dark:text-white">{c.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{c.summary}</p>

            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className={`h-full ${c.completed ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${c.percent}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {c.completed ? `Completed · ${c.badge}` : c.percent > 0 ? `${c.percent}% done` : `${c.modules} modules · ${c.level}`}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
