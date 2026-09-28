// The 6-month risk-profiler retake rule, as the entry buttons see it.
//
// QA 8.7 — Profile.jsx aur BasicDetails.jsx dono mein yehi check hard-coded tha:
//   userData?.risk_profile?.updated_at < Date.now()
// updated_at ek string hai aur Date.now() ek number, to comparison hamesha NaN par gir
// kar false deta tha — yaani har user block, aur jis ne profiler kabhi kiya hi nahi usay
// "You can update after Invalid Date". Ab ek hi definition, dono jagah wohi.
//
// ponytail: asli gate server hai (GET risk/profile / POST risk/calculate ka 403). Ye sirf
// button ko us se ittefaq karata hai, is liye shak ki soorat mein raasta deta hai —
// rokna server ka kaam hai, andaza lagana iska nahi.
export const canRetakeRiskProfile = (riskProfile) => {
  if (!riskProfile || riskProfile.is_active === false) return true; // first-timer / lapsed
  const until = Date.parse(riskProfile.next_allowed_at || riskProfile.expires_at || "");
  return Number.isNaN(until) || until <= Date.now();
};
