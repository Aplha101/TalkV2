import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { sanitizeInput } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, session);
    case 'PATCH':
      return handlePatch(req, res, session);
    case 'DELETE':
      return handleDelete(req, res, session);
    default:
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        isActive: true,
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
        updatedAt: true,
        lastSeen: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    // Validate input
    const validation = profileUpdateSchema.safeParse(req.body);
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

    const { displayName, username, bio, status } = validation.data;

    // Build update data
    const updateData: any = {};

    if (displayName !== undefined) {
      updateData.displayName = sanitizeInput(displayName);
    }

    if (username !== undefined) {
      const sanitizedUsername = sanitizeInput(username).toLowerCase();

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username: sanitizedUsername,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken',
          field: 'username',
        });
      }

      updateData.username = sanitizedUsername;
    }

    if (bio !== undefined) {
      updateData.bio = sanitizeInput(bio);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSeen: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to confirm account deactivation',
      });
    }

    // Get user with password for verification
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Import validatePassword function
    const { validatePassword } = await import('@/lib/auth');

    // Verify password
    const isPasswordValid = await validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
      });
    }

    // Deactivate user (soft delete)
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        isActive: false,
        status: 'OFFLINE',
        updatedAt: new Date(),
      },
    });

    // Optional: Delete or anonymize user's sessions, accounts, etc.
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}