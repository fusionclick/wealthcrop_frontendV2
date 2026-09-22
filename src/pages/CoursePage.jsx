import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { getApiWithToken, postApiWithToken } from "../api/api";
import ShareButtons from "../components/ShareButtons";
import { toastSuccess } from "../utils/notifyCustom";

/**
 * SRS §11 — one course: text, video and quiz modules, with instant feedback and progress.
 *
 * The quiz is graded by the server; this page never sees the answer key until it submits
 * an attempt, which is what stops the answers being readable from the network tab.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

export default function CoursePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({ completed_modules: [], percent: 0 });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await getApiWithToken(api(`/learning/courses/${slug}`));
    if (res?.data?.status) {
      setCourse(res.data.data);
      setProgress(res.data.progress);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setAnswers({});
    setResult(null);
  }, [index]);

  if (!course) {
    return (
      <div className="min-h-screen px-4 py-10 bg-white dark:bg-[#020617]">
        <p className="max-w-3xl mx-auto text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const modules = course.modules || [];
  const module = modules[index];
  const done = (progress.completed_modules || []).includes(index);
  const finished = Boolean(progress.completed_at);

  const markRead = async () => {
    setBusy(true);
    const res = await postApiWithToken(api(`/learning/courses/${slug}/complete`), { module: index });
    setBusy(false);
    if (res?.status) {
      setProgress(res.data);
      if (res.data.badge) toastSuccess(`Badge earned: ${res.data.badge}`);
      if (index < modules.length - 1) setIndex(index + 1);
    }
  };

  const submitQuiz = async () => {
    setBusy(true);
    const res = await postApiWithToken(api(`/learning/courses/${slug}/quiz`), {
      module: index,
      answers: (module.questions || []).map((_, i) => (answers[i] ?? -1)),
    });
    setBusy(false);
    if (res?.status) {
      setResult(res);
      setProgress(res.data);
      if (res.data.badge) toastSuccess(`Badge earned: ${res.data.badge}`);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-white dark:bg-[#020617]">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/learning-centre")} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-4">
          <ChevronLeft size={14} /> Learning Centre
        </button>

        <h1 className="text-2xl font-bold text-blue-900 dark:text-white">
          {course.cover_emoji} {course.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">{course.summary}</p>

        <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div className={`h-full ${finished ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${progress.percent || 0}%` }} />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {progress.percent || 0}% complete · module {index + 1} of {modules.length}
        </p>

        {finished && course.badge && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <Award size={16} /> {course.badge}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-1">Earned for completing {course.title}.</p>
            {/* SRS §10.2 — share an achievement. */}
            <ShareButtons
              className="mt-2"
              text={`I just earned the ${course.badge} badge on WealthCrop by completing "${course.title}".`}
            />
          </div>
        )}

        <div className="mt-6 flex gap-1 flex-wrap">
          {modules.map((m, i) => (
            <button
              key={m.title + i}
              onClick={() => setIndex(i)}
              title={m.title}
              className={`h-7 min-w-7 px-2 text-[11px] font-semibold rounded-md ${
                i === index
                  ? "bg-blue-600 text-white"
                  : (progress.completed_modules || []).includes(i)
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15"
                  : "bg-slate-100 text-slate-500 dark:bg-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-5">
          <h2 className="font-semibold text-slate-900 dark:text-white">{module?.title}</h2>

          {module?.type === "text" && (
            <div className="mt-3 text-sm text-slate-700 dark:text-[#cbd5e1] whitespace-pre-wrap leading-relaxed">{module.body}</div>
          )}

          {module?.type === "video" && (
            <div className="mt-3">
              {module.video_id ? (
                // SRS §10.2 — YouTube, played inside the app.
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube-nocookie.com/embed/${module.video_id}`}
                    title={module.title}
                    allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">{module.body || "A video for this lesson has not been added yet."}</p>
              )}
            </div>
          )}

          {module?.type === "quiz" && (
            <div className="mt-3 space-y-4">
              {(module.questions || []).map((q, qi) => {
                const fb = result?.feedback?.[qi];
                return (
                  <div key={q.q}>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {qi + 1}. {q.q}
                    </p>
                    <div className="mt-2 space-y-1">
                      {(q.options || []).map((opt, oi) => {
                        const chosen = answers[qi] === oi;
                        const isRight = fb && oi === fb.correct_index;
                        const isWrongPick = fb && chosen && !fb.is_correct;

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={Boolean(result)}
                            onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition ${
                              isRight
                                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                                : isWrongPick
                                ? "border-rose-400 bg-rose-50 dark:bg-rose-500/10"
                                : chosen
                                ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                                : "border-slate-200 dark:border-[var(--border-color)]"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {fb?.explain && (
                      <p className={`text-xs mt-1 ${fb.is_correct ? "text-emerald-600" : "text-rose-600"}`}>{fb.explain}</p>
                    )}
                  </div>
                );
              })}

              {result ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {result.score} / {result.total} correct
                  </p>
                  <button onClick={() => setResult(null)} className="text-xs font-semibold text-blue-600 hover:underline">
                    Try again
                  </button>
                </div>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={busy || Object.keys(answers).length !== (module.questions || []).length}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {busy ? "Checking…" : "Check answers"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-2 rounded-md disabled:opacity-40"
          >
            <ChevronLeft size={13} className="inline" /> Previous
          </button>

          {module?.type !== "quiz" &&
            (done ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={14} /> Done
              </span>
            ) : (
              <button
                onClick={markRead}
                disabled={busy}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md disabled:opacity-50"
              >
                Mark as read
              </button>
            ))}

          <button
            onClick={() => setIndex(Math.min(modules.length - 1, index + 1))}
            disabled={index >= modules.length - 1}
            className="ml-auto text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8] px-3 py-2 rounded-md disabled:opacity-40"
          >
            Next <ChevronRight size={13} className="inline" />
          </button>
        </div>
      </div>
    </div>
  );
}
