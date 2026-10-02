// Audit #76 — infographic (image) and interactive chart modules, and "Recommended next".
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { learningImageSrc } from "../src/components/learning/learningMedia.js";

const read = (p) => readFileSync(p, "utf8");

test("an image module's picture is an upload, an https URL or a path on this site — nothing else", () => {
  const name = `${"a".repeat(40)}.png`;
  assert.equal(learningImageSrc({ image_file: name }, "/api/internal"), `/api/internal/learning/media/${name}`);
  assert.equal(learningImageSrc({ image_url: "https://cdn.example.com/x.png" }, ""), "https://cdn.example.com/x.png");
  assert.equal(learningImageSrc({ image_url: "/learning/sip-money-flow.svg" }, ""), "/learning/sip-money-flow.svg");

  for (const bad of ["http://example.com/x.png", "//evil.example/x.png", "javascript:alert(1)", "data:image/png;base64,AA", ""]) {
    assert.equal(learningImageSrc({ image_url: bad }, ""), null, bad);
  }
});

test("the course page renders image and chart modules", () => {
  const src = read("src/pages/CoursePage.jsx");
  assert.match(src, /module\?\.type === "image"/);
  assert.match(src, /alt=\{module\.alt \|\| ""\}/);
  assert.match(src, /module\?\.type === "chart" && <ChartModule key=\{`\$\{slug\}-\$\{index\}`\} module=\{module\} \/>/);

  const chart = read("src/components/learning/ChartModule.jsx");
  // Same maths as the home chart and the goal planner, driven by the module's own sliders.
  assert.match(chart, /import \{ sipSeries \} from "\.\.\/\.\.\/utils\/calculators"/);
  assert.match(chart, /type="range"/);
  assert.match(chart, /min=\{sliders\[k\]\?\.min\}/);
});

test("a finished course and the Learning Centre both recommend the next course", () => {
  const page = read("src/pages/CoursePage.jsx");
  assert.match(page, /setNext\(res\.data\.next \?\? null\)/);
  assert.match(page, /\{finished && <RecommendedCourse course=\{next\}/);
  // Moving to that course resets the module index and quiz picks.
  assert.match(page, /setIndex\(0\);\s*setAnswers\(\{\}\);\s*setResult\(null\);\s*\}, \[slug\]\);/);

  const rail = read("src/components/learning/CourseRail.jsx");
  assert.match(rail, /setRecommended\(res\?\.data\?\.recommended \?\? null\)/);
  assert.match(rail, /<RecommendedCourse course=\{recommended\}/);
});

test("the FAQ no longer says video lessons are 'not yet' available", () => {
  const src = read("src/pages/LearningCenterPage.jsx");
  assert.doesNotMatch(src, /Not yet — the guides below are written lessons/);
  assert.match(src, /Are video lessons available\?/);
});

test("the seeded infographic ships with the app", () => {
  // CourseSeeder's image module points at /learning/sip-money-flow.svg.
  assert.ok(existsSync("public/learning/sip-money-flow.svg"));
  assert.match(read("public/learning/sip-money-flow.svg"), /<title id="t">Where a SIP instalment goes<\/title>/);
});
