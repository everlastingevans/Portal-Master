'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Mic,
  Square,
  Play,
  RefreshCw,
  CheckCircle2,
  Upload,
  Sparkles,
  ShieldAlert,
  FileText,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Timer,
  Camera,
} from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import PortalLoader from '@/components/PortalLoader';
import { Alert, Badge, Button, Card, PageHeader, cx } from '@/components/portal/ui';

const INTERVIEW_QUESTIONS = [
  "Introduce yourself and explain why you're a great fit for your dream tech position.",
  "Describe a challenging technical project you built recently, your specific approach, and the final results.",
  "How do you prioritize deliverables under aggressive timelines or high-pressure situations?"
];

const SUBMIT_START_MESSAGE = 'Starting a secure upload...';

// Dynamic timeline stages for deep multi-modal evaluation
const SUBMIT_STAGES = [
  { progress: 20, message: 'Uploading your recording securely...' },
  { progress: 40, message: 'Preparing your video for review...' },
  { progress: 60, message: 'Listening to your answer...' },
  { progress: 80, message: 'Scoring your content and delivery...' },
  { progress: 95, message: 'Writing your personal feedback...' }
];

const STUDIO_STEPS = ['Allow camera', 'Record answer', 'Review and submit'];

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function ReadinessInterviewPage() {
  const router = useRouter();

  // Session (for the portal shell)
  const [user, setUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Navigation and State Machine
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // MediaRecorder States
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [timer, setTimer] = useState(60); // 60 seconds max per response

  // UI Flow States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    feedback: string;
    transcript: string;
  } | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load the signed-in candidate for the shell
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const role = String(data.user?.role || '').toUpperCase();
          if (!data.user || role !== 'CANDIDATE') {
            router.push('/login');
            return;
          }
          if (!cancelled) setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  // Initialize Camera/Mic stream
  async function requestPermissions() {
    try {
      setPermissionError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });

      setStream(mediaStream);
      setPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => console.error('Error playing stream:', e));
      }

      // Initialize real-time audio visualizer
      setupAudioVisualizer(mediaStream);
    } catch (err: any) {
      console.error('Permission request failed:', err);
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera or microphone access was blocked. Allow access in your browser settings, then try again.'
          : 'We couldn’t find a camera or microphone. Check that they’re connected, then try again.'
      );
    }
  }

  // Audio level visualizer helper
  function setupAudioVisualizer(mediaStream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Map average (0-255) to level percentage (0-100)
        setAudioLevel(Math.min(100, Math.round((average / 120) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (e) {
      console.warn('AudioContext visualization setup failed:', e);
    }
  }

  // Handle stream cleanup
  function stopStream() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.error(e));
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
  }

  useEffect(() => {
    const activeStream = stream;
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error(e));
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream]);

  // Recording actions
  function startRecording() {
    if (!stream) return;

    setRecordedChunks([]);
    setVideoUrl(null);
    setRecordingState('recording');
    setTimer(60);

    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    let recorder: MediaRecorder;

    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      // Fallback mimeType
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      console.log('MediaRecorder stopped.');
    };

    recorder.start();
    setMediaRecorder(recorder);

    // Start countdown timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          stopRecording(recorder);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopRecording(activeRecorder?: MediaRecorder) {
    const recorder = activeRecorder || mediaRecorder;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.stop();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setRecordingState('recorded');

    // Mute stream to client, stop camera preview display
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // Generate local review playback
  useEffect(() => {
    if (recordedChunks.length > 0 && recordingState === 'recorded') {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    }
  }, [recordedChunks, recordingState]);

  // Submit interview to API
  async function submitResponse() {
    if (recordedChunks.length === 0) return;

    setIsSubmitting(true);
    setSubmitProgress(SUBMIT_START_MESSAGE);

    try {
      const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const file = new File([finalBlob], 'candidate-response.webm', { type: 'video/webm' });

      const formData = new FormData();
      formData.append('video', file);
      formData.append('questions', JSON.stringify(INTERVIEW_QUESTIONS));
      formData.append('job_id', '1'); // Default fallback job association for Readiness evaluation

      SUBMIT_STAGES.forEach((stage, index) => {
        setTimeout(() => {
          setSubmitProgress(stage.message);
        }, index * 2500);
      });

      const response = await fetch('/api/video-interview/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API server failed during video file processing.');
      }

      const data = await response.json();

      setSubmissionResult({
        score: data.score,
        feedback: data.feedback,
        transcript: data.transcript,
      });

      setRecordingState('idle');
      setRecordedChunks([]);
      setVideoUrl(null);

    } catch (err: any) {
      console.error('Submission error:', err);
      setPermissionError(err.message || 'Video transmission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  }

  // Reset interview to do another question or try again
  function handleReset() {
    setRecordingState('idle');
    setRecordedChunks([]);
    setVideoUrl(null);
    setSubmissionResult(null);
    requestPermissions();
  }

  if (sessionLoading || !user) {
    return <PortalLoader portal="CANDIDATE" title="Opening interview practice" />;
  }

  /* ------------------------------ Derived UI ------------------------------ */

  const stageIndex = SUBMIT_STAGES.findIndex((s) => s.message === submitProgress);
  const submitPercent = stageIndex >= 0 ? SUBMIT_STAGES[stageIndex].progress : 6;
  const studioStep = !permissionGranted ? 0 : recordingState === 'recorded' ? 2 : 1;
  const timeUsedPercent = ((60 - timer) / 60) * 100;
  const showStudio = !isSubmitting && !submissionResult;

  return (
    <PortalShell portal="candidate" user={user} onLogout={handleLogout} title="Interview practice">
      <div id="readiness-interview-root" className="space-y-6">
        <PageHeader
          title="Interview practice"
          description="Record a short video answer and get instant feedback from our AI coach. Practise as often as you like."
          actions={<Badge tone="neutral">Up to 60 seconds per answer</Badge>}
        />

        <div id="interview-workspace" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left: question & guidance */}
          <div id="workspace-info-panel" className="space-y-6 lg:col-span-5">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
                </p>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {INTERVIEW_QUESTIONS.map((_, idx) => (
                    <span
                      key={idx}
                      className={cx(
                        'h-1.5 rounded-full transition-all',
                        idx === currentQuestionIndex ? 'w-6 bg-brand-navy' : 'w-1.5 bg-slate-200',
                      )}
                    />
                  ))}
                </div>
              </div>

              <h2 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-brand-navy">
                {INTERVIEW_QUESTIONS[currentQuestionIndex]}
              </h2>

              <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={isSubmitting || recordingState === 'recording'}
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => (prev > 0 ? prev - 1 : INTERVIEW_QUESTIONS.length - 1));
                    handleReset();
                  }}
                  id="prev-question-btn"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting || recordingState === 'recording'}
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => (prev < INTERVIEW_QUESTIONS.length - 1 ? prev + 1 : 0));
                    handleReset();
                  }}
                  id="next-question-btn"
                >
                  Next question <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <Lightbulb className="h-4 w-4 text-slate-400" /> Tips for a strong answer
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  Sit somewhere quiet with light in front of you, not behind.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  Use the STAR method: situation, task, action, result.
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  Look at the camera and speak at a calm, steady pace.
                </li>
              </ul>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500">How it works</p>
                <ol className="mt-3 space-y-3">
                  {[
                    'Record a video answer to the question.',
                    'We upload it securely and transcribe what you said.',
                    'Our AI coach reviews your content and delivery.',
                    'You get a score and practical tips to improve.',
                  ].map((text, idx) => (
                    <li key={text} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold tabular-nums text-slate-600">
                        {idx + 1}
                      </span>
                      {text}
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </div>

          {/* Right: studio / progress / results */}
          <div id="workspace-camera-panel" className="lg:col-span-7">
            {/* Submission / processing */}
            {isSubmitting && (
              <Card className="sm:p-8">
                <div role="status" aria-live="polite">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-lime">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-brand-navy">Analysing your answer</h3>
                      <p className="mt-0.5 text-sm text-slate-500">This takes about 15 seconds. Please keep this page open.</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-600">{submitProgress}</span>
                      <span className="font-medium tabular-nums text-brand-navy">{submitPercent}%</span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label="Upload and analysis progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={submitPercent}
                    >
                      <div className="h-full rounded-full bg-brand-lime transition-all duration-700 ease-out" style={{ width: `${submitPercent}%` }} />
                    </div>
                  </div>

                  <ol className="mt-6 space-y-2.5">
                    {SUBMIT_STAGES.map((stage, idx) => {
                      const done = idx < stageIndex;
                      const current = idx === stageIndex;
                      return (
                        <li key={stage.message} className="flex items-center gap-2.5 text-sm">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <span
                              className={cx(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                                current ? 'border-brand-navy' : 'border-slate-200',
                              )}
                            >
                              {current && <span className="h-1.5 w-1.5 rounded-full bg-brand-navy" />}
                            </span>
                          )}
                          <span className={cx(done ? 'text-slate-500' : current ? 'font-medium text-brand-navy' : 'text-slate-400')}>
                            {stage.message.replace(/\.\.\.$/, '')}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </Card>
            )}

            {/* Recording studio */}
            {showStudio && (
              <Card padded={false} className="overflow-hidden">
                {/* Step progress */}
                <ol className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-6" aria-label="Recording steps">
                  {STUDIO_STEPS.map((label, idx) => {
                    const done = idx < studioStep;
                    const current = idx === studioStep;
                    return (
                      <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
                        <span
                          className={cx(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors',
                            done ? 'bg-brand-lime text-brand-navy' : current ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                        </span>
                        <span className={cx('hidden truncate text-xs sm:block', current ? 'font-medium text-brand-navy' : 'text-slate-500')}>{label}</span>
                        {idx < STUDIO_STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />}
                      </li>
                    );
                  })}
                </ol>

                {/* Camera area */}
                <div className="relative flex aspect-video w-full items-center justify-center bg-slate-900">
                  {/* Live stream view (kept mounted so the preview can attach as soon as access is granted) */}
                  {recordingState !== 'recorded' && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={cx('h-full w-full scale-x-[-1] object-cover', !permissionGranted && 'invisible')}
                    />
                  )}

                  {/* Recorded review playback */}
                  {recordingState === 'recorded' && videoUrl && (
                    <video src={videoUrl} controls playsInline className="h-full w-full object-contain" />
                  )}

                  {/* Permission prompt */}
                  {!permissionGranted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-brand-navy p-6 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-brand-lime ring-1 ring-inset ring-white/10">
                        <Camera className="h-6 w-6" />
                      </span>
                      <div className="max-w-sm">
                        <h3 className="text-base font-semibold text-white">Allow camera and microphone</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          We need access to your camera and microphone to record your answer.
                        </p>
                      </div>
                      <Button variant="accent" icon={Video} onClick={requestPermissions} id="request-permissions-btn">
                        Turn on camera
                      </Button>
                    </div>
                  )}

                  {/* Status overlays */}
                  {recordingState === 'recording' && (
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur sm:left-4 sm:top-4">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
                      <span>Recording</span>
                      <span className="tabular-nums text-white/70">{formatTime(timer)}</span>
                    </div>
                  )}

                  {recordingState === 'recorded' && (
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur sm:left-4 sm:top-4">
                      <Play className="h-3 w-3 fill-current" />
                      <span>Review your answer</span>
                    </div>
                  )}

                  {/* Voice level meter (visible during active recording) */}
                  {recordingState === 'recording' && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur sm:bottom-4 sm:right-4">
                      <Mic className="h-3.5 w-3.5 text-brand-lime" aria-hidden="true" />
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15" aria-label="Microphone level">
                        <div className="h-full bg-brand-lime transition-all duration-75" style={{ width: `${audioLevel}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Timer bar */}
                {permissionGranted && (
                  <div className="h-1 w-full bg-slate-100" aria-hidden="true">
                    <div
                      className={cx('h-full transition-all duration-1000 ease-linear', timer <= 10 ? 'bg-rose-500' : 'bg-brand-navy')}
                      style={{ width: `${recordingState === 'idle' ? 0 : timeUsedPercent}%` }}
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="space-y-4 p-4 sm:p-6">
                  {permissionError && (
                    <Alert tone="danger" icon={ShieldAlert}>
                      {permissionError}
                    </Alert>
                  )}

                  {permissionGranted && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/80">
                          <Timer className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-brand-navy">
                            {recordingState === 'idle' && 'Ready when you are'}
                            {recordingState === 'recording' && `${formatTime(timer)} remaining`}
                            {recordingState === 'recorded' && 'How did that feel?'}
                          </h4>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {recordingState === 'idle' && 'Take a breath, then start recording. You have 60 seconds.'}
                            {recordingState === 'recording' && 'Speak clearly and wrap up before the timer ends.'}
                            {recordingState === 'recorded' && 'Submit your answer for feedback, or record it again.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        {recordingState === 'idle' && (
                          <Button variant="accent" size="lg" icon={Video} onClick={startRecording} className="w-full sm:w-auto" id="start-recording-btn">
                            Start recording
                          </Button>
                        )}

                        {recordingState === 'recording' && (
                          <Button
                            variant="danger"
                            size="lg"
                            onClick={() => stopRecording()}
                            className="w-full sm:w-auto"
                            id="stop-recording-btn"
                          >
                            <Square className="h-4 w-4 fill-current" /> Stop recording
                          </Button>
                        )}

                        {recordingState === 'recorded' && (
                          <>
                            <Button variant="secondary" size="lg" icon={RefreshCw} onClick={handleReset} title="Record again" id="retry-recording-btn">
                              <span className="sr-only sm:not-sr-only">Record again</span>
                            </Button>
                            <Button
                              variant="accent"
                              size="lg"
                              icon={Upload}
                              onClick={submitResponse}
                              className="flex-1 sm:flex-none"
                              id="submit-interview-btn"
                            >
                              Submit answer
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {!permissionGranted && !permissionError && (
                    <p className="text-center text-xs text-slate-500">Your browser will ask for permission. You can turn the camera off at any time.</p>
                  )}
                </div>
              </Card>
            )}

            {/* Results */}
            {submissionResult && (
              <Card padded={false} className="overflow-hidden animate-scale-in">
                <div className="flex flex-col gap-5 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Feedback ready
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-brand-navy">Here&apos;s how you did</h3>
                    <p className="mt-0.5 text-sm text-slate-500">Use the tips below and try again to beat your score.</p>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-brand-navy px-5 py-4">
                    <div>
                      <p className="text-xs text-white/60">Readiness score</p>
                      <p className="text-3xl font-semibold tabular-nums tracking-tight text-brand-lime">
                        {submissionResult.score}
                        <span className="text-base font-medium text-white/50">/100</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6 sm:p-8">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                      <Sparkles className="h-4 w-4 text-slate-400" /> Coaching feedback
                    </h4>
                    <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-inset ring-slate-200/80">
                      {submissionResult.feedback}
                    </p>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                      <FileText className="h-4 w-4 text-slate-400" /> Transcript
                    </h4>
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 ring-1 ring-inset ring-slate-200/80">
                      {submissionResult.transcript}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
                  <Button variant="secondary" onClick={() => router.push('/candidate/dashboard')} id="dashboard-return-btn">
                    Back to dashboard
                  </Button>
                  <Button variant="primary" icon={RefreshCw} onClick={handleReset} id="evaluation-retry-btn">
                    Practise again
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
