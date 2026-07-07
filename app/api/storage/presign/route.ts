import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getBucketName } from '@/lib/s3';
import { getSession } from '@/lib/auth';

const ALLOWED_CATEGORIES = ['videos', 'documents', 'resumes'] as const;
type Category = typeof ALLOWED_CATEGORIES[number];

const CATEGORY_MIME_TYPES: Record<Category, string[]> = {
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  resumes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

function sanitizeFilename(filename: string): string {
  // Remove path traversal sequences and keep alphanumeric characters, dots, dashes, and underscores
  return filename
    .replace(/\.\.+/g, '.') // Avoid consecutive dots
    .replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Replace special characters with underscores
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in.' }, { status: 401 });
    }

    const body = await req.json();
    const { filename, contentType, category } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Content-Type is required' }, { status: 400 });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category as Category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate MIME type for the requested category
    const allowedMimeTypes = CATEGORY_MIME_TYPES[category as Category];
    if (!allowedMimeTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: `Content-Type "${contentType}" is not allowed for category "${category}"` },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeFilename(filename);
    const userId = session.userId;
    const bucketName = getBucketName();
    const s3Client = getS3Client();
    const region = process.env.AWS_REGION || 'us-east-1';

    // Build the isolated prefix based on folder structure requirement
    // media/videos/${userId}/filename, media/documents/${userId}/filename, etc.
    const prefix = `media/${category}/${userId}/`;
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const s3Key = `${prefix}${uniqueId}-${sanitizedName}`;

    // Create PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: contentType,
    });

    // Generate Presigned PUT URL valid for 1 hour (3600 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      s3Key,
      filename: sanitizedName,
      contentType,
      category,
    });
  } catch (error: any) {
    console.error('[PRESIGN ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
