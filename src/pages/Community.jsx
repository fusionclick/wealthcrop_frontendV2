import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Search, HelpCircle } from "lucide-react";
import { getApiWithToken, postApiWithToken } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";

/**
 * SRS §10 — the discussion forum and the Q&A platform, on one list.
 *
 * A question and a discussion differ by what they want back, not by where they live, so
 * the tabs filter one feed rather than opening two sections that would each need their own
 * search, their own empty state and their own moderation story.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

const when = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const BLANK = { kind: "question", title: "", body: "", tags: "" };

export default function Community() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab === "questions") params.set("kind", "question");
    if (tab === "discussions") params.set("kind", "discussion");
    if (tab === "unanswered") params.set("unanswered", "1");
    if (tab === "mine") params.set("mine", "1");
    if (q.trim()) params.set("q", q.trim());

    const res = await getApiWithToken(api(`/community?${params}`));
    setTopics(res?.data?.data ?? []);
    setLoading(false);
  }, [tab, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0); // debounce the search box only
    return () => clearTimeout(t);
  }, [load, q]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 8) return toastError("Give it a title of at least 8 characters.");
    if (form.body.trim().length < 10) return toastError("Say a little more — at least 10 characters.");

    setBusy(true);
    const res = await postApiWithToken(api("/community"), {
      kind: form.kind,
      title: form.title.trim(),
      body: form.body.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5),
    });
    setBusy(false);

    if (res?.status) {
      setForm(BLANK);
      setShowForm(false);
      toastSuccess("Posted");
      navigate(`/community/${res.data.id}`);
    }
  };

  const field =
    "w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";

  return (
    <div className="min-h-screen px-4 py-6 bg-white dark:bg-[#020617]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-blue-900 dark:text-white">Community</h1>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              Ask an expert, or talk to other investors. Answers from WealthCrop carry an Expert mark.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-md shrink-0"
          >
            <Plus size={14} /> Post
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-4 mb-5 space-y-3">
            <div className="flex gap-2">
              {[
                ["question", "Ask a question"],
                ["discussion", "Start a discussion"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, kind: value })}
                  className={`text-xs px-3 py-1.5 rounded-md ${
                    form.kind === value ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              className={field}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.kind === "question" ? "Is ELSS better than PPF for tax saving?" : "What are you all doing with the current market?"}
              aria-label="Title"
            />
            <textarea
              className={field}
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Give enough detail for someone to answer properly."
              aria-label="Body"
            />
            <input
              className={field}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags, comma separated — elss, tax, sip"
              aria-label="Tags"
            />

            <button type="submit" disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50">
              {busy ? "Posting…" : "Post"}
            </button>
          </form>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[
            ["all", "All"],
            ["questions", "Questions"],
            ["discussions", "Discussions"],
            ["unanswered", "Unanswered"],
            ["mine", "Mine"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-[#94a3b8]"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search answered questions"
              aria-label="Search the community"
              className="pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-md bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : topics.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-[#94a3b8]">
                <MessageSquare size={26} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {q ? "Nothing matches that" : "Nothing here yet"}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8] max-w-sm">
                {q ? "Try different words, or ask it as a new question." : "Be the first to ask — an expert answers questions from the admin desk."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {topics.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => navigate(`/community/${t.id}`)}
                  className="w-full text-left rounded-xl border border-slate-200 dark:border-[var(--border-color)] p-3 hover:border-blue-300 transition"
                >
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 ${t.kind === "question" ? "text-blue-500" : "text-slate-400"}`}>
                      {t.kind === "question" ? <HelpCircle size={16} /> : <MessageSquare size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-2 mt-0.5">{t.body}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {t.author} · {when(t.last_activity_at)} · {t.reply_count} repl{t.reply_count === 1 ? "y" : "ies"}
                        {t.views ? ` · ${t.views} views` : ""}
                      </p>
                    </div>
                    {t.is_answered && (
                      <span className="text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1 rounded-md shrink-0">
                        Answered
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
