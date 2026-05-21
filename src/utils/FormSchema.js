import z from "zod";

export const formSchema = z.object({
  username: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .min(10, "Please enter a valid number")
    .regex(/^\d+$/, "Only digits are allowed"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      "Password must be at least 6 characters long and include uppercase, lowercase, number, and special character"
    ),
});


export const passwordLoginSchema = z.object({
  // email_or_mobile: z
  //   .string()
  //   .min(10, "Please enter a valid number")
  //   .regex(/^\d+$/, "Only digits are allowed"),
  email_or_mobile: z
    .string()
    .min(1, "This field is required")
    .refine((value) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^\d{10,}$/.test(value);
      return isEmail || isPhone;
    }, {
      message: "Enter a valid email or mobile number",
    }),

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
  email_or_mobile: z
    .string()
    .min(10, "Please enter a valid number")
    .regex(/^\d+$/, "Only digits are allowed"),
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
