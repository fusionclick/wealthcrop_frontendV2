/**
 * QA — /profile/basic: "jitni fields hai ... har field individually editable ho and save ho",
 * and "jitni fields hai kyc etc pr wahan sab pr validation honi chaiye".
 *
 * One table, so the displayed row, the edit modal and the validation cannot disagree. The rules
 * mirror InvestorController::updateContactDetails — the server is the authority, this is here so
 * the investor is told WHICH field is wrong instead of a bare "Validation failed".
 */

export const GENDERS = ["male", "female", "other"];
export const MARITAL_STATUSES = ["single", "married", "divorced", "widowed"];

// Letters (any script), spaces and the few punctuation marks real names carry.
const NAME_OK = /^[\p{L}\s.'-]+$/u;

/** Whole years between `d` and `today`, counting the birthday itself. */
export function yearsSince(d, today = new Date()) {
  let y = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) y -= 1;
  return y;
}

/**
 * @param field the user_profiles / users column name, not the modal's UI key
 * @returns a human message when the value is not acceptable, or "" when it is
 */
export function validateField(field, raw, today = new Date()) {
  const v = String(raw ?? "").trim();
  if (!v) return "Enter a value.";

  switch (field) {
    case "email":
      // Deliberately stricter than type="email", which accepts "john@gmail".
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter a valid email address.";

    case "gender":
      return GENDERS.includes(v) ? "" : "Choose male, female or other.";

    case "marital_status":
      return MARITAL_STATUSES.includes(v) ? "" : "Choose single, married, divorced or widowed.";

    case "dob": {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "Enter a valid date.";
      if (d > today) return "Date of birth cannot be in the future.";
      if (d.getFullYear() < 1900) return "Enter a real date of birth.";
      if (yearsSince(d, today) < 18) return "You must be at least 18 years old.";
      return "";
    }

    case "income": {
      const n = Number(v);
      if (!Number.isFinite(n)) return "Enter your income as a number.";
      if (n < 0) return "Income cannot be negative.";
      return "";
    }

    case "pincode":
      return /^\d{6}$/.test(v) ? "" : "Pincode must be exactly 6 digits.";

    case "fname":
      return NAME_OK.test(v) ? "" : "Father's name may only contain letters, spaces, . ' and -";

    case "city":
    case "state":
      return NAME_OK.test(v) ? "" : "Use letters only.";

    case "occupation":
    case "address_line1":
    case "address_line2":
      return v.length <= 150 ? "" : "Keep this under 150 characters.";

    default:
      return "";
  }
}

/** The modal's UI key -> how to render and label its input. */
const FIELD_CONFIG = {
  email: { label: "Email Address", inputType: "email", placeholder: "you@example.com", button: "Update email" },
  maritalStatus: { label: "Marital Status", inputType: "select", options: MARITAL_STATUSES, button: "Update status" },
  "father'sName": { label: "Father's Name", inputType: "text", placeholder: "Enter father's name", button: "Update" },
  income: { label: "Annual Income", inputType: "number", placeholder: "e.g. 500000", button: "Update income" },
  occupation: { label: "Occupation", inputType: "text", placeholder: "Enter your occupation", button: "Update" },
  dob: { label: "Date of Birth", inputType: "date", placeholder: "", button: "Update date of birth" },
  gender: { label: "Gender", inputType: "select", options: GENDERS, button: "Update gender" },
  address_line1: { label: "Address line 1", inputType: "text", placeholder: "House / street", button: "Update address" },
  address_line2: { label: "Address line 2", inputType: "text", placeholder: "Area / landmark", button: "Update address" },
  city: { label: "City", inputType: "text", placeholder: "City", button: "Update city" },
  state: { label: "State", inputType: "text", placeholder: "State", button: "Update state" },
  pincode: { label: "Pincode", inputType: "text", placeholder: "6-digit pincode", button: "Update pincode" },
  emailVerify: { label: "Enter OTP", inputType: "text", placeholder: "OTP sent to your email address", button: "Verify" },
};

/**
 * Never undefined. The old getFieldConfig fell off the end of a switch for any type it did not
 * know, and the modal then threw on `config.label` — a blank screen instead of an edit box.
 */
export const fieldConfig = (type) =>
  FIELD_CONFIG[type] || { label: "Value", inputType: "text", placeholder: "", button: "Save" };
