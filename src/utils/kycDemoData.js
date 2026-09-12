// BSE StarMF v2 *demo* KYC kit — the values the KYC page's "Fill BSE demo data" button
// drops into the current step. Keyed by step index (0 Personal, 1 Bank, 3 Nominee);
// every value must pass kycStepSchemas — test/kycBseStatus.test.mjs enforces that.
//
// Provenance (nothing here is a real person's PAN/Aadhaar):
// - PAN NYTPA0008A, address, bank account 6986598569865 / IFSC UTIB0000004: the BSE
//   StarMF v2 API doc sample payload, already used as add_ucc fallbacks in
//   Backend/src/controllers/StarMFController.js. A fresh UCC on these came back
//   APPROVED from the demo host on 2026-08-25 (the demo does not check PAN against KRA).
// - Aadhaar 999941057058: UIDAI's published test Aadhaar number.
// - Pincode 248001: Dehradun GPO — BSE validates postal codes (msgid 560), so it must be real.
// - Alternate bank pair from context/01_ONBOARDING_AND_UCC.md: SBIN0000001 / 123456789012.
// Not re-verified live from a dev machine: the BSE demo is IP-whitelisted to the EC2.
export const KYC_DEMO = {
  0: {
    name: "Ramesh Kumar Sharma",
    pan: "NYTPA0008A",
    aadhar: "999941057058",
    dob: "1995-08-15",
    gender: "male",
    occupation: "private sector employee",
    mStatus: "Single",
    fName: "Naresh Sharma",
    addrss1: "Flat No. 102, ABC Apartments",
    addrss2: "Rajpur Road",
    city: "Dehradun",
    state: "Uttarakhand",
    pin: "248001",
    income: "500000",
  },
  1: {
    bankName: "Axis Bank",
    accountNo: "6986598569865",
    ifsc: "UTIB0000004",
  },
  3: {
    nomineeName: "Suresh Sharma",
    nomineeRelation: "Brother",
    nomineePercentage: "100",
  },
};
