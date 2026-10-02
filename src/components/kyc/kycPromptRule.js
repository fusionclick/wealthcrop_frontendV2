import { isKycVerified } from "../../utils/kycVerdict.js";

// sessionStorage key: the id of the investor the pop-up has already been shown to this session.
export const PROMPT_SEEN_KEY = "kyc_prompt_seen";

/**
 * Audit #44 — should the KYC pop-up open? Only once investor-data has loaded (so a slow
 * request never flashes it at someone who is verified), only while KYC is incomplete by both
 * answers the app keeps — the BSE verdict on `kyc` and `users.kyc_status`, the one the weekly
 * reminder reads — and only once per session per account.
 */
export const shouldPromptKyc = (investor, seenFor) =>
  Boolean(investor?.id) &&
  !isKycVerified(investor?.kyc?.kyc_status) &&
  !isKycVerified(investor?.kyc_status) &&
  String(seenFor ?? "") !== String(investor.id);
