import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Check, ChevronLeft, Trash2 } from "lucide-react";
import { deleteApiWithToken, getApiWithToken, postApiWithToken } from "../api/api";
import ShareButtons from "../components/ShareButtons";
import { toastError, toastSuccess } from "../utils/notifyCustom";

/** SRS §10 — one thread: the question, its replies, and the answer that settled it. */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

export default function CommunityTopic() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await getApiWithToken(api(`/community/${id}`));
    if (res?.data?.status) {
      setTopic(res.data.data);
      setReplies(res.data.replies || []);
    } else {
      navigate("/community");
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const reply = async (e) => {
    e.preventDefault();
    if (body.trim().length < 2) return toastError("Write something first.");

    setBusy(true);
    const res = await postApiWithToken(api(`/community/${id}/replies`), { body: body.trim() });
    setBusy(false);

    if (res?.status) {
      setReplies((prev) => [...prev, res.data]);
      setBody("");
    }
  };

  const accept = async (replyId) => {
    const res = await postApiWithToken(api(`/community/${id}/replies/${replyId}/accept`), {});
    if (res?.status) {
      setReplies((prev) => prev.map((r) => ({ ...r, is_accepted: r.id === replyId })));
      setTopic((t) => ({ ...t, is_answered: true }));
      toastSuccess("Marked as the answer");
    }
  };

  const remove = async () => {
    await deleteApiWithToken(api(`/community/${id}`));
    navigate("/community");
  };

  if (!topic) {
    return (
      <div className="min-h-screen px-4 py-10 bg-white dark:bg-[#020617]">
        <p className="max-w-3xl mx-auto text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617]">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/community")} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-4">
          <ChevronLeft size={14} /> Community
        </button>

        <div className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{topic.title}</h1>
            {topic.is_mine && (
              <button onClick={remove} aria-label="Delete post" className="text-slate-400 hover:text-rose-600 shrink-0">
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <p className="text-sm text-slate-700 dark:text-[#cbd5e1] whitespace-pre-wrap mt-2">{topic.body}</p>

          <div className="flex flex-wrap gap-1 mt-3">
            {(topic.tags || []).map((t) => (
              <span key={t} className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 px-2 py-0.5 rounded-md">
                #{t}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            {topic.author} · {new Date(topic.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>

          <ShareButtons className="mt-3" text={topic.title} />
        </div>

        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
          {replies.length} repl{replies.length === 1 ? "y" : "ies"}
        </h2>

        <ul className="space-y-2">
          {replies.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border p-3 ${
                r.is_accepted
                  ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5"
                  : "border-slate-200 dark:border-[var(--border-color)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-[#cbd5e1]">{r.author}</p>
                {r.is_expert && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-2 py-0.5 rounded-md">
                    <BadgeCheck size={11} /> Expert
                  </span>
                )}
                {r.is_accepted && <span className="text-[10px] font-semibold uppercase text-emerald-700">Answer</span>}

                {topic.is_mine && !r.is_accepted && (
                  <button onClick={() => accept(r.id)} className="ml-auto text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                    <Check size={12} /> Mark as answer
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-700 dark:text-[#cbd5e1] whitespace-pre-wrap mt-1">{r.body}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={reply} className="mt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Add a reply"
            aria-label="Your reply"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
          />
          <button type="submit" disabled={busy} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50">
            {busy ? "Posting…" : "Reply"}
          </button>
        </form>
      </div>
    </div>
  );
}
