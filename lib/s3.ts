import { S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

/**
 * Lazily initializes and returns the AWS S3 client instance.
 * Throws a detailed error if credentials are not configured.
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing AWS Credentials. Please define AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment.'
      );
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

/**
 * Returns the configured AWS S3 bucket name.
 */
export function getBucketName(): string {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('Missing AWS Bucket Name. Please define AWS_S3_BUCKET_NAME in your environment.');
  }
  return bucketName;
}
