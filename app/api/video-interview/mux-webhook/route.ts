import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

// Simple helper to lazy initialize Gemini for webhook triggered transcriptions
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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

        // Trigger AI transcription asynchronously (or update state)
        const interview = await prisma.videoInterview.findFirst({
          where: { mux_asset_id: assetId },
          include: { candidate: true },
        });

        if (interview && !interview.transcript) {
          const ai = getGeminiClient();
          if (ai) {
            console.info(`[MUX AI TRANSCRIPTION] Running transcription for interview ${interview.id}...`);
            try {
              // Mux provides a standard low-resolution audio file, or we can use standard webm/mp4 stream url if public
              const mediaStreamUrl = playbackId
                ? `https://stream.mux.com/${playbackId}/low.mp4`
                : interview.video_url;

              if (mediaStreamUrl) {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.5-flash',
                  contents: `Listen to the audio or view this video stream at ${mediaStreamUrl}. Provide a verbatim transcript of the candidate response, a performance score from 0-100, and a summary of constructive feedback.`,
                });

                const content = response.text || '';
                await prisma.videoInterview.update({
                  where: { id: interview.id },
                  data: {
                    transcript: content,
                  },
                });
                console.info('[MUX AI TRANSCRIPTION] Finished webhook transcription.');
              }
            } catch (transcribeError) {
              console.error('[MUX AI TRANSCRIPTION ERROR] Failed during async webhook transcription.', transcribeError);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[MUX WEBHOOK ERROR] Failed to process webhook.', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
