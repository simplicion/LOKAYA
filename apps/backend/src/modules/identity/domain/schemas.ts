import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6),
  name: z.string().min(2),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
});

export const googleLoginSchema = z.object({
  token: z.string().min(1)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const sendOtpSchema = z.object({
  phone: z.string().min(10)
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().min(4)
});
