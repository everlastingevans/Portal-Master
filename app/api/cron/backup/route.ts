import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getBucketName } from '@/lib/s3';
import db from '@/lib/db';

/**
 * Programmatic secure backup route triggered by Vercel Cron.
 * Fetches application data, serializes to JSON snapshot, and writes
 * directly to the segregated "backups/" folder in AWS S3.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Validate Cron Secret for Authentication (Vercel standard)
    const authHeader = req.headers.get('authorization');
    const isProduction = process.env.NODE_ENV === 'production';
    const cronSecret = process.env.CRON_SECRET;

    if (isProduction) {
      if (!cronSecret) {
        return NextResponse.json(
          { error: 'CRON_SECRET is not configured on the server.' },
          { status: 500 }
        );
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
    }

    console.info('[CRON BACKUP] Starting automated database backup snapshot...');

    // 2. Query application tables programmatically
    const [
      tenants,
      users,
      jobs,
      applications,
      savedJobs,
      matches,
      resumeTasks,
      interviews,
      videoInterviews,
      notifications,
      attachments,
    ] = await Promise.all([
      db.tenant.findMany(),
      db.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          professional_title: true,
          experience_level: true,
          phone: true,
          linkedin_url: true,
          github_url: true,
          portfolio_url: true,
          cv_url: true,
          created_at: true, // If fields exist
        } as any, // dynamic bypass in case some columns differ
      }),
      db.job.findMany(),
      db.jobApplication.findMany(),
      db.savedJob.findMany(),
      db.jobMatch.findMany(),
      db.resumeTask.findMany(),
      db.interview.findMany(),
      db.videoInterview.findMany(),
      db.notification.findMany(),
      db.attachment.findMany(),
    ]);

    // 3. Construct structured backup payload
    const snapshot = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        database_provider: 'postgresql/neon',
      },
      tables: {
        tenants,
        users,
        jobs,
        applications,
        savedJobs,
        matches,
        resumeTasks,
        interviews,
        videoInterviews,
        notifications,
        attachments,
      },
    };

    const snapshotString = JSON.stringify(snapshot, null, 2);
    const snapshotSize = Buffer.byteLength(snapshotString, 'utf8');

    // 4. Set S3 target coordinates inside the "backups/" prefix namespace
    const bucketName = getBucketName();
    const s3Client = getS3Client();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = `backups/db-backup-${dateStr}.json`;

    // 5. Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: snapshotString,
      ContentType: 'application/json',
      Metadata: {
        BackupType: 'Automated_Cron_Snapshot',
        SnapshotVersion: '1.0.0',
      },
    });

    await s3Client.send(uploadCommand);

    console.info(`[CRON BACKUP] Backup successfully created: ${s3Key} (${snapshotSize} bytes)`);

    return NextResponse.json({
      success: true,
      message: 'Database backup compiled and pushed to S3.',
      details: {
        bucket: bucketName,
        key: s3Key,
        size_bytes: snapshotSize,
        timestamp: snapshot.metadata.timestamp,
      },
    });
  } catch (error: any) {
    console.error('[CRON BACKUP EXCEPTION]', error);
    return NextResponse.json(
      { error: 'Backup process failed internally.', message: error.message },
      { status: 500 }
    );
  }
}
