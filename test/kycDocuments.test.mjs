// Audit #43 — an Aadhaar needs both sides, and documents can be viewed and re-uploaded from
// Profile after onboarding.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { currentDocuments, documentRows } from "../src/pages/profile/kycDocuments.js";

const read = (p) => readFileSync(p, "utf8");

test("the newest upload per type and side is the document on file", () => {
  const docs = [
    { id: 1, type: "pan", side: null, created_at: "2026-09-01" },
    { id: 4, type: "pan", side: null, created_at: "2026-09-04" },
    { id: 2, type: "voter_id", side: "front", created_at: "2026-09-02" },
    { id: 3, type: "voter_id", side: "back", created_at: "2026-09-02" },
  ];
  assert.deepEqual(currentDocuments(docs).map((d) => d.id).sort(), [2, 3, 4]);
});

test("an Aadhaar pair replaces a single-file Aadhaar, and is shown as one document", () => {
  const legacy = { id: 1, type: "aadhaar", side: null, created_at: "2026-08-31" };
  const pair = [
    { id: 7, type: "aadhaar", side: "front", created_at: "2026-10-02", is_verified: 0 },
    { id: 8, type: "aadhaar", side: "back", created_at: "2026-10-02", is_verified: 1 },
  ];

  const rows = documentRows([legacy, ...pair]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].sides, ["front", "back"]);
  // Either side verified locks the card.
  assert.equal(rows[0].verified, true);

  // And a lone legacy file still shows, as the whole card.
  assert.deepEqual(documentRows([legacy])[0].sides, []);
});

test("the KYC wizard uploads an Aadhaar as a front-and-back pair", () => {
  const kyc = read("src/components/kyc/KYC.jsx");
  // Main slot: one picker per side, sent together.
  assert.match(kyc, /uploadDocument\("aadhaar", front, \{ back \}\)/);
  // Aadhaar chosen as the secondary ID: same pair rule.
  assert.match(kyc, /type === "aadhaar" \? \(\s*<AadhaarSides onUpload=\{sendPair\} \/>/);
  // The single-file Aadhaar input is gone.
  assert.doesNotMatch(kyc, /await uploadDocument\("aadhaar", file\)/);

  const helper = read("src/components/kyc/uploadKycDocument.js");
  assert.match(helper, /formData\.append\("file_back", back\)/);
  // The server's reason ("both sides", "locked") reaches the screen.
  assert.match(helper, /throw new Error\(data\?\.message \|\| "Upload failed"\)/);
});

test("AadhaarSides waits for both sides before uploading", () => {
  const src = read("src/components/kyc/AadhaarSides.jsx");
  assert.match(src, /if \(!next\.front \|\| !next\.back\) return;/);
  assert.match(src, /await onUpload\(next\.front, next\.back\)/);
});

test("Profile shows the documents section on both layouts", () => {
  const src = read("src/pages/profile/BasicDetails.jsx");
  const marker = src.indexOf("{/* Less than lg view */}");
  assert.match(src.slice(0, marker), /<ProfileDocuments userData=\{userData\} refetch=\{refetch\} \/>/);
  assert.match(src.slice(marker), /<ProfileDocuments userData=\{userData\} refetch=\{refetch\} \/>/);

  const section = read("src/pages/profile/ProfileDocuments.jsx");
  // A verified document, or one under a verified KYC, offers no Replace — the server refuses it too.
  assert.match(section, /const locked = row\.verified \|\| kycDone/);
});
