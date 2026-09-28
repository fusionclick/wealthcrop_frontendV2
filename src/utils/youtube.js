/**
 * QA 11.10 — a YouTube link has to play where it was posted.
 *
 * The player at CoursePage.jsx:148 takes a bare **video id** and interpolates it into
 * `/embed/${id}`, and nothing has ever normalised the other thing people actually have in
 * their clipboard: a full watch URL. Paste one and the src becomes
 * `.../embed/https://youtube.com/watch?v=abc`, which loads a YouTube error page inside the
 * frame. So this is a URL → id parser, not a link detector.
 *
 * It returns an id or null, and never a URL. That is the security property the community
 * embed depends on: the iframe src is built from eleven characters of [A-Za-z0-9_-] that this
 * function vouched for, so no part of a body an investor typed can reach the `src` attribute —
 * not a `javascript:` scheme, not a lookalike host, not a second URL smuggled in a query
 * string. The body itself stays text; nothing is ever rendered as HTML.
 */

// Every id YouTube has ever issued is 11 of these. Anything else is not an id, whatever the
// URL claimed.
const ID = /^[A-Za-z0-9_-]{11}$/;

// Only hosts YouTube actually serves video from. A path that looks right on
// youtube.attacker.com is still not a YouTube video.
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

// /embed/ID, /shorts/ID, /live/ID and the old /v/ID all carry the id as the second segment.
const PATH_FORMS = new Set(["embed", "shorts", "live", "v"]);

/** The video id in `input`, or null if `input` is not a YouTube video URL. */
export function youtubeId(input) {
  let url;
  try {
    url = new URL(String(input ?? "").trim());
  } catch {
    return null; // not a URL at all
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;

  // "/watch/extra" is not "/watch", and an empty segment from a trailing slash is dropped.
  const parts = url.pathname.split("/").filter(Boolean);

  const id = url.hostname.toLowerCase().endsWith("youtu.be")
    ? parts[0] // youtu.be/ID — the whole path is the id
    : parts[0] === "watch" && parts.length === 1
    ? url.searchParams.get("v") // ?v=ID, with ?t= / ?list= / ?si= alongside it
    : parts.length === 2 && PATH_FORMS.has(parts[0])
    ? parts[1]
    : null;

  return ID.test(id ?? "") ? id : null;
}

/**
 * The first YouTube video id in a block of text, or null.
 *
 * A community post is prose with a link in it, so the link has to be found before it can be
 * parsed. The punctuation people wrap a URL in is trimmed off both ends: "(<url>)" and
 * "watch this: <url>." are both how it actually gets typed.
 */
export function youtubeIdFromText(text) {
  for (const word of String(text ?? "").split(/\s+/)) {
    const id = youtubeId(word.replace(/^[([{<'"]+/, "").replace(/[.,;:!?)\]}>'"]+$/, ""));
    if (id) return id;
  }

  return null;
}
