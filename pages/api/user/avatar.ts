import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Avatar upload service is not configured',
      });
    }

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

    // For now, we'll return a placeholder implementation
    // In a real implementation, you would:
    // 1. Parse multipart form data with formidable or similar
    // 2. Validate file type and size
    // 3. Upload to Cloudinary
    // 4. Update user's avatarUrl in database

    return res.status(501).json({
      success: false,
      error: 'Avatar upload is not yet implemented. This feature will be available soon.',
      message: 'For now, users will have default avatars based on their display name initials.',
    });

    /*
    // Full implementation example (commented out for now):

    const formidable = require('formidable');
    const fs = require('fs');

    const form = new formidable.IncomingForm();
    form.maxFileSize = 5 * 1024 * 1024; // 5MB
    form.multiples = false;
    form.allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(400).json({
          success: false,
          error: 'Failed to parse upload data',
        });
      }

      const file = files.avatar;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
        });
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum 5MB allowed',
        });
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.filepath, {
          folder: 'talkie/avatars',
          public_id: `${session.user.id}`,
          overwrite: true,
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
        });

        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        // Update user's avatar URL in database
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: { avatarUrl: result.secure_url },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        });

        return res.status(200).json({
          success: true,
          message: 'Avatar uploaded successfully',
          data: { user: updatedUser },
        });

      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);

        // Clean up temporary file if it exists
        if (file.filepath && fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }

        return res.status(500).json({
          success: false,
          error: 'Failed to upload avatar',
        });
      }
    });
    */

  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}