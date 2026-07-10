'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Video, 
  Mic, 
  Square, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  Sparkles, 
  Loader2, 
  ShieldAlert, 
  Tv, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const INTERVIEW_QUESTIONS = [
  "Introduce yourself and explain why you're a great fit for your dream tech position.",
  "Describe a challenging technical project you built recently, your specific approach, and the final results.",
  "How do you prioritize deliverables under aggressive timelines or high-pressure situations?"
];

export default function ReadinessInterviewPage() {
  const router = useRouter();

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
          ? 'Camera or microphone access was denied. Please update your browser permissions.' 
          : 'Could not detect camera or microphone. Please ensure your peripherals are connected.'
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
    setSubmitProgress('Connecting to LaunchPath secure repository...');

    try {
      const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const file = new File([finalBlob], 'candidate-response.webm', { type: 'video/webm' });

      const formData = new FormData();
      formData.append('video', file);
      formData.append('questions', JSON.stringify(INTERVIEW_QUESTIONS));
      formData.append('job_id', '1'); // Default fallback job association for Readiness evaluation

      // Dynamic timeline stages for deep multi-modal evaluation
      const stages = [
        { progress: 20, message: 'Transferring secure encrypted stream to AWS S3...' },
        { progress: 40, message: 'Registering streaming layers on Mux Engine...' },
        { progress: 60, message: 'Extracting audio and initializing Gemini Flash Multi-modal analysis...' },
        { progress: 80, message: 'Grading verbal presentation patterns and compiling talent scores...' },
        { progress: 95, message: 'Generating personalized written career suggestions...' }
      ];

      stages.forEach((stage, index) => {
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

  return (
    <div id="readiness-interview-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#22c55e] selection:text-black font-sans">
      
      {/* Dynamic Header */}
      <header id="interview-header" className="border-b border-neutral-900 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/candidate/dashboard')}
            className="p-2 hover:bg-neutral-900 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer"
            id="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase font-heading">AI Job Readiness Evaluation</h1>
            <p className="text-[10px] font-mono text-[#22c55e] uppercase tracking-wider">Timed Interview Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 rounded-full border border-neutral-800">
          <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold tracking-wide uppercase text-neutral-400">Live Pilot</span>
        </div>
      </header>

      {/* Main Workspace */}
      <main id="interview-workspace" className="flex-1 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
        
        {/* Left Side: System Information & Prompt Cards */}
        <div id="workspace-info-panel" className="lg:col-span-5 space-y-6">
          
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
              <h2 className="text-sm font-black uppercase tracking-wider">Evaluation Prompt</h2>
            </div>
            
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-850 relative">
              <span className="absolute top-2 right-3 text-[10px] font-mono text-neutral-500 uppercase">
                Q {currentQuestionIndex + 1} of 3
              </span>
              <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">Current Question</p>
              <h3 className="text-md font-bold text-white leading-relaxed">
                {INTERVIEW_QUESTIONS[currentQuestionIndex]}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button 
                onClick={() => {
                  setCurrentQuestionIndex((prev) => (prev > 0 ? prev - 1 : INTERVIEW_QUESTIONS.length - 1));
                  handleReset();
                }}
                className="text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                id="prev-question-btn"
              >
                ← Prev Question
              </button>
              <button 
                onClick={() => {
                  setCurrentQuestionIndex((prev) => (prev < INTERVIEW_QUESTIONS.length - 1 ? prev + 1 : 0));
                  handleReset();
                }}
                className="text-xs font-mono text-[#22c55e] hover:underline transition cursor-pointer flex items-center gap-1"
                id="next-question-btn"
              >
                Next Question →
              </button>
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 space-y-4 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-400" />
              How the Evaluation Works:
            </h4>
            <ul className="space-y-2.5 text-neutral-400 leading-relaxed list-disc list-inside">
              <li>Record a webcam response answering the active scenario.</li>
              <li>Saves raw video directly to AWS S3 & converts with Mux.</li>
              <li>Our server utilizes Gemini Flash for deep semantic transcription.</li>
              <li>Receive instant professional scores and actionable career feedback.</li>
            </ul>
          </div>

        </div>

        {/* Right Side: Interactive Live Camera / Review & Results Panel */}
        <div id="workspace-camera-panel" className="lg:col-span-7">
          
          {/* Permission Screen */}
          {!permissionGranted && !submissionResult && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-10 text-center space-y-6">
              <div className="h-16 w-16 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#22c55e]/20">
                <Video className="w-8 h-8 text-[#22c55e]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">Camera & Microphone Access</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  We need standard browser permissions to access your camera and microphone to conduct the evaluation.
                </p>
              </div>

              {permissionError && (
                <div className="p-4 bg-red-950/40 border border-red-900 rounded-xl flex items-start gap-3 text-left">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">{permissionError}</p>
                </div>
              )}

              <button
                onClick={requestPermissions}
                className="w-full py-4 bg-[#22c55e] hover:bg-emerald-500 text-black font-black uppercase tracking-wider text-xs rounded-xl transition cursor-pointer shadow-lg shadow-[#22c55e]/10"
                id="request-permissions-btn"
              >
                Authorize Camera & Mic
              </button>
            </div>
          )}

          {/* Submission / Processing screen */}
          {isSubmitting && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center space-y-6 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#22c55e] animate-spin" />
              <div className="space-y-2 max-w-sm">
                <h3 className="text-md font-extrabold uppercase tracking-widest text-white">Uploading & Analyzing</h3>
                <p className="text-xs text-neutral-400 animate-pulse font-mono leading-relaxed">
                  {submitProgress}
                </p>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-neutral-850 overflow-hidden max-w-xs">
                <div className="bg-[#22c55e] h-full animate-loader-progress rounded-full"></div>
              </div>
            </div>
          )}

          {/* Core Recording & Playback view */}
          {permissionGranted && !isSubmitting && !submissionResult && (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden relative shadow-2xl">
              
              {/* Media Player display */}
              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                
                {/* Live Stream View */}
                {recordingState !== 'recorded' && (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}

                {/* Recorded Review Playback */}
                {recordingState === 'recorded' && videoUrl && (
                  <video 
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Status Indicator overlays */}
                {recordingState === 'recording' && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-red-600/95 text-white text-[10px] font-mono font-black uppercase tracking-widest rounded-full animate-pulse flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-white rounded-full"></span>
                    <span>Recording | {timer}s left</span>
                  </div>
                )}

                {recordingState === 'recorded' && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-[#22c55e] text-black text-[10px] font-mono font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Review Playback</span>
                  </div>
                )}

                {/* Voice level ripple meter (visible during active recording) */}
                {recordingState === 'recording' && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-full border border-neutral-800">
                    <Mic className="w-3.5 h-3.5 text-[#22c55e]" />
                    <div className="w-16 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#22c55e] h-full transition-all duration-75"
                        style={{ width: `${audioLevel}%` }}
                      ></div>
                    </div>
                  </div>
                )}

              </div>

              {/* Controls bar */}
              <div className="p-6 bg-neutral-900/80 border-t border-neutral-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                <div className="text-center sm:text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {recordingState === 'idle' && 'Step 1: Check Camera & Prepare'}
                    {recordingState === 'recording' && 'Step 2: Responding Live'}
                    {recordingState === 'recorded' && 'Step 3: Review Response'}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {recordingState === 'idle' && 'Click start once you are comfortable answering.'}
                    {recordingState === 'recording' && 'Speak clearly. Answer within the 60 seconds limit.'}
                    {recordingState === 'recorded' && 'Submit your response, or record again if needed.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {recordingState === 'idle' && (
                    <button
                      onClick={startRecording}
                      className="w-full sm:w-auto px-6 py-3 bg-[#22c55e] hover:bg-emerald-500 text-black font-black uppercase tracking-wider text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      id="start-recording-btn"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Recording</span>
                    </button>
                  )}

                  {recordingState === 'recording' && (
                    <button
                      onClick={() => stopRecording()}
                      className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer animate-pulse"
                      id="stop-recording-btn"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Recording</span>
                    </button>
                  )}

                  {recordingState === 'recorded' && (
                    <>
                      <button
                        onClick={handleReset}
                        className="p-3 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl border border-neutral-700 transition cursor-pointer"
                        title="Record Again"
                        id="retry-recording-btn"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={submitResponse}
                        className="flex-1 sm:flex-initial px-6 py-3 bg-[#22c55e] hover:bg-emerald-500 text-black font-black uppercase tracking-wider text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        id="submit-interview-btn"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Submit Response</span>
                      </button>
                    </>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* Submission Results / AI Insights Display */}
          {submissionResult && (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 space-y-6 shadow-2xl backdrop-blur relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Status and Score layout */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-neutral-800">
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-[#22c55e] justify-center sm:justify-start">
                    <CheckCircle className="w-5 h-5" />
                    <h3 className="text-md font-black uppercase tracking-wider">Evaluation Completed</h3>
                  </div>
                  <p className="text-xs text-neutral-400">Response analyzed successfully by LaunchPath AI.</p>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Candidate Readiness</p>
                    <p className="text-xs font-bold text-white uppercase">AI Matching Score</p>
                  </div>
                  <div className="h-12 w-12 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-black text-[#22c55e]">{submissionResult.score}</span>
                  </div>
                </div>
              </div>

              {/* Actionable Feedback */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#22c55e]" />
                  AI Coaching Feedback
                </h4>
                <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl text-neutral-300 text-xs leading-relaxed italic">
                  &ldquo;{submissionResult.feedback}&rdquo;
                </div>
              </div>

              {/* Verbatim Transcript */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-neutral-400" />
                  Speech-to-Text Transcript
                </h4>
                <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl max-h-48 overflow-y-auto text-xs text-neutral-400 leading-relaxed font-mono">
                  {submissionResult.transcript}
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-4 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-3 bg-neutral-850 hover:bg-neutral-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  id="evaluation-retry-btn"
                >
                  Evaluate Again
                </button>
                <button
                  onClick={() => router.push('/candidate/dashboard')}
                  className="w-full sm:w-auto px-6 py-3 bg-[#22c55e] hover:bg-emerald-500 text-black font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  id="dashboard-return-btn"
                >
                  Return to Dashboard
                </button>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer copyright */}
      <footer id="interview-footer" className="border-t border-neutral-900 bg-slate-950/40 p-4 text-center z-10">
        <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
          © 2026 LaunchPath TALENT PORTAL • AI MULTI-MODAL PIPELINE
        </p>
      </footer>

    </div>
  );
}
