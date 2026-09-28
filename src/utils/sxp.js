// Tickets 17 and 18 — SWP and STP.
//
// An SWP is a redemption on a schedule and an STP is a switch on a schedule. Both start
// from a holding the investor already has, which is exactly what RedeemMF and SwitchMF
// already make them pick, folio and all. So neither gets its own page: the one-off forms
// grow a "repeat this" switch, and the only genuinely new things are the schedule and the
// payload — both of which live here, in plain JS, so they can be checked directly.

export const SXP_LABEL = { swp: "SWP", stp: "STP" };

/**
 * Which of BSE's systematic[] rulebooks governs the source scheme.
 *
 * The money leaves the source scheme in both cases, so an STP reads STP-OUT — reading
 * STP-IN would be the destination fund's rules, and its accepted dates are not the same set.
 */
export const SXP_BUCKET = { swp: "swp", stp: "stpOut" };

/**
 * The request the browser is allowed to make: what to do, not how to do it.
 *
 * Everything BSE needs that the browser must not be trusted with — UCC, member code, demat
 * ids, the reference id — is added server-side in buildXspRegisterPayload. A recurring
 * instruction is always for an amount: "all units" on a schedule empties the folio at the
 * first installment and there is nothing left for the rest, which is a one-off redemption
 * wearing a schedule.
 */
export function buildSxpIntent({ type, source = {}, destCode, amount, schedule = {}, acknowledged = [] }) {
  return {
    data: {
      sxp_type: type,
      scheme: source.scheme_bse_code || source.scheme_code || "",
      ...(type === "stp" ? { dest_scheme: destCode || "" } : {}),
      folio: source.folio || "",
      amount: Number(amount),
      freq: schedule.freq,
      txn_date: Number(schedule.day),
      start_date: schedule.startDate,
      end_date: schedule.endDate,
      acknowledged,
    },
  };
}

/**
 * Why this instruction cannot be sent yet, or null.
 *
 * The server validates all of it again — this only exists so the investor is told before a
 * round trip. Units held are deliberately not checked here: the page's idea of the holding
 * comes from a portfolio call that may be minutes old, and the server asks BSE.
 */
export function sxpIntentError({ type, source, destCode, amount, schedule }) {
  const what = SXP_LABEL[type] || "instruction";
  if (!source) return "Pick a fund from the list.";
  if (!source.folio) return `Folio is missing on this holding. Cannot start a ${what}.`;
  if (type === "stp") {
    if (!destCode) return "Pick a destination fund from the list.";
    if (destCode === (source.scheme_bse_code || source.scheme_code)) {
      return "Source and destination fund cannot be the same.";
    }
  }
  if (!amount || Number(amount) <= 0) return `Enter a ${what} amount.`;
  if (!schedule?.installments) return "End date must be after the start date.";
  if (schedule.startDayInvalid) return `This scheme does not start a ${what} on that date.`;
  return null;
}

/**
 * QA 3.10 — "modify" for an SWP or an STP, which BSE does not offer as an operation.
 *
 * Changing a plan means registering the replacement and then retiring the old one, in that
 * order. If the retire fails the investor is told plainly that BOTH are running, because
 * the alternative — cancelling first — risks ending up with no plan at all when the
 * registration is the half that fails.
 *
 * Returns the message to show. `null` means the replacement is clean and the caller's own
 * success toast is the right one.
 */
export async function retireReplacedPlan({ type, regNo, cancelXsp }) {
  if (!regNo) return null;
  const what = SXP_LABEL[type] || "plan";
  // try/catch rather than `.catch()`: a cancel that throws synchronously still has to count
  // as "could not cancel", not crash the success path and leave the investor told nothing.
  let res = null;
  try {
    res = await cancelXsp(regNo);
  } catch {
    res = null;
  }
  if (!res) {
    return `The new ${what} is registered, but the old one could NOT be cancelled — both are running. `
      + `Cancel the old one from Manage ${what}.`;
  }
  return null;
}
