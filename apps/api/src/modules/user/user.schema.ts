import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(320).optional()
}).refine((value) => value.name !== undefined || value.email !== undefined, {
  message: "At least one field is required"
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128)
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
