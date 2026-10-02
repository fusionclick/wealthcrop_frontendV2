/**
 * Audit #43 — Profile → Documents reads the `documents` rows investor-data already returns.
 *
 * Every upload is a new row (KycController never overwrites — the older rows are the audit
 * trail), so "the document on file" is the newest row per type and side. Pure, so it is
 * unit-tested directly (test/kycDocuments.test.mjs).
 */

export const DOC_LABELS = {
  pan: "PAN",
  aadhaar: "Aadhaar",
  voter_id: "Voter ID",
  passport: "Passport",
  driving_licence: "Driving licence",
  selfie: "Selfie video",
  signature: "Signature",
};

/** The newest row per type + side. */
export const currentDocuments = (docs = []) => {
  const byKey = new Map();
  for (const d of [...(docs || [])].sort((a, b) => a.id - b.id)) {
    if (d.type === "aadhaar") {
      // A single-file Aadhaar (from before both sides were required) stands for the whole
      // card, and a later front/back pair replaces it — so whichever came last wins outright.
      for (const key of [...byKey.keys()]) {
        if (key.startsWith("aadhaar|") && (!d.side || key === "aadhaar|")) byKey.delete(key);
      }
    }
    byKey.set(`${d.type}|${d.side || ""}`, d);
  }
  return [...byKey.values()];
};

const isTrue = (v) => v === true || Number(v) === 1;

/** One display row per document — an Aadhaar's two sides are one document. */
export const documentRows = (docs = []) => {
  const rows = new Map();
  for (const d of currentDocuments(docs)) {
    const key = d.type === "aadhaar" ? "aadhaar" : `${d.type}|${d.side || ""}`;
    const row = rows.get(key) || { key, type: d.type, side: d.side || null, sides: [], docs: [] };
    row.docs.push(d);
    if (d.side) row.sides.push(d.side);
    rows.set(key, row);
  }
  return [...rows.values()].map((row) => ({
    ...row,
    verified: row.docs.some((d) => isTrue(d.is_verified)),
    uploadedAt: row.docs.map((d) => d.created_at).sort().pop() || null,
    number: row.docs.find((d) => d.document_number)?.document_number || null,
  }));
};
