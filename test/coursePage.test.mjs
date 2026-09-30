// QA 12.2 / 12.4 / 12.7 — "Mark as read ne progress bar update nahi kia", "Check answer batata
// nahi ke sahi hai ya ghalat", "no way to retake" — but "/learning-centre par module complete
// dikh raha". That last part is the diagnosis: the server recorded everything, the screen never
// moved. postApiWithToken returns the BODY; a `bodyOf(res) => res.data` step reached one level
// past it into the progress payload, which has no `.status`, so the `if` never opened.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/pages/CoursePage.jsx", "utf8");

test("the POST handlers treat the result as the body, not as a response", () => {
  // No re-unwrapping step.
  assert.doesNotMatch(src, /const bodyOf/, "bodyOf reached one level past the body");
  assert.doesNotMatch(src, /bodyOf\(res\)/);

  // Both handlers branch on the body's own status and read its own fields.
  for (const fn of ["markRead", "submitQuiz"]) {
    const body = src.slice(src.indexOf(`const ${fn} =`), src.indexOf(`const ${fn} =`) + 700);
    assert.match(body, /if \(res\?\.status\)/, `${fn} does not branch on res.status`);
    assert.match(body, /setProgress\(res\.data\)/, `${fn} does not apply the new progress`);
  }

  // The quiz result is the whole body: score/total/feedback sit beside `data`.
  assert.match(src, /setResult\(res\)/);
});

test("the GET loader is left alone — get and post helpers are opposite", () => {
  // getApiWithToken really does return the axios response, so this one is correctly deeper.
  assert.match(src, /getApiWithToken\(api\(`\/learning\/courses\/\$\{slug\}`\)\)/);
  assert.match(src, /res\?\.data\?\.status/);
  assert.match(src, /setCourse\(res\.data\.data\)/);
  assert.match(src, /setProgress\(res\.data\.progress\)/);
});

test("retaking a quiz clears the previous picks", () => {
  assert.match(src, /setResult\(null\); setAnswers\(\{\}\);/);
  assert.match(src, /Retake quiz/);
});

test("a video module is rendered, not just tolerated", () => {
  assert.match(src, /module\?\.type === "video"/);
  assert.match(src, /youtube-nocookie\.com\/embed\/\$\{module\.video_id\}/);
});

test("the Share control is a button, not a decorative span", () => {
  // QA 12.6 — "copy link working, share link not": Share was a <span> beside Copy that looked
  // identical and did nothing when clicked.
  const share = readFileSync("src/components/ShareButtons.jsx", "utf8");
  assert.match(share, /onClick=\{share\}/);
  assert.match(share, /navigator\.share/);
  // And it still does something where the browser has no share sheet.
  assert.match(share, /if \(!navigator\.share\) return copy\(\)/);
  assert.doesNotMatch(share, /<span[^>]*>\s*<Share2/);
});
