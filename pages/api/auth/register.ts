import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateUsername, isEmailAllowed, sanitizeInput } from '@/lib/auth';
import { signUpSchema } from '@/lib/schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Validate input
    const validation = signUpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { email, displayName, password } = validation.data;

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedDisplayName = sanitizeInput(displayName);

    // Check if email is allowed
    if (!isEmailAllowed(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Email domain is not allowed',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          {
            displayName: {
              equals: sanitizedDisplayName,
              mode: 'insensitive'
            }
          }
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === sanitizedEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
          field: 'email',
        });
      }

      if (existingUser.displayName.toLowerCase() === sanitizedDisplayName.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Display name already taken',
          field: 'displayName',
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique username
    const username = await generateUsername(sanitizedDisplayName);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        username,
        displayName: sanitizedDisplayName,
        password: hashedPassword,
        status: 'ONLINE',
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    // Update session status
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(400).json({
          success: false,
          error: 'User already exists',
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}