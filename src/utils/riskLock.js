// The risk-profiler retake rule, as the entry buttons see it.
//
// QA 8.7 — Profile.jsx aur BasicDetails.jsx dono yehi ek function padhte hain, taake dono
// buttons ek hi baat kahein.
//
// Audit #23 / #70 — the 6-month lock is gone by the client's decision: the demo script retakes
// the questionnaire on the spot ("dobara bharo, profile recalculate"). The server keeps every
// attempt and turns the old date into a "review due" reminder (GET risk/profile), so a retake
// is always allowed and this answers yes. Kept as the one switch both entry buttons read.
export const canRetakeRiskProfile = () => true;
