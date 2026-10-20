import { z } from "zod";

export const SHOP_CATEGORIES = [
  "Kirana & Grocery",
  "Cosmetics & Bangles / Jewelry",
  "Apparel & Garments",
  "Hardware & Electrical",
  "Stationery & Books",
  "General Store",
  "Other Retail",
] as const;

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
  shopName: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(120, "Shop name is too long"),
  category: z.string().min(1, "Please select a shop category"),
  whatsappNumber: z
    .string()
    .trim()
    .refine(
      (val) => !val || (val.length >= 10 && /^[0-9+\s-]+$/.test(val)),
      { message: "Please enter a valid phone number (at least 10 digits)" }
    )
    .optional()
    .or(z.literal("")),
});

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .optional()
    .or(z.literal("")),
  shopName: z
    .string()
    .trim()
    .min(2, "Shop name is required (at least 2 characters)")
    .max(120, "Shop name is too long"),
  category: z.string().min(1, "Please select a shop category"),
  whatsappNumber: z
    .string()
    .trim()
    .refine(
      (val) => !val || (val.length >= 10 && /^[0-9+\s-]+$/.test(val)),
      { message: "Please enter a valid phone number (at least 10 digits)" }
    )
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Please enter your password"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
