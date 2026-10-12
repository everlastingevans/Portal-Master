import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.type;
    console.info(`[MUX WEBHOOK RECEIVED] Event: ${eventType}`, JSON.stringify(body));

    // Handle when a direct upload finishes
    if (eventType === 'video.upload.asset_created') {
      const uploadId = body.data?.upload_id;
      const assetId = body.data?.id;

      if (uploadId && assetId) {
        console.info(`[MUX WEBHOOK] Direct upload complete. Mapping upload ${uploadId} to asset ${assetId}`);
        await prisma.videoInterview.updateMany({
          where: { mux_upload_id: uploadId },
          data: { mux_asset_id: assetId, status: 'PROCESSING' },
        });
      }
    }

    // Handle when a video asset is processed and has its streaming playback ready
    if (eventType === 'video.asset.ready') {
      const assetId = body.data?.id;
      const playbackId = body.data?.playback_ids?.[0]?.id;
      const duration = body.data?.duration;

      if (assetId) {
        console.info(`[MUX WEBHOOK] Asset is ready. Updating video interview table for asset: ${assetId}`);

        // Update DB
        await prisma.videoInterview.updateMany({
          where: { mux_asset_id: assetId },
          data: {
            mux_playback_id: playbackId || '',
            status: 'COMPLETED',
          },
        });

        // Transcription and scoring happen at upload (/api/video-interview/upload) from the actual recording.
        // The model can't fetch a URL from a text prompt, so transcribing here would only produce invented text.
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[MUX WEBHOOK ERROR] Failed to process webhook.', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
