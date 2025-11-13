import { z } from 'zod';
import { validatePasswordStrength } from './auth';

/**
 * User registration schema
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(254, 'Email is too long'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(32, 'Display name must be less than 32 characters')
    .regex(/^[a-zA-Z0-9\s._-]+$/, 'Display name can only contain letters, numbers, spaces, dots, underscores, and hyphens')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => validatePasswordStrength(data.password).isValid, {
  message: "Password does not meet strength requirements",
  path: ["password"],
});

/**
 * User sign in schema
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z
    .boolean()
    .default(false),
});

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(32, 'Display name must be less than 32 characters')
    .regex(/^[a-zA-Z0-9\s._-]+$/, 'Display name can only contain letters, numbers, spaces, dots, underscores, and hyphens')
    .trim()
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be less than 32 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens')
    .trim()
    .optional(),
  bio: z
    .string()
    .max(280, 'Bio must be less than 280 characters')
    .trim()
    .optional(),
  status: z
    .enum(['ONLINE', 'IDLE', 'DO_NOT_DISTURB', 'INVISIBLE', 'OFFLINE'])
    .optional(),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmNewPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => validatePasswordStrength(data.newPassword).isValid, {
  message: "New password does not meet strength requirements",
  path: ["newPassword"],
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required'),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => validatePasswordStrength(data.password).isValid, {
  message: "Password does not meet strength requirements",
  path: ["password"],
});

/**
 * Account deactivation schema
 */
export const accountDeactivationSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to confirm account deactivation'),
  confirmation: z
    .string()
    .min(1, 'Please type "DEACTIVATE" to confirm'),
}).refine((data) => data.confirmation === 'DEACTIVATE', {
  message: "Please type DEACTIVATE exactly to confirm account deactivation",
  path: ["confirmation"],
});

// Export types for use in components
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type AccountDeactivationInput = z.infer<typeof accountDeactivationSchema>;