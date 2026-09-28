import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { youtubeId, youtubeIdFromText } from "../src/utils/youtube.js";

const read = (p) => readFileSync(p, "utf8");

const ID = "dQw4w9WgXcQ";

// QA 11.10 — the player has always taken a bare video id, and nothing normalised a pasted
// watch URL, so `/embed/https://youtube.com/watch?v=…` is what actually shipped.
test("every shape of YouTube link people paste resolves to the same id", () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${ID}`,
    `http://youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}/`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube.com/v/${ID}`,
  ]) {
    assert.equal(youtubeId(url), ID, url);
  }
});

test("the extra query parameters a share link carries do not become part of the id", () => {
  assert.equal(youtubeId(`https://www.youtube.com/watch?v=${ID}&list=PLabc&index=2&t=41s`), ID);
  assert.equal(youtubeId(`https://www.youtube.com/watch?app=desktop&v=${ID}`), ID);
  assert.equal(youtubeId(`https://youtu.be/${ID}?t=41&si=xyz`), ID);
  assert.equal(youtubeId(`https://www.youtube.com/shorts/${ID}?feature=share`), ID);
  assert.equal(youtubeId(`  https://www.youtube.com/watch?v=${ID}  `), ID, "surrounding whitespace");
});

test("anything that is not a YouTube video URL is null, never a guess", () => {
  for (const bad of [
    "",
    "   ",
    null,
    undefined,
    "not a url at all",
    ID, // a bare id is not a link — the parser's job is URLs
    "https://vimeo.com/123456789",
    `https://youtube.com.attacker.example/watch?v=${ID}`, // lookalike host
    `https://notyoutube.com/watch?v=${ID}`,
    "https://www.youtube.com/watch?v=short", // not 11 characters
    "https://www.youtube.com/watch?v=abcdefghijk!", // not an id alphabet
    "https://www.youtube.com/watch", // no v at all
    `https://www.youtube.com/watch/${ID}`, // /watch is not a path form
    "https://www.youtube.com/results?search_query=sip",
    "https://www.youtube.com/@wealthcrop",
    `https://www.youtube.com/embed/${ID}/extra`,
    `javascript:alert(1)//youtube.com/watch?v=${ID}`,
    `ftp://youtube.com/watch?v=${ID}`,
  ]) {
    assert.equal(youtubeId(bad), null, JSON.stringify(bad));
  }
});

// A community post is prose with a link in it, not a bare URL in a field of its own.
test("the link is found inside a post, and punctuation around it is not part of the id", () => {
  assert.equal(youtubeIdFromText(`Watch this: https://youtu.be/${ID} — it explains SIPs.`), ID);
  assert.equal(youtubeIdFromText(`See https://www.youtube.com/watch?v=${ID}.`), ID);
  assert.equal(youtubeIdFromText(`(https://youtu.be/${ID})`), ID);
  assert.equal(youtubeIdFromText(`line one\nhttps://youtu.be/${ID}\nline three`), ID);
  assert.equal(youtubeIdFromText("No link here, just a question about ELSS funds."), null);
  assert.equal(youtubeIdFromText("Read https://wealthcrop.co/blog/1 instead"), null);
  assert.equal(youtubeIdFromText(null), null);
});

// QA 11.10 security — the body is never HTML, and the src is built from the parsed id only.
test("the community embed builds its src from the parsed id and renders no user HTML", () => {
  const page = read("src/pages/CommunityTopic.jsx");

  assert.match(page, /import \{ youtubeIdFromText \} from "\.\.\/utils\/youtube"/);
  assert.match(page, /const videoId = youtubeIdFromText\(text\)/);
  assert.match(page, /src=\{`https:\/\/www\.youtube-nocookie\.com\/embed\/\$\{videoId\}`\}/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  // The text itself stays a text node next to the player.
  assert.match(page, /<p className=\{className\}>\{text\}<\/p>/);
});

// QA 11.3 — flat rows plus parent_id, nested in the browser; the per-reply affordance is what
// makes a nested reply possible to write in the first place.
test("the thread nests its replies and every reply can be replied to", () => {
  const page = read("src/pages/CommunityTopic.jsx");

  assert.match(page, /const nest = \(rows\) =>/);
  assert.match(page, /\(parent \? parent\.children : roots\)\.push\(node\)/);
  assert.match(page, /\{ body: body\.trim\(\), parent_id: parentId \}/);
  assert.match(page, /<ReplyNode/);
  assert.match(page, /setReplyTo\(replyTo === node\.id \? null : node\.id\)/);
});

// ponytail: nest() is asserted as source above, not called, because it lives in a .jsx file
// node --test cannot import. The ordering it has to survive (a child before its parent, a
// parent hidden by a moderator) is covered by the Pest test on the payload it consumes.
