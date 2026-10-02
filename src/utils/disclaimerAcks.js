/**
 * Audit #33 — what a checkout's ticks DECLARE, in the form the order sends them.
 *
 * §2 rows 1 and 2 of the consent matrix are one choice: an order is either execution-only or
 * RM-assisted. The assisted declaration names one employee, so it travels as
 * `rm_assisted:<EUIN>` IN PLACE of execution_only. The server (Backend suitability.js
 * checkDisclaimers) honours it only for an EUIN on the admin's register and then sends that
 * EUIN to BSE with EUINDecl "N"; it refuses an order that carries both.
 */
export const EXEC_KEY = "execution_only";
export const RM_KEY = "rm_assisted";

/** The `acknowledged` array an order carries, from the boxes ticked and who (if anyone) helped. */
export function wireAcks(checked = [], rmEuin = "") {
  const others = checked.filter((k) => k !== RM_KEY && k !== EXEC_KEY);
  if (rmEuin) return [...others, ...(checked.includes(RM_KEY) ? [`${RM_KEY}:${rmEuin}`] : [])];
  return [...others, ...(checked.includes(EXEC_KEY) ? [EXEC_KEY] : [])];
}

/** Is the server's required `key` satisfied? execution_only is, by the RM tick, when assisted. */
export const isAcknowledged = (key, checked = [], rmEuin = "") =>
  key === EXEC_KEY && rmEuin ? checked.includes(RM_KEY) : checked.includes(key);
