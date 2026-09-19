import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().optional(),
    otp: z.string().min(4),
    age: z.number().int().positive().optional().nullable(),
    gender: z.string().optional().nullable(),
    locationArea: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  }).refine(data => data.email || data.phone, {
    message: "Either email or phone is required"
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(6),
  }).refine(data => data.email || data.phone, {
    message: "Either email or phone is required"
  })
});

export const googleLoginSchema = z.object({
  body: z.object({
    token: z.string().min(1)
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).refine(data => data.email || data.phone, {
    message: "Either email or phone is required"
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    otp: z.string().min(4, "OTP must be at least 4 digits")
  }).refine(data => data.email || data.phone, {
    message: "Either email or phone is required"
  })
});

export const setPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    avatarUrl: z.string().optional().nullable(),
    age: z.number().int().positive().optional().nullable(),
    gender: z.string().optional().nullable(),
    locationArea: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    phone: z.string().optional().nullable(),
    password: z.string().min(6).optional(),
  })
});
