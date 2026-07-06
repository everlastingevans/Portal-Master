'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, VideoOff, ShieldAlert, Sparkles } from 'lucide-react';

export default function DeactivatedReadinessInterviewPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#22c55e] selection:text-black font-sans">
      
      {/* Top Bar Navigation */}
      <header className="border-b border-neutral-900 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/candidate/dashboard')}
            className="p-2 hover:bg-neutral-900 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase font-heading">AI Job Readiness Evaluation</h1>
            <p className="text-[10px] font-mono text-[#22c55e] uppercase tracking-wider">Timed Interview Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 rounded-full border border-neutral-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold tracking-wide uppercase text-neutral-400">Offline Upgrade</span>
        </div>
      </header>

      {/* Main workspace container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-10 space-y-8 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300 text-center">
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
              <VideoOff className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white font-heading uppercase">
                Video Interview Deactivated
              </h2>
              <p className="text-xs font-mono text-amber-500 uppercase tracking-widest font-bold">
                Temporarily Disabled for Maintenance
              </p>
            </div>
          </div>

          <p className="text-neutral-300 text-sm leading-relaxed max-w-md mx-auto">
            The AI Video Readiness Interview and automated communication evaluations are currently deactivated. 
            Our engineering team is upgrading the multi-modal speech transcription pipelines to deliver deeper talent insights and more accurate feedback matching.
          </p>

          <div className="p-4 bg-neutral-950/60 border border-neutral-850 rounded-xl flex items-start gap-3.5 text-left max-w-md mx-auto">
            <ShieldAlert className="w-5 h-5 text-amber-500/80 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">What this means for you:</h4>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                You can still browse jobs, upload your resume, sync LinkedIn details, and receive AI job matching scores. Your general candidate dashboard functionality is unaffected.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-850">
            <button
              onClick={() => router.push('/candidate/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-850 hover:bg-neutral-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer hover:-translate-y-0.5 shadow-lg border border-neutral-800"
            >
              <ArrowLeft className="w-4 h-4 text-[#22c55e]" />
              <span>Back to Candidate Dashboard</span>
            </button>
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-neutral-900 bg-slate-950/40 p-4 text-center z-10">
        <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
          © 2026 LaunchPath TALENT PORTAL • PIPELINE OFFLINE
        </p>
      </footer>

    </div>
  );
}
