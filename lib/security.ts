import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from './prisma';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: NextApiRequest) => string; // Custom key generator
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
}

// In-memory store for rate limiting (for development)
// In production, you'd want to use Redis or another distributed store
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: Date;
  windowMs: number;
}>();

/**
 * Rate limiting middleware for API routes
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<RateLimitResult> => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getDefaultKey(req);
    const now = new Date();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: new Date(now.getTime() + config.windowMs),
        windowMs: config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment counter (based on success/failure settings)
    const shouldCount =
      (res.statusCode >= 200 && res.statusCode < 300 && !config.skipSuccessfulRequests) ||
      (res.statusCode >= 400 && !config.skipFailedRequests);

    if (shouldCount) {
      entry.count++;
    }

    // Check if limit exceeded
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const success = entry.count <= config.maxRequests;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime.getTime() / 1000));

    if (!success) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000));
    }

    // Clean up expired entries periodically
    cleanupExpiredEntries();

    return {
      success,
      limit: config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
    };
  };
}

/**
 * Default key generator for rate limiting
 */
function getDefaultKey(req: NextApiRequest): string {
  // Try to get IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0] || req.connection.remoteAddress || 'unknown';

  // Try to get user ID from session (if available)
  // This would need to be implemented based on your auth system
  const userId = (req as any).session?.user?.id;

  return `${userId || ip}:${req.url}`;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = new Date();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * CORS configuration for API routes
 */
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Add your production domains
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(res: NextApiResponse): void {
  if (corsConfig.origin.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', corsConfig.origin.join(', '));
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials.toString());
}

/**
 * Validate request origin
 */
export function validateOrigin(req: NextApiRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true; // Allow all origins in development
  }

  const origin = req.headers.origin;
  if (!origin) return false;

  return corsConfig.origin.includes(origin);
}

/**
 * CSRF protection for state-changing requests
 */
export function validateCsrfToken(req: NextApiRequest): boolean {
  // Skip CSRF validation for GET requests
  if (req.method === 'GET') return true;

  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');

  // For now, we'll implement a simple check
  // In production, you'd want to use a more robust CSRF protection
  return true; // Placeholder - implement proper CSRF validation
}

/**
 * Security headers middleware
 */
export function applySecurityHeaders(res: NextApiResponse): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
}

/**
 * Input sanitization utilities
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
    .replace(/<embed\b[^>]*>/gi, '') // Remove embeds
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

export function sanitizeJson(input: any): any {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  // Remove prototype pollution attempts
  if (input.__proto__ || input.constructor || input.prototype) {
    return {};
  }

  // Recursively sanitize nested objects
  const sanitized: any = Array.isArray(input) ? [] : {};

  for (const key in input) {
    if (input.hasOwnProperty(key) && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      if (typeof input[key] === 'object' && input[key] !== null) {
        sanitized[key] = sanitizeJson(input[key]);
      } else {
        sanitized[key] = input[key];
      }
    }
  }

  return sanitized;
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Authentication endpoints - very strict
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    skipSuccessfulRequests: false,
  }),

  // General API - moderate
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    skipSuccessfulRequests: false,
  }),

  // Profile updates - strict
  profile: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 profile updates per hour
    skipSuccessfulRequests: false,
  }),

  // Password reset - very strict
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset attempts per hour
    skipSuccessfulRequests: false,
  }),
};

/**
 * Log security events
 */
export function logSecurityEvent(
  type: string,
  details: {
    ip?: string;
    userId?: string;
    userAgent?: string;
    path?: string;
    method?: string;
    message?: string;
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    ...details,
  };

  console.warn('Security Event:', logEntry);

  // In production, you'd want to send this to a security monitoring service
  // like Sentry, Datadog, or a custom security logging system
}

/**
 * Detect suspicious patterns
 */
export function detectSuspiciousActivity(req: NextApiRequest): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const userAgent = req.headers['user-agent'] || '';

  // Check for missing/empty user agent
  if (!userAgent || userAgent.length < 10) {
    reasons.push('Missing or suspicious user agent');
  }

  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('Bot-like user agent detected');
  }

  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
  for (const header of suspiciousHeaders) {
    if (req.headers[header] && Array.isArray(req.headers[header])) {
      reasons.push(`Multiple ${header} headers`);
    }
  }

  // Check for request size anomalies
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB
    reasons.push('Unusually large request');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}