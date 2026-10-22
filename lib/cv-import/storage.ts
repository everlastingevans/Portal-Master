import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getBucketName, getS3Client } from '@/lib/s3';
import { safeUploadName } from '@/lib/uploads';

/**
 * Stores an imported CV privately under the candidate's resumes folder and returns the bucket URL
 * kept in users.cv_url. The object is never public: shortlists turn this URL back into a key with
 * cvSourceFromUrl and hand employers a short-lived signed link.
 */
export async function storeCandidateCv(candidateId: number, fileName: string, buffer: Buffer): Promise<string> {
  const bucket = getBucketName();
  const key = `media/resumes/${candidateId}/${safeUploadName(candidateId, fileName, 'cv.pdf')}`;
  await getS3Client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: 'application/pdf' }));
  return `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}
