import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Handles database logging for successfully uploaded S3 attachments.
 * Associates the upload metadata with the authenticated user ID.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { s3Key, url, name, size, type, mimeType } = body;

    // Validate request payload
    if (
      !s3Key ||
      !url ||
      !name ||
      typeof size !== 'number' ||
      !type ||
      !mimeType
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required attachment metadata parameters.' },
        { status: 400 }
      );
    }

    // Persist attachment details in PostgreSQL/Neon database using Prisma
    const attachment = await db.attachment.create({
      data: {
        userId: session.userId,
        s3Key,
        url,
        name,
        size,
        type,
        mimeType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Attachment successfully registered in database.',
      attachment,
    });
  } catch (error: any) {
    console.error('[LOG UPLOAD DATABASE ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to persist attachment metadata.' },
      { status: 500 }
    );
  }
}
