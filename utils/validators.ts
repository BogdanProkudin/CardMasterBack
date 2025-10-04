import { z } from "zod";
import { passwordPolicy } from "./passwordPolicy";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().refine(passwordPolicy.check, passwordPolicy.message),
  name: z.string().min(1).max(64).optional(),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const emailOnlySchema = z.object({ email: z.string().email() });
export const verifyConfirmSchema = z.object({ token: z.string().min(20) });
export const resetConfirmSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().refine(passwordPolicy.check, passwordPolicy.message),
});
