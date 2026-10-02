import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Check, ChevronLeft, Flag, Reply, Trash2 } from "lucide-react";
import { deleteApiWithToken, getApiWithToken, postApiWithToken } from "../api/api";
import ShareButtons from "../components/ShareButtons";
import { toastError, toastSuccess } from "../utils/notifyCustom";
import { youtubeIdFromText } from "../utils/youtube";

/** SRS §10 — one thread: the question, its replies, and the answer that settled it. */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

const REASONS = [
  ["spam", "Spam or an advert"],
  ["abuse", "Abusive or personal"],
  ["misinformation", "Misleading advice"],
  ["other", "Something else"],
];

/**
 * QA 11.10 — a post is text, and a YouTube link inside it plays here instead of sending the
 * reader to youtube.com.
 *
 * The body stays a text node: it is never HTML, and the id comes back from the parser as
 * eleven safe characters or null, so nothing an investor typed can reach the iframe src.
 */
function Body({ text, className }) {
  const videoId = youtubeIdFromText(text);

  return (
    <>
      <p className={className}>{text}</p>

      {videoId && (
        <div className="aspect-video w-full mt-3">
          <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title="Shared video"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </>
  );
}

function ReplyForm({ body, setBody, onSubmit, busy, label, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="mt-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={label}
        aria-label={label}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
      />
      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50">
          {busy ? "Posting…" : "Reply"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * QA 11.3 — one reply and the replies to it.
 *
 * The indentation comes from the nesting, not from a margin that grows with depth: the API
 * caps depth at 2 (CommunityReply::MAX_DEPTH), so the third level is as far right as this can
 * ever go. Answering a reply that is already at the cap is still allowed — the server makes it
 * a sibling rather than refusing the reply.
 */
function ReplyNode({ node, canAccept, onAccept, replyTo, setReplyTo, body, setBody, onReply, busy }) {
  return (
    <li>
      <div
        className={`rounded-xl border p-3 ${
          node.is_accepted
            ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5"
            : "border-slate-200 dark:border-[var(--border-color)]"
        }`}
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-700 dark:text-[#cbd5e1]">{node.author}</p>
          {node.is_expert && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-2 py-0.5 rounded-md">
              <BadgeCheck size={11} /> Support team
            </span>
          )}
          {node.is_accepted && <span className="text-[10px] font-semibold uppercase text-emerald-700">Answer</span>}

          {canAccept && !node.is_accepted && (
            <button onClick={() => onAccept(node.id)} className="ml-auto text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1">
              <Check size={12} /> Mark as answer
            </button>
          )}
        </div>

        <Body text={node.body} className="text-sm text-slate-700 dark:text-[#cbd5e1] whitespace-pre-wrap mt-1" />

        <button
          onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}
          className="mt-2 text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
        >
          <Reply size={12} /> Reply
        </button>

        {replyTo === node.id && (
          <ReplyForm
            body={body}
            setBody={setBody}
            onSubmit={(e) => onReply(e, node.id)}
            busy={busy}
            label={`Reply to ${node.author}`}
            onCancel={() => setReplyTo(null)}
          />
        )}
      </div>

      {node.children.length > 0 && (
        <ul className="mt-2 ml-2 space-y-2 pl-3 sm:pl-4 border-l border-slate-200 dark:border-[var(--border-color)]">
          {node.children.map((child) => (
            <ReplyNode
              key={child.id}
              node={child}
              canAccept={canAccept}
              onAccept={onAccept}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              body={body}
              setBody={setBody}
              onReply={onReply}
              busy={busy}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * The flat rows from the API, nested by parent_id.
 *
 * Two passes, because the server sorts the accepted answer to the front and a child can
 * therefore arrive before its parent. A parent_id pointing at nothing readable — a hidden
 * reply, say — leaves the reply at the top level rather than dropping it from the thread.
 */
const nest = (rows) => {
  const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : null;
    (parent ? parent.children : roots).push(node);
  }

  return roots;
};

export default function CommunityTopic() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(REASONS[0][0]);
  const [detail, setDetail] = useState("");

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

  const reply = async (e, parentId = null) => {
    e.preventDefault();
    if (body.trim().length < 2) return toastError("Write something first.");

    setBusy(true);
    const res = await postApiWithToken(api(`/community/${id}/replies`), { body: body.trim(), parent_id: parentId });
    setBusy(false);

    if (res?.status) {
      setReplies((prev) => [...prev, res.data]);
      setBody("");
      setReplyTo(null);
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

  /** QA 11.5 — the reason goes to the moderators and nowhere else. */
  const report = async (e) => {
    e.preventDefault();

    const res = await postApiWithToken(api(`/community/${id}/report`), { reason, detail: detail.trim() || null });

    if (res?.status) {
      setReporting(false);
      setDetail("");
      toastSuccess(res.data?.message || "Reported.");
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
            <div className="flex items-center gap-2 shrink-0">
              {!topic.is_mine && (
                <button
                  onClick={() => setReporting((s) => !s)}
                  aria-label="Report this post"
                  title="Report this post"
                  className={`hover:text-rose-600 ${reporting ? "text-rose-600" : "text-slate-400"}`}
                >
                  <Flag size={15} />
                </button>
              )}
              {topic.is_mine && (
                <button onClick={remove} aria-label="Delete post" className="text-slate-400 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          <Body text={topic.body} className="text-sm text-slate-700 dark:text-[#cbd5e1] whitespace-pre-wrap mt-2" />

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

        {reporting && (
          <form onSubmit={report} className="rounded-xl border border-rose-200 dark:border-rose-500/30 p-4 mt-3 space-y-3">
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              A moderator reads this. The person who posted is never told who reported it.
            </p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReason(value)}
                  className={`text-xs px-3 py-1.5 rounded-md ${
                    reason === value ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Anything else the moderator should know (optional)"
              aria-label="Report detail"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
            />
            <div className="flex items-center gap-3">
              <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-md">
                Report
              </button>
              <button type="button" onClick={() => setReporting(false)} className="text-xs text-slate-500 hover:underline">
                Cancel
              </button>
            </div>
          </form>
        )}

        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
          {replies.length} repl{replies.length === 1 ? "y" : "ies"}
        </h2>

        <ul className="space-y-2">
          {nest(replies).map((node) => (
            <ReplyNode
              key={node.id}
              node={node}
              canAccept={topic.is_mine}
              onAccept={accept}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              body={body}
              setBody={setBody}
              onReply={reply}
              busy={busy}
            />
          ))}
        </ul>

        {/* The thread-level composer. Answering one reply uses the form inside it instead. */}
        {replyTo === null && <ReplyForm body={body} setBody={setBody} onSubmit={reply} busy={busy} label="Add a reply" />}
      </div>
    </div>
  );
}
