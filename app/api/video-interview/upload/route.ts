import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { questionText, readinessInstruction, parseReadinessEvaluation, feedbackText, RUBRIC, CRITERION_MAX, type ReadinessEvaluation } from '@/lib/readiness';
import { safeUploadName } from '@/lib/uploads';

const MODEL = process.env.GEMINI_READINESS_MODEL || 'gemini-3.5-flash';

const READINESS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answered: { type: Type.BOOLEAN, description: 'False if no audible speech or no attempt to answer the question.' },
    transcript: { type: Type.STRING, description: 'Verbatim transcript of what the candidate says.' },
    criteria: {
      type: Type.ARRAY,
      description: `One entry per rubric criterion: ${RUBRIC.map((c) => c.key).join(', ')}.`,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, enum: RUBRIC.map((c) => c.key) },
          score: { type: Type.INTEGER, description: `0-${CRITERION_MAX}` },
          reason: { type: Type.STRING, description: 'One sentence referring to the answer.' },
        },
        required: ['key', 'score', 'reason'],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '1-2 specific things the candidate did well.' },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: '1-3 specific, practical tips to improve this answer.' },
  },
  required: ['answered', 'transcript', 'criteria', 'strengths', 'improvements'],
};

// Lazy initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[GEMINI API WARNING] GEMINI_API_KEY is not defined. Readiness answers will be queued for manual review.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Lazy initialize AWS S3 client
function getS3Client() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.info('[S3 WARNING] S3 is not fully configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME). Falling back to local disk storage.');
    return null;
  }

  const { S3Client } = require('@aws-sdk/client-s3');
  return {
    client: new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    }),
    bucketName,
  };
}

// Lazy initialize Mux client
function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.info('[MUX WARNING] Mux is not configured (MUX_TOKEN_ID, MUX_TOKEN_SECRET). Streaming services will fall back.');
    return null;
  }

  const Mux = require('@mux/mux-node');
  return new Mux({
    tokenId,
    tokenSecret,
  });
}

