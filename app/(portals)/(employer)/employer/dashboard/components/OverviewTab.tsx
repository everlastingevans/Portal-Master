'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Search, PlusCircle, Briefcase, Users, Lock } from 'lucide-react';

interface OverviewTabProps {
  jobs: any[];
  applications: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredJobs: any[];
  handleStartEdit: (job: any) => void;
  setSelectedJobFilter: (id: any) => void;
  setActiveTab: (tab: string) => void;
}

export default function OverviewTab({
  jobs = [],
  applications = [],
  searchQuery,
  setSearchQuery,
  filteredJobs = [],
  handleStartEdit,
  setSelectedJobFilter,
  setActiveTab,
}: OverviewTabProps) {

  const renderBadges = (
    fieldVal: any,
    bgClass: string,
    textClass: string,
    borderClass: string
  ) => {
    if (!fieldVal) return null;
    let list: string[] = [];
    if (Array.isArray(fieldVal)) {
      list = fieldVal;
    } else if (typeof fieldVal === 'string') {
      list = fieldVal
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (list.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {list.slice(0, 8).map((item, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${bgClass} ${textClass} ${borderClass} border`}
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Dashboard Header & Stats Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Active Postings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your active recruitment drives, see applicant volumes, and post new vacancies.
          </p>
        </div>
        <Link
          href="/employer/new"
          className="bg-[#5D3FD3] hover:bg-[#5b32e6] dark:bg-[#5D3FD3] dark:hover:bg-[#5b32e6] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Post
        </Link>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            Total Job Postings
          </p>
          <p className="text-3xl font-bold dark:text-white">{jobs?.length || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            Received Applications
          </p>
          <p className="text-3xl font-bold dark:text-white">{applications?.length || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
            Unscheduled Pipeline
          </p>
          <p className="text-3xl font-bold dark:text-white">
            {
              (applications || []).filter(
                (a: any) => !a.interviews || a.interviews.length === 0
              ).length
            }
          </p>
        </div>
      </div>

      {/* Search & Filter section */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search postings by role title, description, skills, or tech stack..."
          className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Jobs list */}
      {!filteredJobs || filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-center transition-colors">
          <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            No Job Postings Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm">
            {searchQuery
              ? 'No job roles match your current search criteria. Try a different query or clear the filter.'
              : 'Get started by posting your first role to LaunchPath and find the perfect candidate today.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-bold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Clear Search
            </button>
          ) : (
            <Link
              href="/employer/new"
              className="bg-[#5D3FD3] hover:bg-[#5b32e6] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job: any) => {
            const jobAppsCount = (applications || []).filter(
              (app: any) => app.job_id === job.id
            ).length;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-205 flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="flex-1 space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between sm:justify-start gap-3 flex-wrap">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                      {job.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30'
                          : job.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30 font-extrabold'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30'
                      }`}
                    >
                      {job.status === 'PENDING' ? 'PENDING PAYMENT' : (job.status || 'ACTIVE')}
                    </span>
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {job.company && (
                      <>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {job.company}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                      </>
                    )}
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {job.years_experience
                        ? `${job.years_experience} Experience`
                        : 'No experience limit'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex-shrink-0">{job.location || 'Remote'}</span>
                    {(job.salary_min || job.salary_max) && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex-shrink-0">
                          {job.salary_min && job.salary_max
                            ? `R${Number(job.salary_min).toLocaleString()} - R${Number(
                                job.salary_max
                              ).toLocaleString()}`
                            : job.salary_min
                            ? `From R${Number(job.salary_min).toLocaleString()}`
                            : `Up to R${Number(job.salary_max).toLocaleString()}`}
                        </span>
                      </>
                    )}
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex-shrink-0">Job ID: #{job.id}</span>
                  </div>

                  {/* Rich HTML Description snippet */}
                  <div
                    className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 prose prose-slate prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />

                  {/* Skills / Tech stacks block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {((job.mandatory_skills && job.mandatory_skills.length > 0) ||
                      (typeof job.mandatory_skills === 'string' && job.mandatory_skills)) && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Mandatory Skills
                        </span>
                        {renderBadges(
                          job.mandatory_skills,
                          'bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20',
                          'text-[#5D3FD3] dark:text-violet-300',
                          'border-[#5D3FD3]/10 dark:border-[#5D3FD3]/20'
                        )}
                      </div>
                    )}
                    {((job.tech_stack && job.tech_stack.length > 0) ||
                      (typeof job.tech_stack === 'string' && job.tech_stack)) && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Tech Stack / Tools
                        </span>
                        {renderBadges(
                          job.tech_stack,
                          'bg-purple-50 dark:bg-purple-900/10',
                          'text-purple-700 dark:text-purple-300',
                          'border-purple-100 dark:border-purple-900/30'
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Hand Actions & Stats */}
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end gap-4 min-w-[150px] border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                  {/* Match Counts */}
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider mb-0.5">
                      Matches
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      {jobAppsCount} {jobAppsCount === 1 ? 'Candidate' : 'Candidates'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    {job.status === 'PENDING' && (
                      <Link
                        href={`/employer/payment?jobId=${job.id}`}
                        className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm"
                      >
                        Resume Payment
                      </Link>
                    )}
                    <button
                      onClick={() => handleStartEdit(job)}
                      className="bg-[#5D3FD3]/10 hover:bg-[#5D3FD3]/20 text-[#5D3FD3] dark:text-[#a385ff] dark:bg-[#5D3FD3]/20 dark:hover:bg-[#5D3FD3]/30 font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer border-none"
                    >
                      Edit Posting
                    </button>
                    <button
                      onClick={() => {
                        setSelectedJobFilter(job.id);
                        setActiveTab('Applicants');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-lg transition cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm"
                    >
                      {job.status === 'PENDING' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>View Applicants (Locked)</span>
                        </>
                      ) : (
                        <span>View Applicants</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
