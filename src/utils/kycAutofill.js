// KYC autofill — the point is that the investor types as little as possible.
//
// Nothing here needs an API key. Two of the three sources are pure lookups on data the
// investor has already typed, and the third (pincode) is India Post's own free endpoint.
// The paid PAN→name/DOB lookup is a separate, optional backend proxy (kyc/pan-lookup);
// when it is not configured the form still autofills everything below.

/**
 * PAN's 4th character is the holder type. Only "P" can open an individual investment
 * account, so a company/HUF/trust PAN is worth catching here — BSE rejects it at
 * add_ucc, eleven screens later, with a code nobody can act on.
 */
const PAN_HOLDER_TYPE = {
  P: "Individual",
  C: "Company",
  H: "Hindu Undivided Family",
  A: "Association of Persons",
  B: "Body of Individuals",
  F: "Firm / LLP",
  T: "Trust",
  G: "Government",
  L: "Local Authority",
  J: "Artificial Juridical Person",
};

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * What a PAN number tells you on its own, with no API at all:
 * 4th char = holder type, 5th char = first letter of the surname.
 *
 * Returns null until 10 well-formed characters are present, so this can be called on
 * every keystroke.
 */
export const readPan = (pan) => {
  const value = String(pan || "").trim().toUpperCase();
  if (!PAN_REGEX.test(value)) return null;
  return {
    pan: value,
    holderType: PAN_HOLDER_TYPE[value[3]] || null,
    isIndividual: value[3] === "P",
    surnameInitial: value[4],
  };
};

/**
 * The surname initial encoded in the PAN vs. the name that was typed. A mismatch is the
 * single most common reason BSE bounces a UCC, and it costs nothing to say so up front.
 * Returns a message, or "" when it is consistent (or when there is not enough to judge).
 */
export const panNameMismatch = (pan, fullName) => {
  const read = readPan(pan);
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!read || !read.isIndividual || parts.length < 2) return "";
  const surname = parts[parts.length - 1].toUpperCase();
  return surname[0] === read.surnameInitial
    ? ""
    : `PAN expects a surname starting with "${read.surnameInitial}" — check the spelling or the order of your name.`;
};

/**
 * IFSC prefix → bank name, using the exact strings in utils/bank.js so the autofilled
 * value is selectable in the same dropdown (Laravel stores bank_name verbatim).
 *
 * ponytail: offline table, not an API. ifsc.razorpay.com 403s from anything that is not
 * a browser, and a branch name is not something this form collects anyway. Add a lookup
 * only if branch/address is ever needed.
 */
const IFSC_BANK = {
  SBIN: "State Bank of India",
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  KKBK: "Kotak Mahindra Bank",
  PUNB: "Punjab National Bank",
  BARB: "Bank of Baroda",
  CNRB: "Canara Bank",
  UBIN: "Union Bank of India",
  IDIB: "Indian Bank",
  BKID: "Bank of India",
  UCBA: "UCO Bank",
  CBIN: "Central Bank of India",
  PSIB: "Punjab & Sind Bank",
  IOBA: "Indian Overseas Bank",
  IBKL: "IDBI Bank",
  YESB: "Yes Bank",
  INDB: "IndusInd Bank",
  IDFB: "IDFC FIRST Bank",
  FDRL: "Federal Bank",
  BDBL: "Bandhan Bank",
  AUBL: "AU Small Finance Bank",
  ESFB: "Equitas Small Finance Bank",
  UJVN: "Ujjivan Small Finance Bank",
  JSFB: "Jana Small Finance Bank",
  ESMF: "ESAF Small Finance Bank",
  SURY: "Suryoday Small Finance Bank",
  UTKS: "Utkarsh Small Finance Bank",
  PYTM: "Paytm Payments Bank",
  AIRP: "Airtel Payments Bank",
};

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Bank name for an IFSC, or "" when the code is short or the bank is not in the list. */
export const bankFromIfsc = (ifsc) => {
  const value = String(ifsc || "").trim().toUpperCase();
  if (value.length < 4) return "";
  return IFSC_BANK[value.slice(0, 4)] || "";
};

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Pincode → { city, state } from India Post's free, keyless endpoint.
 * Resolves to null on anything unexpected: autofill is a convenience, and the investor
 * can always type over it, so a lookup failure must never block the step.
 */
export const lookupPincode = async (pincode, { fetchImpl = fetch } = {}) => {
  const value = String(pincode || "").trim();
  if (!PINCODE_REGEX.test(value)) return null;
  try {
    const res = await fetchImpl(`https://api.postalpincode.in/pincode/${value}`);
    if (!res.ok) return null;
    const office = (await res.json())?.[0]?.PostOffice?.[0];
    if (!office?.State) return null;
    // District is the city for every form BSE cares about; Name is the post office, which
    // is not an address field.
    return { city: office.District || office.Block || "", state: office.State };
  } catch {
    return null;
  }
};

/* ---------------- self-check ---------------- */
// ponytail: node src/utils/kycAutofill.js — no framework, fails loudly if the logic rots.
export const demo = async () => {
  const { default: assert } = await import("node:assert/strict");

  // Lowercase is normalised, not rejected — people paste PANs in every case.
  assert.equal(readPan("abcpe1234f").pan, "ABCPE1234F");
  // "D" is not a holder code at all; say nothing rather than guess.
  assert.equal(readPan("ABCDE1234F").holderType, null);
  assert.deepEqual(readPan("ABCPE1234F"), {
    pan: "ABCPE1234F", holderType: "Individual", isIndividual: true, surnameInitial: "E",
  });
  assert.equal(readPan("ABCCE1234F").isIndividual, false, "C = company");
  assert.equal(readPan("ABCDE123"), null, "incomplete PAN yields nothing");
  assert.equal(readPan(""), null);

  assert.equal(panNameMismatch("ABCPE1234F", "Ravi Ehsan"), "", "E matches Ehsan");
  assert.match(panNameMismatch("ABCPE1234F", "Ravi Kumar"), /surname starting with "E"/);
  assert.equal(panNameMismatch("ABCPE1234F", "Ravi"), "", "one word — nothing to compare");
  assert.equal(panNameMismatch("", "Ravi Kumar"), "", "no PAN, no complaint");
  assert.equal(panNameMismatch("ABCCE1234F", "Ravi Kumar"), "", "non-individual has no surname letter");

  assert.equal(bankFromIfsc("sbin0001234"), "State Bank of India");
  assert.equal(bankFromIfsc("UTIB"), "Axis Bank", "bank is known from the first 4 characters");
  assert.equal(bankFromIfsc("ZZZZ0000001"), "", "unknown bank leaves the dropdown alone");
  assert.equal(bankFromIfsc("SB"), "");

  const fake = (body) => async () => ({ ok: true, json: async () => body });
  assert.deepEqual(
    await lookupPincode("700091", { fetchImpl: fake([{ PostOffice: [{ District: "North 24 Parganas", State: "West Bengal" }] }]) }),
    { city: "North 24 Parganas", state: "West Bengal" }
  );
  assert.equal(await lookupPincode("012345"), null, "leading zero is not an India pincode");
  assert.equal(await lookupPincode("700091", { fetchImpl: fake([{ Status: "Error", PostOffice: null }]) }), null);
  assert.equal(
    await lookupPincode("700091", { fetchImpl: async () => { throw new Error("offline"); } }),
    null,
    "a dead network must not block the step"
  );

  console.log("kycAutofill: ok");
};

// eslint-disable-next-line no-undef -- node only; the browser build never takes this branch
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("kycAutofill.js")) demo();
