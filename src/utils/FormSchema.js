import z from "zod";

export const formSchema = z.object({
  username: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must be at least 6 characters long and include uppercase, lowercase, number, and special character"
    ),
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
  newPassword: z.string()
  .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must be at least 6 characters long and include uppercase, lowercase, number, and special character"
    ),
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
    name: z.string().trim().min(2, "Full name is required"),
    pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must look like ABCDE1234F"),
    aadhar: z.string().trim().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits"),
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
  if (step === 2) {
    return {
      ...(data.documentP ? {} : { documentP: "Upload your PAN" }),
      ...(data.documentA ? {} : { documentA: "Upload your Aadhaar" }),
    };
  }
  const schema = kycStepSchemas[step];
  if (!schema) return {};
  const res = schema.safeParse(data);
  if (res.success) return {};
  return Object.fromEntries(
    Object.entries(res.error.flatten().fieldErrors).map(([k, v]) => [k, v[0]])
  );
};
