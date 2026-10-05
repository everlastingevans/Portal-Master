import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getBucketName, getS3Client } from '@/lib/s3';

/** Short-lived (5 minute) download URL for a private CV object. Never stored or logged. */
export async function presignCvUrl(s3Key: string, displayName: string): Promise<string> {
  const filename = `CV - ${displayName}`.replace(/[^\w .-]/g, '').slice(0, 80) || 'CV';
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: getBucketName(), Key: s3Key, ResponseContentDisposition: `inline; filename="${filename}.pdf"` }),
    { expiresIn: 300 },
  );
}
