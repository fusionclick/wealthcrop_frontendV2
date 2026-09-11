import z from "zod";
// Extension is required: test/ imports this file straight into node, with no Vite resolver.
import { PAN_REGEX, readPan } from "./kycAutofill.js";

/**
 * One password rule, shared by signup and reset.
 *
 * The old regex was /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
 * and rejected passwords that satisfied the message it printed. Two faults:
 *
 *   1. Only @$!%*?& counted as "special". A full stop, hyphen, underscore, #, + and most
 *      of the keyboard did not, so "Johndoe1234." failed the lookahead.
 *   2. The trailing [A-Za-z\d@$!%*?&]{6,} was a WHITELIST of permitted characters, so a
 *      password containing any other symbol was rejected even when it also carried an
 *      approved one — "Johndoe1234!." fails too. Password rules should never forbid
 *      characters; that only shrinks the search space.
 *
 * Any non-alphanumeric now counts as special, and nothing is forbidden.
 *
 * Minimum is 8, not 6: Laravel validates 'password' => 'required|min:8' on register,
 * login and reset, so a 6-character password passed the browser and came back a 422 from
 * the server with a message that contradicted the one on screen.
 */
const PASSWORD_RULE = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character (any symbol, e.g. . ! @ # -)");

export const formSchema = z.object({
  username: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: PASSWORD_RULE,
});


export const passwordLoginSchema = z.object({
  email: z.string().email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
  // password: z
  //   .string()
  //   .min(6, "Password must be at least 6 characters")
  //   .regex(
  //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/,
  //     "Password must include uppercase, lowercase, number, and special character"
  //   ),
});

export const resetPasswordSchema = z.object({
  newPassword: PASSWORD_RULE,
})

export const otpLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .optional()
    .or(z.literal("")) // allow empty before sending
    .refine((val) => val === "" || /^\d{6}$/.test(val), {
      message: "OTP must be 6 digits",
    }),
});
export const pinSetSchema = z.object({
  pin: z
    .string()
    .optional()
    .or(z.literal("")) // allow empty before sending
    .refine((val) => val === "" || /^\d{4}$/.test(val), {
      message: "PIN must be 4 digits",
    }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ponytail: KYC ki validation yahan, kyunki Login/Register ki bhi yahin hai.
// Pehle ye KYC.jsx me if-ladder tha jo sirf PEHLI galti lautata tha — user ek-ek
// karke 11 baar Continue dabata. Ab step ka poora fieldErrors map milta hai.
export const kycStepSchemas = {
  // 0 — Personal
  0: z.object({
    // BSE registers this as the holder name and accepts only letters, spaces, "." and
    // "'" — errcode alpha_special otherwise. Catch it here rather than at the very last
    // step, where the only way back used to be starting over.
    name: z
      .string()
      .trim()
      .min(2, "Full name is required")
      .max(70, "Full name is too long")
      .regex(/^[A-Za-z][A-Za-z .']*$/, "Use letters only — no digits or symbols, as printed on your PAN"),
    // PAN and Aadhaar are optional on the form: the investor can fill the profile, save
    // progress and come back. Shape is still enforced when something IS typed, and PAN is
    // demanded again — with a link back to this step — at the BSE add_ucc submit, which
    // legally cannot be registered without one. See the PAN guard in KYC.jsx.
    pan: z
      .string()
      .trim()
      .refine((v) => !v || PAN_REGEX.test(v.toUpperCase()), "PAN must look like ABCDE1234F")
      // 4th letter is the holder type; only "P" (individual) can hold a retail folio.
      .refine(
        (v) => !v || !PAN_REGEX.test(v.toUpperCase()) || readPan(v).isIndividual,
        "Enter your personal PAN — company, HUF and trust PANs cannot open this account"
      )
      .optional(),
    aadhar: z
      .string()
      .trim()
      .refine((v) => !v || /^[0-9]{12}$/.test(v), "Aadhaar must be 12 digits")
      .optional(),
    // <input type="date"> hamesha YYYY-MM-DD deta hai; range check phir bhi chahiye
    dob: z.string().min(1, "Date of birth is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
      .refine((v) => new Date(v) < new Date(), "Date of birth cannot be in the future")
      .refine((v) => {
        const age = (Date.now() - new Date(v)) / 31557600000;
        return age >= 18 && age <= 120;
      }, "You must be at least 18 years old"),
    gender: z.string().min(1, "Select a gender"),
    occupation: z.string().min(1, "Select an occupation"),
    income: z.string().min(1, "Select an income range"),
    addrss1: z.string().trim().min(8, "Address line 1 must be at least 8 characters"),
    addrss2: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().optional().or(z.literal("")),
    pin: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit India pincode"),
    mStatus: z.string().optional().or(z.literal("")),
    fName: z.string().optional().or(z.literal("")),
  }),

  // 1 — Bank
  1: z.object({
    accountNo: z.string().trim().regex(/^\d{9,18}$/, "Account number must be 9–18 digits"),
    ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "IFSC must look like SBIN0001234"),
    bankName: z.string().optional().or(z.literal("")),
  }),

  // 2 — Docs (file objects, isliye zod ke bahar check hota hai)
  // 3 — Nominee
  3: z.object({
    nomineeName: z.string().trim().min(2, "Nominee name is required"),
    nomineeRelation: z.string().trim().min(2, "Relation with nominee is required"),
    nomineePercentage: z.coerce.number({ message: "Enter a number" })
      .int("Whole numbers only").min(1, "Must be at least 1%").max(100, "Cannot exceed 100%"),
  }),
};

/** Step ke saare errors ek saath: { field: "message" }. Khali object = valid. */
export const validateKycStep = (step, data) => {
  // Step 2 (Docs) has no schema and no required upload: PAN and Aadhaar scans are both
  // optional, so the step is always passable. The files are uploaded the moment they are
  // picked (uploadDocument), not on Continue.
  if (step === 2) return {};
  const schema = kycStepSchemas[step];
  if (!schema) return {};
  const res = schema.safeParse(data);
  if (res.success) return {};
  return Object.fromEntries(
    Object.entries(res.error.flatten().fieldErrors).map(([k, v]) => [k, v[0]])
  );
};
