'use client';

import React from 'react';
import { 
  Clock, 
  Search, 
  Users, 
  CheckCircle, 
  Video, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import LaunchpathMuxPlayer from '@/components/LaunchpathMuxPlayer';

const LAUNCHPATH_POSTER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNDUwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ2xvdyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTFiNGIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMwZjE3MmEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDIwNjE3Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJicmFuZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNzE0NUZGIi8+CiAgICAgIDxzdG9wIG9mZnNldD0i1MDAlIiBzdG9wLWNvbG9yPSIjOGI1Y2Y2Ii8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0idXJsKCNnbG93KSIvPgogIAogIDwhLS0gU3VidGxlIGZ1dHVyaXN0aWMgbGluZXMgLS0+CiAgPGcgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wMyIgc3Ryb2tlLXdpZHRoPSIxIj4KICAgIDxsaW5lIHgxPSIxMDAiIHkxPSIwIiB4Mj0iMTAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iMjAwIiB5MT0iIiB4Mj0iMjAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iMzAwIiB5MT0iMCIgeDI9IjMwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjQwMCIgeTE9IjAiIHgyPSI0MDAiIHkyPSI0Uw0iLz4KICAgIDxsaW5lIHgxPSI1MDAiIHkxPSIwIiB4Mj0iNTAwIiB5Mj0iNDUwIi8+CiAgICA8bGluZSB4MT0iNjAwIiB5MT0iMCIgeDI9IjYwMCIgeTI9IjQ1MCIvPgogICAgPGxpbmUgeDE9IjcwMCIgeTE9IjAiIHgyPSI3MDAiIHkyPSI0NTAiLz4KICAgIDxsaW5lIHgxPSIwIiB5MT0iMTAwIiB4Mj0iODAwIiB5Mj0iMTAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iMjAwIiB4Mj0iODAwIiB5Mj0iMjAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iMzAwIiB4Mj0iODAwIiB5Mj0iMzAwIi8+CiAgICA8bGluZSB4PSIwIiB5MT0iNDAwIiB4Mj0iODAwIiB5Mj0iNDAwIi8+CiAgPC9nPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjIyNSIgcj0iMTQwIiBmaWxsPSIjNzE0NUZGIiBmaWxsLW9wYWNpdHk9IjAuMTUiIGZpbHRlcj0iYmx1cig2MHB4KSIvPgogIDxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4xIiBmaWx0ZXI9ImJsdXIoNDBweCkiLz4KICA8cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI3MDAiIGhlaWdodD0iMzUwIiByeD0iMjAiIGZpbGw9IiMwZjE3MmEiIGZpbGwtb3BhY2l0eT0iMC41IiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iMC40Ii8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSI0NSIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjIiIHN0cm9rZT0iIzcxNDVGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTkwIiByPSIzNSIgZmlsbD0idXJsKCNicmFuZCkiLz4KICA8cG9seWdvbiBwb2ludHM9IjM5MiwxNzcgNDE1LDE5MCAzOTIsMjAzIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHJlY3QgeD0iMzEwIiB5PSIyNzAiIHdpZHRoPSIxODAiIGhlaWdodD0iMjQiIHJ4PSIxMiIgZmlsbD0iIzcxNDVGRiIgZmlsbC1vcGFjaXR5PSIwLjE1IiBzdHJva2U9IiM3MTQ1RkYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIvPgogIDx0ZXh0IHg9IjQwMCIgeT0iMjg1IiBmaWxsPSIjYTc4YmZhIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9IjkwMCIgbGV0dGVyLXNwYWNpbmc9IjEuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgdGV4dC10cmFuc2Zvcm09InVwcGVyY2FzZSI+TEFVTkNIUEFUSCBWRVJJRklFRDwvdGV4dD4KICA8dGV4dCB4PSI0MDAiIHk9IjMyNSIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtQ29sLCAnU2Vnb2UgVUknLCBSb2JvdG8sIE91dGZpdCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjgwMCIgbGV0dGVyLXNwYWNpbmc9Ii0wLjUiIHRleHQtYW5jaG9yPSJuYXR1cmFsIj5BSSBSRUFESU5FU1MgVklERU8gSU5URVJWSUVXPC90ZXh0PgogIDx0ZXh0IHg9IjQwMCIgeT0iMzQ3IiBmaWxsPSIjOTRhM2I4IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Db2wsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9IjUwMCIgdHJhY2tpbmc9IjAuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VjdXJlIFdlYlJUQyBUaW1lZCBFeGVjdXRpdmUgUHJlc2VudGF0aW9uPC90ZXh0PgogIDx0ZXh0IHg9IjgwIiB5PSI5MCIgZmlsbD0iIzY0NzQ4YiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMSIgZm9udC13ZWlnaHQ9IjcwMCI+RkVFRF9TVFJFQU06IEFDVElWRTwvdGV4dD4KICA8Y2lyY2xlIGN4PSIyMTUiIGN5PSI4NiIgcj0iNCIgZmlsbD0iIzEwYjk4MSIvPgogIDx0ZXh0IHg9IjcyMCIgeT0iOTAiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTEiIHRleHQtYW5jaG9yPSJlbmQiPjQvNCBNT0RVTEVTIENPTVBMRVRFRDwvdGV4dD4KPC9zdmc+";

interface ApplicantsTabProps {
  jobs: any[];
  applications: any[];
  selectedJobFilter: string | number | null;
  setSelectedJobFilter: (id: any) => void;
  isJobUnlocked: (jobId: any) => boolean;
  unlocking: boolean;
  handleUnlock: (action: 'checkout' | 'bypass', jobIdToUnlock?: any) => void;
  filterScore: number | 'All';
  setFilterScore: (val: number | 'All') => void;
  filterExperience: string;
  setFilterExperience: (val: string) => void;
  filterSkill: string;
  setFilterSkill: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  filteredApplicants: any[];
  selectedApplicant: any | null;
  setSelectedApplicant: (val: any) => void;
  interviewDate: string;
  setInterviewDate: (val: string) => void;
  interviewTime: string;
  setInterviewTime: (val: string) => void;
  interviewNotes: string;
  setInterviewNotes: (val: string) => void;
  scheduleInterview: (app: any) => void;
  handleUpdateApplicationStatus: (appId: number, status: 'Accepted' | 'Rejected') => void;
}

export default function ApplicantsTab({
  jobs = [],
  applications = [],
  selectedJobFilter,
  setSelectedJobFilter,
  isJobUnlocked,
  unlocking,
  handleUnlock,
  filterScore,
  setFilterScore,
  filterExperience,
  setFilterExperience,
  filterSkill,
  setFilterSkill,
  sortBy,
  setSortBy,
  filteredApplicants = [],
  selectedApplicant,
  setSelectedApplicant,
  interviewDate,
  setInterviewDate,
  interviewTime,
  setInterviewTime,
  interviewNotes,
  setInterviewNotes,
  scheduleInterview,
  handleUpdateApplicationStatus,
}: ApplicantsTabProps) {

  const activeJob = jobs.find((j) => j.id === selectedJobFilter);

  return (
    <div className="w-full">
      {!selectedJobFilter && (jobs || []).length > 1 ? (
        <div className="max-w-5xl mx-auto py-8 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Review Applicants by Job Posting
            </h2>
            <p className="text-sm text-slate-500">
              Select one of your open roles below to review matched candidate profiles, view AI fit scores, and schedule interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {(jobs || []).map((j: any) => {
              const appCount = (applications || []).filter((a: any) => a.job_id === j.id).length;
              const unlocked = isJobUnlocked(j.id);
              return (
                <div
                  key={j.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-[#5D3FD3]/30 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                          unlocked
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}
                      >
                        {unlocked ? 'Unlocked 🔓' : 'Locked 🔒'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {appCount} {appCount === 1 ? 'Candidate' : 'Candidates'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-md text-slate-900 dark:text-white line-clamp-1">
                      {j.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {j.company} • {j.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedJobFilter(j.id)}
                    className="mt-6 w-full text-center bg-slate-100 hover:bg-[#5D3FD3] hover:text-white dark:bg-slate-800 dark:hover:bg-[#5D3FD3] text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                  >
                    View Applicants
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : selectedJobFilter && !isJobUnlocked(selectedJobFilter) ? (
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 md:p-12 text-center space-y-6 transition-all">
            <div className="mx-auto w-20 h-20 bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20 rounded-full flex items-center justify-center animate-pulse">
              <Lock className="w-10 h-10 text-[#5D3FD3]" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Candidate Pipeline Locked 🔒
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-extrabold tracking-wider">
                Role:{' '}
                <span className="text-[#5D3FD3] dark:text-violet-400 font-bold">
                  {activeJob?.title || 'Selected Role'}
                </span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm md:text-md leading-relaxed">
                Great news! You have{' '}
                <span className="font-extrabold text-[#5D3FD3] dark:text-violet-400">
                  {
                    (applications || []).filter((a: any) => a.job_id === selectedJobFilter)
                      .length
                  } matched candidates
                </span>{' '}
                aligned and waiting for this specific role. Unlock this pipeline to review matches,
                view assessment details, and schedule interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto py-4 text-left">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Unlock All Candidate Profiles
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Access names, contact data, resumes, and full experience summaries.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-[#5D3FD3] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    AI Role-Fit Index
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    See direct matching score, tool breakdown, and AI recruiter analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 animate-pulse">
                <Video className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-sans">
                    Practice Pitch Recordings
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Listen to candidate&apos;s verified answers with active playback.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Direct Interview Proposals
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Schedule video conferences, dates, times, and send virtual links natively.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-slate-800 pt-6">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                  onClick={() => handleUnlock('checkout', selectedJobFilter)}
                  disabled={unlocking}
                  className="w-full sm:w-auto bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-extrabold px-8 py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {unlocking ? 'Connecting...' : 'Activate Role & Sourcing matches (R1,499 once-off)'}
                </button>
                <button
                  onClick={() => handleUnlock('bypass', selectedJobFilter)}
                  disabled={unlocking}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Simulate Payment & Activate (Demo)
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Payment activates your job vacancy for matching and lifetime views of matched applicants. Secured by Payfast.
              </p>

              {(jobs || []).length > 1 && (
                <button
                  onClick={() => setSelectedJobFilter(null)}
                  className="text-xs text-slate-500 hover:text-[#5D3FD3] hover:underline font-bold flex items-center gap-1 mx-auto mt-4 cursor-pointer bg-transparent border-none"
                >
                  ← Back to Job Postings
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Column: Sorting & Filtering Sidebar */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5 shadow-sm sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Filter Applicants</h3>
              <button
                type="button"
                onClick={() => {
                  setFilterScore('All');
                  setFilterExperience('All');
                  setFilterSkill('All');
                  setSortBy('applied_at_desc');
                }}
                className="text-xs text-[#5D3FD3] hover:underline font-bold cursor-pointer bg-transparent border-none"
              >
                Reset All
              </button>
            </div>

            {/* Sort By Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 focus:ring-2 focus:ring-[#5D3FD3] focus:border-transparent outline-none transition"
              >
                <option value="applied_at_desc">Applied Date (Newest)</option>
                <option value="score_desc">AI Match Score (High-Low)</option>
                <option value="readiness_desc">Practice Readiness (High-Low)</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>

            {/* AI Match Score Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Min AI Job Match
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {['All', 70, 80, 90].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterScore(s as any)}
                    className={`px-2 py-1.5 rounded-lg text-center text-xs font-semibold border transition cursor-pointer ${
                      filterScore === s
                        ? 'bg-[#5D3FD3]/10 border-[#5D3FD3] text-[#5D3FD3]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {s === 'All' ? 'All Scores' : `${s}%+ Match`}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Experience Level
              </label>
              <div className="flex flex-col gap-1">
                {['All', 'Junior', 'Mid', 'Senior', 'Executive'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFilterExperience(level)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center justify-between cursor-pointer ${
                      filterExperience === level
                        ? 'bg-[#5D3FD3]/10 border-[#5D3FD3]/30 text-[#5D3FD3] font-bold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{level === 'All' ? 'Any Experience' : `${level} Level`}</span>
                    {filterExperience === level && (
                      <span className="h-1.5 w-1.5 bg-[#5D3FD3] rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Verified Skill Set */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Verified Skillset
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'React', 'TypeScript', 'NodeJS', 'Python', 'SQL', 'DevOps'].map(
                  (skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setFilterSkill(skill === 'NodeJS' ? 'Node' : skill)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                        (skill === 'NodeJS' && filterSkill === 'Node') ||
                        (skill !== 'NodeJS' && filterSkill === skill)
                          ? 'bg-[#5D3FD3]/15 border-[#5D3FD3]/40 text-[#5D3FD3]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {skill}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Main Candidates Column */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Applicant Pipeline ({filteredApplicants.length})
              </h2>
              {selectedJobFilter && (
                <button
                  onClick={() => setSelectedJobFilter(null)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Show All Postings
                </button>
              )}
            </div>

            {selectedJobFilter && (
              <div className="px-6 py-3 bg-[#5D3FD3]/5 dark:bg-[#5D3FD3]/10 border-b border-[#5D3FD3]/15 dark:border-[#5D3FD3]/25 flex items-center justify-between text-xs text-[#5D3FD3] dark:text-violet-300">
                <span>
                  Filtering applicants for role:{' '}
                  <span className="font-bold underline">
                    {activeJob?.title || 'Selected Job'}
                  </span>
                </span>
                <button
                  onClick={() => setSelectedJobFilter(null)}
                  className="font-semibold hover:underline cursor-pointer bg-transparent border-none text-[#5D3FD3] dark:text-violet-300"
                >
                  Clear Filter
                </button>
              </div>
            )}

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/20">
                  <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3">Candidate</th>
                    <th className="px-6 py-3">Applied Role</th>
                    <th className="px-6 py-3">AI Match Score</th>
                    <th className="px-6 py-3">Fit Summary</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredApplicants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500 text-sm">
                        No candidates found matching the active filters or job postings.
                      </td>
                    </tr>
                  )}
                  {filteredApplicants.map((app: any) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {app.candidate.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.candidate.professional_title} •{' '}
                          <span className="italic">
                            {app.candidate.experience_level || 'General'}
                          </span>
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#5D3FD3]/10 text-[#5D3FD3] dark:text-violet-300 px-2.5 py-1 rounded-md text-xs font-semibold border border-[#5D3FD3]/20">
                          {app.job.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {app.matchContext ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                app.matchContext.match_score >= 80
                                  ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/30'
                              }`}
                            >
                              {app.matchContext.match_score}%
                            </span>
                            {app.matchContext.match_score >= 80 && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Not calculated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-sm">
                          {app.matchContext?.fit_summary || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="text-[#5D3FD3] hover:text-[#5b32e6] font-bold text-xs bg-[#5D3FD3]/10 hover:bg-[#5D3FD3]/20 dark:bg-[#5D3FD3]/20 dark:hover:bg-[#5D3FD3]/30 px-3.5 py-1.5 rounded transition cursor-pointer border-none"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedApplicant &&
              (() => {
                const readiness = selectedApplicant.candidate.video_interviews?.[0];
                return (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div
                      className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl ${
                        readiness ? 'max-w-4xl' : 'max-w-lg'
                      } w-full overflow-hidden flex flex-col transition-all duration-300`}
                    >
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                        <div>
                          <h3 className="font-bold text-lg">
                            Manage Candidate: {selectedApplicant.candidate.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedApplicant.candidate.professional_title || 'Software Candidate'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3.5 mt-2.5 text-xs text-slate-500 font-sans">
                            <span className="flex items-center gap-1">
                              <span>📧</span> {selectedApplicant.candidate.email}
                            </span>
                            {selectedApplicant.candidate.phone && (
                              <span className="flex items-center gap-1 font-bold text-[#5D3FD3] dark:text-[#a385ff]">
                                <span>📞</span> {selectedApplicant.candidate.phone}
                              </span>
                            )}
                            {selectedApplicant.candidate.linkedin_url && (
                              <a
                                href={selectedApplicant.candidate.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                LinkedIn ↗
                              </a>
                            )}
                            {selectedApplicant.candidate.github_url && (
                              <a
                                href={selectedApplicant.candidate.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 dark:text-slate-400 hover:underline"
                              >
                                GitHub ↗
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedApplicant(null)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 text-2xl font-bold leading-none cursor-pointer border-none bg-transparent"
                        >
                          &times;
                        </button>
                      </div>

                      <div
                        className={`overflow-y-auto max-h-[80vh] p-6 ${
                          readiness ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'space-y-6'
                        }`}
                      >
                        {/* Left column: Scheduling & Actions */}
                        <div className="space-y-6">
                          {/* Application Decision Actions */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 mb-6">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                Application Status
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                  selectedApplicant.status === 'Accepted'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/60'
                                    : selectedApplicant.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/60'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/60'
                                }`}
                              >
                                {selectedApplicant.status || 'Pending'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                              <button
                                onClick={() =>
                                  handleUpdateApplicationStatus(selectedApplicant.id, 'Accepted')
                                }
                                disabled={selectedApplicant.status === 'Accepted'}
                                className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 border-none ${
                                  selectedApplicant.status === 'Accepted'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Accept
                              </button>

                              <button
                                onClick={() =>
                                  handleUpdateApplicationStatus(selectedApplicant.id, 'Rejected')
                                }
                                disabled={selectedApplicant.status === 'Rejected'}
                                className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 border-none ${
                                  selectedApplicant.status === 'Rejected'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          </div>

                          {selectedApplicant.interviews && selectedApplicant.interviews.length > 0 ? (
                            <div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">
                                Scheduled Interviews
                              </h4>
                              <div className="space-y-3">
                                {selectedApplicant.interviews.map((iv: any) => (
                                  <div
                                    key={iv.id}
                                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950"
                                  >
                                    <p className="font-bold text-sm">
                                      {new Date(iv.proposed_time).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Status:{' '}
                                      <span className="font-bold text-[#5D3FD3]">{iv.status}</span>
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No interviews scheduled yet.</p>
                          )}

                          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3">
                              Propose New Interview
                            </h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={interviewDate}
                                  onChange={(e) => setInterviewDate(e.target.value)}
                                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded font-sans"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={interviewTime}
                                  onChange={(e) => setInterviewTime(e.target.value)}
                                  className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded font-sans"
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-xs font-bold text-slate-500 mb-1">
                                Notes / Video Link
                              </label>
                              <input
                                type="text"
                                value={interviewNotes}
                                onChange={(e) => setInterviewNotes(e.target.value)}
                                placeholder="Zoom/Meet link or instructions"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded font-sans"
                              />
                            </div>
                            <button
                              onClick={() => scheduleInterview(selectedApplicant)}
                              className="w-full bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold py-2 rounded transition cursor-pointer border-none"
                            >
                              Send Invite
                            </button>
                          </div>
                        </div>

                        {/* Right column: Shared Job Readiness Credentials */}
                        {readiness && (
                          <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-8 space-y-6">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                                Job Readiness Credentials
                              </h4>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-850 font-sans">
                                Overall Score: {readiness.score}%
                              </span>
                            </div>

                            {/* Shared Video response stream player */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                                Candidate Stream Recording Output
                              </span>
                              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-sm">
                                <LaunchpathMuxPlayer
                                  videoUrl={readiness?.video_url as string | undefined}
                                  poster={LAUNCHPATH_POSTER_SVG}
                                  className="w-full h-full"
                                />
                              </div>
                            </div>

                            {/* Shared AI Experts feedback assessment */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 font-sans">
                              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                                Recruiter Coaching Feedback
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                {readiness.feedback}
                              </p>
                            </div>

                            {/* Question lists, transcripts, and scores */}
                            <div className="space-y-3 font-sans">
                              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                Readiness Speech Transcripts
                              </span>
                              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {(typeof readiness.questions === 'string'
                                  ? JSON.parse(readiness.questions)
                                  : readiness.questions || []
                                ).map((q: any) => (
                                  <div
                                    key={q.id}
                                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg space-y-2 text-xs"
                                  >
                                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800/60 font-semibold">
                                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                        Q0{q.id}: {q.title}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 font-mono">
                                        Score: {q.questionScore}%
                                      </span>
                                    </div>
                                    <p className="italic text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                                      &ldquo;{q.transcript}&rdquo;
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
}
