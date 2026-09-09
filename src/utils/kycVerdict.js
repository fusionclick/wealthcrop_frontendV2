// BSE KYC verdict, as relayed by Laravel (kyc/ucc_add or kyc/bse-status).
// Pure functions on purpose: KYC.jsx only renders what these return, so the branching
// is unit-tested directly (test/kycVerdict.test.mjs) instead of by grepping the JSX.

// ponytail: "verified" ka matlab ek hi jagah — user_kycs string se "verified" aata hai,
// par admin panel/DB purane rows par "approved"/"complete" bhi rakhta hai aur
// validateInvestorReady teenon ko manta hai. Do jagah do definitions rakhne se hi
// wo bug aata tha jahan approved user ko page "awaiting verification" dikhata raha.
const VERIFIED = ["verified", "approved", "complete"];

export const isKycVerified = (status) => VERIFIED.includes(String(status || "").toLowerCase());

// add_ucc BSE ka faisla apne jawab mein hi wapas deta hai (demo par seedha "APPROVED"), is
// liye page usay foran dikha sakta hai — get_ucc wale round trip ka intezar zaroori nahi.
// Ye table Backend/src/mf/kyc.js ke UCC_TO_KYC ka mirror hai; dono ko saath badalna.
const UCC_TO_KYC = {
  APPROVED: "verified",
  // Observed live: an investor already placing orders reports ACTIVE, not APPROVED. It was
  // missing from both this table and the server's, so the page told a fully active
  // investor their KYC was still awaiting verification.
  ACTIVE: "verified",
  PENDING_VERIFICATION: "pending",
  PENDING: "pending",
  REJECTED: "rejected",
  DEACTIVATED: "rejected",
  INACTIVE: "rejected",
};

/** add_ucc ke ucc_status se foran verdict. Anjaan status par null — phir server ka sync bolega. */
export const verdictFromUccStatus = (uccStatus) => {
  const status = String(uccStatus || "").trim().toUpperCase();
  const kyc = UCC_TO_KYC[status];
  return kyc ? { kyc_status: kyc, ucc_status: status, reasons: [], error: "" } : null;
};

/**
 * add_ucc now replies with `kyc`: the verdict the server read straight from BSE for the
 * UCC it just created. Prefer it. The page used to wait on Laravel's separate bse-status
 * sync, and when that did not answer the investor was stranded on "awaiting BSE
 * verification" with nothing useful to click.
 *
 * `demo` marks a UAT pass-through, kept so the screen can say so rather than present it
 * as a real BSE verification.
 */
export const verdictFromAddUcc = (data) => {
  const kyc = data?.kyc;
  if (kyc?.kyc_status) {
    return {
      kyc_status: kyc.kyc_status,
      ucc_status: kyc.ucc_status || null,
      reasons: Array.isArray(kyc.reasons) ? kyc.reasons : [],
      error: "",
      demo: Boolean(kyc.auto_verified_on_demo),
    };
  }
  return verdictFromUccStatus(data?.status);
};

// `bse: null` = Laravel Node/BSE tak pahunch hi nahi paya — stored status jaisa tha waisa hai.
export const verdictFrom = (res) => ({
  kyc_status: res?.kyc_status || "pending",
  ucc_status: res?.bse?.ucc_status || null,
  reasons: Array.isArray(res?.bse?.reasons) ? res.bse.reasons : [],
  error: res?.bse ? "" : "Could not reach BSE — your status is unchanged.",
});

export const BSE_UNREACHABLE = {
  kyc_status: "pending",
  ucc_status: null,
  reasons: [],
  error: "Could not reach BSE — your status is unchanged.",
};

export const VERIFIED_VERDICT = { kyc_status: "verified", ucc_status: null, reasons: [], error: "" };

/**
 * What the Review step shows: heading, detail line, and whether "Check again" helps.
 * Rejected is terminal — re-asking BSE cannot change it, so the button is hidden and
 * the copy says what to do instead.
 */
export function reviewCopy(verdict, checking = false) {
  const status = String(verdict?.kyc_status || "pending").toLowerCase();
  const verified = isKycVerified(status);
  const rejected = status === "rejected";
  const reasons = (verdict?.reasons || []).filter(Boolean).join("; ");

  const heading = verified
    ? "KYC verified by BSE"
    : rejected
    ? "BSE could not verify your KYC"
    : "KYC submitted — awaiting BSE verification";

  const guidance = verified
    ? verdict?.demo
      ? "Verified on BSE's test environment — you can start investing here. On the live host BSE approves this itself."
      : "You can start investing."
    : rejected
    ? "Please contact support to correct your details — re-checking will not change this."
    : "BSE has not verified your UCC yet. Check again in a moment, or continue to the dashboard.";

  // Reason adds to the guidance, never replaces it — the raw BSE phrase alone
  // ("KYC not found") tells the user nothing about what to do next. BSE's phrases come
  // back unpunctuated, so end each part before joining or they read as one run-on line.
  const sentence = (t) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
  const parts = checking
    ? ["Checking with BSE…"]
    : [verdict?.error, reasons, guidance].filter(Boolean).map(sentence);

  return { heading, verified, rejected, detail: parts.join(" "), canRecheck: !verified && !rejected };
}
