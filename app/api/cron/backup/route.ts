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
    // Helper to sanitize any surrounding quotes from credentials
    const sanitizeToken = (token?: string | null) => {
      if (!token) return '';
      let t = token.trim();
      if (t.startsWith('"') && t.endsWith('"')) {
        t = t.slice(1, -1);
      }
      if (t.startsWith("'") && t.endsWith("'")) {
        t = t.slice(1, -1);
      }
      return t.trim();
    };

    // 1. Validate Cron Secret for Authentication (Vercel standard or custom query params)
    const authHeader = req.headers.get('authorization');
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const rawCronSecret = process.env.CRON_SECRET;
    const cronSecret = sanitizeToken(rawCronSecret);

    const searchParams = req.nextUrl.searchParams;
    const querySecret = searchParams.get('key') || searchParams.get('secret') || searchParams.get('cron_secret');

    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const incomingToken = sanitizeToken(headerToken || querySecret);

    // Log diagnostic information to the server logs to assist in troubleshooting
    console.info('[CRON BACKUP AUTH DIAGNOSTIC]', {
      isProduction,
      hasServerSecret: !!cronSecret,
      serverSecretLength: cronSecret.length,
      rawServerSecretLength: rawCronSecret?.length || 0,
      hasHeaderAuth: !!authHeader,
      hasQueryAuth: !!querySecret,
      incomingTokenLength: incomingToken.length,
      match: incomingToken && cronSecret ? incomingToken === cronSecret : false,
    });

    if (isProduction) {
      if (!cronSecret) {
        console.error('[CRON BACKUP] Failure: CRON_SECRET is not configured in Vercel environment variables.');
        return NextResponse.json(
          { error: 'CRON_SECRET is not configured on the server.' },
          { status: 500 }
        );
      }
      if (!incomingToken) {
        console.warn('[CRON BACKUP] Warning: Attempted access without an authorization token (header or query param).');
        return NextResponse.json(
          { error: 'Unauthorized. Missing authorization token (provide Bearer header or ?secret= query parameter).' },
          { status: 401 }
        );
      }
      if (incomingToken !== cronSecret) {
        console.warn('[CRON BACKUP] Warning: Mismatched authorization token.');
        return NextResponse.json(
          { error: 'Unauthorized. Invalid bearer token or query secret.' },
          { status: 401 }
        );
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
