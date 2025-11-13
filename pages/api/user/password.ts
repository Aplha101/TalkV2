import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required',
      });
    }

    // Validate new password
    const validation = passwordChangeSchema.safeParse({
      newPassword,
      confirmNewPassword: newPassword, // We'll assume frontend already validated this
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Get current user
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

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}