/** Scores the answer with Gemini. Returns null when AI is unavailable or its output can't be trusted. */
async function evaluateAnswer(buffer: Buffer, mimeType: string, question: string, profile: string): Promise<ReadinessEvaluation | null> {
  const ai = getGeminiClient();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ inlineData: { mimeType, data: buffer.toString('base64') } }, 'Assess this recorded answer.'],
      config: {
        temperature: 0,
        systemInstruction: readinessInstruction(question, profile),
        responseMimeType: 'application/json',
        responseSchema: READINESS_SCHEMA,
      },
    });
    const evaluation = parseReadinessEvaluation(response.text || '');
    if (!evaluation) console.error('[READINESS] Unusable model output:', response.text?.slice(0, 500));
    return evaluation;
  } catch (aiError) {
    console.error('[READINESS] Gemini scoring failed.', aiError);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Identity comes only from the verified session (set by middleware), never from the request body
    const userId = Number(req.headers.get('x-user-id'));
    if (!userId || req.headers.get('x-user-role')?.toUpperCase() !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Candidate authentication required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const jobIdStr = formData.get('job_id') as string | null;
    const questionIndex = formData.get('question_index') ?? 0;

    if (!file) {
      return NextResponse.json({ error: 'No video file uploaded.' }, { status: 400 });
    }

    const question = questionText(questionIndex);
    if (!question) {
      return NextResponse.json({ error: 'Unknown interview question.' }, { status: 400 });
    }

    const candidate = await prisma.user.findUnique({
      where: { id: userId },
      select: { professional_title: true, experience_level: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 });
    }
    const profile = [
      candidate.professional_title && `target role: ${candidate.professional_title.slice(0, 120)}`,
      candidate.experience_level && `experience level: ${candidate.experience_level.slice(0, 60)}`,
    ].filter(Boolean).join('; ');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. SCORE THE ANSWER FIRST, so a recording with no answer is rejected before it is stored
    const evaluation = await evaluateAnswer(buffer, file.type || 'video/webm', question, profile);
    if (evaluation && !evaluation.answered) {
      return NextResponse.json(
        { error: 'We couldn’t hear an answer to the question in your recording. Check your microphone and try again.' },
        { status: 422 },
      );
    }

    // Initial storage and streaming variables
    let videoUrl = '';
    let s3Key = '';
    let muxAssetId = '';
    let muxPlaybackId = '';

    const s3Config = getS3Client();
    const mux = getMuxClient();

    // 2. UPLOAD TO AWS S3 IF CONFIG EXISTS
    if (s3Config) {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const key = `video-interviews/${safeUploadName(userId, file.name)}`;
      try {
        console.info(`[S3 UPLOAD] Uploading video for candidate ${userId} to S3 bucket ${s3Config.bucketName}...`);
        await s3Config.client.send(new PutObjectCommand({
          Bucket: s3Config.bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type || 'video/webm',
        }));
        s3Key = key;
        videoUrl = `https://${s3Config.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
        console.info(`[S3 SUCCESS] Video uploaded successfully: ${videoUrl}`);
      } catch (s3Error: any) {
        console.error('[S3 ERROR] S3 upload failed. Falling back to local storage.', s3Error);
      }
    }

    // 3. FALLBACK TO LOCAL STORAGE IF NOT ON S3 OR S3 FAILED
    if (!videoUrl) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = safeUploadName(userId, file.name);
      const filePath = path.join(uploadDir, fileName);
      console.info(`[LOCAL STORAGE] Writing video response to disk: ${filePath}`);
      fs.writeFileSync(filePath, buffer);
      videoUrl = `/uploads/${fileName}`;
    }

    // 4. INTEGRATE MUX STREAMING IF CONFIG EXISTS
    if (mux) {
      try {
        console.info('[MUX ASSET] Creating Mux asset from video url:', videoUrl);
        // If it's a local video URL, we pass a standard test video URL or Mux won't be able to fetch it
        const inputUrl = videoUrl.startsWith('/')
          ? 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4' // test video for local development
          : videoUrl;

        const asset = await mux.video.assets.create({
          input: [{ url: inputUrl }],
          playback_policy: ['public'],
        });

        muxAssetId = asset.id;
        const playback = asset.playback_ids?.[0];
        if (playback) {
          muxPlaybackId = playback.id;
        }
        console.info('[MUX SUCCESS] Mux Asset created successfully.', { muxAssetId, muxPlaybackId });
      } catch (muxError: any) {
        console.error('[MUX ERROR] Mux integration failed.', muxError);
      }
    }

    // 5. SAVE. Without a trustworthy AI result the answer goes to a LaunchPath reviewer instead of getting a guessed score.
    const pending = !evaluation;
    const score = evaluation?.score ?? 0;
    const transcript = evaluation?.transcript ?? '';
    const feedback = evaluation
      ? feedbackText(evaluation)
      : 'We couldn’t score your answer automatically, so a LaunchPath reviewer will watch it and add your score and feedback.';

    // Only link the interview to a job the candidate has actually applied to
    const jobId = jobIdStr ? parseInt(jobIdStr, 10) : null;
    const application = jobId
      ? await prisma.jobApplication.findUnique({ where: { candidate_id_job_id: { candidate_id: userId, job_id: jobId } }, select: { id: true } })
      : null;

    const videoInterview = await prisma.videoInterview.create({
      data: {
        candidate_id: userId,
        job_id: application ? jobId : null,
        video_url: videoUrl,
        questions: JSON.stringify([
          {
            id: Number(questionIndex) + 1,
            title: question,
            questionScore: score,
            transcript: transcript || 'Awaiting review.',
            points: evaluation ? evaluation.criteria.map((c) => `${c.label} (${c.score}/${CRITERION_MAX}): ${c.reason}`) : ['Pending manual evaluation'],
            criteria: evaluation?.criteria ?? [],
          },
        ]),
        score,
        feedback,
        status: pending ? 'PENDING_REVIEW' : 'COMPLETED',
        mux_upload_id: s3Key || 'local-disk',
        mux_asset_id: muxAssetId || 'simulated-asset',
        mux_playback_id: muxPlaybackId || 'simulated-playback',
        transcript: transcript || null,
      },
    });

    console.info(`[DATABASE SUCCESS] VideoInterview created with ID ${videoInterview.id}`);

    if (application && jobId) {
      try {
        await prisma.jobApplication.update({
          where: { id: application.id },
          data: {
            status: 'Interviewing',
          },
        });

        await prisma.notification.create({
          data: {
            user_id: userId,
            title: 'Video Interview Submitted',
            content: pending
              ? 'Your video interview for the job has been submitted and is waiting for review.'
              : `Your video interview for the job has been scored and shared with the employer. Score: ${score}/100.`,
            type: 'INTERVIEW',
          }
        });
      } catch (assocError) {
        console.warn('[DATABASE WARNING] Could not update associated JobApplication status.', assocError);
      }
    }

    return NextResponse.json({
      success: true,
      interviewId: videoInterview.id,
      videoUrl,
      pending,
      score,
      criteria: evaluation?.criteria ?? [],
      feedback,
      transcript,
      playbackId: muxPlaybackId,
    }, { status: pending ? 202 : 200 });

  } catch (error: any) {
    console.error('[VIDEO INTERVIEW ERROR] Internal processing failed.', error);
    return NextResponse.json({ error: 'Video upload processing failed.' }, { status: 500 });
  }
}
